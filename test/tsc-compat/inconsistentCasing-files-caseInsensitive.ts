import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			files: ['A.ts'],
		}),
	},
	if: {
		caseSensitive: false,
		// Seems that mock-fs does not handle this test case well.
		vfs: false,
	},
	files: {
		'A.ts': ['A.js'],
	},
});
