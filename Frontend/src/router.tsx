import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

import { 
  Status,
  Weather,
  Earthquake,
  AddNotification,
  AddEvent,
  Donation,
  Volunteer  
} from "@/pages/contents";
import Login from "./pages/auth/Login";

import AdminProfile from "./pages/profiile/AdminProfile";

const Router = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Status />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/earthquake" element={<Earthquake />} />
        <Route path="/add_notification" element={<AddNotification />} />
        <Route path="/add_event" element={<AddEvent />} />
        <Route path="/donation" element={<Donation />} />
        <Route path="/volunteer" element={<Volunteer />} />
        <Route path="/profile" element={<AdminProfile />} />
      </Route>

      {/* Auth layout */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<Login />} />
      </Route>

    </Routes>
  )
}

export default Router