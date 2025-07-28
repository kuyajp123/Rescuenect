import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import BlankLayout from "./layouts/BlankLayout";

import { 
  Status,
  Weather,
  Earthquake,
  AddNotification,
  AddEvent,
  Donation,
  Volunteer  
} from "./pages";

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
      </Route>

    </Routes>
  )
}

export default Router