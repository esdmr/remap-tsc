import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript will err on “a.ts” being outside of rootDir, but we do not err if any included files are outside of it.
		'a.ts': '',
		src: {
			'b.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					// With composite, rootDir defaults to “the directory
					// containing the tsconfig.json file”
					composite: true,
					outDir: 'build',
				},
				include: ['../**/*'],
			}),
		},
	},
	path: 'src',
	files: {
		'a.ts': ['src/a.js'],
		'src/b.ts': ['src/build/b.js'],
	},
});
