export const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank",
  "Globus Bank",
  "Guaranty Trust Bank",
  "Heritage Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint MFB",
  "Opay",
  "Palmpay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
] as const;

const MOCK_ACCOUNT_HOLDER_NAMES = [
  "Chukwuemeka Obi",
  "Amaka Nwosu",
  "Tunde Adeyemi",
  "Ngozi Eze",
  "Femi Olawale",
  "Blessing Okafor",
  "Ifeoma Adeyemi",
  "Oluwaseun Bankole",
  "Chinedu Okonkwo",
  "Aisha Mohammed",
];

export type BankAccountResolution =
  | { success: true; accountName: string }
  | { success: false };

// Mock stand-in for a real Monnify/NUBAN account-resolution call. Any
// well-formed 10-digit account number "resolves" successfully; anything
// else fails, mirroring the real verification UX without a live API.
export function mockResolveBankAccount(
  accountNumber: string,
  bankName: string,
): Promise<BankAccountResolution> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!/^\d{10}$/.test(accountNumber) || !bankName) {
        resolve({ success: false });
        return;
      }
      const seed = Array.from(accountNumber).reduce((sum, d) => sum + Number(d), 0);
      const accountName = MOCK_ACCOUNT_HOLDER_NAMES[seed % MOCK_ACCOUNT_HOLDER_NAMES.length];
      resolve({ success: true, accountName });
    }, 700);
  });
}

export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "";
  const last4 = accountNumber.slice(-4);
  return `**** **** ${last4}`;
}
