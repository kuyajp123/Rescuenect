const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canAccessClientScope,
  canLguAdminUseClient,
  isClientVisibleInResidentSignup,
  shouldAllowLegacyAdminEmails,
} = require('../dist/src/utils/accessControl');

test('super admin can access any client scope', () => {
  assert.equal(
    canAccessClientScope(
      {
        role: 'super_admin',
        clientId: null,
      },
      'naic'
    ),
    true
  );
});

test('LGU admin can only access assigned client scope', () => {
  const admin = {
    role: 'lgu_admin',
    clientId: 'naic',
  };

  assert.equal(canAccessClientScope(admin, 'naic'), true);
  assert.equal(canAccessClientScope(admin, undefined), true);
  assert.equal(canAccessClientScope(admin, 'other-client'), false);
});

test('LGU admin operations require an active client', () => {
  assert.equal(canLguAdminUseClient('active'), true);
  assert.equal(canLguAdminUseClient('draft'), false);
  assert.equal(canLguAdminUseClient('inactive'), false);
});

test('resident signup only sees active clients', () => {
  assert.equal(isClientVisibleInResidentSignup('active'), true);
  assert.equal(isClientVisibleInResidentSignup('draft'), false);
  assert.equal(isClientVisibleInResidentSignup('inactive'), false);
});

test('legacy ADMIN_EMAILS fallback is opt-in only', () => {
  assert.equal(shouldAllowLegacyAdminEmails(undefined), false);
  assert.equal(shouldAllowLegacyAdminEmails('false'), false);
  assert.equal(shouldAllowLegacyAdminEmails('true'), true);
  assert.equal(shouldAllowLegacyAdminEmails('1'), true);
});
