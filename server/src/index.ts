import { config as loadEnv } from 'dotenv';
import { setServers } from 'node:dns/promises';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import mongoose, { Schema, Types } from 'mongoose';
import { z, ZodError } from 'zod';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidDateString } from './math.js';
import { isMongoUri, isSrvDnsLookupFailure } from './mongoUri.js';

// Resolve server/.env independently of the directory from which npm is launched.
// This works when executing server/src in development and server/dist in production.
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

const nameSchema = new Schema({
  section: { type: String, enum: ['buta', 'top'], required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  nameKey: { type: String, required: true },
}, { timestamps: true });
nameSchema.index({ section: 1, nameKey: 1 }, { unique: true });
nameSchema.index({ section: 1, createdAt: -1 });

const entrySchema = new Schema({
  nameId: { type: Schema.Types.ObjectId, ref: 'Person', required: true },
  date: { type: String, required: true },
  title: { type: String, default: '', maxlength: 120 },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  completed: { type: Boolean, default: false },
}, { timestamps: true });
entrySchema.index({ nameId: 1, date: 1, createdAt: -1 });
entrySchema.index({ nameId: 1, createdAt: -1 });

const Person = mongoose.model('Person', nameSchema);
const Entry = mongoose.model('Entry', entrySchema);

const section = z.enum(['buta', 'top']);
const validName = z.string().trim().min(1).max(80);
const validDate = z.string().refine(isValidDateString, 'Invalid date (use YYYY-MM-DD)');
const validMoney = z.number().finite().min(0).max(1_000_000);
const validQuantity = z.number().finite().min(0).max(1_000_000_000);
const validTitle = z.string().trim().max(120);
const entryInput = z.object({
  date: validDate,
  title: validTitle.default(''),
  quantity: validQuantity,
  price: validMoney,
  completed: z.boolean().default(false),
}).strict();
const entryPatch = entryInput.partial().refine(v => Object.keys(v).length > 0, 'Nothing to update');
const namePatch = z.object({ name: validName }).strict();
const isId = (id: string) => Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
const key = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase();

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false })); // Vite bundles assets and fonts locally/system.
app.use(express.json({ limit: '32kb' }));

const wrap = (handler: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(handler(req, res)).catch(next);

app.get('/api/health', (_req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1 });
});

// Keep the API responsive while MongoDB is unavailable, rather than timing out
// every request or causing an opaque Vite proxy error during setup.
app.use('/api', (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database unavailable. Check server/.env, MongoDB Atlas credentials and Network Access.' });
    return;
  }
  next();
});

app.get('/api/names', wrap(async (req, res) => {
  const selected = section.parse(req.query.section);
  const names = await Person.find({ section: selected }).sort({ createdAt: -1 }).lean();
  res.json(names);
}));

app.post('/api/names', wrap(async (req, res) => {
  const input = z.object({ section, name: validName }).strict().parse(req.body);
  const created = await Person.create({ ...input, nameKey: key(input.name) });
  res.status(201).json(created);
}));

app.patch('/api/names/:id', wrap(async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const input = namePatch.parse(req.body);
  const changed = await Person.findByIdAndUpdate(req.params.id,
    { name: input.name, nameKey: key(input.name) }, { new: true, runValidators: true });
  if (!changed) { res.status(404).json({ error: 'Name not found' }); return; }
  res.json(changed);
}));

app.delete('/api/names/:id', wrap(async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  // Remove associated entries only after confirming the name exists.
  const deleted = await Person.findByIdAndDelete(req.params.id);
  if (!deleted) { res.status(404).json({ error: 'Name not found' }); return; }
  await Entry.deleteMany({ nameId: deleted._id });
  res.status(204).end();
}));

app.get('/api/names/:id/entries', wrap(async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const found = await Person.exists({ _id: req.params.id });
  if (!found) { res.status(404).json({ error: 'Name not found' }); return; }
  // Return the full ledger. Dates remain properties of entries, never a filter.
  const entries = await Entry.find({ nameId: req.params.id })
    .sort({ createdAt: -1, _id: -1 }).lean();
  res.json(entries);
}));

