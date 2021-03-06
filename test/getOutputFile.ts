import path from 'node:path';
import process from 'node:process';
import { test } from 'tap';
import { mock, OutputFile, TscRemap } from './utils/source.js';
import { tsconfig } from './utils/harness.js';

await test('getOutputFile', async (t) => {
	mock(t);

	const dir = path.resolve(t.testdir({
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				rootDir: 'src',
				outDir: 'build',
			},
		}),
	}));

	process.chdir(dir);

	const data = new TscRemap({
		useRelativePaths: true,
	});

	data.loadConfig('.');

	t.strictSame(
		data.getOutputFile(path.normalize('build/a.js')),
		new OutputFile(path.normalize('src/a.ts')),
		'should be the correct output file',
	);
});
