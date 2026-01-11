import Calendar from './pages/Calendar';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import JobDescriptionManagement from './pages/JobDescriptionManagement';
import Onboarding from './pages/Onboarding';
import Payments from './pages/Payments';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "JobDescriptionManagement": JobDescriptionManagement,
    "Onboarding": Onboarding,
    "Payments": Payments,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};