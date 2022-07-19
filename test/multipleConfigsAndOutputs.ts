import path from 'node:path';
import process from 'node:process';
import { test } from 'tap';
import { mock, OutputFile, SourceFile, TscRemap } from './utils/source.js';
import { tsconfig } from './utils/harness.js';

await test('getOutputFile', async (t) => {
	mock(t);

	const dir = path.resolve(t.testdir({
		'a.ts': '',
		a: {
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '..',
					outDir: '.',
				},
				files: ['../a.ts'],
			}),
		},
		b: {
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '..',
					outDir: '.',
				},
				files: ['../a.ts'],
			}),
		},
	}));

	process.chdir(dir);

	const data = new TscRemap();

	data.loadConfig('a');
	data.loadConfig('b');

	t.strictSame(
		{
			sourceFiles: new Map(data.sourceFiles),
			outputFiles: new Map(data.outputFiles),
		},
		{
			sourceFiles: new Map([
				[path.resolve('a.ts'), new SourceFile([
					path.resolve('a/a.js'),
					path.resolve('b/a.js'),
				])],
			]),
			outputFiles: new Map([
				[path.resolve('a/a.js'), new OutputFile(path.resolve('a.ts'))],
				[path.resolve('b/a.js'), new OutputFile(path.resolve('a.ts'))],
			]),
		},
		'resolution matches',
	);
});
