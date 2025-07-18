import { ThemeSwitcher } from './components/hooks/ThemeSwitcher';
import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";

function App() {
   const [user, setUser] = useState<any[]>([]);
  
    useEffect(() => {
      const db = getFirestore(app);
      const unsubscribe = onSnapshot(collection(db, "User"), (snapshot) => {
        const userData = snapshot.docs.map(doc => doc.data());
        setUser(userData);
      });
  
      return () => unsubscribe();
    }, []);

  return (
    <div className='bg-bg dark:bg-bg h-screen w-full flex flex-col'>
      <ThemeSwitcher />

      {user ? (
        user.map((u) => (
          <React.Fragment key={u.id}>
            <div>{u.name}</div>
            <div>{u.email}</div>
            <div>{u.age}</div>
            <div>--------</div>
          </React.Fragment>
        ))
      ) : (
        <div>Loading...</div>
      )}

    </div>
  );
}

export default App;
