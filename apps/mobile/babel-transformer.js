const babel = require('@babel/core')
const upstream = require('@expo/metro-config/babel-transformer')

const TRANSFORM_NODE_MODULES = /node_modules[\\/](three|@react-three|zustand)[\\/]/

module.exports.transform = async function transform(params) {
  if (TRANSFORM_NODE_MODULES.test(params.filename)) {
    const result = babel.transformSync(params.src, {
      filename: params.filename,
      babelrc: false,
      configFile: false,
      plugins: ['babel-plugin-transform-import-meta'],
    })
    if (result && result.code) {
      params = { ...params, src: result.code }
    }
  }
  return upstream.transform(params)
}
