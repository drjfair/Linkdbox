import fs from "fs";
import path from "path";

export interface Account {
  id: string;
  email: string;
  label: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  color: string;
  addedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

const ACCOUNT_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EF4444", // red
  "#06B6D4", // cyan
];

function seedFromEnv(): Account | null {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!refreshToken || !clientId || !clientSecret) return null;

  return {
    id: "env-default",
    email: "Primary Account",
    label: "Primary",
    clientId,
    clientSecret,
    refreshToken,
    color: ACCOUNT_COLORS[0],
    addedAt: new Date().toISOString(),
  };
}

export function getAccounts(): Account[] {
  // On Vercel (ephemeral FS) or first run — seed from env vars
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    const envAccount = seedFromEnv();
    if (!envAccount) return [];

    // Try to persist locally (won't work on Vercel but harmless)
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([envAccount], null, 2));
    } catch {
      // Vercel read-only FS — just return in-memory
    }
    return [envAccount];
  }

  try {
    const raw = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
    const accounts: Account[] = JSON.parse(raw);

    // Always ensure the env-default account is present
    const envAccount = seedFromEnv();
    if (envAccount && !accounts.find((a) => a.id === "env-default")) {
      accounts.unshift(envAccount);
    }
    return accounts;
  } catch {
    return seedFromEnv() ? [seedFromEnv()!] : [];
  }
}

export function getAccount(id: string): Account {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === id);
  if (!account) throw new Error(`Account ${id} not found`);
  return account;
}

export function addAccount(
  data: Omit<Account, "id" | "addedAt" | "color">
): Account {
  const accounts = getAccounts();
  const newAccount: Account = {
    ...data,
    id: `acc_${Date.now()}`,
    color: ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
    addedAt: new Date().toISOString(),
  };
  accounts.push(newAccount);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  return newAccount;
}

export function removeAccount(id: string): void {
  if (id === "env-default") throw new Error("Cannot remove the primary account");
  const accounts = getAccounts().filter((a) => a.id !== id);
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

export function updateAccountEmail(id: string, email: string): void {
  if (!fs.existsSync(ACCOUNTS_FILE)) return;
  const accounts = getAccounts().map((a) =>
    a.id === id ? { ...a, email } : a
  );
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}
