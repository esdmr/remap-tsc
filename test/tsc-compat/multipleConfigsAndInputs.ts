import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		a: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
					outDir: '..',
				},
				files: ['a.ts'],
			}),
		},
		b: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
					outDir: '..',
				},
				files: ['a.ts'],
			}),
		},
	},
	paths: ['a', 'b'],
	files: {
		'a/a.ts': ['a.js'],
		'b/a.ts': ['a.js'],
	},
});
