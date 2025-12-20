import * as Location from "expo-location";
import { useEffect, useState, useCallback } from "react";
import { requestLocationPermission } from "@/helper/commonHelpers";

export const useLocationTracking = () => {
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setErrorMsg("Permission to access location was denied");
      return;
    }

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 1,
        },
        (location) => {
          setCoords(location.coords);
          setErrorMsg(null);
        }
      );
      setSubscription(sub);
    } catch (error) {
      console.warn("Error watching location:", error);
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  }, [subscription]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  return { coords, errorMsg, startTracking, stopTracking };
};

export default useLocationTracking;
