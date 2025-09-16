import { create } from "zustand";
import { StatusForm } from '@/types/components';

export const useFetchedStatusFormStore = create<StatusForm>((set) => ({
    firstName: '',
    lastName: '',
    statusType: '',
    phoneNumber: '',
    lat: null,
    lng: null,
    loc: null,
    image: '',
    note: '',
    shareLocation: true,
    shareContact: true,
    setFirstName: (firstName: string) => set({ firstName }),
    setLastName: (lastName: string) => set({ lastName }),
    setStatusType: (statusType: string) => set({ statusType }),
    setPhoneNumber: (phoneNumber: string) => set({ phoneNumber }),
    setLat: (lat: number | null) => set({ lat }),
    setLng: (lng: number | null) => set({ lng }),
    setLoc: (loc: string | null) => set({ loc }),
    setImage: (image: string) => set({ image }),
    setNote: (note: string) => set({ note }),
    setShareLocation: (shareLocation: boolean) => set({ shareLocation }),
    setShareContact: (shareContact: boolean) => set({ shareContact }),
}))
