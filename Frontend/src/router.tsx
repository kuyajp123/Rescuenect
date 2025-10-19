import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './security/ProtectedRoutes';

import {
  Dashboard,
  Status,
  StatusHistory,
  Weather,
  Earthquake,
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
        {/* <Route path="/city" element={<City />} /> */}
        <Route path="/weather" element={<Weather />} />
        <Route path="/earthquake" element={<Earthquake />} />
        {/* <Route path="/add_notification" element={<AddNotification />} /> */}
        {/* <Route path="/add_event" element={<AddEvent />} /> */}
        <Route path="/profile" element={<AdminProfile />} />
      </Route>

      {/* Auth layout */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
      </Route>
    </Routes>
  );
};

export default Router;
