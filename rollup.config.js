const alias = require('rollup-plugin-alias');
const typescript = require('rollup-plugin-typescript');
const postcss = require('rollup-plugin-postcss');
const path = require('path');
const { minify } = require('html-minifier');
const external = require('@yelo/rollup-node-external');
const rollupPostcssLessLoader = require('rollup-plugin-postcss-webpack-alias-less-loader');

const NODE_MODULE_PATH = path.join(__dirname, 'node_modules');

const aliases = {
  coreImports: path.resolve(
    NODE_MODULE_PATH,
    '@spinnaker',
    'core',
    'src',
    'presentation',
    'less',
    'imports',
    'commonImports.less',
  ),
  kayenta: path.resolve('./src/kayenta'),
};

const CONFIG = {
  external: external(),
  input: ['src/kayenta/index.ts'],
  output: { name: 'kayenta', file: 'lib/lib.es.js', format: 'es', sourcemap: true },
  treeshake: true,
  plugins: [
    {
      // LOGGING PLUGIN
      transform(code, id) {
        console.log(`Processing: '${id}'`);
      },
    },
    alias({
      resolve: ['.ts', '.tsx', '/index.ts', '/index.tsx', '.less'],
      ...aliases,
    }),
    typescript(),
    postcss({
      loaders: [
        rollupPostcssLessLoader({
          nodeModulePath: NODE_MODULE_PATH,
          aliases: aliases,
        }),
      ],
    }),
    {
      // HTML TEMPLATE PLUGIN
      transform(code, id) {
        if (id.endsWith('.html')) {
          return {
            code: `export default ${JSON.stringify(minify(code, {}))}`,
            map: { mappings: '' },
          };
        }
      },
    },
  ],
};

export default CONFIG;
