// declarations.d.ts
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Fix for React Native timeout types
declare namespace NodeJS {
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

// Global timeout types for React Native
declare var setTimeout: (callback: (...args: any[]) => void, ms?: number, ...args: any[]) => NodeJS.Timeout;
declare var clearTimeout: (timeoutId: NodeJS.Timeout | undefined | null) => void;
