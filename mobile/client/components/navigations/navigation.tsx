import { useBackendResponse, handleLogout } from "@/components/auth/auth";
import { storage } from "@/components/helper/storage";
import {
  navigateToBarangayForm,
  navigateToNameAndContactForm,
  navigateToSignIn,
  navigateToTabs,
} from "@/routes/route";
import { fetchAndSaveStatusData } from "@/API/fetchStatusData";
import { useStatusFormStore } from "../store/useStatusForm";

export const handleAuthNavigation = async (user: any) => {
  try {
    const { isNewUser, userResponse } = useBackendResponse.getState();
    const setFormData = useStatusFormStore.getState().setFormData;

    // console.log("✅ useBackendResponseState data:", JSON.stringify(userResponse, null, 2));
    // console.log("✅ isNewUser?", JSON.stringify(isNewUser, null, 2));
    // console.log("🔍 Authenticated user:", user ? JSON.stringify(user, null, 2) : null);

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

        const idToken = await user.getIdToken();
        console.log("idToken: ", !!idToken);
        const response = await fetchAndSaveStatusData(user.uid, idToken);

        // ✅ Fix: Handle new response format and errors
        if (response.success && response.data) {
          setFormData(response.data);
          console.log(
            "✅ Fetched and saved status data for user:",
            JSON.stringify(response.data, null, 2)
          );
        } else if (!response.success) {
          console.log("⚠️ Failed to fetch status data:", response.error);
          // Continue with navigation even if status fetch fails
        } else {
          console.log("ℹ️ No existing status data found for user");
        }

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
        const idToken = await user.getIdToken();
        console.log("idToken: ", idToken);
        console.log("user.uid: ", user.uid);
        const response = await fetchAndSaveStatusData(user.uid, idToken);

        // ✅ Fix: Handle new response format and errors
        if (response.success && response.data) {
          setFormData(response.data);
          console.log(
            "✅ Fetched and saved status data for user:",
            JSON.stringify(response.data, null, 2)
          );
        } else if (!response.success) {
          console.log("⚠️ Failed to fetch status data:", response.error);
          // Continue with navigation even if status fetch fails
        } else {
          console.log("ℹ️ No existing status data found for user");
        }

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
