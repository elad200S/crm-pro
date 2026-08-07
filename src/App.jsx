import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// עמודים שנגישים בלי התחברות — כרגע רק דף חתימת ההסכם החיצוני שנשלח ללקוחות.
// כל עמוד אחר (כולל "/") ממשיך לדרוש התחברות, גם אם הגישה הציבורית לאפליקציה פתוחה ברמת Base44.
const PUBLIC_PAGES = new Set(["ClientSign"]);

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={
      <LayoutWrapper currentPageName={mainPageKey}>
        <MainPage />
      </LayoutWrapper>
    } />
    {Object.entries(Pages).map(([path, Page]) => (
      <Route
        key={path}
        path={`/${path}`}
        element={
          <LayoutWrapper currentPageName={path}>
            <Page />
          </LayoutWrapper>
        }
      />
    ))}
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const currentPath = decodeURIComponent(location.pathname.replace(/^\//, ""));
  const isPublicRoute = PUBLIC_PAGES.has(currentPath);

  // דף ציבורי (חתימת הסכם) — נטען מיד, בלי לחכות לבדיקת התחברות ובלי אפשרות להפנייה ללוגין.
  // זה קיים כדי ש-Base44 יוכל לאפשר גישה ציבורית לאפליקציה מבלי שזה ייפתח את שאר המערכת.
  if (isPublicRoute) {
    return <AppRoutes />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // כל עמוד שאינו ברשימת PUBLIC_PAGES דורש משתמש מחובר — נבדק כאן במפורש כי הגישה
  // הציבורית ברמת האפליקציה (Base44) כבר לא חוסמת אוטומטית מבקרים אנונימיים.
  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  // Render the main app
  return <AppRoutes />;
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
