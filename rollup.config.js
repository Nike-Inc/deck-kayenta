import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import url from 'rollup-plugin-url';

import pkg from './package.json';

export default {
  input: 'src/reusable-components-exports.ts',
  output: {
    dir: 'reusable-components-dist',
    format: 'cjs',
    exports: 'named',
    sourcemap: true,
  },
  plugins: [
    external(),
    url(),
    resolve(),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true,
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react/index.js': ['Component', 'PureComponent', 'Fragment', 'Children', 'createElement'],
        'node_modules/react-dom/index.js': ['findDOMNode'],
        'node_modules/lodash/lodash.js': ['get', 'omit'],
      },
    }),
  ],
};
