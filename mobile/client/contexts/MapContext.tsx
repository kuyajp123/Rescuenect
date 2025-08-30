// MapContext.tsx
import React, { createContext, useRef, useContext } from "react";
import MapboxGL from "@rnmapbox/maps";

type MapContextType = {
  mapRef: React.MutableRefObject<MapboxGL.MapView | null>;
  zoomLevel?: number;
  centerCoordinate?: [number, number];
  animationDuration?: number;
};

type MapProviderProps = {
  children: React.ReactNode;
  zoomLevel?: number;
  centerCoordinate?: [number, number];
  animationDuration?: number;
};

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<MapProviderProps> = ({ 
    children, 
    zoomLevel = 11, 
    centerCoordinate = [120.98, 14.6], 
    animationDuration = 300 
}) => {
  const mapRef = useRef<MapboxGL.MapView | null>(null);

  return (
    <MapContext.Provider value={{ mapRef, zoomLevel, centerCoordinate, animationDuration }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within MapProvider");
  return ctx;
};
