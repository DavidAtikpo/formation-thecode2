import { FedaPay, Transaction } from 'fedapay';

export type FedapayEnvironment = 'sandbox' | 'live';

let configured = false;

export function isFedapayConfigured(): boolean {
  return Boolean(process.env.FEDAPAY_SECRET_KEY?.trim());
}

function getFedapayEnvironment(): FedapayEnvironment {
  const key = process.env.FEDAPAY_SECRET_KEY?.trim() ?? '';
  if (key.startsWith('sk_sandbox') || key.startsWith('sk_test')) return 'sandbox';
  if (key.startsWith('sk_live')) return 'live';
  const env = process.env.FEDAPAY_ENVIRONMENT?.trim().toLowerCase();
  return env === 'sandbox' ? 'sandbox' : 'live';
}

function ensureFedapay() {
  const key = process.env.FEDAPAY_SECRET_KEY?.trim();
  if (!key) return null;

  if (!configured) {
    FedaPay.setApiKey(key);
    FedaPay.setEnvironment(getFedapayEnvironment());
    configured = true;
  }

  return FedaPay;
}

const COUNTRY_ISO: Record<string, string> = {
  togo: 'TG',
  bénin: 'BJ',
  benin: 'BJ',
  'côte d\'ivoire': 'CI',
  "cote d'ivoire": 'CI',
  'cote divoire': 'CI',
  sénégal: 'SN',
  senegal: 'SN',
  mali: 'ML',
  burkina: 'BF',
  'burkina faso': 'BF',
  niger: 'NE',
  ghana: 'GH',
  nigeria: 'NG',
  cameroun: 'CM',
  cameroon: 'CM',
  gabon: 'GA',
  france: 'FR',
};

export function countryToIso(country: string): string {
  const norm = country.trim().toLowerCase();
  return COUNTRY_ISO[norm] ?? 'TG';
}

export function normalizePhoneForFedapay(phone: string, countryIso: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  const prefixes: Record<string, string> = {
    TG: '228',
    BJ: '229',
    CI: '225',
    SN: '221',
    ML: '223',
    BF: '226',
    NE: '227',
    GH: '233',
    NG: '234',
    CM: '237',
    GA: '241',
    FR: '33',
  };

  const prefix = prefixes[countryIso];
  if (prefix && digits.startsWith(prefix)) {
    digits = digits.slice(prefix.length);
  }

  return digits;
}

export async function createFedapayPayment(params: {
  description: string;
  amountXof: number;
  callbackUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
}) {
  if (!ensureFedapay()) {
    throw new Error('FedaPay non configuré');
  }

  const countryIso = countryToIso(params.country);
  const phoneNumber = normalizePhoneForFedapay(params.phone, countryIso);

  const transaction = await Transaction.create({
    description: params.description,
    amount: params.amountXof,
    currency: { iso: 'XOF' },
    callback_url: params.callbackUrl,
    customer: {
      firstname: params.firstName,
      lastname: params.lastName,
      email: params.email,
      phone_number: {
        number: phoneNumber,
        country: countryIso,
      },
    },
  });

  const token = await transaction.generateToken();
  const paymentUrl = typeof token.url === 'string' ? token.url : null;

  if (!paymentUrl || transaction.id == null) {
    throw new Error('Lien de paiement FedaPay invalide');
  }

  return {
    url: paymentUrl,
    transactionId: String(transaction.id),
  };
}

export async function retrieveFedapayTransaction(transactionId: string) {
  if (!ensureFedapay()) return null;
  return Transaction.retrieve(transactionId);
}
