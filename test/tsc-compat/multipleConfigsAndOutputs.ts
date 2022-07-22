import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		a: {
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '..',
					outDir: '.',
				},
				files: ['../a.ts'],
			}),
		},
		b: {
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '..',
					outDir: '.',
				},
				files: ['../a.ts'],
			}),
		},
	},
	paths: ['a', 'b'],
	files: {
		'a.ts': ['a/a.js', 'b/a.js'],
	},
});
