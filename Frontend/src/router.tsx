import { Route, Routes } from 'react-router-dom';
import { AuthLayout, MainLayout, Onboarding } from './layouts';
import ProtectedRoute from './security/ProtectedRoutes';

import {
  AddNewCenter,
  Dashboard,
  Earthquake,
  Evacuation,
  HistoryVersions,
  Notification,
  NotificationDetails,
  Residents,
  ResidentsProfile,
  SaveAsPDF,
  Status,
  StatusHistory,
  Weather,
} from '@/pages/contents';
import { AddressForm, AdminInfo, Login, Welcome } from './pages/auth';
import Settings from './pages/contents/Settings';

import AdminProfile from './pages/profiile/AdminProfile';

const Router = () => {
  return (
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
        <Route path="/status/history" element={<StatusHistory />} />
        <Route path="/status/history/versions" element={<HistoryVersions />} />
        <Route path="/status/history/save-as-pdf" element={<SaveAsPDF />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/earthquake" element={<Earthquake />} />
        <Route path="/evacuation" element={<Evacuation />} />
        <Route path="/evacuation/add_new_center" element={<AddNewCenter />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/residents/profile" element={<ResidentsProfile />} />
        <Route path="/profile" element={<AdminProfile />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/notification/details" element={<NotificationDetails />} />
        <Route path="/settings" element={<Settings />} />
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
    </Routes>
  );
};

export default Router;
