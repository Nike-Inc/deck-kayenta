const { existsSync } = require('fs');
const typescript = require('rollup-plugin-typescript');
const postcss = require('rollup-plugin-postcss');
const pify = require('pify');
const path = require('path');
const less = require('less');
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
 * Replaces aliases in less code then replaces ~ to node_modules root
 * @param code
 * @return {*}
 */
const replaceAliases = code => {
  Object.keys(lessAliases).forEach(alias => {
    code = code.replace(new RegExp(`(@import.*?)["']~${alias}.*?["']`, 'g'), `$1"${lessAliases[alias]}"`);
  });
  code = code.replace(/(@import.*?)["']~(.*?)["'].*?/g, `$1"${NODE_MODULE_PATH}/$2"`);
  return code;
};

/**
 * Custom file manager to support webpack style aliases via '~'
 * Inspired by https://github.com/webpack-contrib/less-loader/blob/99aad2171e9784cecef2e7820fb8300698fe7007/src/createWebpackLessPlugin.js#L36
 */
class RollupFileManager extends less.FileManager {
  supports() {
    return true;
  }

  supportsSync() {
    return false;
  }

  async loadFile(filename, currentDirectory, options, environment) {
    const file = await super.loadFile(filename, currentDirectory, options, environment);
    file.contents = replaceAliases(file.contents);
    return file;
  }
}

const rollupFileManager = new RollupFileManager();

// Copy pasted from https://github.com/egoist/rollup-plugin-postcss/blob/5596ca978bee3d5c4da64c8ddd130ca3d8e77244/src/less-loader.js
// But modified to use the above RollupFileManager
const lessLoader = {
  name: 'less',
  test: /\.less$/,
  async process({ code }) {
    code = replaceAliases(code);
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
    typescript(),
    postcss({
      loaders: [lessLoader],
    }),
  ],
};

export default CONFIG;
