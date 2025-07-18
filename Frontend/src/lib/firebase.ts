// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyADtkf5UNXMgpxBfqyGQwVfiWePv8kdSEo",
  authDomain: "rescuenect.firebaseapp.com",
  projectId: "rescuenect",
  storageBucket: "rescuenect.firebasestorage.app",
  messagingSenderId: "193005721627",
  appId: "1:193005721627:web:172cabd7ddfd2e399400be",
  measurementId: "G-5G7JJRQ6QZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);