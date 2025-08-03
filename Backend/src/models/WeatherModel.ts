import { db } from '@/db/firestoreConfig';
import { convertToManilaTime } from '@/shared/functions/DateAndTime';
import { WeatherData, forecastData } from '@/shared/types/types';

export class WeatherModel {
  public static insertForecastData = async (groupId: string, data: WeatherData): Promise<void> => {
    const docRef = db.collection('weather').doc(groupId);
    const hourlyData = data.timelines.hourly;
    const dailyData = data.timelines.daily;

    try {      
      // Hourly Forecast
      const hourlyPromises: Promise<FirebaseFirestore.WriteResult>[] = hourlyData.map((hour: forecastData, index: number): Promise<FirebaseFirestore.WriteResult> => {
        const localTime = convertToManilaTime(hour.time);
        const paddedId = index.toString().padStart(3, '0');
        return docRef.collection('hourly').doc(paddedId).set({
          time: localTime,
          ...hour.values,
        });
      });
      
      await Promise.all(hourlyPromises);
      
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

  static selectHourlyData = async (): Promise<FirebaseFirestore.DocumentData> => {
    const collectionRef = db.collection('weather').doc('central_naic').collection('hourly');
    const snapshot = await collectionRef.limit(24).get();
    if (snapshot.empty) {
      throw new Error('No hourly weather data found');
    }
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data;
  }

  // static selectNaicWeatherData = async (): Promise<FirebaseFirestore.DocumentData> => {
  //   const coastal_west = db.collection('weather').doc('coastal_west').collection('realtime');
  //   const coastal_east = db.collection('weather').doc('coastal_east').collection('realtime');
  //   const central_naic = db.collection('weather').doc('central_naic').collection('realtime');
  //   const sabang = db.collection('weather').doc('sabang').collection('realtime');
  //   const farm_area = db.collection('weather').doc('farm_area').collection('realtime');
  //   const naic_boundary = db.collection('weather').doc('naic_boundary').collection('realtime');

  //   const coastalWestData = await coastal_west.doc('data').get();
  //   const coastalEastData = await coastal_east.doc('data').get();
  //   const centralNaicData = await central_naic.doc('data').get();
  //   const sabangData = await sabang.doc('data').get();
  //   const farmAreaData = await farm_area.doc('data').get();
  //   const naicBoundaryData = await naic_boundary.doc('data').get();
    
  //   return {
  //     coastalWest: coastalWestData.exists ? { id: coastalWestData.id, ...coastalWestData.data() } : null,
  //     coastalEast: coastalEastData.exists ? { id: coastalEastData.id, ...coastalEastData.data() } : null,
  //     centralNaic: centralNaicData.exists ? { id: centralNaicData.id, ...centralNaicData.data() } : null,
  //     sabang: sabangData.exists ? { id: sabangData.id, ...sabangData.data() } : null,
  //     farmArea: farmAreaData.exists ? { id: farmAreaData.id, ...farmAreaData.data() } : null,
  //     naicBoundary: naicBoundaryData.exists ? { id: naicBoundaryData.id, ...naicBoundaryData.data() } : null,
  //   };

  // }
}