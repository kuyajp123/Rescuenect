import { Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './security/ProtectedRoutes';

import {
  AddNewCenter,
  Dashboard,
  Earthquake,
  Evacuation,
  HistoryVersions,
  Residents,
  Status,
  StatusHistory,
  Weather,
  Notification,
  NotificationDetails,
} from '@/pages/contents';
import Login from './pages/auth/Login';

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
        <Route path="/weather" element={<Weather />} />
        <Route path="/earthquake" element={<Earthquake />} />
        <Route path="/evacuation" element={<Evacuation />} />
        <Route path="/evacuation/add_new_center" element={<AddNewCenter />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/profile" element={<AdminProfile />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/notification/details" element={<NotificationDetails />} />
      </Route>

      {/* Auth layout */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
      </Route>
    </Routes>
  );
};

export default Router;
