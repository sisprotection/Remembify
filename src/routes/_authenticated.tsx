import { Link, Outlet, useNavigate, useRouterState, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/use-role";
import { LayoutDashboard, PlusCircle, Map, Bell, History, Settings, LogOut, Menu, X, Brain, Shield, LifeBuoy, Inbox, Briefcase, Crown, Home, Sparkles } from "lucide-react";
import { GeofenceMonitor } from "@/components/geofence-monitor";
import { HolidayBanner } from "@/components/holiday-banner";
import { RememberFiLogo } from "@/components/rememberfi-logo";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create", label: "Create reminder", icon: PlusCircle },
  { to: "/map", label: "Map reminders", icon: Map },
  { to: "/ai", label: "AI assistant", icon: Brain },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/history", label: "History", icon: History },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AuthenticatedLayout() {
  const { user, loading, signOut } = useAuth();
  const { isOwner, isStaff, tier } = useRoles();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showUpgrade = !isStaff && tier !== "lifetime";

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center bg-hero">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-hero">
      <GeofenceMonitor />
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <span className="font-display text-xs font-bold text-primary-foreground">Fi</span>
          </div>
          <span className="font-display font-semibold">RememberFi</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-muted">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="hidden md:flex h-16 items-center gap-2 px-5 border-b border-sidebar-border shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
              <span className="font-display text-xs font-bold text-primary-foreground">Fi</span>
            </div>
            <span className="font-display text-base font-semibold">RememberFi</span>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-2 md:mt-0">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}

            {showUpgrade && (
              <Link to="/pricing" className="mt-3 flex items-center gap-3 rounded-xl bg-gradient-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition">
                <Sparkles className="h-4 w-4" /> Upgrade plan
              </Link>
            )}

            <div className="mt-4 mb-1 px-3 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold">
              Browse
            </div>
            <Link to="/" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
              <Home className="h-4 w-4" /> Homepage
            </Link>
            <Link to="/pricing" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/pricing" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
              <Sparkles className="h-4 w-4" /> Plans & pricing
            </Link>

            {isStaff && (
              <>
                <div className="mt-4 mb-1 px-3 text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-semibold flex items-center gap-1">
                  {isOwner ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {isOwner ? "Owner" : "Executive"}
                </div>
                <Link to="/employee" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/employee" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
                  <Briefcase className="h-4 w-4" /> Employee portal
                </Link>
                <Link to="/admin" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/admin" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
                  <Shield className="h-4 w-4" /> Admin
                </Link>
                <Link to="/admin/tickets" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === "/admin/tickets" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"}`}>
                  <Inbox className="h-4 w-4" /> Ticket inbox
                </Link>
              </>
            )}
          </nav>
          <div className="shrink-0 border-t border-sidebar-border p-3">
            <div className="px-3 py-2 text-xs text-muted-foreground truncate" title={user.email ?? undefined}>{user.email}</div>
            <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent transition">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </aside>

        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-background/40 backdrop-blur-sm md:hidden" />}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
