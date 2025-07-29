import {Card, CardBody} from "@heroui/card";
import {Divider} from "@heroui/divider";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table";
import { getWeatherIcons, getWeatherCondition } from "@/components/helper/WeatherLogic";

import { WeatherCardProps } from "@/components/shared/types";

const WeatherCard = ({ 
    name, 
    icon, 
    precipitationProbability,
    rainAccumulation,
    rainIntensity,
    humidity,
    temperature,
    temperatureApparent,
    uvIndex,
    windSpeed,
    weatherCode,
    cloudCover
}: WeatherCardProps) => {
  return (
    <Card className="w-fit h-fit">
        <CardBody className="flex flex-row gap-4 px-9">
          <div className="flex flex-col h-auto justify-between py-4">
            <div className="flex flex-col gap-2">
              <p>{name}</p>
            <p>{getWeatherCondition(weatherCode)}</p>
          </div>
          <div className="flex flex-row gap-2 items-center">
            <strong className="text-3xl">{temperature}°C</strong>
            {icon && getWeatherIcons(icon)({ height: 40, width: 50 })}
          </div>
        </div>

        <Divider orientation="vertical" className="h-auto" />

        <div >
          <Table 
          shadow="none" 
          removeWrapper 
          hideHeader 
          aria-label="Example static collection table"
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>STATUS</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell>Feels like:</TableCell>
                <TableCell><p>{temperatureApparent}°C</p></TableCell>
                <TableCell>Chance of Rain:</TableCell>
                <TableCell><p>{precipitationProbability}%</p></TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell>UV:</TableCell>
                <TableCell><p>{uvIndex}</p></TableCell>
                <TableCell>Rain intensity:</TableCell>
                <TableCell><p>{rainIntensity} mm/h</p></TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell>Humidity:</TableCell>
                <TableCell><p>{humidity}%</p></TableCell>
                <TableCell>Rain acc.:</TableCell>
                <TableCell><p>{rainAccumulation} mm</p></TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>Cloud:</TableCell>
                <TableCell><p>{cloudCover}%</p></TableCell>
                <TableCell>Wind speed:</TableCell>
                <TableCell><p>{windSpeed} km/h</p></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  )
}

export default WeatherCard