import { create } from "zustand";

// Address state type matching your existing AddressState interface
interface AddressState {
    formatted: string;
    components: any;
}

interface AddressStore {
    // Tapped location address data
    addressCoords: AddressState | null;
    addressCoordsLoading: boolean;
    
    // GPS location address data  
    addressGPS: AddressState | null;
    addressGPSLoading: boolean;
    
    // Actions for tapped location
    setAddressCoords: (address: AddressState | null) => void;
    setAddressCoordsLoading: (loading: boolean) => void;
    
    // Actions for GPS location
    setAddressGPS: (address: AddressState | null) => void;
    setAddressGPSLoading: (loading: boolean) => void;
    
    // Utility actions
    clearAllAddresses: () => void;
    clearAddressCoords: () => void;
    clearAddressGPS: () => void;
}

export const useGetAddress = create<AddressStore>((set) => ({
    // Initial state
    addressCoords: null,
    addressCoordsLoading: false,
    addressGPS: null,
    addressGPSLoading: false,
    
    // Tapped location actions
    setAddressCoords: (address: AddressState | null) => 
        set({ addressCoords: address }),
    setAddressCoordsLoading: (loading: boolean) => 
        set({ addressCoordsLoading: loading }),
    
    // GPS location actions
    setAddressGPS: (address: AddressState | null) => 
        set({ addressGPS: address }),
    setAddressGPSLoading: (loading: boolean) => 
        set({ addressGPSLoading: loading }),
    
    // Utility actions
    clearAllAddresses: () => 
        set({ 
            addressCoords: null, 
            addressGPS: null,
            addressCoordsLoading: false,
            addressGPSLoading: false 
        }),
    clearAddressCoords: () => 
        set({ addressCoords: null, addressCoordsLoading: false }),
    clearAddressGPS: () => 
        set({ addressGPS: null, addressGPSLoading: false }),
}));