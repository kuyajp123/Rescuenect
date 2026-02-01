import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Loading } from './components/ui/LazyLoading/Loading';
import { AuthLayout, MainLayout, Onboarding } from './layouts';
import ProtectedRoute from './security/ProtectedRoutes';

// Lazy load content pages
const AddNewCenter = lazy(() => import('@/pages/contents/Evacuation/AddNewCenter'));
const DailyForecastDetails = lazy(() => import('@/pages/contents/Weather/DailyForecastDetails'));
const Dashboard = lazy(() => import('@/pages/contents/Dashboard').then(module => ({ default: module.Dashboard })));
const Earthquake = lazy(() => import('@/pages/contents/Earthquake'));
const Evacuation = lazy(() => import('@/pages/contents/Evacuation'));
const HistoryVersions = lazy(() => import('@/pages/contents/Status/HistoryVersions'));
const HourlyDetails = lazy(() => import('@/pages/contents/Weather/HourlyDetails'));
const Notification = lazy(() =>
  import('@/pages/contents/Notification').then(module => ({ default: module.Notification }))
);
const NotificationDetails = lazy(() =>
  import('@/pages/contents/Notification/NotificationDetails').then(module => ({ default: module.NotificationDetails }))
);
const Residents = lazy(() => import('@/pages/contents/Residents'));
const ResidentsProfile = lazy(() => import('@/pages/contents/Residents/ResidentsProfile'));
const SaveAsPDF = lazy(() => import('@/pages/contents/Status/saveAsPDF'));
const Status = lazy(() => import('@/pages/contents/Status'));
const StatusHistory = lazy(() =>
  import('@/pages/contents/Status/History').then(module => ({ default: module.StatusHistory }))
);
const Announcement = lazy(() => import('@/pages/contents/announcement/index'));
const AddAnnouncement = lazy(() => import('@/pages/contents/announcement/add-announcement'));

import PrivacyPolicy from './components/ui/legalTerms/PrivacyPolicy';
import TermsAndCondition from './components/ui/legalTerms/TermsAndCondition';

const Weather = lazy(() => import('@/pages/contents/Weather/Weather'));
const Settings = lazy(() => import('./pages/contents/Settings'));

// Lazy load auth pages
const AddressForm = lazy(() => import('./pages/auth/AddressForm'));
const AdminInfo = lazy(() => import('./pages/auth/AdminInfo'));
const Login = lazy(() => import('./pages/auth/Login'));
const Welcome = lazy(() => import('./pages/auth/Welcome'));

// Lazy load profile pages
const AdminProfile = lazy(() => import('./pages/profile/AdminProfile'));

const Router = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path === '/' || path === '') {
      document.title = 'Rescuenect';
    } else {
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // Capitalize and replace hyphens
        const formatted = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
        document.title = `Rescuenect - ${formatted}`;
      } else {
        document.title = 'Rescuenect';
      }
    }
  }, [location]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/status" element={<Status />} />
          <Route path="/status/resident-profile" element={<ResidentsProfile />} />
          <Route path="/status/history" element={<StatusHistory />} />
          <Route path="/status/history/resident-profile" element={<ResidentsProfile />} />
          <Route path="/status/history/versions" element={<HistoryVersions />} />
          <Route path="/status/history/save-as-pdf" element={<SaveAsPDF />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/weather/details/:id" element={<DailyForecastDetails />} />
          <Route path="/weather/hourly/:id" element={<HourlyDetails />} />
          <Route path="/earthquake" element={<Earthquake />} />
          <Route path="/evacuation" element={<Evacuation />} />
          <Route path="/evacuation/add_new_center" element={<AddNewCenter />} />
          <Route path="/residents" element={<Residents />} />
          <Route path="/residents/profile" element={<ResidentsProfile />} />
          <Route path="/profile" element={<AdminProfile />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/notification/details" element={<NotificationDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/announcement" element={<Announcement />} />
          <Route path="/announcement/create-announcement" element={<AddAnnouncement />} />
        </Route>

        {/* Onboarding layout */}
        <Route
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        >
          <Route path="/Welcome" element={<Welcome />} />
          <Route path="/address-setup" element={<AddressForm />} />
          <Route path="/info-setup" element={<AdminInfo />} />
        </Route>

        {/* Auth layout */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<Login />} />
        </Route>

        <Route path="/terms-and-condition" element={<TermsAndCondition />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Suspense>
  );
};

export default Router;
