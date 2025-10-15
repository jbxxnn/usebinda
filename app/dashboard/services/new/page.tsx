// Create new service page

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ServiceForm } from '@/components/services/service-form';
import Link from 'next/link';

export default async function NewServicePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard/services" className="hover:underline">
            Services
          </Link>
          <span>/</span>
          <span>New</span>
        </div>
        <h1 className="text-3xl font-bold">Create New Service</h1>
        <p className="text-muted-foreground mt-1">
          Add a new service that customers can book
        </p>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}

