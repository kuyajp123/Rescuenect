import { handleLogout } from '@/auth/auth';
import { storageHelpers } from '@/helper/storage';
import { useUserData } from '@/store/useBackendResponse';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { navigateToBarangayForm, navigateToNameAndContactForm, navigateToSignIn, navigateToTabs } from '@/routes/route';

export const handleAuthNavigation = async (user: any) => {
  try {
    const { isNewUser, userData, resetResponse } = useUserData.getState();

    // this is the path after signing in of new users

    if (user) {
      if (isNewUser === true) {
        resetResponse();
        navigateToBarangayForm();
        return;
      } else if (isNewUser === false) {
        // Existing user - check if they have complete data from backend
        if (!userData.barangay) {
          // console.log("❌ User is missing barangay information from backend");
          navigateToBarangayForm();
          return;
        }

        if (!userData.phoneNumber) {
          // console.log('❌ User is missing phone number information from backend');
          navigateToNameAndContactForm();
          return;
        }

        await storageHelpers.setData(STORAGE_KEYS.USER, {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          barangay: userData.barangay || '',
        });

        // console.log('✅ User has complete data from backend - going to tabs');
        navigateToTabs();
        return;
      } else {
        // console.log('❓ Undefined newUser state, checking storage for existing data');
        // console.log("user from else block", JSON.stringify(user, null, 2));
        // this is also the navigation for currently logged in users

        await handleGuestNavigation();
        return;
      }
    } else {
      // No authenticated user - check saved data
      // console.log('❌ No authenticated user, checking saved data');
      await handleGuestNavigation();
    }
  } catch (error) {
    console.error('❌ Error in handleAuthNavigation:', error);
    // Fallback to sign-in page
    navigateToSignIn();
  }
};

// Handle navigation for guests (no authenticated user)
export const handleGuestNavigation = async () => {
  const { setUserData, userData } = useUserData.getState();

  try {
    const savedUser = await storageHelpers.getData(STORAGE_KEYS.USER);
    const hasSignedOut = await storageHelpers.getField(STORAGE_KEYS.APP_STATE, 'hasSignedOut');

    // If user previously signed out, stay on sign-in page to let them choose
    if (hasSignedOut) {
      navigateToSignIn();
      return;
    }

    // First-time user or continuing guest - check data requirements
    if (!savedUser?.barangay) {
      navigateToBarangayForm();
      return;
    }

    // Check if user has name and contact info
    if (!savedUser?.firstName || !savedUser?.lastName || !savedUser?.phoneNumber) {
      navigateToNameAndContactForm();
      return;
    }

    setUserData({
      userData: {
        ...userData,
        firstName: savedUser.firstName || '',
        lastName: savedUser.lastName || '',
        phoneNumber: savedUser.phoneNumber || '',
        barangay: savedUser.barangay || '',
      },
    });

    navigateToTabs();
  } catch (error) {
    console.error('❌ Error loading saved data:', error);
    await handleLogout();
    navigateToSignIn();
  }
};

// Handle navigation after sign-out
export const handleSignOutNavigation = () => {
  // console.log('🚪 User signed out');
  navigateToSignIn();
};
