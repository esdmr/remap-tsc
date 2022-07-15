import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			files: ['A.ts'],
		}),
	},
	path: '.',
	if: {
		caseSensitive: false,
	},
	files: {
		'A.ts': ['A.js'],
	},
});
