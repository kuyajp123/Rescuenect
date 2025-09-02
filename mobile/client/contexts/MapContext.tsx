// MapContext.tsx
import MapboxGL from "@rnmapbox/maps";
import React, { createContext, useContext, useEffect, useRef } from "react";

type MapContextType = {
  mapRef: React.MutableRefObject<MapboxGL.MapView | null>;
  zoomLevel?: number;
  centerCoordinate?: [number, number];
  animationDuration?: number;
  isContextReady: boolean;
};

type MapProviderProps = { children: React.ReactNode };

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const mapRef = useRef<MapboxGL.MapView | null>(null);
  const [isContextReady, setIsContextReady] = React.useState(false);

  useEffect(() => {
    // Small delay to ensure the context is properly initialized
    const timer = setTimeout(() => {
      setIsContextReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  return (
  <MapContext.Provider value={{ mapRef, isContextReady }}>
    {children}
  </MapContext.Provider>
  );
};

export const useMap = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMap must be used within MapProvider");
  return ctx;
};
