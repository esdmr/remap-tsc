import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			// TypeScript could not find any file in “includes” which matched.
			include: ['A.ts'],
		}),
	},
	if: {
		caseSensitive: true,
	},
});
