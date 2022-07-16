import assert from 'node:assert';
import { TscRemap } from '@esdmr/remap-tsc';

const data = new TscRemap({
	// For this example:
	useRelativePaths: true,
});

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
	data.getSourceFile('src/index.ts')?.javaScriptFile,
	'build/index.js',
);

// Map output to source.
assert.strictEqual(
	data.getOutputFile('build/index.js')?.sourceFile,
	'src/index.ts',
);
