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
				// Without composite, rootDir defaults to “the longest
				// common path of all non-declaration input files”. In this
				// case, it is “core”.
				declaration: true,
				outDir: 'build',
			},
		}),
	},
	files: {
		'core/b.ts': ['build/b.js', 'build/b.d.ts'],
	},
});
