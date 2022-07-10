import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			include: ['A.ts'],
		}),
	},
	path: '.',
	if: {
		'case-sensitive': true,
	},
	// TypeScript could not find any file in “includes” which matched.
	files: {},
});
