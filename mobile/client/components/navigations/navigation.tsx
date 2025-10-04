import { useBackendResponse, handleLogout } from '@/components/auth/auth';
import { storage, storageHelpers } from '@/components/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { navigateToBarangayForm, navigateToNameAndContactForm, navigateToSignIn, navigateToTabs } from '@/routes/route';

export const handleAuthNavigation = async (user: any) => {
  try {
    const { isNewUser, userResponse } = useBackendResponse.getState();

    if (user) {
      if (isNewUser === true) {
        useBackendResponse.getState().resetResponse();
        navigateToBarangayForm();
        return;
      } else if (isNewUser === false) {
        // Existing user - check if they have complete data from backend
        if (!userResponse.barangay) {
          // console.log("❌ User is missing barangay information from backend");
          navigateToBarangayForm();
          return;
        }

        if (!userResponse.phoneNumber) {
          // console.log('❌ User is missing phone number information from backend');
          navigateToNameAndContactForm();
          return;
        }

        await storageHelpers.setData(STORAGE_KEYS.USER, {
          firstName: userResponse.firstName || '',
          lastName: userResponse.lastName || '',
          phoneNumber: userResponse.phoneNumber || '',
          barangay: userResponse.barangay || '',
        });

        // User has complete data from backend - go to main app
        useBackendResponse.getState().resetResponse();
        // console.log('✅ User has complete data from backend - going to tabs');
        navigateToTabs();
        return;
      } else {
        // console.log('❓ Undefined newUser state, checking storage for existing data');
        // console.log("user from else block", JSON.stringify(user, null, 2));

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
