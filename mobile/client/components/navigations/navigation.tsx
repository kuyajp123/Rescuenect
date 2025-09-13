import { useBackendResponse, handleLogout } from '@/components/auth/auth';
import { storage } from '@/components/helper/storage';
import { navigateToBarangayForm, navigateToNameAndContactForm, navigateToSignIn, navigateToTabs } from '@/components/routes/route';

export const handleAuthNavigation = async (user: any) => {

  try {
    const { isNewUser, userResponse } = useBackendResponse.getState();
    
    console.log('response: ', isNewUser, userResponse);

        if (user) {
            if (isNewUser === true) {
                // useBackendResponse.getState().resetResponse();
                navigateToBarangayForm();
                return;
            } else if (isNewUser === false) {


              // ANG PROBLEMA PAG MERONG NAKA CURRENTLY SIGIN NA ACCOUNT 
              // WALANG MAG I STORE SA ZUSTAND STATE NEED ATA MAG QUERY 
              // OR OTHER WAY PARA MAKUHA YUNG DATA
              
                // Existing user - check if they have complete data from backend
                if (!userResponse.barangay) {
                    console.log("❌ User is missing barangay information from backend");
                    navigateToBarangayForm();
                    return;
                }

                if (!userResponse.phoneNumber) {
                    console.log("❌ User is missing phone number information from backend");
                    navigateToNameAndContactForm();
                    return;
                }

                // User has complete data from backend - go to main app
                console.log("✅ User has complete data from backend - going to tabs");
                navigateToTabs();
                return;
            } else {
                console.log("❓ Undefined newUser state, checking storage for existing data");
                // Check if user has required data in storage
                const barangayData = await storage.get('@barangay');
                const userData = await storage.get('@user');
        
                if (barangayData && userData?.phoneNumber) {
                    console.log("✅ User has complete data in storage - going to tabs");
                    navigateToTabs();
                } else {
                    console.log("❌ User missing data in storage - going to barangay form");
                    navigateToBarangayForm();
                }
            }
        } else if (!user) {
          console.log("❌ No authenticated user, checking saved data");
          handleLogout();
          navigateToSignIn();
        } else {
          // No authenticated user - check saved data
          console.log("❌ No authenticated user, checking saved data");
          await handleGuestNavigation();
        }
    } catch (error) {
        console.error("❌ Error in handleAuthNavigation:", error);
        // Fallback to sign-in page
        navigateToSignIn();
    }
}


// Handle navigation for guests (no authenticated user)
export const handleGuestNavigation = async () => {
  try {
    const savedBarangay = await storage.get('@barangay');
    const savedUser = await storage.get('@user');

    console.log("🔍 Checking saved data:", { 
      savedBarangay: !!savedBarangay, 
      savedUser: !!savedUser 
    });

    if (savedBarangay && savedUser) {
      console.log("✅ Found saved data");
      navigateToTabs();
    } else {
      console.log("❌ No saved data");
      await handleLogout();
      navigateToSignIn();
    }
  } catch (error) {
    console.error('❌ Error loading saved data:', error);
    await handleLogout();
    navigateToSignIn();
  }
};


// Handle navigation after sign-out
export const handleSignOutNavigation = () => {
  console.log("🚪 User signed out");
  navigateToSignIn();
};