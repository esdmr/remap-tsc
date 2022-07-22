import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
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
	paths: ['src'],
	files: {
		'src/b.ts': ['src/build/b.js', 'src/build/b.d.ts'],
	},
});
