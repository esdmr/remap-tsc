import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			include: ['A.ts'],
		}),
	},
	if: {
		caseSensitive: false,
	},
	files: {
		'a.ts': ['a.js'],
	},
});
