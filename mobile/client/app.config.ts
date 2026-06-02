const fs = require('fs');

type AppVariant = 'local' | 'staging' | 'production';

const normalizeEasBuildProfile = (value?: string): AppVariant | undefined => {
  switch (value) {
    case 'development':
      return 'local';
    case 'staging':
      return 'staging';
    case 'preview':
    case 'production':
      return 'production';
    default:
      return undefined;
  }
};

const getAppEnvForBuildProfile = (value?: string): string | undefined => {
  switch (value) {
    case 'development':
      return 'local';
    case 'staging':
      return 'staging';
    case 'preview':
      return 'production-preview';
    case 'production':
      return 'production';
    default:
      return undefined;
  }
};

const normalizeAppVariant = (value?: string): AppVariant => {
  switch (value) {
    case 'development':
    case 'dev':
    case 'local':
      return 'local';
    case 'staging':
      return 'staging';
    case 'production':
    case 'production-preview':
    case 'preview':
    default:
      return 'production';
  }
};

const easBuildProfile = process.env.EAS_BUILD_PROFILE;
const appVariantFromBuildProfile = normalizeEasBuildProfile(easBuildProfile);
const appEnv = getAppEnvForBuildProfile(easBuildProfile) ?? process.env.APP_ENV ?? 'production';
const appVariant = appVariantFromBuildProfile ?? normalizeAppVariant(process.env.APP_VARIANT || appEnv);

const variantConfig: Record<
  AppVariant,
  {
    name: string;
    scheme: string;
    androidPackage: string;
    googleServicesFile: string;
  }
> = {
  local: {
    name: 'dev-client',
    scheme: 'rescuenect-staging',
    androidPackage: 'com.yajeyps.client.staging',
    googleServicesFile: './staging-google-services.json',
  },
  staging: {
    name: 'Rescuenect Staging',
    scheme: 'rescuenect-staging',
    androidPackage: 'com.yajeyps.client.staging',
    googleServicesFile: './staging-google-services.json',
  },
  production: {
    name: 'Rescuenect',
    scheme: 'rescuenect',
    androidPackage: 'com.yajeyps.client',
    googleServicesFile: './google-services.json',
  },
};

const selectedVariantConfig = variantConfig[appVariant];
const selectedGoogleServicesPath = selectedVariantConfig.googleServicesFile;

if (!fs.existsSync(selectedGoogleServicesPath)) {
  throw new Error(
    `Missing ${selectedVariantConfig.googleServicesFile} for APP_VARIANT=${appVariant}. ` +
      `Download the google-services.json for the selected Firebase project.`
  );
}

const selectedGoogleServices = require(selectedVariantConfig.googleServicesFile);

const getAndroidPackageName = (client: any): string | undefined =>
  client?.client_info?.android_client_info?.package_name;

const getFirebaseClient = (googleServices: any, androidPackage: string) => {
  const clients = googleServices?.client ?? [];

  const matchingClient = clients.find((client: any) => getAndroidPackageName(client) === androidPackage);
  if (!matchingClient) {
    throw new Error(
      `${selectedVariantConfig.googleServicesFile} does not contain Android package ${androidPackage}. ` +
        `Add this Android app inside the staging Firebase project and download the updated google-services.json.`
    );
  }

  return matchingClient;
};

const selectedFirebaseClient = getFirebaseClient(selectedGoogleServices, selectedVariantConfig.androidPackage);

const getWebClientId = (googleServices: any, firebaseClient: any) => {
  const selectedWebClient = firebaseClient?.oauth_client?.find((oauthClient: any) => oauthClient?.client_type === 3);
  if (selectedWebClient?.client_id) {
    return selectedWebClient.client_id;
  }

  const clients = googleServices?.client ?? [];
  for (const client of clients) {
    const webClient = client?.oauth_client?.find((oauthClient: any) => oauthClient?.client_type === 3);
    if (webClient?.client_id) {
      return webClient.client_id;
    }
  }

  return process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
};

const googleWebClientId = getWebClientId(selectedGoogleServices, selectedFirebaseClient);

const getFirebaseClientConfig = (googleServices: any, firebaseClient: any) => {
  const projectInfo = googleServices?.project_info ?? {};
  const apiKey = firebaseClient?.api_key?.[0]?.current_key;
  const projectId = projectInfo?.project_id;

  return {
    apiKey,
    authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
    projectId,
    storageBucket: projectInfo?.storage_bucket,
    messagingSenderId: projectInfo?.project_number,
    appId: firebaseClient?.client_info?.mobilesdk_app_id,
  };
};

const firebaseConfig = getFirebaseClientConfig(selectedGoogleServices, selectedFirebaseClient);

export default ({ config }: { config: any }) => {
  return {
    ...config,
    name: selectedVariantConfig.name,
    slug: 'client',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo/adaptive-icon.png',
    scheme: selectedVariantConfig.scheme,
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      userInterfaceStyle: 'automatic',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/logo/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: selectedVariantConfig.androidPackage,
      googleServicesFile: selectedVariantConfig.googleServicesFile,
      userInterfaceStyle: 'automatic',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          image: './assets/images/logo/splash-icon-dark.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            image: './assets/images/logo/splash-icon-light.png',
            resizeMode: 'contain',
            backgroundColor: '#000000',
          },
        },
      ],
      'expo-font',
      'expo-web-browser',
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: 'com.googleusercontent.apps.554379793893',
        },
      ],
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_API_TOKEN,
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      googleWebClientId,
      firebaseConfig,
      firebaseProjectId: firebaseConfig.projectId,
      appVariant,
      appEnv,
      easBuildProfile,
      eas: {
        projectId: 'b0c098eb-8a7f-4cbd-b1ea-2e6557df75f7',
      },
    },
    owner: 'yajeyps',
  };
};
