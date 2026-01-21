import { z } from 'zod';
import {
  addressTypeEnum,
  nameIdentifierTypeEnum,
  nationalIdentifierTypeEnum,
  transferDirectionEnum,
  vaspIdentifierTypeEnum,
  personTypeEnum,
} from './type';
import type { KeyEntry } from './type';

export const validateKeyEntry = (
  entry: Required<KeyEntry>,
  entryName: string = '',
): { valid: boolean; error?: string } => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return { valid: false, error: `${entryName} must be an object` };
  }

  if (
    entry.priv === undefined ||
    entry.priv === null ||
    typeof entry.priv !== 'object' ||
    Array.isArray(entry.priv)
  ) {
    return { valid: false, error: `${entryName}.priv must be an object` };
  }

  if (
    entry.pub === undefined ||
    entry.pub === null ||
    typeof entry.pub !== 'object' ||
    Array.isArray(entry.pub)
  ) {
    return { valid: false, error: `${entryName}.pub must be an object` };
  }

  return { valid: true };
};

export type VaspKeysWithMaterial = {
  vasp_id: string;
  sig: Required<KeyEntry>;
  dpop: Required<KeyEntry>;
  enc: Required<KeyEntry>;
};

export const validateVaspKeysWithError = (
  data: Partial<VaspKeysWithMaterial>,
): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data must be an object' };
  }

  if (typeof data.vasp_id !== 'string' || !data.vasp_id.trim()) {
    return { valid: false, error: 'vasp_id is required and must be a non-empty string' };
  }

  if (!data.sig || typeof data.sig !== 'object') {
    return { valid: false, error: 'sig is required and must be an object' };
  }
  if (!data.dpop || typeof data.dpop !== 'object') {
    return { valid: false, error: 'dpop is required and must be an object' };
  }
  if (!data.enc || typeof data.enc !== 'object') {
    return { valid: false, error: 'enc is required and must be an object' };
  }

  const sigValidation = validateKeyEntry(data.sig, 'sig');

  if (!sigValidation.valid) {
    return sigValidation;
  }
  const dpopValidation = validateKeyEntry(data.dpop, 'dpop');
  if (!dpopValidation.valid) {
    return dpopValidation;
  }
  const encValidation = validateKeyEntry(data.enc, 'enc');
  if (!encValidation.valid) {
    return encValidation;
  }

  return { valid: true };
};

const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((s) => {
    const [y, m, d] = s.split('-').map(Number);
    if (m < 1 || m > 12) return false;
    const maxDay = new Date(y, m, 0).getDate();
    return d >= 1 && d <= maxDay;
  }, 'Invalid calendar date (YYYY-MM-DD)');

const MessageFormDataSchema = z.object({
  ivms101Version: z.string(),
  messageId: z.string(),
  createdAt: z.string(),
  transfer: z.object({
    direction: transferDirectionEnum,
    asset: z.string(),
    amount: z.string(),
    network: z.string(),
    txHash: z.string(),
    originatingAddress: z.string(),
    beneficiaryAddress: z.string(),
    memoOrTag: z.string().optional(),
    internalRef: z.string().optional(),
  }),
  originatingVasp: z.object({
    vaspName: z.string(),
    vaspIdentifier: z
      .object({
        type: vaspIdentifierTypeEnum,
        value: z.string(),
      })
      .optional(),
  }),
  beneficiaryVasp: z.object({
    vaspName: z.string(),
    vaspIdentifier: z
      .object({
        type: vaspIdentifierTypeEnum,
        value: z.string(),
      })
      .optional(),
  }),
  originator: z.object({
    type: personTypeEnum,
    name: z.object({
      nameIdentifier: z.array(
        z.object({
          primaryIdentifier: z.string(),
          secondaryIdentifier: z.string().optional(),
          nameIdentifierType: nameIdentifierTypeEnum,
        }),
      ),
    }),
    customerIdentification: z.string().optional(),
    accountNumber: z.string().optional(),
    geographicAddress: z.array(
      z.object({
        addressType: addressTypeEnum.optional(),
        streetName: z.string().optional(),
        buildingNumber: z.string().optional(),
        townName: z.string().optional(),
        countrySubDivision: z.string().optional(),
        postCode: z.string().optional(),
        country: z.string(),
      }),
    ),
    nationalIdentification: z
      .array(
        z.object({
          nationalIdentifier: z.string(),
          nationalIdentifierType: nationalIdentifierTypeEnum.optional(),
          countryOfIssue: z.string(),
        }),
      )
      .optional(),
    dateAndPlaceOfBirth: z
      .object({
        birthDate: yyyyMmDd,
        cityOfBirth: z.string(),
        countryOfBirth: z.string(),
      })
      .partial()
      .optional(),
  }),
  beneficiary: z.object({
    type: personTypeEnum,
    name: z.object({
      nameIdentifier: z.array(
        z.object({
          primaryIdentifier: z.string(),
          secondaryIdentifier: z.string().optional(),
          nameIdentifierType: nameIdentifierTypeEnum,
        }),
      ),
    }),
    customerIdentification: z.string().optional(),
    accountNumber: z.string().optional(),
  }),
  contact: z
    .object({
      complianceEmail: z.string(),
      supportReference: z.string(),
    })
    .optional(),
});

