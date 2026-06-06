const normalizeEnv = (env?: string): string => env?.trim().toLowerCase() || '';

export const getAppEnv = (): string => normalizeEnv(process.env.APP_ENV);

export const isProductionAppEnv = (): boolean => getAppEnv() === 'production';

export const isDevelopmentAppEnv = (): boolean => {
  const appEnv = getAppEnv();
  return appEnv === 'development' || appEnv === 'local';
};
