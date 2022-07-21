import { runTestCase, tsconfig } from './utils/harness.js';
import { OutputFile } from './utils/source.js';

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
		const outputFile = options.data.getOutputFile(
			options.getPath('build/a.js'),
		);

		if (outputFile === undefined) {
			throw new Error('Output file should exist');
		}

		t.strictSame(
			new OutputFile(options.fixUpActual(outputFile.sourceFile)),
			new OutputFile(options.fixUpExpected('src/a.ts')),
			'should be the correct output file',
		);
	},
	tscCompatible: false,
	files: {},
});
