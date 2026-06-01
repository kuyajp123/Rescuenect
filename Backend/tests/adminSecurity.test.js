const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canAccessClientScope,
  canLguAdminCompleteOnboarding,
  canLguAdminUseClient,
  hasUsableWeatherCoordinates,
  isValidClientMapZoom,
  isClientVisibleInResidentSignup,
  canAdminReceiveNotification,
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

test('LGU admin onboarding is allowed for draft or active clients', () => {
  assert.equal(canLguAdminCompleteOnboarding('draft'), true);
  assert.equal(canLguAdminCompleteOnboarding('active'), true);
  assert.equal(canLguAdminCompleteOnboarding('inactive'), false);
});

test('resident signup only sees active clients', () => {
  assert.equal(isClientVisibleInResidentSignup('active'), true);
  assert.equal(isClientVisibleInResidentSignup('draft'), false);
  assert.equal(isClientVisibleInResidentSignup('inactive'), false);
});

test('client activation requires usable weather coordinates', () => {
  assert.equal(hasUsableWeatherCoordinates(14.2919325, 120.7752839), true);
  assert.equal(hasUsableWeatherCoordinates(null, 120.7752839), false);
  assert.equal(hasUsableWeatherCoordinates(14.2919325, null), false);
  assert.equal(hasUsableWeatherCoordinates(Number.NaN, 120.7752839), false);
  assert.equal(hasUsableWeatherCoordinates(120.521822, 15.846794), false);
  assert.equal(hasUsableWeatherCoordinates(15.846794, 120.521822), true);
});

test('legacy ADMIN_EMAILS fallback is opt-in only', () => {
  assert.equal(shouldAllowLegacyAdminEmails(undefined), false);
  assert.equal(shouldAllowLegacyAdminEmails('false'), false);
  assert.equal(shouldAllowLegacyAdminEmails('true'), true);
  assert.equal(shouldAllowLegacyAdminEmails('1'), true);
});

test('client map zoom settings stay within configured caps', () => {
  assert.equal(isValidClientMapZoom({ minZoom: 13, zoom: 15, maxZoom: 18 }), true);
  assert.equal(isValidClientMapZoom({ minZoom: 14, zoom: 15, maxZoom: 18 }), false);
  assert.equal(isValidClientMapZoom({ minZoom: 13, zoom: 18, maxZoom: 18 }), false);
  assert.equal(isValidClientMapZoom({ minZoom: 13, zoom: 15, maxZoom: 19 }), false);
});

test('role-aware admin notification targeting excludes super admin weather', () => {
  const superAdmin = { role: 'super_admin', clientId: null };
  const naicAdmin = { role: 'lgu_admin', clientId: 'naic' };

  assert.equal(canAdminReceiveNotification(superAdmin, { type: 'weather', clientId: 'naic' }), false);
  assert.equal(canAdminReceiveNotification(superAdmin, { type: 'system' }), false);
  assert.equal(canAdminReceiveNotification(superAdmin, { type: 'admin_invite', targetRole: 'super_admin' }), false);
  assert.equal(
    canAdminReceiveNotification(superAdmin, {
      type: 'client_request',
      targetRole: 'super_admin',
      data: { status: 'pending' },
    }),
    true
  );
  assert.equal(
    canAdminReceiveNotification(superAdmin, {
      type: 'client_request',
      targetRole: 'super_admin',
      data: { status: 'approved' },
    }),
    false
  );
  assert.equal(
    canAdminReceiveNotification(superAdmin, {
      type: 'client_change_request',
      targetRole: 'super_admin',
      data: { status: 'pending' },
    }),
    true
  );
  assert.equal(canAdminReceiveNotification(superAdmin, { type: 'earthquake', audience: 'users' }), true);
  assert.equal(canAdminReceiveNotification(superAdmin, { type: 'system_health', targetRole: 'super_admin' }), true);
  assert.equal(canAdminReceiveNotification(superAdmin, { type: 'system', audience: 'users' }), false);
  assert.equal(canAdminReceiveNotification(naicAdmin, { type: 'weather', clientId: 'naic' }), true);
  assert.equal(canAdminReceiveNotification(naicAdmin, { type: 'weather', clientId: 'naic', audience: 'users' }), true);
  assert.equal(canAdminReceiveNotification(naicAdmin, { type: 'weather', clientId: 'gentri' }), false);
  assert.equal(canAdminReceiveNotification(naicAdmin, { type: 'client_request', targetRole: 'super_admin' }), false);
});
