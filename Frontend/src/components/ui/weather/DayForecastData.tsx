import { getWeatherCondition, getWeatherIcons } from "@/components/helper/WeatherLogic";
import { ChevronRightIcon } from "lucide-react";
import { TableRow, TableCell} from "@heroui/react";

import { ForecastDataProps } from "@/components/shared/types";

const DayForecastData = ({ key, time, weatherCode, temperature }: ForecastDataProps) => {

  return (     
    <TableRow key={key} className="h-20">
      <TableCell className="p-0 pr-4">
        {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
      </TableCell>
      <TableCell className="px-4">
        {getWeatherIcons(weatherCode)({ height: 40, width: 50 })}
      </TableCell>
      <TableCell className="px-4">{getWeatherCondition(weatherCode)}</TableCell>
      <TableCell className="px-4">{Math.round(temperature)} °C</TableCell>
      <TableCell className="p-0 pl-4">
        <ChevronRightIcon className="h-5 w-5" />
      </TableCell>
    </TableRow>
  )
}

export default DayForecastData