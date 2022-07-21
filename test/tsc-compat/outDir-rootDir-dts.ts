import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript does not copy input declarations to the output.
		'a.d.ts': '',
		core: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				rootDir: '.',
				outDir: 'build',
			},
		}),
	},
	files: {
		'core/b.ts': ['build/core/b.js'],
	},
});
