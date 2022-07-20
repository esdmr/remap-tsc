import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			files: ['a.ts'],
		}),
	},
	files: {
		'a.ts': ['a.js'],
	},
});
