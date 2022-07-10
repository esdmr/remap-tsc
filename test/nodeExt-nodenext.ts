import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.cts': '',
		'b.mts': '',
		'c.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				module: 'NodeNext',
			},
		}),
	},
	path: '.',
	if: {
		typescript: '>=4.7.0',
	},
	files: {
		'a.cts': ['a.cjs'],
		'b.mts': ['b.mjs'],
		'c.ts': ['c.js'],
	},
});
