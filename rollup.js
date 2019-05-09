const rollup = require('rollup');
const alias = require('rollup-plugin-alias');
const commonjs = require('rollup-plugin-commonjs');
const external = require('rollup-plugin-peer-deps-external');
const json = require('rollup-plugin-json');
const postcssPlugin = require('rollup-plugin-postcss');
const resolve = require('rollup-plugin-node-resolve');
const sizes = require('rollup-plugin-sizes');
const typescript = require('rollup-plugin-typescript2');
const url = require('rollup-plugin-url');
const pify = require('pify');
const path = require('path');
const less = require('less');
const fs = require('fs');
const importCwd = require('import-cwd');

const humanlizePath = filepath => path.relative(process.cwd(), filepath);
const NODE_MODULE_PATH = path.join(__dirname, 'node_modules');

const lessAliases = {
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
};

/**
 * Custom file manager to support webpack style aliases via '~'
 */
class RollupFileManager extends less.FileManager {
  constructor(lessAliases) {
    super();
    this._lessAliases = lessAliases;
  }

  supports(filename) {
    if (filename && filename.startsWith('~')) {
      return true;
    }
    return false;
  }

  supportsSync(filename) {
    if (filename && filename.startsWith('~')) {
      return true;
    }
    return false;
  }

  loadFile(filename, currentDirectory, options, environment, callback) {
    const prefix = filename
      .replace('~', '')
      .replace('.less', '')
      .split('/')[0];

    const filesToCheck = [];

    if (this._lessAliases[prefix]) {
      filesToCheck.push(
        filename
          .substr(1, filename.length)
          .replace(prefix, this._lessAliases[prefix])
          .replace('.less.less', '.less'),
      ); // if the alias is absolute
    }

    filesToCheck.push(NODE_MODULE_PATH + '/' + filename.replace('~', ''));

    for (let i = 0; i < filesToCheck.length; i++) {
      const fileToCheck = filesToCheck[i];
      if (fs.existsSync(fileToCheck)) {
        return {
          contents: fs.readFileSync(fileToCheck).toString('utf-8'),
          filename: filesToCheck,
        };
      }
    }

    const errMsg = "'" + filename + "' wasn't found. Tried - " + filesToCheck.join(',');
    console.error(errMsg);
    callback(new Error(errMsg), null);
  }
}

const rollupFileManager = new RollupFileManager(lessAliases);

// Copy pasted from https://github.com/egoist/rollup-plugin-postcss/blob/5596ca978bee3d5c4da64c8ddd130ca3d8e77244/src/less-loader.js
// But modified to replace ~ in import statements with the node_modules path
const lessLoader = {
  name: 'less',
  test: /\.less$/,
  async process({ code }) {
    let { css, map, imports } = await pify(less.render.bind(importCwd('less')))(code, {
      ...this.options,
      sourceMap: this.sourceMap && {},
      filename: this.id,
      plugins: [
        {
          install(lessInstance, pluginManager) {
            pluginManager.addFileManager(rollupFileManager);
          },
          minVersion: [2, 1, 1],
        },
      ],
    });

    for (const dep of imports) {
      this.dependencies.add(dep);
    }

    if (map) {
      map = JSON.parse(map);
      map.sources = map.sources.map(source => humanlizePath(source));
    }

    return {
      code: css,
      map,
    };
  },
};

rollup.rollup({
  input: 'src/index.ts',
  treeshake: true,
  output: {
    file: 'lib/index.js',
    format: 'cjs',
    sourcemap: false,
  },
  plugins: [
    {
      transform(code, id) {
        console.log(`Processing: '${id}'`);
      },
    },
    alias({
      resolve: ['.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.less', '.html'],
      root: __dirname,
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react-virtualized/dist/es/WindowScroller/utils/onScroll.js': ['IS_SCROLLING_TIMEOUT'],
        'node_modules/lodash/lodash.js': ['get', 'omit'],
        'node_modules/@spinnaker/core/lib/lib.js': [
          'SETTINGS',
          'API',
          'NgReact',
          'JsonEditor',
          'JsonUtils',
          'noop',
          'HelpField',
          'ValidationMessage',
        ],
      },
    }),
    external(),
    json(),
    postcssPlugin({
      loaders: [lessLoader],
    }),
    resolve({
      preferBuiltins: true,
    }),
    sizes(),
    // This takes soo dang long, #sad-panda
    typescript({
      check: false,
    }),
    url(),
  ],
});
