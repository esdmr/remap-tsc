import path from 'node:path';
import process from 'node:process';
import { test } from 'tap';
import { mock, OutputFile, SourceFile, TscRemap } from './utils/source.js';
import { tsconfig } from './utils/harness.js';

await test('getOutputFile', async (t) => {
	mock(t);

	const dir = path.resolve(t.testdir({
		a: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
					outDir: '..',
				},
				files: ['a.ts'],
			}),
		},
		b: {
			'a.ts': '',
			'tsconfig.json': tsconfig({
				compilerOptions: {
					rootDir: '.',
					outDir: '..',
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
				[path.normalize('a/a.ts'), new SourceFile([path.normalize('a.js')])],
				[path.normalize('b/a.ts'), new SourceFile([path.normalize('a.js')])],
			]),
			outputFiles: new Map([
				[path.normalize('a.js'), new OutputFile(path.normalize('b/a.ts'))],
			]),
		},
		'resolution matches',
	);
});
