import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Payments from './pages/Payments';
import Calendar from './pages/Calendar';
import UserManagement from './pages/UserManagement';
import Onboarding from './pages/Onboarding';
import JobDescriptionManagement from './pages/JobDescriptionManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Customers": Customers,
    "Payments": Payments,
    "Calendar": Calendar,
    "UserManagement": UserManagement,
    "Onboarding": Onboarding,
    "JobDescriptionManagement": JobDescriptionManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};