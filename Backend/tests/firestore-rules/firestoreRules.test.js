const { after, before, beforeEach, test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore');

const projectId = 'rescuenect-rules-test';
const rules = readFileSync(path.resolve(__dirname, '../../../firestore.rules'), 'utf8');

let testEnv;

const dbFor = uid => testEnv.authenticatedContext(uid).firestore();
const guestDb = () => testEnv.unauthenticatedContext().firestore();

async function seedBaseData() {
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();

    await Promise.all([
      setDoc(doc(db, 'clients', 'naic'), { name: 'Naic', status: 'active' }),
      setDoc(doc(db, 'clients', 'gentri'), { name: 'General Trias', status: 'active' }),
      setDoc(doc(db, 'clients', 'scheduled-town'), { name: 'Scheduled Town', status: 'deletion_scheduled' }),
      setDoc(doc(db, 'clients', 'inactive-town'), { name: 'Inactive Town', status: 'inactive' }),

      setDoc(doc(db, 'admin', 'super-admin'), { role: 'super_admin', status: 'active', clientId: null }),
      setDoc(doc(db, 'admin', 'lgu-naic'), { role: 'lgu_admin', status: 'active', clientId: 'naic' }),
      setDoc(doc(db, 'admin', 'lgu-gentri'), { role: 'lgu_admin', status: 'active', clientId: 'gentri' }),
      setDoc(doc(db, 'admin', 'lgu-scheduled'), {
        role: 'lgu_admin',
        status: 'active',
        clientId: 'scheduled-town',
      }),

      setDoc(doc(db, 'users', 'resident-naic'), {
        clientId: 'naic',
        displayName: 'Naic Resident',
      }),
      setDoc(doc(db, 'users', 'resident-gentri'), {
        clientId: 'gentri',
        displayName: 'Gentri Resident',
      }),
      setDoc(doc(db, 'users', 'resident-scheduled'), {
        clientId: 'scheduled-town',
        displayName: 'Scheduled Resident',
      }),
      setDoc(doc(db, 'users', 'resident-missing-client'), {
        displayName: 'Missing Client Resident',
      }),

      setDoc(doc(db, 'announcements', 'naic-alert'), { clientId: 'naic', title: 'Naic alert' }),
      setDoc(doc(db, 'announcements', 'gentri-alert'), { clientId: 'gentri', title: 'Gentri alert' }),
      setDoc(doc(db, 'announcements', 'scheduled-alert'), {
        clientId: 'scheduled-town',
        title: 'Scheduled alert',
      }),
      setDoc(doc(db, 'announcements', 'missing-client-alert'), {
        title: 'Legacy missing client alert',
      }),

      setDoc(doc(db, 'centers', 'naic-center'), { clientId: 'naic', name: 'Naic Center' }),
      setDoc(doc(db, 'centers', 'gentri-center'), { clientId: 'gentri', name: 'Gentri Center' }),

      setDoc(doc(db, 'contacts', 'naic'), { hotline: '111' }),
      setDoc(doc(db, 'contacts', 'gentri'), { hotline: '222' }),
      setDoc(doc(db, 'contacts', 'scheduled-town'), { hotline: '333' }),

      setDoc(doc(db, 'adminInvitations', 'invite-naic'), { clientId: 'naic', email: 'naic@example.com' }),
      setDoc(doc(db, 'adminInvitations', 'invite-gentri'), {
        clientId: 'gentri',
        email: 'gentri@example.com',
      }),

      setDoc(doc(db, 'clientChangeRequests', 'change-naic'), { clientId: 'naic', status: 'pending' }),
      setDoc(doc(db, 'clientChangeRequests', 'change-gentri'), { clientId: 'gentri', status: 'pending' }),

      setDoc(doc(db, 'clientBoundaries', 'naic'), { clientId: 'naic', type: 'FeatureCollection' }),
      setDoc(doc(db, 'clientBoundaries', 'gentri'), { clientId: 'gentri', type: 'FeatureCollection' }),

      setDoc(doc(db, 'statuses', 'status-naic'), {
        uid: 'resident-naic',
        clientId: 'naic',
        statusType: 'safe',
      }),
      setDoc(doc(db, 'statuses', 'status-gentri'), {
        uid: 'resident-gentri',
        clientId: 'gentri',
        statusType: 'safe',
      }),
      setDoc(doc(db, 'statuses', 'status-scheduled'), {
        uid: 'resident-scheduled',
        clientId: 'scheduled-town',
        statusType: 'safe',
      }),
      setDoc(doc(db, 'statuses', 'status-missing-client'), {
        uid: 'resident-missing-client',
        statusType: 'safe',
      }),

      setDoc(doc(db, 'status', 'resident-naic', 'statuses', 'current'), {
        uid: 'resident-naic',
        clientId: 'naic',
        statusType: 'safe',
      }),
      setDoc(doc(db, 'status', 'resident-gentri', 'statuses', 'current'), {
        uid: 'resident-gentri',
        clientId: 'gentri',
        statusType: 'safe',
      }),
      setDoc(doc(db, 'status', 'resident-missing-client', 'statuses', 'current'), {
        uid: 'resident-missing-client',
        statusType: 'safe',
      }),
    ]);
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedBaseData();
});

