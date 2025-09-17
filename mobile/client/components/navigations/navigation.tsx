import { useBackendResponse, handleLogout } from "@/components/auth/auth";
import { storage } from "@/components/helper/storage";
import {
  navigateToBarangayForm,
  navigateToNameAndContactForm,
  navigateToSignIn,
  navigateToTabs,
} from "@/routes/route";

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
          console.log("❌ User is missing barangay information from backend");
          navigateToBarangayForm();
          return;
        }

        if (!userResponse.phoneNumber) {
          console.log(
            "❌ User is missing phone number information from backend"
          );
          navigateToNameAndContactForm();
          return;
        }

        await storage.set("@barangay", userResponse.barangay);
        await storage.set("@user", {
          firstName: userResponse.firstName || "",
          lastName: userResponse.lastName || "",
          phoneNumber: userResponse.phoneNumber || "",
        });

        // User has complete data from backend - go to main app
        useBackendResponse.getState().resetResponse();
        console.log("✅ User has complete data from backend - going to tabs");
        navigateToTabs();
        return;
      } else {
        console.log(
          "❓ Undefined newUser state, checking storage for existing data"
        );
        // console.log("user from else block", JSON.stringify(user, null, 2));

        await handleGuestNavigation();
        return;
      }
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
};

// Handle navigation for guests (no authenticated user)
export const handleGuestNavigation = async () => {
  try {
    const savedBarangay = await storage.get("@barangay");
    const savedUser = await storage.get("@user");

    console.log("🔍 Checking saved data:", {
      savedBarangay: savedBarangay,
      savedUser: savedUser,
    });

    if (!savedBarangay) {
      console.log("❌ User is missing barangay information");
      navigateToBarangayForm();
      return;
    }

    if (!savedUser) {
      console.log("❌ User is missing phone number information");
      navigateToNameAndContactForm();
      return;
    }

    navigateToTabs();
  } catch (error) {
    console.error("❌ Error loading saved data:", error);
    await handleLogout();
    navigateToSignIn();
  }
};

// Handle navigation after sign-out
export const handleSignOutNavigation = () => {
  console.log("🚪 User signed out");
  navigateToSignIn();
};
