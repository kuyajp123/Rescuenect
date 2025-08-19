export default ({ config }: { config: any }) => {
  return {
    ...config,
    name: "Rescuenect",
    slug: "client",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo/adaptive-icon.png",
    scheme: "client",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.yajeyps.client"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo/splash-icon-dark.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/images/logo/splash-icon-light.png",
            resizeMode: "contain",
            backgroundColor: "#000000",
          }
        }
      ],
      "expo-font",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "b0c098eb-8a7f-4cbd-b1ea-2e6557df75f7"
      },
    },
    owner: "yajeyps"
  };
};