after(async () => {
  await testEnv.cleanup();
});

test('public reads active clients only while protected client metadata stays private', async () => {
  const db = guestDb();

  await assertSucceeds(getDoc(doc(db, 'clients', 'naic')));
  await assertFails(getDoc(doc(db, 'clients', 'scheduled-town')));
  await assertFails(getDoc(doc(db, 'clients', 'inactive-town')));
});

test('public access is limited to intentional emergency and onboarding collections', async () => {
  const db = guestDb();

  await assertSucceeds(getDoc(doc(db, 'notifications', 'public-alert')));
  await assertSucceeds(getDoc(doc(db, 'weather', 'naic', 'realtime', 'data')));
  await assertSucceeds(getDoc(doc(db, 'earthquakes', 'recent-quake')));
  await assertSucceeds(getDoc(doc(db, 'contacts', 'naic')));
  await assertSucceeds(setDoc(doc(db, 'lguRequests', 'public-request'), {
    requesterName: 'Requester',
    status: 'pending',
  }));

  await assertFails(getDoc(doc(db, 'users', 'resident-naic')));
  await assertFails(getDoc(doc(db, 'admin', 'lgu-naic')));
  await assertFails(setDoc(doc(db, 'notifications', 'public-write'), {
    title: 'Blocked write',
  }));
});

test('super admin can read system-wide protected collections', async () => {
  const db = dbFor('super-admin');

  await assertSucceeds(getDoc(doc(db, 'clients', 'gentri')));
  await assertSucceeds(getDoc(doc(db, 'admin', 'lgu-naic')));
  await assertSucceeds(getDoc(doc(db, 'clientArchives', 'deleted-client')));
  await assertSucceeds(getDoc(doc(db, 'clientDeletionJobs', 'deleted-client')));
  await assertSucceeds(getDoc(doc(db, 'operationLogs', 'log-1')));
  await assertSucceeds(getDoc(doc(db, 'emailLogs', 'email-1')));
});

test('LGU admin can read own tenant data but not another tenant', async () => {
  const db = dbFor('lgu-naic');

  await assertSucceeds(getDoc(doc(db, 'clients', 'naic')));
  await assertSucceeds(getDoc(doc(db, 'users', 'resident-naic')));
  await assertSucceeds(getDoc(doc(db, 'announcements', 'naic-alert')));
  await assertSucceeds(getDoc(doc(db, 'centers', 'naic-center')));
  await assertSucceeds(getDoc(doc(db, 'statuses', 'status-naic')));
  await assertSucceeds(getDoc(doc(db, 'adminInvitations', 'invite-naic')));
  await assertSucceeds(getDoc(doc(db, 'clientChangeRequests', 'change-naic')));
  await assertSucceeds(getDoc(doc(db, 'clientBoundaries', 'naic')));

  await assertFails(getDoc(doc(db, 'users', 'resident-gentri')));
  await assertFails(getDoc(doc(db, 'announcements', 'gentri-alert')));
  await assertFails(getDoc(doc(db, 'centers', 'gentri-center')));
  await assertFails(getDoc(doc(db, 'statuses', 'status-gentri')));
  await assertFails(getDoc(doc(db, 'adminInvitations', 'invite-gentri')));
  await assertFails(getDoc(doc(db, 'clientChangeRequests', 'change-gentri')));
  await assertFails(getDoc(doc(db, 'clientBoundaries', 'gentri')));
});

