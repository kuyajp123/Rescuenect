/**
 * Contacts Seeder
 *
 * Writes a complete contacts document (categories + contact items) into the
 * `contacts` Firestore collection for the specified client.
 *
 * Note: ContactModel.saveContacts() requires a valid logoUrl on the client record.
 * This seeder writes directly to Firestore to avoid that dependency at seed time.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { canonicalizeClientId } from '../../src/config/locationConfig';
import { db } from '../../src/db/firestoreConfig';
import { randomBool, uuid, verifyClientExists } from './_utils';

// ─── Random data pools ─────────────────────────────────────────────────────────

const EMERGENCY_CONTACTS = [
  { name: 'BFP Fire Emergency', value: '160', action: 'call', iconKey: 'fire', iconColor: '#e63946' },
  { name: 'PNP Police Hotline', value: '911', action: 'call', iconKey: 'police', iconColor: '#1d3557' },
  { name: 'MDRRMO Hotline', value: '(046) 123-4567', action: 'call', iconKey: 'emergency', iconColor: '#e63946' },
  { name: 'Red Cross', value: '143', action: 'call', iconKey: 'health', iconColor: '#e63946' },
  { name: 'Coast Guard', value: '5100', action: 'call', iconKey: 'water', iconColor: '#0077b6' },
];

const HEALTH_CONTACTS = [
  { name: 'Rural Health Unit', value: '(046) 234-5678', action: 'call', iconKey: 'health', iconColor: '#2d6a4f' },
  { name: 'Municipal Hospital', value: '(046) 345-6789', action: 'call', iconKey: 'hospital', iconColor: '#2d6a4f' },
  { name: 'Ambulance Service', value: '(046) 456-7890', action: 'call', iconKey: 'ambulance', iconColor: '#e63946' },
  { name: 'DOH Hotline', value: '1555', action: 'call', iconKey: 'health', iconColor: '#2d6a4f' },
];

const LGU_CONTACTS = [
  { name: "Mayor's Office", value: '(046) 567-8901', action: 'call', iconKey: 'government', iconColor: '#1d3557' },
  { name: 'Municipal Hall', value: '(046) 678-9012', action: 'call', iconKey: 'building', iconColor: '#1d3557' },
  { name: 'MSWDO Office', value: '(046) 789-0123', action: 'call', iconKey: 'social', iconColor: '#5e60ce' },
  {
    name: 'LGU Facebook Page',
    value: 'https://facebook.com/lgu.naic',
    action: 'open',
    iconKey: 'social_media',
    iconColor: '#0077b6',
  },
  { name: 'LGU Email', value: 'info@naic.gov.ph', action: 'email', iconKey: 'email', iconColor: '#1d3557' },
];

const UTILITY_CONTACTS = [
  { name: 'NAWASA Water District', value: '(046) 890-1234', action: 'call', iconKey: 'water', iconColor: '#0077b6' },
  { name: 'Meralco (Power Outage)', value: '16211', action: 'call', iconKey: 'electric', iconColor: '#f4a261' },
  { name: 'PLDT Hotline', value: '171', action: 'call', iconKey: 'phone', iconColor: '#457b9d' },
  { name: 'Globe Telecom', value: '211', action: 'call', iconKey: 'phone', iconColor: '#2d6a4f' },
];

// ─── Category definitions ──────────────────────────────────────────────────────

interface CategoryDef {
  name: string;
  type: string;
  description: string;
  contacts: Array<{
    name: string;
    value: string;
    action: string;
    iconKey: string;
    iconColor: string;
  }>;
}

const CATEGORY_DEFINITIONS: CategoryDef[] = [
  {
    name: 'Emergency Services',
    type: 'emergency',
    description: 'Critical emergency hotlines for immediate response',
    contacts: EMERGENCY_CONTACTS,
  },
  {
    name: 'Health Services',
    type: 'health',
    description: 'Medical and health-related contacts',
    contacts: HEALTH_CONTACTS,
  },
  {
    name: 'LGU Offices',
    type: 'government',
    description: 'Local Government Unit offices and contacts',
    contacts: LGU_CONTACTS,
  },
  {
    name: 'Utilities',
    type: 'utilities',
    description: 'Water, power, and telecommunications',
    contacts: UTILITY_CONTACTS,
  },
];

// ─── Seeder ────────────────────────────────────────────────────────────────────

export async function seedContacts(clientId: string): Promise<void> {
  await verifyClientExists(clientId);

  const canonicalId = canonicalizeClientId(clientId) ?? clientId;

  console.log(`   Seeding contacts for client "${canonicalId}"...`);

  const categories: Record<string, unknown>[] = [];
  const contacts: Record<string, unknown>[] = [];

  CATEGORY_DEFINITIONS.forEach((catDef, catIndex) => {
    const catId = uuid();
    categories.push({
      id: catId,
      name: catDef.name,
      type: catDef.type,
      description: catDef.description,
      order: catIndex + 1,
    });

    catDef.contacts.forEach((contact, contactIndex) => {
      contacts.push({
        id: uuid(),
        categoryId: catId,
        name: contact.name,
        value: contact.value,
        action: contact.action,
        iconKey: contact.iconKey,
        iconColor: contact.iconColor,
        isActive: randomBool(0.9),
        order: contactIndex + 1,
      });
    });
  });

  await db
    .collection('contacts')
    .doc(canonicalId)
    .set({
      clientId: canonicalId,
      clientName: canonicalId === 'naic' ? 'Naic' : canonicalId,
      municipalityName: canonicalId === 'naic' ? 'Naic' : canonicalId,
      provinceName: 'Cavite',
      logoUrl: null,
      logoPath: null,
      logoWidth: null,
      logoHeight: null,
      logoUpdatedAt: null,
      categories,
      contacts,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'seeder-system',
    });

  console.log(`   ✅ ${categories.length} categories and ${contacts.length} contacts seeded — doc ID: ${canonicalId}`);
  console.log(`   📞 Contacts seeded successfully.`);
}
