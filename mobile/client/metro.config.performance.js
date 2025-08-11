// Performance optimization settings for React Native/Expo
// Add these to your metro.config.js for better bundling performance

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable Hermes engine optimizations
config.transformer.hermes = {
  enableHermesSnapshotGeneration: true,
};

// Optimize bundle size
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable caching for faster rebuilds
config.resolver.enableGlobalPackages = true;

// Optimize resolver for faster module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
