import test from 'node:test';
import assert from 'node:assert/strict';
import { isMongoUri } from '../src/mongoUri.js';

test('MongoDB Atlas URI must include mongodb+srv:// with both slashes', () => {
  assert.equal(isMongoUri('mongodb+srv://user:pass@example.mongodb.net/personal_entry'), true);
  assert.equal(isMongoUri('mongodb://127.0.0.1:27017/personal_entry'), true);
  assert.equal(isMongoUri('srv://user:pass@example.mongodb.net/personal_entry'), false);
  assert.equal(isMongoUri('mongodb+srv:user:pass@example.mongodb.net/personal_entry'), false);
  assert.equal(isMongoUri('mongodb+srv//user:pass@example.mongodb.net/personal_entry'), false);
  assert.equal(isMongoUri('MONGODB_URI=mongodb+srv://user:pass@example.mongodb.net'), false);
});
