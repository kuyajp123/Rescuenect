import { API_ROUTES } from '@/config/endpoints';
import { auth } from '@/lib/firebaseConfig';
import { BestEvacuationRouteResponse, EvacuationTravelMode } from '@/types/evacuationRoute';
import axios from 'axios';

type RequestBestRouteParams = {
  clientId: string;
  origin: { lat: number; lng: number };
  targetCenterId?: string;
  travelMode: EvacuationTravelMode;
};

export const requestBestEvacuationRoute = async ({
  clientId,
  origin,
  targetCenterId,
  travelMode,
}: RequestBestRouteParams): Promise<BestEvacuationRouteResponse> => {
  const authUser = auth.currentUser;
  const token = await authUser?.getIdToken();
  if (!token) {
    throw new Error('You need to sign in before requesting an evacuation route.');
  }

  const response = await axios.post<BestEvacuationRouteResponse>(
    API_ROUTES.EVACUATION.GET_BEST_ROUTE,
    {
      clientId,
      origin,
      targetCenterId,
      travelMode,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    }
  );

  return response.data;
};
