const { withAndroidManifest } = require('@expo/config-plugins');

// TransactionTooLargeException fix — Neva'dan kopyalandı
const withDisableSavedState = (config) => {
  return withAndroidManifest(config, (config) => {
    const activities = config.modResults.manifest.application?.[0]?.activity ?? [];
    const main = activities.find(a => a.$['android:name'] === '.MainActivity');
    if (main) {
      main.$['android:saveEnabled']  = 'false';
      main.$['android:launchMode']   = 'singleTask';
    }
    return config;
  });
};

module.exports = {
  expo: {
    name: "TamirBul",
    slug: "tamirbul",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "tamirbul",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: "co.nevaapp.tamirbul",
      buildNumber: "1"
    },
    android: {
      package: "co.nevaapp.tamirbul",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#E8540A",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.INTERNET"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      withDisableSavedState,
      "expo-router",
      [
        "expo-build-properties",
        {
          android: {
            largeHeap: true
          }
        }
      ],
      [
        "expo-notifications",
        {
          color: "#E8540A"
        }
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#E8540A",
          dark: {
            backgroundColor: "#1A3A5C"
          }
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-PLACEHOLDER~PLACEHOLDER",
          iosAppId: "ca-app-pub-PLACEHOLDER~PLACEHOLDER"
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      router: {},
      eas: {
        projectId: "ae0c922f-a67c-4589-bb8b-077ee1590fdc"
      }
    },
    owner: "nevaapp"
  }
};
