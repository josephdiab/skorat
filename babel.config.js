module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for reanimated to work in production
      'react-native-reanimated/plugin', 
    ],
  };
};