import { db } from '@/db/firestoreConfig';
import { convertToManilaTime } from '@/shared/functions/DateAndTime';
import { WeatherData } from '@/shared/types/types';

export class WeatherModel {

  public static insertForecastData = async (groupId: string, data: WeatherData): Promise<void> => {
    const docRef = db.collection('weather').doc(groupId);
    const hourlyData = data.timelines.hourly;
    const dailyData = data.timelines.daily;

    try {
      for (const hour of hourlyData) {
        const localTime = convertToManilaTime(hour.time);
        await docRef.collection('hourly').doc(localTime).set({
          time: localTime,
          ...hour.values,
        });
      }
      for (const day of dailyData) {
        const localTime = convertToManilaTime(day.time);
        await docRef.collection('daily').doc(localTime).set({
          time: localTime,
          ...day.values,
        });
      }
      // console.log('✅ Weather data inserted successfully');
    } catch (error) {
      console.error('Error inserting weather data:', error);
      throw new Error(`Failed to insert weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static insertRealtimeData = async (groupId: string, data: any): Promise<void> => {
    const docRef = db.collection('weather').doc(groupId);

    try {
      const localTime = convertToManilaTime(data.data.time);
      await docRef.collection('realtime').doc('data').set({ 
        localTime, 
        ...data 
      });
      // console.log('✅ Realtime weather data inserted successfully');
    } catch (error) {
      console.error('Error inserting realtime weather data:', error);
      throw new Error(`Failed to insert realtime weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static selectRealtimeData = async (): Promise<FirebaseFirestore.DocumentData> => {
    const docRef = db.collection('weather').doc('central_naic').collection('realtime').doc('data');
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error('No realtime weather data found');
    }
    return { id: doc.id, ...doc.data() };
  }

  static selectForecastData = async (): Promise<FirebaseFirestore.DocumentData> => {
    const collectionRef = db.collection('weather').doc('central_naic').collection('daily');
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
      throw new Error('No forecast weather data found');
    }
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  static selectHourlyForecastData = async (): Promise<FirebaseFirestore.DocumentData> => {
    const collectionRef = db.collection('weather').doc('central_naic').collection('hourly');
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
      throw new Error('No hourly forecast weather data found');
    }
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }
}