import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.json': 'null',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				resolveJsonModule: true,
			},
			files: ['a.json'],
		}),
	},
	path: '.',
	// Currently, we do not accept an output which does not output a JavaScript
	// file.
	files: {},
});
