import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'a.js': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				allowJs: true,
				outDir: 'build',
				rootDir: 'src',
				declaration: true,
				emitDeclarationOnly: true,
			},
		}),
	},
	files: {
		'src/a.js': ['build/a.d.ts'],
	},
});
