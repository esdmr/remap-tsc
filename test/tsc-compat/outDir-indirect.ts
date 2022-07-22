import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		src: {
			'b.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					// Without composite, rootDir defaults to “the longest
					// common path of all non-declaration input files”. In this
					// case, it is the root directory.
					outDir: 'build',
				},
				include: ['../**/*'],
			}),
		},
	},
	paths: ['src'],
	files: {
		'a.ts': ['src/build/a.js'],
		'src/b.ts': ['src/build/src/b.js'],
	},
});
