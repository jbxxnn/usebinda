// Provider settings page

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/database';
import { SettingsForm } from '@/components/settings/settings-form';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const profile = await getUserById(user.id);

  if (!profile) {
    return <div>Error loading profile</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and booking link
        </p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
}


