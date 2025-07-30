import { db } from '@/db/firestoreConfig';

const docRef = db.collection('weather').doc('temporaryDoc');

export class WeatherModel {
  static insertWeatherData = async (data: string): Promise<void> => {
    try {
      await docRef.set({ weatherForecast: data }, { merge: true });
    } catch (error) {
      console.error('Error inserting weather data:', error);
      throw new Error(`Failed to insert weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
}