import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		a: {
			'a.ts': '',
		},
		b: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				// RootDirs only changes the module resolution, not the emit.
				rootDirs: ['a', 'b'],
				outDir: 'build',
			},
		}),
	},
	files: {
		'a/a.ts': ['build/a/a.js'],
		'b/b.ts': ['build/b/b.js'],
	},
});