const fieldNameMap: Record<string, string> = {
  ivms101Version: 'IVMS101 Version',
  messageId: 'Message ID',
  createdAt: 'Created At',
  'transfer.direction': 'Transfer Direction',
  'transfer.asset': 'Asset',
  'transfer.amount': 'Amount',
  'transfer.network': 'Network',
  'transfer.txHash': 'Transaction Hash',
  'transfer.originatingAddress': 'Originating Address',
  'transfer.beneficiaryAddress': 'Beneficiary Address',
  'originatingVasp.vaspName': 'Originating VASP Name',
  'beneficiaryVasp.vaspName': 'Beneficiary VASP Name',
  'originator.type': 'Originator Type',
  'originator.name.nameIdentifier': 'Originator Name Identifier',
  'originator.name.nameIdentifier.primaryIdentifier': 'Originator Primary Identifier',
  'originator.name.nameIdentifier.nameIdentifierType': 'Originator Name Identifier Type',
  'originator.geographicAddress': 'Originator Geographic Address',
  'originator.geographicAddress.country': 'Originator Country',
  'originator.nationalIdentification.nationalIdentifier': 'Originator National Identifier',
  'originator.nationalIdentification.countryOfIssue': 'Originator Country of Issue',
  'beneficiary.type': 'Beneficiary Type',
  'beneficiary.name.nameIdentifier': 'Beneficiary Name Identifier',
  'beneficiary.name.nameIdentifier.primaryIdentifier': 'Beneficiary Primary Identifier',
  'beneficiary.name.nameIdentifier.nameIdentifierType': 'Beneficiary Name Identifier Type',
  'contact.complianceEmail': 'Compliance Email',
  'contact.supportReference': 'Support Reference',
};

const getFieldName = (path: string): string => {
  if (fieldNameMap[path]) {
    return fieldNameMap[path];
  }

  for (const [key, value] of Object.entries(fieldNameMap)) {
    if (path.includes(key)) {
      return value;
    }
  }

  return path
    .split('.')
    .map((part) => {
      return part
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    })
    .join(' > ');
};

const formatInvalidTypeError = (fieldName: string, errorMsg: string): string => {
  const msg = errorMsg.toLowerCase();
  if (msg.includes('required') || msg.includes('undefined')) return `${fieldName} is required`;
  if (msg.includes('null')) return `${fieldName} cannot be null`;
  if (errorMsg.includes('Expected string')) return `${fieldName} must be a valid text value`;
  return `${fieldName}: ${errorMsg}`;
};

const formatTooSmallError = (fieldName: string, errorMsg: string): string => {
  if (errorMsg.toLowerCase().includes('array')) return `${fieldName} must have at least one item`;
  return `${fieldName} is too small`;
};

const formatEnumError = (fieldName: string, path: string, received: string): string => {
  if (path.includes('nameIdentifierType')) {
    return `${fieldName} must be one of: LEGL, ALIA, or TRAD`;
  }
  if (path.includes('addressType')) {
    return `${fieldName} must be one of: HOME, BIZZ, or GEOG`;
  }
  if (path.includes('nationalIdentifierType')) {
    return `${fieldName} must be one of: ARNU, CCPT, DRLC, NIDN, TXID, SOCS, RAID, or LEIX`;
  }
  if (path.includes('direction')) {
    return `${fieldName} must be either OUTBOUND or INBOUND`;
  }
  if (path.includes('vaspIdentifier') && path.includes('type')) {
    return `${fieldName} must be one of: LEI, BIC, LOCAL, or OTHER`;
  }
  if (path.includes('originator.type') || path.includes('beneficiary.type')) {
    return `${fieldName} must be either NATURAL or LEGAL`;
  }
  return `${fieldName} has an invalid value. Received: ${received}`;
};

const formatRegexError = (fieldName: string, path: string): string => {
  if (path.includes('birthDate')) {
    return `${fieldName} must be in YYYY-MM-DD format (e.g., 2026-01-01)`;
  }
  return `${fieldName} format is invalid`;
};

const formatCustomError = (fieldName: string, errorMsg: string): string => {
  if (errorMsg.includes('Invalid calendar date')) {
    return `${fieldName} must be a valid date`;
  }
  return `${fieldName}: ${errorMsg}`;
};

const formatZodError = (error: z.ZodError): string => {
  const issue = error.issues[0];
  if (!issue) return 'Validation failed. Please check your input and try again.';

  const path = issue.path.join('.');
  const fieldName = getFieldName(path);

  switch (issue.code) {
    case 'invalid_type':
      return formatInvalidTypeError(fieldName, issue.message);

    case 'too_small':
      return formatTooSmallError(fieldName, issue.message);

    case 'custom':
      return formatCustomError(fieldName, issue.message);

    default:
      if (issue.message.includes('Invalid enum') || issue.message.toLowerCase().includes('enum')) {
        return formatEnumError(fieldName, path, '');
      }
      if (issue.message.includes('Expected YYYY-MM-DD') || issue.message.toLowerCase().includes('regex')) {
        return formatRegexError(fieldName, path);
      }
      return `${fieldName}: ${issue.message}`;
  }
};

export const validateMessageFormData = (
  data: MessageFormData,
): { valid: boolean; error?: string } => {
  try {
    MessageFormDataSchema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: formatZodError(error) };
    }
    return { valid: false, error: 'Validation failed. Please check your input and try again.' };
  }
};

export type MessageFormData = z.infer<typeof MessageFormDataSchema>;
