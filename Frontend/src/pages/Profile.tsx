import { useEffect, useState } from 'react'
import axios from 'axios'
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL!;

interface User {
    success: boolean;
    message: string;
    data: {
        // userID: string;
        email: string;
        name: string;
        firstName: string;
        lastName: string;
        birthDate: string;
        picture: string;
    };
}

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);

    const fetchUser = async () => {
        try {
            const response = await axios.get<User>(`${VITE_BACKEND_URL}/profile`, { withCredentials: true });
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        fetchUser();

        console.error('User data:', user);
    }, []);

  return (
    <div className='bg-bg dark:bg-bg h-full w-full text-content_text dark:text-content_text flex items-center justify-center'>
        <div>
            <br />
            {/* <strong>User ID:</strong> {user?.data.userID}<br /> */}
            <strong>Email:</strong> {user?.data.email}<br />
            <strong>First Name:</strong> {user?.data.firstName}<br />
            <strong>Last Name:</strong> {user?.data.lastName}<br />
            <strong>Birth Date:</strong> {user?.data.birthDate}<br />
            <strong>Picture:</strong> <img src={user?.data.picture} alt="User Profile" />
        </div>
    </div>
  )
}

export default Profile