// Dashboard layout with navigation

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-background p-4 md:p-6">
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold">Binda</h1>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">Provider Dashboard</p>
          </div>

          <nav className="flex-1 space-y-2">
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/services" 
              className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Services
            </Link>
            <Link 
              href="/dashboard/availability" 
              className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Availability
            </Link>
            <Link 
              href="/dashboard/bookings" 
              className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Bookings
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              Settings
            </Link>
          </nav>

          <div className="mt-auto space-y-4 pt-4 border-t">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}


