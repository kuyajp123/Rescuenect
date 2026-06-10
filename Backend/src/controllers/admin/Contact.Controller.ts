import { ContactModel } from '@/models/admin/ContactModel';
import { ClientModel } from '@/models/admin/ClientModel';
import { ClientLogoUploadService, ClientLogoValidationError } from '@/services/clientLogoUpload';
import { getClientScopeFromRequest } from '@/utils/adminScope';
import { canLguAdminCompleteOnboarding } from '@/utils/accessControl';
import { Request, Response } from 'express';

const MAX_CATEGORY_NAME_LENGTH = 80;
const MAX_CATEGORY_DESCRIPTION_LENGTH = 200;
const MAX_CONTACT_NAME_LENGTH = 100;
const MAX_CONTACT_VALUE_LENGTH = 100;

type ContactsFieldErrors = Partial<Record<string, string>>;

const asTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value).trim();
  return '';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const validateMaxLength = (fieldErrors: ContactsFieldErrors, key: string, value: string, maxLength: number) => {
  if (value.length > maxLength) {
    fieldErrors[key] = `Must not exceed ${maxLength} characters`;
  }
};

const isAllowedContactAction = (value: unknown): value is 'call' | 'copy' | 'link' | 'display' =>
  value === 'call' || value === 'copy' || value === 'link' || value === 'display';

const isAllowedCategoryType = (value: unknown): value is 'Emergency Hotline' | 'Contact Information' =>
  value === 'Emergency Hotline' || value === 'Contact Information';

const validateContactsPayload = (payload: unknown): ContactsFieldErrors => {
  const fieldErrors: ContactsFieldErrors = {};

  if (!isPlainObject(payload)) {
    return { payload: 'Invalid contacts payload' };
  }

  const categories = Array.isArray(payload.categories) ? payload.categories : null;
  const contacts = Array.isArray(payload.contacts) ? payload.contacts : null;

  if (!categories || !contacts) {
    return { payload: 'Invalid contacts payload' };
  }

  const logoUrl = asTrimmedString(payload.logoUrl);
  if (!logoUrl) {
    fieldErrors.logoUrl = 'LGU logo is required';
  } else if (!/^https?:\/\//i.test(logoUrl)) {
    fieldErrors.logoUrl = 'Upload a valid LGU logo first';
  }

  categories.forEach((category, index) => {
    if (!isPlainObject(category)) {
      fieldErrors[`categories.${index}`] = 'Invalid category entry';
      return;
    }

    const name = asTrimmedString(category.name);
    if (!name) {
      fieldErrors[`categories.${index}.name`] = 'Category name is required';
    } else {
      validateMaxLength(fieldErrors, `categories.${index}.name`, name, MAX_CATEGORY_NAME_LENGTH);
    }

    const type = category.type;
    if (!isAllowedCategoryType(type)) {
      fieldErrors[`categories.${index}.type`] = 'Invalid category type';
    }

    const description = asTrimmedString(category.description);
    if (description) {
      validateMaxLength(fieldErrors, `categories.${index}.description`, description, MAX_CATEGORY_DESCRIPTION_LENGTH);
    }
  });

  contacts.forEach((contact, index) => {
    if (!isPlainObject(contact)) {
      fieldErrors[`contacts.${index}`] = 'Invalid contact entry';
      return;
    }

    const categoryId = asTrimmedString(contact.categoryId);
    if (!categoryId) {
      fieldErrors[`contacts.${index}.categoryId`] = 'Contact category is required';
    }

    const name = asTrimmedString(contact.name);
    if (!name) {
      fieldErrors[`contacts.${index}.name`] = 'Contact name is required';
    } else {
      validateMaxLength(fieldErrors, `contacts.${index}.name`, name, MAX_CONTACT_NAME_LENGTH);
    }

    const value = asTrimmedString(contact.value);
    if (!value) {
      fieldErrors[`contacts.${index}.value`] = 'Contact value is required';
    } else {
      validateMaxLength(fieldErrors, `contacts.${index}.value`, value, MAX_CONTACT_VALUE_LENGTH);
    }

    if (!isAllowedContactAction(contact.action)) {
      fieldErrors[`contacts.${index}.action`] = 'Invalid contact action';
    }
  });

  return fieldErrors;
};

export class ContactController {
  static async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required for contacts' });
        return;
      }

      const data = await ContactModel.getContacts(clientId);
      res.status(200).json({ data });
    } catch (error) {
      console.error('❌ Failed to fetch contacts:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        message: 'Failed to fetch contacts',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async saveContacts(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const fieldErrors = validateContactsPayload(payload);

      if (Object.keys(fieldErrors).length > 0) {
        res.status(400).json({
          message: 'Validation failed',
          errors: Object.values(fieldErrors).filter(Boolean),
          fieldErrors,
        });
        return;
      }

      const userId = (req as any).user?.uid || 'system';
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required for contacts' });
        return;
      }

      await ContactModel.saveContacts(payload, userId, clientId);
      res.status(200).json({ message: 'Contacts saved successfully' });
    } catch (error) {
      console.error('❌ Failed to save contacts:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (error instanceof Error && error.message === 'Client not found') {
        res.status(404).json({ message: error.message });
        return;
      }
      if (
        error instanceof Error &&
        ['LGU logo is required before saving contacts', 'Uploaded LGU logo was not found for this client'].includes(
          error.message
        )
      ) {
        res.status(400).json({
          message: 'Validation failed',
          errors: [error.message],
          fieldErrors: { logoUrl: error.message },
        });
        return;
      }

      res.status(500).json({
        message: 'Failed to save contacts',
        error: typeof error === 'string' ? error : (error as Error).message,
      });
    }
  }

  static async uploadClientLogo(req: Request, res: Response): Promise<void> {
    try {
      const clientId = getClientScopeFromRequest(req);
      if (!clientId) {
        res.status(400).json({ message: 'clientId is required for logo upload' });
        return;
      }

      const client = await ClientModel.getClientById(clientId);
      if (!client) {
        res.status(404).json({ message: 'Client not found' });
        return;
      }

      if (req.adminUser?.role === 'lgu_admin' && !canLguAdminCompleteOnboarding(client.status)) {
        res.status(403).json({ message: 'LGU client is not ready for logo upload' });
        return;
      }

      const uploadedLogo = await ClientLogoUploadService.uploadClientLogo(req.file as Express.Multer.File, client.id);
      const updatedClient = await ClientModel.updateClientLogo(client.id, uploadedLogo);

      res.status(200).json({
        message: 'LGU logo uploaded successfully',
        logoUrl: uploadedLogo.logoUrl,
        logoPath: uploadedLogo.logoPath,
        width: uploadedLogo.width,
        height: uploadedLogo.height,
        client: updatedClient,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload LGU logo';
      if (error instanceof ClientLogoValidationError) {
        res.status(400).json({ message });
        return;
      }

      console.error('Failed to upload LGU logo:', error);
      res.status(500).json({ message });
    }
  }
}
