declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      MONGODB_URL: string;
      DB_NAME: string;
      PORT: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export const getEnvVar = (
  key: keyof NodeJS.ProcessEnv,
  defaultValue?: string,
): string => {
  const value = process.env[key]
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`)
  }
  return value || defaultValue || ''
}
