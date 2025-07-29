import { getWeatherCondition, getWeatherIcons } from "@/components/helper/WeatherLogic";
import { ChevronRightIcon } from "lucide-react";
import { TableRow, TableCell} from "@heroui/react";

import { ForecastDataProps } from "@/components/shared/types";

const DayForecastData = ({ key, time, weatherCode, temperature }: ForecastDataProps) => {

  return (     
    <TableRow key={key} className="h-20">
        <TableCell>
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </TableCell>
        <TableCell>
            {getWeatherIcons(weatherCode)({ height: 40, width: 50 })}
        </TableCell>
        <TableCell>{getWeatherCondition(weatherCode)}</TableCell>
        <TableCell>{Math.round(temperature)} °C</TableCell>
        <TableCell>
            <ChevronRightIcon className="h-4 w-4" />
        </TableCell>
    </TableRow>
  )
}

export default DayForecastData