import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		a: {
			b: {
				'c.ts': '',
			},
			c: {
				'd.ts': '',
			},
			d: {
				'e.ts': '',
			},
		},
		'tsconfig.json': tsconfig({
			include: ['*', '?/?/c.ts', '**/e.ts', 'f.ts'],
		}),
	},
	files: {
		'a.ts': ['a.js'],
		'a/b/c.ts': ['a/b/c.js'],
		'a/d/e.ts': ['a/d/e.js'],
	},
});
