import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		base: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					outDir: '../build',
				},
			}),
		},
		'tsconfig.json': tsconfig({
			extends: './base/tsconfig.json',
			compilerOptions: {
				rootDir: 'base',
			},
		}),
	},
	files: {
		'base/a.ts': ['build/a.js'],
	},
});
