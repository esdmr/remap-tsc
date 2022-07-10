import {ResolutionData} from '@esdmr/remap-tsc';

const data = new ResolutionData({
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
data.getSourceFile('src/index.ts')?.outputFile === 'build/index.js';

// Map output to source.
data.getOutputFile('build/index.js')?.sourceFile === 'src/index.ts';
