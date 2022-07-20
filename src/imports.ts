/**
 * @fileoverview
 * This file deduplicates the imports in the bundled output.
 *
 * @see https://togithub.com/evanw/esbuild/issues/475
 */
import path from 'node:path';
import ts from 'typescript';

// eslint-disable-next-line unicorn/prefer-export-from
export { path, ts };
