import { runTestCase, tsconfig } from '../utils/harness.js';

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
	paths: ['src'],
	files: {
		'a.ts': ['src/build/a.js', 'src/build/a.d.ts'],
		'src/b.ts': ['src/build/src/b.js', 'src/build/src/b.d.ts'],
	},
});
