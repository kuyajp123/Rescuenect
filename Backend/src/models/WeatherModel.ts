import { db } from '@/db/firestoreConfig';
import { convertToManilaTime } from '@/shared/functions/DateAndTime';
import { WeatherData, forecastData } from '@/shared/types/types';

export class WeatherModel {
  public static insertHourlyData = async (groupId: string, data: WeatherData): Promise<void> => {
    const docRef = db.collection('weather').doc(groupId);
    const hourlyData = data.timelines.hourly;

    try {      
      // Hourly Forecast
      const hourlyPromises = [];
      for (let i = 0; i < 24; i++ ){
          const hour = hourlyData[i];
          const localTime = convertToManilaTime(hour.time);
          const paddedId = i.toString().padStart(3, '0');

          hourlyPromises.push(docRef.collection('hourly').doc(paddedId).set({
            time: localTime,
            ...hour.values,
          }));
      }
      
      await Promise.all(hourlyPromises);
    } catch (error) {
      console.error('Error inserting weather data:', error);
      throw new Error(`Failed to insert weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static insertDailyData = async (groupId: string, data: any): Promise<void> => {
    const docRef = db.collection('weather').doc(groupId);
    const dailyData = data.timelines.daily;

    try {
      // Daily Forecast
      const dailyPromises: Promise<FirebaseFirestore.WriteResult>[] = dailyData.map((day: forecastData, index: number): Promise<FirebaseFirestore.WriteResult> => {
        const localTime: string = convertToManilaTime(day.time);
        const paddedId = index.toString().padStart(3, '0');
        return docRef.collection('daily').doc(paddedId).set({
          time: localTime,
          ...day.values,
        });
      });

      await Promise.all(dailyPromises);
    } catch (error) {
      console.error('Error inserting daily weather data:', error);
      throw new Error(`Failed to insert daily weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  static selectDailyData = async (): Promise<FirebaseFirestore.DocumentData> => {
    const collectionRef = db.collection('weather').doc('central_naic').collection('daily');
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
      throw new Error('No daily weather data found');
    }
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  static selectHourlyData = async (): Promise<FirebaseFirestore.DocumentData> => {
    const collectionRef = db.collection('weather').doc('central_naic').collection('hourly');
    const snapshot = await collectionRef.limit(24).get();
    if (snapshot.empty) {
      throw new Error('No hourly weather data found');
    }
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }
}