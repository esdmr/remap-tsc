import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			files: ['A.ts'],
		}),
	},
	path: '.',
	// TypeScript API does not error in this case.
	files: {
		'A.ts': ['A.js'],
	},
});
