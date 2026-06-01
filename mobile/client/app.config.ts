const appEnv = process.env.APP_ENV;
const useStagingFirebase = appEnv === 'staging' || appEnv === 'local';
const selectedGoogleServices = useStagingFirebase
  ? require('./staging-google-services.json')
  : require('./google-services.json');

const getWebClientId = (googleServices: any) => {
  const clients = googleServices?.client ?? [];
  for (const client of clients) {
    const webClient = client?.oauth_client?.find((oauthClient: any) => oauthClient?.client_type === 3);
    if (webClient?.client_id) {
      return webClient.client_id;
    }
  }

  return process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
};

const googleWebClientId = getWebClientId(selectedGoogleServices);

const getFirebaseClientConfig = (googleServices: any) => {
  const projectInfo = googleServices?.project_info ?? {};
  const client = googleServices?.client?.[0] ?? {};
  const apiKey = client?.api_key?.[0]?.current_key;
  const projectId = projectInfo?.project_id;

  return {
    apiKey,
    authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
    projectId,
    storageBucket: projectInfo?.storage_bucket,
    messagingSenderId: projectInfo?.project_number,
    appId: client?.client_info?.mobilesdk_app_id,
  };
};

const firebaseConfig = getFirebaseClientConfig(selectedGoogleServices);

export default ({ config }: { config: any }) => {
  return {
    ...config,
    name: 'Rescuenect',
    slug: 'client',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/logo/adaptive-icon.png',
    scheme: 'client',
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
      package: useStagingFirebase ? 'com.yajeyps.client.staging' : 'com.yajeyps.client',
      googleServicesFile: useStagingFirebase ? './staging-google-services.json' : './google-services.json',
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
      eas: {
        projectId: 'b0c098eb-8a7f-4cbd-b1ea-2e6557df75f7',
      },
    },
    owner: 'yajeyps',
  };
};
