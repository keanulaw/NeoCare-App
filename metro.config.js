const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.blockList = exclusionList([
  /react-native-keyboard-controller\/.*/,
]);

defaultConfig.resolver.extraNodeModules = {
  'react-native-keyboard-controller': require.resolve('./shim/react-native-keyboard-controller.js'),
};

module.exports = defaultConfig;
