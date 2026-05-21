module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-worklets/plugin'],
    overrides: [
      {
        test: /node_modules[\\/](three|@react-three)[\\/]/,
        plugins: ['babel-plugin-transform-import-meta'],
      },
    ],
  }
}
