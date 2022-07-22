import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		src: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				outDir: 'build',
			},
		}),
	},
	files: {
		'a.ts': ['build/a.js'],
		'src/b.ts': ['build/src/b.js'],
	},
});
