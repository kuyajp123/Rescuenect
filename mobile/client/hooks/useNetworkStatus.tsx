import * as Network from "expo-network";
import { useNetwork } from "@/components/store/useNetwork";
import { useEffect } from "react";

export const useNetworkStatus = () => {
const { setIsOnline } = useNetwork();

useEffect(() => {
    const updateNetworkStatus = async () => {
        const state = await Network.getNetworkStateAsync();
        setIsOnline(!!(state.isConnected && state.isInternetReachable));
    };

    updateNetworkStatus();

    const subscription = Network.addNetworkStateListener((state) => {
        setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });

    return () => {
        subscription.remove();
    };
}, []);

};
