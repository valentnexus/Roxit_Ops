const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateEditRule, checkDeleteAllowed } = require('../src/utils/approvalRules');

test('evaluateEditRule: Pending => edit biasa, status tidak berubah', () => {
  const r = evaluateEditRule('Pending', {});
  assert.equal(r.ok, true);
  assert.equal(r.backToPending, false);
});

test('evaluateEditRule: Rejected tanpa resubmit=true => ditolak', () => {
  const r = evaluateEditRule('Rejected', {});
  assert.equal(r.ok, false);
});

test('evaluateEditRule: Rejected + resubmit=true => balik Pending', () => {
  const r = evaluateEditRule('Rejected', { resubmit: true });
  assert.equal(r.ok, true);
  assert.equal(r.backToPending, true);
  assert.equal(r.action, 'Resubmit');
});

test('evaluateEditRule: Success tanpa cancelApproval=true => ditolak', () => {
  const r = evaluateEditRule('Success', {});
  assert.equal(r.ok, false);
});

test('evaluateEditRule: Success + cancelApproval=true => balik Pending', () => {
  const r = evaluateEditRule('Success', { cancelApproval: true });
  assert.equal(r.ok, true);
  assert.equal(r.action, 'Cancel Approval');
});

test('checkDeleteAllowed: Success tidak boleh diarsipkan, status lain boleh', () => {
  assert.equal(checkDeleteAllowed('Success').ok, false);
  assert.equal(checkDeleteAllowed('Pending').ok, true);
  assert.equal(checkDeleteAllowed('Rejected').ok, true);
});
