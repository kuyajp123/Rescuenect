import axios from 'axios';
import { API_ROUTES } from '@/config/endpoints';

type AddressResponse = {
    success: boolean; 
    address?: string; 
    components?: any; 
    error?: string
};

export const getAddress = async (lat: number, lng: number, idToken: string): Promise<AddressResponse> => {
	try {
		const response = await axios.get(API_ROUTES.GEOCODING.GET_ADDRESS, {
			params: { lat, lng },
			headers: { Authorization: `Bearer ${idToken}` },
			timeout: 10000 // 10 seconds timeout
		});
		
		return {
			success: true,
			address: response.data.address,
			components: response.data.components
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}