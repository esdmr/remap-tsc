import path from 'node:path';
import process from 'node:process';
import {test} from 'tap';
import {mock, OutputFile, SourceFile, TscRemap} from './utils/source.js';
import { tsconfig } from './utils/harness.js';

await test('getOutputFile', async (t) => {
	mock(t);

	const dir = path.resolve(t.testdir({
		a: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
					outDir: '..'
				},
				files: ['a.ts'],
			}),
		},
		b: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
					outDir: '..'
				},
				files: ['a.ts'],
			}),
		},
	}));

	process.chdir(dir);

	const data = new TscRemap({
		useRelativePaths: true,
	});

	data.loadConfig('a');
	data.loadConfig('b');

	t.strictSame(
		{
			sourceFiles: new Map(data.sourceFiles),
			outputFiles: new Map(data.outputFiles),
		},
		{
			sourceFiles: new Map([
				['a/a.ts', new SourceFile(['a.js'])],
				['b/a.ts', new SourceFile(['a.js'])],
			]),
			outputFiles: new Map([
				['a.js', new OutputFile('b/a.ts')],
			]),
		},
		'resolution matches',
	);
});
