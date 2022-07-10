import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
	// TypeScript does not err that some files are outside of rootDir when not actually emitting.
		'a.ts': '',
		src: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				rootDir: 'src',
			},
		}),
	},
	path: '.',
	files: {
		'a.ts': ['a.js'],
		'src/b.ts': ['src/b.js'],
	},
});
