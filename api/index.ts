// Import the built ESM backend. The Vercel build command compiles
// server/src -> server/dist before the function is bundled.
// Importing ../server/src/index.js failed in production because that .js file
// does not exist in the TypeScript source directory.
import app from '../server/dist/index.js';

export default app;
