import { useEffect, useState } from 'react'
import axios from 'axios'
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL!;
import PrimaryButton from '../components/PrimaryButton'

interface User {
    success: boolean;
    message: string;
    data: {
        userid: string;
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
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await axios.get<User>(`${VITE_BACKEND_URL}/profile`, { withCredentials: true });
                if (response.status === 200) {
                    setIsLoggedIn(true);
                    setIsLoading(false);
                    setUser(response.data);
                } else {
                    setIsLoggedIn(false);
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoggedIn(false);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    if (isLoading) {
        return (
            <div className='bg-bg dark:bg-bg h-full w-full text-content_text dark:text-content_text flex items-center justify-center flex-col gap-16'>
                <div>
                    <h1 className='text-3xl font-bold'>Loading...</h1>
                </div>
            </div>
        )
    }

    if (!isLoggedIn) {
        return (
            <div className='bg-bg dark:bg-bg h-full w-full text-content_text dark:text-content_text flex items-center justify-center flex-col gap-16'>
                <div>
                    <h1 className='text-3xl font-bold'>You are not logged in</h1>
                </div>
            </div>
        )
    }

  return (
    <div className='bg-bg dark:bg-bg h-full w-full text-content_text dark:text-content_text flex items-center justify-center flex-col gap-5'>
        <div>
            <br />
            {/* <strong>User ID:</strong> {user?.data.userid}<br /> */}
            <strong>Email:</strong> {user?.data.email}<br />
            <strong>First Name:</strong> {user?.data.firstName}<br />
            <strong>Last Name:</strong> {user?.data.lastName}<br />
            <strong>Birth Date:</strong> {user?.data.birthDate ? user.data.birthDate : 'secret'}<br />
            <strong>Picture:</strong> <img src={user?.data.picture} alt="User Profile" />
        </div>
        <div>
            <PrimaryButton
            onPress={() => {
                window.open(`${VITE_BACKEND_URL}/logout`, '_self')
            }}>
            Log out
            </PrimaryButton>
        </div>
        <div className='text-sm text-gray-500 dark:text-gray-500'>
            Created by John Paul Naag.
        </div>
    </div>
  )
}

export default Profile