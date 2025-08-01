export interface WeatherData {
    timelines: { 
      hourly: any 
      daily: any
    }; 
  }

export type WeatherLocationKey = 'coastal_west' | 'coastal_east' | 'central_naic' | 'sabang' | 'farm_area' | 'naic_boundary';