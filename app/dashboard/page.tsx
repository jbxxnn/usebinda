// Provider Dashboard - Main page

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserById, getProviderServices, getProviderBookings } from '@/lib/database';
import { formatAmount } from '@/lib/stripe';
import { formatDateTime, getRelativeTime } from '@/lib/scheduling';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const profile = await getUserById(user.id);
  const services = await getProviderServices(user.id);
  const upcomingBookings = await getProviderBookings(user.id, {
    status: 'confirmed',
    limit: 5,
    startDate: new Date(),
  });

  // Calculate stats
  const activeServices = services.filter(s => s.active).length;
  const totalBookings = upcomingBookings.length;

  return (
    <div className="flex-1 w-full flex flex-col gap-8 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your business</p>
        </div>
        <Link href="/dashboard/services/new">
          <Button>Add Service</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Active Services</div>
          <div className="text-3xl font-bold mt-2">{activeServices}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Upcoming Bookings</div>
          <div className="text-3xl font-bold mt-2">{totalBookings}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Your Booking Link</div>
          <div className="text-sm mt-2 font-mono">
            {profile?.username ? (
              <Link 
                href={`/${profile.username}`} 
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                binda.app/{profile.username}
              </Link>
            ) : (
              <Link href="/dashboard/settings" className="text-blue-600 hover:underline">
                Set up username
              </Link>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Services Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Services</h2>
            <Link href="/dashboard/services">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No services yet</p>
              <Link href="/dashboard/services/new">
                <Button className="mt-4">Create Your First Service</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {services.slice(0, 3).map((service) => (
                <div key={service.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{service.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.duration} min • {formatAmount(service.price)}
                    </div>
                  </div>
                  <Badge variant={service.active ? 'default' : 'secondary'}>
                    {service.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Bookings Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
            <Link href="/dashboard/bookings">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No upcoming bookings</p>
              <p className="text-sm mt-2">Share your booking link to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border-b pb-3 last:border-0">
                  <div className="font-medium">{booking.customer_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.service.title}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getRelativeTime(booking.date_time)} • {formatDateTime(booking.date_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Setup Guide - Show if user hasn't set up username */}
      {!profile?.username && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-2">Complete Your Setup</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set up your custom booking link to start accepting bookings
          </p>
          <Link href="/dashboard/settings">
            <Button>Complete Setup</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

