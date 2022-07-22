import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript does not copy input json files to the output.
		'a.json': 'null',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				resolveJsonModule: true,
			},
			files: ['a.json'],
		}),
	},
	files: {},
});
