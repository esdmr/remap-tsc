import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
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
	files: {
		'src/b.ts': ['build/b.js', 'build/b.d.ts'],
	},
});
