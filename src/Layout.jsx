import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    checkUserOnboarding();
  }, []);

  const checkUserOnboarding = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

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
    if (notificationsOpen) {
      setNotificationsOpen(false);
    }
  };

  const handleNotificationsToggle = (isOpen) => {
    setNotificationsOpen(isOpen);
    if (isOpen && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  if (currentPageName === "Onboarding" || loading) {
    return children;
  }

  return (
    <div dir="rtl" className="fixed inset-0 bg-gray-50 overflow-hidden">
      {/* Mobile Header - FIXED */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm fixed top-0 left-0 right-0 z-[100] h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">CRM Pro</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell 
              onOpenChange={handleNotificationsToggle}
              isOpen={notificationsOpen}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMobileMenuToggle}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - FIXED */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg fixed top-16 left-0 right-0 z-[99] max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="px-4 py-2">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === item.url
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      <div className="flex h-full pt-16 lg:pt-0">
        {/* Desktop Sidebar - FIXED */}
        <aside className="hidden lg:flex lg:flex-col w-80 bg-white border-l border-gray-200 shadow-lg flex-shrink-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Sidebar Header - FIXED HEIGHT */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">CRM Pro</h2>
                  <p className="text-sm text-gray-500">ניהול לקוחות מתקדם</p>
                </div>
                </Link>
                <NotificationBell />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-3">
                  תפריט ראשי
                </h3>
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        location.pathname === item.url
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border-r-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 flex-shrink-0" />
                  סטטיסטיקות מהירות
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">לקוחות פעילים</span>
                    <span className="text-lg font-bold text-blue-600">--</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">תשלומים פתוחים</span>
                    <span className="text-lg font-bold text-orange-600">--</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">הכנסות החודש</span>
                    <span className="text-lg font-bold text-green-600">₪--</span>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {currentUser?.full_name?.charAt(0) || "מ"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {currentUser?.full_name || "משתמש המערכת"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.job_title || currentUser?.user_category?.replace(/_/g, ' ') || "משתמש"}
                    </p>
                  </div>
                </div>
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