"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Wheat,
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  LogIn,
  Menu,
  X,
  Shield,
  MessageSquare,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const publicNavItems = [
  { href: "/dashboard", label: "RFPs", icon: LayoutDashboard },
];

const authedNavItems = [
  { href: "/dashboard", label: "RFPs", icon: LayoutDashboard },
  { href: "/settings", label: "Alerts & Settings", icon: Bell },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/requests", label: "Requests", icon: MessageSquare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useProfile();
  const isAuthenticated = !!profile;
  const isAdmin = profile?.subscription_tier === "enterprise";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const navItems = isAuthenticated ? authedNavItems : publicNavItems;
  const allNav = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container-app flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-forest-600 flex items-center justify-center">
                <Wheat className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-sm tracking-tight hidden sm:block">
                RFP Harvest
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {allNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "text-forest-700 bg-forest-50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/request-town"
              className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:text-forest-700 px-2 py-1 border border-forest-200 hover:bg-forest-50 transition-colors hidden md:flex"
            >
              <MapPin className="w-3 h-3" />
              Request a town
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/settings"
                  className="p-2 text-slate-500 hover:text-slate-700 hidden md:block"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-slate-700 hidden md:block"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium bg-forest-600 text-white px-3 py-1.5 hover:bg-forest-700 transition-colors hidden md:block"
                >
                  Sign up free
                </Link>
              </>
            ) : null}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 md:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="container-app py-3 space-y-1">
              {allNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 text-sm font-medium",
                      active
                        ? "text-forest-700 bg-forest-50"
                        : "text-slate-600"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/request-town"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-forest-600"
              >
                <MapPin className="w-4 h-4" />
                Request a town
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              ) : (
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-forest-600"
                >
                  <LogIn className="w-4 h-4" />
                  Sign up free
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="container-app py-6">{children}</main>
    </div>
  );
}
