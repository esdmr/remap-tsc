import assert from 'node:assert';
import path from 'node:path';
import { RemapTsc } from '@esdmr/remap-tsc';

const data = new RemapTsc();

// Assume the directory structure:
//
//     Working directory
//     ├╴ tsconfig.json
//     ├╴ src
//     │  └╴ index.ts
//     └╴ build
//        └╴ index.js

data.loadConfig('tsconfig.json');

// Map source to output.
assert.strictEqual(
	data.sourceFiles.get('src/index.ts')?.javaScriptFile,
	path.resolve('build/index.js'),
);

// Map output to source.
assert.strictEqual(
	data.outputFiles.get('build/index.js')?.sourceFile,
	path.resolve('src/index.ts'),
);
