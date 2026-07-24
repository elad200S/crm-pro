import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Calendar,
  Building2,
  Menu,
  X,
  UserPlus,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "./components/notifications/NotificationBell";

const navigationItems = [
  {
    title: "דשבורד",
    url: createPageUrl("Dashboard"),
    icon: BarChart3,
  },
  {
    title: "לידים",
    url: createPageUrl("Leads"),
    icon: UserPlus,
  },
  {
    title: "לקוחות", 
    url: createPageUrl("Customers"),
    icon: Users,
  },
  {
    title: "תשלומים",
    url: createPageUrl("Payments"),
    icon: CreditCard,
  },
  {
    title: "מסמכים",
    url: createPageUrl("Quotes"),
    icon: FileText,
  },
  {
    title: "יומן ומשימות",
    url: createPageUrl("Calendar"), 
    icon: Calendar,
  },
  {
    title: "ניהול משתמשים",
    url: createPageUrl("UserManagement"),
    icon: Users,
  },
  {
    title: "קבצי תיאור תפקיד",
    url: createPageUrl("JobDescriptionManagement"),
    icon: Building2,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleNavItems, setVisibleNavItems] = useState(navigationItems);
  const [sidebarStats, setSidebarStats] = useState({ activeCustomers: null, pendingPayments: null, monthlyRevenue: null });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    checkUserOnboarding();
  }, []);

  useEffect(() => {
    if (currentUser) loadSidebarStats();
  }, [currentUser]);

  const loadSidebarStats = async () => {
    try {
      const now = new Date();
      const [customers, payments] = await Promise.all([
        base44.entities.Customer.list('-created_date', 200),
        base44.entities.Payment.list('-created_date', 200)
      ]);
      const activeCustomers = customers.filter(c => c.status === "פעיל").length;
      const pendingPayments = payments.filter(p => p.status !== "שולם" && p.status !== "מבוטל").length;
      const monthlyRevenue = payments
        .filter(p => p.status === "שולם" && p.paid_date && new Date(p.paid_date).getMonth() === now.getMonth() && new Date(p.paid_date).getFullYear() === now.getFullYear())
        .reduce((s, p) => s + (p.amount || 0), 0);
      setSidebarStats({ activeCustomers, pendingPayments, monthlyRevenue });
    } catch {}
  };

  const checkUserOnboarding = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const isAdmin = user.role === 'admin';
      const adminOnlyPages = ["ניהול משתמשים", "קבצי תיאור תפקיד"];
      setVisibleNavItems(navigationItems.filter(item =>
        !adminOnlyPages.includes(item.title) || isAdmin
      ));

      const needsOnboarding = !user.phone || !user.job_title || !user.department || !user.user_category;
      
      if (needsOnboarding && currentPageName !== "Onboarding") {
        navigate(createPageUrl("Onboarding"));
        setLoading(false);
        return;
      }

      if (!needsOnboarding) {
        await base44.auth.updateMe({
          last_login: new Date().toISOString()
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("שגיאה בבדיקת משתמש:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (delta > 0) setSwipeOffset(delta);
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 80) setMobileMenuOpen(false);
    setSwipeOffset(0);
    touchStartX.current = null;
  };

  const handleNotificationsToggle = (isOpen) => {
    setNotificationsOpen(isOpen);
    if (isOpen && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  if (currentPageName === "Onboarding" || currentPageName === "ClientSign" || loading) {
    return children;
  }

  return (
    <div dir="rtl" className="fixed inset-0 bg-gray-50 overflow-hidden">
      {/* Mobile Header - FIXED */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm fixed top-0 left-0 right-0 z-[100] h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleMobileMenuToggle}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <NotificationBell
              onOpenChange={handleNotificationsToggle}
              isOpen={notificationsOpen}
            />
          </div>
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5">
            <img src="/logo-hey.png" alt="HEY Digital" className="h-7 object-contain" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar — backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-[98]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar — slide panel */}
      <div
        className="lg:hidden fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-[99] flex flex-col"
        style={{
          transform: mobileMenuOpen ? `translateX(${swipeOffset}px)` : 'translateX(100%)',
          transition: swipeOffset > 0 ? 'none' : 'transform 0.3s ease-in-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
            <img src="/logo-hey.png" alt="HEY Digital" className="h-6 object-contain" />
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 relative transition-colors ${
                  active ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
              >
                {active && (
                  <span className="absolute right-0 top-2 bottom-2 w-[3px] bg-purple-500 rounded-l-full" />
                )}
                <span className={`text-sm font-medium ${active ? 'text-purple-700' : 'text-gray-600'}`}>
                  {item.title}
                </span>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-purple-500' : 'text-gray-400'}`} />
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center justify-end gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser?.full_name || "משתמש"}</p>
              <p className="text-xs text-gray-400">{currentUser?.job_title || ""}</p>
            </div>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{currentUser?.full_name?.charAt(0) || "מ"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full pt-16 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-[72px] bg-white border-l border-gray-100 shadow-sm flex-shrink-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex flex-col items-center py-4 border-b border-gray-100 flex-shrink-0 gap-1">
              <img src="/stamp-hey.png" alt="HEY Digital" className="w-10 h-10 object-contain" />
              <NotificationBell />
            </div>

            {/* Nav Items — distributed evenly, no scroll */}
            <nav className="flex-1 flex flex-col items-center justify-evenly py-2">
              {visibleNavItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    title={item.title}
                    className={`flex flex-col items-center gap-0.5 w-full px-1 py-1.5 transition-all duration-150 relative group
                      ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    {active && (
                      <span className="absolute right-0 top-1 bottom-1 w-0.5 bg-blue-600 rounded-l-full" />
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors
                      ${active ? 'bg-blue-50' : 'group-hover:bg-gray-50'}`}>
                      <item.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[9px] font-medium leading-tight text-center line-clamp-1 w-full px-0.5">
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* User avatar */}
            <div className="flex flex-col items-center py-3 border-t border-gray-100 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {currentUser?.full_name?.charAt(0) || "מ"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6 min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}