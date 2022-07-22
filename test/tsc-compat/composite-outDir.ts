import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				// With composite, rootDir defaults to “the directory containing the
				// tsconfig.json file”.
				composite: true,
				outDir: 'build',
			},
		}),
	},
	files: {
		'a.ts': ['build/a.js', 'build/a.d.ts'],
	},
});
