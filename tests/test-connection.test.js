// Basic test for /api/db/test-connection route using fetch
// Run with: node tests/test-connection.test.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/db/test-connection';

async function testHappyPath() {
  const res = await fetch.default(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'snowflake' })
  });
  const data = await res.json();
  if (data.success && data.diagnostics) {
    console.log('✅ Happy path: success');
  } else {
    console.error('❌ Happy path: failed', data);
    process.exit(1);
  }
}

async function testInvalidTarget() {
  const res = await fetch.default(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'invalid' })
  });
  const data = await res.json();
  if (!data.success && data.error) {
    console.log('✅ Invalid target: error as expected');
  } else {
    console.error('❌ Invalid target: did not error', data);
    process.exit(1);
  }
}

async function runAll() {
  await testHappyPath();
  await testInvalidTarget();
  await testAuthFail();
  await testTLSFail();
  await testSlow();
  console.log('All tests passed.');
}
async function testAuthFail() {
  const res = await fetch.default(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'authfail' })
  });
  const data = await res.json();
  if (res.status === 401 && !data.success && data.error && data.diagnostics?.code === 'AUTH_FAIL') {
    console.log('✅ Auth fail: error as expected');
  } else {
    console.error('❌ Auth fail: did not error as expected', data);
    process.exit(1);
  }
}

async function testTLSFail() {
  const res = await fetch.default(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'tlsfail' })
  });
  const data = await res.json();
  if (res.status === 495 && !data.success && data.error && data.diagnostics?.code === 'TLS_ERROR') {
    console.log('✅ TLS fail: error as expected');
  } else {
    console.error('❌ TLS fail: did not error as expected', data);
    process.exit(1);
  }
}

async function testSlow() {
  const start = Date.now();
  const res = await fetch.default(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'slow' })
  });
  const data = await res.json();
  const elapsed = Date.now() - start;
  if (data.success && data.diagnostics?.details === 'mock slow' && elapsed >= 2900) {
    console.log('✅ Slow: delayed response as expected');
  } else {
    console.error('❌ Slow: did not delay or wrong response', { data, elapsed });
    process.exit(1);
  }
}

runAll().catch(e => { console.error(e); process.exit(1); });
