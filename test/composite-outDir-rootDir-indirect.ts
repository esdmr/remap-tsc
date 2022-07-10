import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		src: {
			'b.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					composite: true,
					outDir: 'build',
					rootDir: '..',
				},
				include: ['../**/*'],
			}),
		},
	},
	path: 'src',
	files: {
		'a.ts': ['src/build/a.js'],
		'src/b.ts': ['src/build/src/b.js'],
	},
});