app.post('/api/names/:id/entries', wrap(async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const person = await Person.exists({ _id: req.params.id });
  if (!person) { res.status(404).json({ error: 'Name not found' }); return; }
  const input = entryInput.parse(req.body);
  const created = await Entry.create({ nameId: req.params.id, ...input });
  res.status(201).json(created);
}));

app.patch('/api/entries/:id', wrap(async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const input = entryPatch.parse(req.body);
  const updated = await Entry.findByIdAndUpdate(req.params.id, { $set: input },
    { new: true, runValidators: true });
  if (!updated) { res.status(404).json({ error: 'Entry not found' }); return; }
  res.json(updated);
}));

app.delete('/api/entries/:id', wrap(async (req, res) => {
  if (!isId(req.params.id)) { res.status(400).json({ error: 'Invalid ID' }); return; }
  const result = await Entry.findByIdAndDelete(req.params.id);
  if (!result) { res.status(404).json({ error: 'Entry not found' }); return; }
  res.status(204).end();
}));

// Always answer unknown API routes with JSON, including in production.
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));

// The production Node server serves both the React app and the API on one origin.
const currentDir = dirname(fileURLToPath(import.meta.url));
const clientDist = resolve(currentDir, '../../client/dist');
if (existsSync(resolve(clientDist, 'index.html'))) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get('*', (_req, res) => res.sendFile(resolve(clientDist, 'index.html')));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid data' });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
    res.status(409).json({ error: 'This name already exists in this section' });
    return;
  }
  console.error('Request failed', err);
  res.status(500).json({ error: 'An unexpected server error occurred' });
});

// Switch DNS only if the user's default resolver refuses Atlas SRV requests.
let publicDnsFallbackUsed = false;
let networkHelpShown = false;

async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error('[api] Missing MONGODB_URI in server/.env. Add the Atlas URL after MONGODB_URI= and restart npm run dev.');
    return;
  }
  if (!isMongoUri(uri)) {
    // Never log the connection string: it contains the database password.
    console.error('[api] Invalid MONGODB_URI scheme in server/.env.');
    console.error('[api] The URL must start with mongodb+srv:// (Atlas) or mongodb://.');
    console.error('[api] Keep the // after srv:. Do not use srv:// by itself.');
    console.error('[api] Fix server/.env and restart npm run dev. No retries for a malformed URL.');
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000, maxPoolSize: 10 });
    console.log('[api] MongoDB connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Avoid exposing database credentials in logs, even for unusual driver errors.
    console.error('[api] MongoDB connection failed:', message.replaceAll(uri, '[MongoDB URI hidden]'));

    if (uri.startsWith('mongodb+srv://') && !publicDnsFallbackUsed && isSrvDnsLookupFailure(error)) {
      try {
        // Node's MongoDB driver uses dns.promises.resolveSrv and resolveTxt.
        // Public resolvers can bypass broken Windows/ISP DNS SRV resolution.
        setServers(['1.1.1.1', '8.8.8.8']);
        publicDnsFallbackUsed = true;
        console.info('[api] DNS SRV lookup refused. Retrying with Cloudflare/Google DNS...');
        await connectMongo();
        return;
      } catch (dnsError) {
        console.error('[api] Unable to configure DNS fallback:', dnsError instanceof Error ? dnsError.message : 'Unknown error');
      }
    }

    if (isSrvDnsLookupFailure(error) && !networkHelpShown) {
      networkHelpShown = true;
      console.error('[api] Atlas DNS SRV lookups are failing on this network.');
      console.error('[api] Try another network / mobile hotspot, or change Windows DNS to 1.1.1.1 and 8.8.8.8.');
      console.error('[api] You can also copy the Standard (mongodb://) driver URI from MongoDB Atlas to avoid SRV lookups.');
      console.error('[api] Keep the URI only in server/.env, never in GitHub.');
    }
    console.error('[api] Will retry database connection in 15 seconds.');
    setTimeout(() => void connectMongo(), 15000).unref();
  }
}

// Listen immediately so Vite can reach the API even if Atlas is offline.
// All database routes return HTTP 503 until MongoDB becomes available.
const port = Number(process.env.PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port number');
}
app.listen(port, '0.0.0.0', () => {
  console.log(`[api] Listening on http://localhost:${port}`);
  void connectMongo();
});
