import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		base: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
				},
			}),
		},
		'tsconfig.json': tsconfig({
			extends: './base/tsconfig.json',
			compilerOptions: {
				outDir: 'build',
			},
		}),
	},
	files: {
		'base/a.ts': ['build/a.js'],
	},
});
