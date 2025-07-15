import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Text } from '@/components/ui/text';
import ClearDay from '@/assets/images/weather/ClearDay10000.svg';
import ClearNight from '@/assets/images/weather/ClearNight10001.svg';
import Cloudy from '@/assets/images/weather/Cloudy1001.svg';
import DrizleRain from '@/assets/images/weather/DrizzleLightRain4000_4200.svg';
import Fog from '@/assets/images/weather/Fog2000_2100.svg';
import HeavyGust from '@/assets/images/weather/HeavyGust.svg';
import PartlyCloudy from '@/assets/images/weather/PartlyCloudyDay11010.svg';
import PartlyCloudyNight from '@/assets/images/weather/PartlyCloudyNight11011.svg';
import Rainy from '@/assets/images/weather/RainyHeavyRain4001_ 4201.svg';
import ThunderStorm from '@/assets/images/weather/ThunderStorm8000.svg';
import Windy from '@/assets/images/weather/Windy.svg';

export const CardWeather = () => {
  return (
    <View style={{ borderWidth: 1 }} >
      <Text>CardWeather</Text>
      <ClearDay width={100} height={100} />
      <ClearNight width={100} height={100} />
      <Cloudy width={100} height={100} />
      <DrizleRain width={100} height={100} />
      <Fog width={100} height={100} />
      <HeavyGust width={100} height={100} />
      <PartlyCloudy width={100} height={100} />
      <PartlyCloudyNight width={100} height={100} />
      <Rainy width={100} height={100} />
      <ThunderStorm width={100} height={100} />
      <Windy width={100} height={100} />
    </View>
  )
}

export default CardWeather

const styles = StyleSheet.create({})