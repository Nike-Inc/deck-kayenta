import { existsSync } from 'fs';
import typescript from 'rollup-plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import pify from 'pify';
import path from 'path';
import less from 'less';
import resolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';
import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import importCwd from 'import-cwd';

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
 * Inspired by https://github.com/webpack-contrib/less-loader/blob/99aad2171e9784cecef2e7820fb8300698fe7007/src/createWebpackLessPlugin.js#L36
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
// But modified to use the above RollupFileManager
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

const CONFIG = {
  external: id => {
    if (id.startsWith('@spinnaker')) {
      return false;
    }
    return existsSync(`./node_modules/${id}`);
  },
  input: ['src/index.ts'],
  output: { name: 'kayenta', file: 'lib/index.js', format: 'es', sourcemap: true },
  treeshake: true,
  plugins: [
    {
      transform(code, id) {
        console.log(`Processing: '${id}'`);
      },
    },
    json(),
    resolve(),
    commonjs({
      include: ['node_modules/@spinnaker/**'],
      namedExports: {
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
    alias({
      resolve: ['.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.less', '.html'],
      root: __dirname,
    }),
    typescript(),
    postcss({
      loaders: [lessLoader],
    }),
  ],
};

export default CONFIG;
