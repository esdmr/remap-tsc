import { runTestCase, tsconfig } from './utils/harness.js';
import { SourceFile } from './utils/source.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				rootDir: 'src',
				outDir: 'build',
			},
		}),
	},
	checkResolution (t, options) {
		const sourceFile = options.data.getSourceFile(
			options.getPath('src/a.ts'),
		);

		if (sourceFile === undefined) {
			throw new Error('Source file should exist');
		}

		t.strictSame(
			new SourceFile(
				[...sourceFile.outputFiles].map((file) =>
					options.fixUpActual(file),
				),
			),
			new SourceFile([options.fixUpExpected('build/a.js')]),
			'should be the correct output file',
		);
	},
	tscCompatible: false,
	files: {},
});
