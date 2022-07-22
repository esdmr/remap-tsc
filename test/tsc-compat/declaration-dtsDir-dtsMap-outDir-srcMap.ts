import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'b.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				declaration: true,
				declarationDir: 'types',
				declarationMap: true,
				outDir: 'build',
				sourceMap: true,
			},
		}),
	},
	files: {
		'b.ts': [
			'build/b.js',
			'build/b.js.map',
			'types/b.d.ts',
			'types/b.d.ts.map',
		],
	},
});
