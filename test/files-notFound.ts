import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			files: ['a.ts', 'b.ts'],
		}),
	},
	path: '.',
	// TypeScript API does not error in this case.
	files: {
		'a.ts': ['a.js'],
		'b.ts': ['b.js'],
	},
});
