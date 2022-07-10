# Remap TypeScript Compiler

[![GitHub workflow](https://img.shields.io/github/workflow/status/esdmr/remap-tsc/CI/main?label=test&labelColor=0F0F0F&logo=github)][workflow]
[![Codecov coverage](https://img.shields.io/codecov/c/gh/esdmr/remap-tsc/main?labelColor=0F0F0F&logo=CodeCov&logoColor=FF66B0)][codecov]
[![License](https://img.shields.io/github/license/esdmr/remap-tsc?labelColor=0F0F0F&color=005C9A)][license]
[![Documentation](https://img.shields.io/badge/documentation-005C9A)][gh-pages]
[![NodeJS version](https://img.shields.io/badge/node-≥16-005C9A?labelColor=0F0F0F&logo=node.js&logoColor=00B834)][node]
[![pnpm version](https://img.shields.io/badge/pnpm-6-005C9A?labelColor=0F0F0F&logo=pnpm)][pnpm]

[workflow]: https://github.com/esdmr/remap-tsc/actions/workflows/ci.yml
[codecov]: https://codecov.io/gh/esdmr/remap-tsc
[license]: https://github.com/esdmr/remap-tsc/blob/main/LICENSE
[gh-pages]: https://esdmr.github.io/remap-tsc/
[node]: https://nodejs.org/en/download/current
[pnpm]: https://pnpm.io

Map TypeScript compiler source files to output files and vice versa.

## Installing as a dependency

This project requires [Node.JS][node] version 14 minimum. Ensure that you have
installed the correct version of Node.JS by running `node --version`.

Any of the following snippets will install this project as a dependency:

```sh
npm install --save @esdmr/remap-tsc
# Or
yarn add @esdmr/remap-tsc
# Or
pnpm install @esdmr/remap-tsc
```

## Installing from source

This project requires [Node.JS][node] version 14 minimum. Ensure that you have
installed the correct version of Node.JS by running `node --version`.

This project recommends [pnpm][pnpm] version 7. Ensure that you have installed
the correct version of pnpm by running `pnpm --version`.

The following snippet will download, install, and build the source from GitHub:

```sh
git clone https://github.com/esdmr/remap-tsc.git
cd remap-tsc
pnpm install
pnpm run build
```
