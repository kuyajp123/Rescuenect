import { storageHelpers } from '@/components/helper/storage';
import { STORAGE_KEYS } from '@/config/asyncStorage';
import { API_ROUTES } from '@/config/endpoints';
import axios from 'axios';

export const updateTokenInDatabase = async (authUser: any, fcmToken: string) => {
  try {
    const token = await authUser?.getIdToken();
    const response = await axios.post(
      API_ROUTES.DATA.SAVE_FCMTOKENREFRESH,
      {
        uid: authUser.uid,
        fcmToken,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await storageHelpers.setField(STORAGE_KEYS.USER, 'fcmToken', fcmToken);

    console.log('✅ FCM token updated in database', response.data);
  } catch (error) {
    console.error('❌ Error updating FCM token in database:', error);
  }
};
