import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5">
            <Link href="/" className="text-xl font-bold">
              Binda
            </Link>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <AuthButton />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl px-5 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Get booked, get paid, get rebooked
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
            The operating system for solo home-service professionals.
            Accept bookings, automate payments, and reduce no-shows — all from your phone.
          </p>
          <div className="flex gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full">
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold mb-2">Online Bookings</h3>
              <p className="text-muted-foreground text-sm">
                Share your link. Customers book instantly. No more phone tag.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-lg font-semibold mb-2">Auto Payments</h3>
              <p className="text-muted-foreground text-sm">
                Accept deposits and payments with Stripe. Apple Pay, Google Pay, cards.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">SMS Reminders</h3>
              <p className="text-muted-foreground text-sm">
                Automated confirmations and reminders reduce no-shows by 30%.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 p-8 bg-muted rounded-lg max-w-2xl">
            <p className="text-lg italic mb-4">
              &ldquo;Two missed jobs a month? That&apos;s $300 gone. Binda fixes that for $19.&rdquo;
            </p>
            <p className="text-sm text-muted-foreground">
              Built for cleaners, handymen, detailers, and repair pros who hate admin work.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p className="text-muted-foreground">
            © 2024 Binda. Built for the 6 million Americans who do the real work.
          </p>
        </footer>
      </div>
    </main>
  );
}
