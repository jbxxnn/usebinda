// Services management page

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProviderServices } from '@/lib/database';
import { ServicesList } from '@/components/services/services-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const services = await getProviderServices(user.id);

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage the services you offer to customers
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button>Add Service</Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            You haven&apos;t created any services yet
          </p>
          <Link href="/dashboard/services/new">
            <Button size="lg">Create Your First Service</Button>
          </Link>
        </div>
      ) : (
        <ServicesList initialServices={services} />
      )}
    </div>
  );
}

