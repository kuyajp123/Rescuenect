/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORT: number;
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const VITE_PORT: number;
declare const VITE_BACKEND_URL: string;