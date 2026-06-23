import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Public pages
import Home from '@/pages/Home';
import Schedule from '@/pages/Schedule';
import About from '@/pages/About';
import Testimonials from '@/pages/Testimonials';

// Member portal
import MemberLayout from '@/components/MemberLayout';
import PortalHome from '@/pages/portal/PortalHome';
import Curriculum from '@/pages/portal/Curriculum';
import Community from '@/pages/portal/Community';
import Events from '@/pages/portal/Events';
import Billing from '@/pages/portal/Billing';

// Admin
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminLeads from '@/pages/admin/AdminLeads';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminBilling from '@/pages/admin/AdminBilling';
import AdminCurriculum from '@/pages/admin/AdminCurriculum';
import AdminCurriculumBuilder from '@/pages/admin/AdminCurriculumBuilder';
import InstructorEvaluation from '@/pages/admin/InstructorEvaluation';
import AdminCommunity from '@/pages/admin/AdminCommunity';
import AdminEvents from '@/pages/admin/AdminEvents';
import AdminSchedule from '@/pages/admin/AdminSchedule';
import AdminProgress from '@/pages/admin/AdminProgress';
import AdminAttendance from '@/pages/admin/AdminAttendance';
import AdminOnboarding from '@/pages/admin/AdminOnboarding';
import AdminPrograms from '@/pages/admin/AdminPrograms';
import Progress from '@/pages/portal/Progress';
import StudentCurriculum from '@/pages/portal/StudentCurriculum';
import Messages from '@/pages/portal/Messages';
import Family from '@/pages/portal/Family';
import Kiosk from '@/pages/Kiosk';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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

  // Render the main app
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/about" element={<About />} />
      <Route path="/testimonials" element={<Testimonials />} />

      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Member portal (authenticated) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<MemberLayout />}>
          <Route path="/portal" element={<PortalHome />} />
          <Route path="/portal/curriculum" element={<Curriculum />} />
          <Route path="/portal/community" element={<Community />} />
          <Route path="/portal/progress" element={<Progress />} />
          <Route path="/portal/journey" element={<StudentCurriculum />} />
          <Route path="/portal/messages" element={<Messages />} />
          <Route path="/portal/family" element={<Family />} />
          <Route path="/portal/events" element={<Events />} />
          <Route path="/portal/billing" element={<Billing />} />
        </Route>
      </Route>

      {/* Admin dashboard (authenticated + admin role) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
            <Route path="/admin/curriculum" element={<AdminCurriculum />} />
            <Route path="/admin/curriculum-builder" element={<AdminCurriculumBuilder />} />
            <Route path="/admin/evaluation" element={<InstructorEvaluation />} />
            <Route path="/admin/community" element={<AdminCommunity />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/progress" element={<AdminProgress />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/onboarding" element={<AdminOnboarding />} />
            <Route path="/admin/programs" element={<AdminPrograms />} />
          </Route>
        </Route>
      </Route>

      {/* Kiosk (public, no auth) */}
      <Route path="/kiosk" element={<Kiosk />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App