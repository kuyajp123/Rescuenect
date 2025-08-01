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
import { useMemo } from "react";

import { WeatherCardProps } from "@/components/shared/types";

const WeatherCard = ({ 
    name, 
    icon, 
    precipitationProbability,
    rainIntensity,
    humidity,
    temperature,
    uvIndex,
    temperatureApparent,
    windSpeed,
    weatherCode,
    cloudCover,
    rainAccumulation
}: WeatherCardProps) => {
  
  const rows = useMemo(() => {
    const baseRows = [
      <TableRow key="1">
        <TableCell>Feels like:</TableCell>
        <TableCell><p>{temperatureApparent}°C</p></TableCell>
        <TableCell>Chance of Rain:</TableCell>
        <TableCell><p>{precipitationProbability}%</p></TableCell>
      </TableRow>,
      <TableRow key="2">
        <TableCell>Humidity:</TableCell>
        <TableCell><p>{humidity}%</p></TableCell>
        <TableCell>Rain intensity:</TableCell>
        <TableCell><p>{rainIntensity} mm/h</p></TableCell>
      </TableRow>,
      <TableRow key="3">
        <TableCell>Cloud:</TableCell>
        <TableCell><p>{cloudCover}%</p></TableCell>
        <TableCell>Wind speed:</TableCell>
        <TableCell><p>{windSpeed} km/h</p></TableCell>
      </TableRow>
    ];

    if (uvIndex !== undefined && uvIndex !== null || rainAccumulation !== undefined && rainAccumulation !== null) {
      baseRows.push(
        <TableRow key="4">
          <TableCell><p>{uvIndex ? 'UV Index:' : ''}</p></TableCell>
          <TableCell><p>{uvIndex ? <>{uvIndex}</> : ''}</p></TableCell>
          <TableCell><p>{rainAccumulation ? 'Rain acc:' : ''}</p></TableCell>
          <TableCell><p>{rainAccumulation ? <>{rainAccumulation} mm</> : ''}</p></TableCell>
        </TableRow>
      );
    }

    return baseRows;
  }, [temperatureApparent, precipitationProbability, humidity, rainIntensity, cloudCover, windSpeed, uvIndex, rainAccumulation]);

  return (
    <Card className="w-fit h-auto">
        <CardBody className="flex flex-row gap-4 p-8">
          <div className="flex flex-col h-auto pt-2 gap-4 justify-between">
            <div className="flex flex-col gap-1">
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
              <TableColumn>1</TableColumn>
              <TableColumn>2</TableColumn>
              <TableColumn>3</TableColumn>
              <TableColumn>4</TableColumn>
              
            </TableHeader>
            <TableBody>
              {rows}
            </TableBody>
          </Table>
        </div>
      </CardBody>
    </Card>
  )
}

export default WeatherCard