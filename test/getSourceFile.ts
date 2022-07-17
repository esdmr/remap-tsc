import path from 'node:path';
import process from 'node:process';
import {test} from 'tap';
import {mock, SourceFile, TscRemap} from './utils/source.js';
import { tsconfig } from './utils/harness.js';

await test('getSourceFile', async (t) => {
	mock(t);

	const dir = path.resolve(t.testdir({
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				rootDir: 'src',
				outDir: 'build'
			},
		}),
	}));

	process.chdir(dir);

	const data = new TscRemap({
		useRelativePaths: true,
	});

	data.loadConfig('.');

	t.strictSame(
		data.getSourceFile('src/a.ts'),
		new SourceFile(['build/a.js']),
		'should be the correct source file',
	);
});