test('missing clientId records are not treated as Naic fallback data', async () => {
  const lguDb = dbFor('lgu-naic');
  const residentDb = dbFor('resident-naic');

  await assertFails(getDoc(doc(lguDb, 'users', 'resident-missing-client')));
  await assertFails(getDoc(doc(lguDb, 'announcements', 'missing-client-alert')));
  await assertFails(getDoc(doc(lguDb, 'statuses', 'status-missing-client')));
  await assertFails(getDoc(doc(lguDb, 'status', 'resident-missing-client', 'statuses', 'current')));

  await assertFails(getDoc(doc(residentDb, 'announcements', 'missing-client-alert')));
  await assertFails(getDoc(doc(residentDb, 'statuses', 'status-missing-client')));
  await assertFails(getDoc(doc(residentDb, 'status', 'resident-missing-client', 'statuses', 'current')));
});

test('LGU admin writes require own active client and cannot move documents across tenants', async () => {
  const naicDb = dbFor('lgu-naic');
  const scheduledDb = dbFor('lgu-scheduled');

  await assertSucceeds(setDoc(doc(naicDb, 'announcements', 'new-naic-alert'), {
    clientId: 'naic',
    title: 'New Naic alert',
  }));
  await assertSucceeds(updateDoc(doc(naicDb, 'announcements', 'naic-alert'), {
    title: 'Updated Naic alert',
  }));
  await assertSucceeds(deleteDoc(doc(naicDb, 'announcements', 'naic-alert')));
  await assertSucceeds(setDoc(doc(naicDb, 'contacts', 'naic'), {
    hotline: '999',
  }));

  await assertFails(setDoc(doc(naicDb, 'announcements', 'new-gentri-alert'), {
    clientId: 'gentri',
    title: 'Wrong tenant',
  }));
  await assertFails(updateDoc(doc(naicDb, 'announcements', 'gentri-alert'), {
    clientId: 'naic',
    title: 'Tenant takeover attempt',
  }));
  await assertFails(setDoc(doc(scheduledDb, 'announcements', 'scheduled-new'), {
    clientId: 'scheduled-town',
    title: 'Locked client write',
  }));
  await assertFails(updateDoc(doc(scheduledDb, 'contacts', 'scheduled-town'), {
    hotline: '000',
  }));
});

test('resident profile and status writes require own active client', async () => {
  const naicDb = dbFor('resident-naic');
  const scheduledDb = dbFor('resident-scheduled');

  await assertSucceeds(updateDoc(doc(naicDb, 'users', 'resident-naic'), {
    displayName: 'Updated Resident',
  }));
  await assertFails(updateDoc(doc(naicDb, 'users', 'resident-naic'), {
    clientId: 'gentri',
  }));
  await assertFails(updateDoc(doc(scheduledDb, 'users', 'resident-scheduled'), {
    displayName: 'Locked Resident',
  }));

  await assertSucceeds(setDoc(doc(naicDb, 'statuses', 'new-status-naic'), {
    uid: 'resident-naic',
    clientId: 'naic',
    statusType: 'safe',
  }));
  await assertFails(setDoc(doc(naicDb, 'statuses', 'new-status-gentri'), {
    uid: 'resident-naic',
    clientId: 'gentri',
    statusType: 'safe',
  }));
  await assertFails(setDoc(doc(scheduledDb, 'statuses', 'new-status-scheduled'), {
    uid: 'resident-scheduled',
    clientId: 'scheduled-town',
    statusType: 'safe',
  }));
});

test('personal status subcollections are tenant-scoped for reads and active-client writes', async () => {
  const residentDb = dbFor('resident-naic');
  const lguDb = dbFor('lgu-naic');
  const scheduledDb = dbFor('resident-scheduled');

  await assertSucceeds(getDoc(doc(residentDb, 'status', 'resident-naic', 'statuses', 'current')));
  await assertSucceeds(getDocs(query(
    collection(residentDb, 'status', 'resident-naic', 'statuses'),
    where('statusType', '==', 'safe')
  )));
  await assertFails(getDoc(doc(residentDb, 'status', 'resident-gentri', 'statuses', 'current')));

  await assertSucceeds(setDoc(doc(residentDb, 'status', 'resident-naic', 'statuses', 'fresh'), {
    uid: 'resident-naic',
    clientId: 'naic',
    statusType: 'safe',
  }));
  await assertFails(setDoc(doc(scheduledDb, 'status', 'resident-scheduled', 'statuses', 'fresh'), {
    uid: 'resident-scheduled',
    clientId: 'scheduled-town',
    statusType: 'safe',
  }));

  await assertSucceeds(getDocs(query(collectionGroup(lguDb, 'statuses'), where('clientId', '==', 'naic'))));
  await assertFails(getDocs(query(collectionGroup(lguDb, 'statuses'), where('clientId', '==', 'gentri'))));
});
