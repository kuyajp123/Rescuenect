import { auth } from "@/lib/firebaseConfig";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { signInWithCustomToken  } from "firebase/auth";
import { Alert } from "react-native";
import axios from 'axios'
import { useRouter } from "expo-router";

export const handleGoogleSignIn = async (setLoading?: (loading: boolean) => void) => {
    const router = useRouter();

    try {
      setLoading?.(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      try {
        const response = await axios.post(`${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/signin`, {
          idToken,
          user: {
            email: userInfo.data?.user.email,
            familyName: userInfo.data?.user.familyName,
            givenName: userInfo.data?.user.givenName,
            name: userInfo.data?.user.name,
            photo: userInfo.data?.user.photo
          }
        })

        await signInWithCustomToken(auth, response.data.token);
        await auth.currentUser?.reload();
        setLoading?.(false);
      } catch (error) {
        console.error("error:", error);
        setLoading?.(false);
        throw new Error("authentication failed");
      }
      
    } catch (error: any) {
      // Set loading to false on error
      setLoading?.(false);
      
      console.error("❌ Google Sign-In error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
        toString: error.toString()
      });
      
      // Show user-friendly error
      Alert.alert(
        "Sign-In Error",
        `Failed to sign in: ${error.message || 'Unknown error'}`,
        [{ text: "OK" }]
      );
    }
};

export const handleLogout = async () => {
  const router = useRouter();

  try {
    // Sign out from Firebase first
    await auth.signOut();
    
    // Then sign out from Google and clear any cached tokens
    await GoogleSignin.signOut();
    
    console.log("Successfully logged out from both Firebase and Google");
    
    Alert.alert("Logged Out", "You have been logged out successfully.");
    router.replace('auth/signIn' as any);
  } catch (error) {
    console.error("❌ Logout error:", error);
    
    // Even if there's an error, try to clear the state
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.error("Failed to sign out from Google:", e);
    }
    
    Alert.alert("Logout Error", "Failed to log out completely. Please try again.");
  }
};
