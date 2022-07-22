import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		a: {
			b: {
				'c.ts': '',
				'c2.ts': '',
			},
			c: {
				'd.ts': '',
			},
			d: {
				'e.ts': '',
				'e2.ts': '',
			},
		},
		'tsconfig.json': tsconfig({
			exclude: ['*.ts', '?/?/c.ts', '**/e.ts', 'f.ts', 'a/c'],
		}),
	},
	files: {
		'a/b/c2.ts': ['a/b/c2.js'],
		'a/d/e2.ts': ['a/d/e2.js'],
	},
});
