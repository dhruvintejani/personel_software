import test from 'node:test';
import assert from 'node:assert/strict';
import { isMongoUri, isSrvDnsLookupFailure } from '../src/mongoUri.js';

test('MongoDB Atlas URI must include mongodb+srv:// with both slashes', () => {
  assert.equal(isMongoUri('mongodb+srv://user:pass@example.mongodb.net/personal_entry'), true);
  assert.equal(isMongoUri('mongodb://127.0.0.1:27017/personal_entry'), true);
  assert.equal(isMongoUri('srv://user:pass@example.mongodb.net/personal_entry'), false);
  assert.equal(isMongoUri('mongodb+srv:user:pass@example.mongodb.net/personal_entry'), false);
  assert.equal(isMongoUri('mongodb+srv//user:pass@example.mongodb.net/personal_entry'), false);
  assert.equal(isMongoUri('MONGODB_URI=mongodb+srv://user:pass@example.mongodb.net'), false);
});

test('detect Atlas SRV DNS refusal but not authentication or other failures', () => {
  assert.equal(isSrvDnsLookupFailure({
    code: 'ECONNREFUSED', syscall: 'querySrv',
    message: 'querySrv ECONNREFUSED _mongodb._tcp.example.mongodb.net',
  }), true);
  assert.equal(isSrvDnsLookupFailure({
    code: 'ETIMEOUT', syscall: 'querySrv',
  }), true);
  assert.equal(isSrvDnsLookupFailure({ code: 'ECONNREFUSED', syscall: 'getaddrinfo' }), false);
  assert.equal(isSrvDnsLookupFailure({ code: 18, message: 'Authentication failed' }), false);
  assert.equal(isSrvDnsLookupFailure(null), false);
});
