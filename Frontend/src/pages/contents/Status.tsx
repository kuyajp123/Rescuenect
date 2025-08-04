import { useEffect, useState } from 'react';
import { auth, provider, signInWithPopup } from '@/lib/firebaseConfig';
// const allowedEmails = ['admin1@email.com', 'admin2@email.com'];

const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // // ✅ Check if user is an authorized admin
    // if (!allowedEmails.includes(user.email || '')) {
    //   alert('Not authorized');

    //   // Optional: sign them out immediately
    //   await auth.signOut();

    //   // Optional: redirect or block access
    //   return;
    // }

    // ✅ Authorized - continue with your app logic
    console.log('Authorized admin:', user.email);
    console.log('user:', user);

  } catch (err) {
    console.error('Login failed', err);
  }
};

const Status = () => {

  return (
    <div>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  )
}

export default Status