import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";

const config = {
  input: "./packages/browser/index.ts",
  output: {
    name: "MonitorWeb",
    sourcemap: !process.env.MINIFY,
    globals: {
      "mobile-detect": "MobileDetect",
    },
  },
  external: [],
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
    }),
    json(),
    babel({ babelHelpers: "bundled" }),
    commonjs(),
    resolve(),
    replace({
      preventAssignment: true,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
  ],
};

if (process.env.MINIFY) {
  config.plugins.push(terser());
}

export default config;
