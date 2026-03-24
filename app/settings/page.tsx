import { getAccounts } from "@/lib/accounts";
import { getAccountEmail } from "@/lib/gmail";
import { Mail, Plus, Trash2, CheckCircle2 } from "lucide-react";

async function getAccountsWithEmails() {
  const accounts = getAccounts();
  return Promise.all(
    accounts.map(async (account) => {
      try {
        const email = await getAccountEmail(account);
        return { ...account, email };
      } catch {
        return account;
      }
    })
  );
}

export default async function SettingsPage() {
  const accounts = await getAccountsWithEmails();

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your connected accounts and preferences
        </p>
      </header>

      <main className="flex-1 px-8 py-6 max-w-3xl">
        {/* Connected Accounts */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Connected Accounts
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Gmail accounts linked to your LinkBox dashboard
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: account.color }}
                >
                  {account.email.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {account.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-gray-500">
                      {account.id === "env-default" ? "Primary account" : "Connected"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-md px-2.5 py-1">
                    {account.label}
                  </span>
                  {account.id !== "env-default" && (
                    <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Connect Account CTA */}
          <div className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Connect another Gmail account
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Add more inboxes to monitor from a single LinkBox dashboard.
                  Multi-account support is coming soon.
                </p>
              </div>
              <button
                disabled
                className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg opacity-40 cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </section>

        {/* Scan Settings */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Scan Schedule
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Automatic scan frequency
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Your inbox is scanned automatically every 15 minutes
                </p>
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                Every 15 min
              </span>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">About</h2>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Mail className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">LinkBox</p>
                <p className="text-xs text-gray-400">
                  AI-powered inbox · v0.1.0
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
