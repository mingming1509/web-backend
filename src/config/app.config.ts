import { registerAs } from '@nestjs/config';

export const APP_CONFIG_KEY = 'app';

/**
 * Process-level settings. Registered as a namespace so consumers inject a typed
 * object instead of reaching for `process.env` or stringly-typed lookups.
 */
export const appConfig = registerAs(APP_CONFIG_KEY, () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  /** Browser origins allowed to send credentialed requests. */
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));
