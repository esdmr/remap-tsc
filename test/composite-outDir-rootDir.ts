import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript will err on “a.ts” being outside of rootDir, but we do not err
		// if any included files are outside of it.
		'a.ts': '',
		src: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				composite: true,
				outDir: 'build',
				rootDir: 'src',
			},
		}),
	},
	path: 'src',
	files: {
		'a.ts': ['a.js', 'a.d.ts'],
		'src/b.ts': ['build/b.js', 'build/b.d.ts'],
	},
});
