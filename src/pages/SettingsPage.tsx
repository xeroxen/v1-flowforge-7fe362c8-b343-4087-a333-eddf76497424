import React from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, Users, CreditCard } from 'lucide-react';
import { CredentialsVault } from '@/components/settings/CredentialsVault';
import { Toaster } from 'sonner';
export function SettingsPage() {
  return (
    <div className="min-h-screen bg-off-white dark:bg-slate-900 text-slate-dark dark:text-off-white">
      <Toaster richColors />
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-bold font-sans mb-8">Settings</h2>
        <Tabs defaultValue="credentials">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="credentials">
              <KeyRound className="h-4 w-4 mr-2" />
              Credentials Vault
            </TabsTrigger>
            <TabsTrigger value="users" disabled>
              <Users className="h-4 w-4 mr-2" />
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="billing" disabled>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="credentials" className="mt-6">
            <CredentialsVault />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400">
        Built with ❤️ at Cloudflare
      </footer>
    </div>
  );
}