import { useLocation } from "react-router-dom";

const UrlLocation = () => {
  const location = useLocation();

  if (location.pathname) {
        if (location.pathname === '/') {
            return 'Status';
        } else if (location.pathname === '/weather') {
            return 'Weather';
        } else if (location.pathname === '/earthquake') {
            return 'Earthquake';
        } else if (location.pathname === '/add_notification') {
            return 'Add Notification';
        } else if (location.pathname === '/add_event') {
            return 'Add Event';
        } else if (location.pathname === '/donation') {
            return 'Donation';
        } else if (location.pathname === '/volunteer') {
            return 'Volunteer';
        } else {
            return '';
        }
    }
};

export default UrlLocation;