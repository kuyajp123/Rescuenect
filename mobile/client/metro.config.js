const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
  
const config = getDefaultConfig(__dirname);

// SVG transformer configuration
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Performance optimizations
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

// Enable experimental optimizations
config.transformer.experimentalImportSupport = false;
config.transformer.inlineRequires = true;
  
module.exports = withNativeWind(config, { input: './global.css' });