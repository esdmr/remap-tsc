import { test } from 'tap';
import { RemapTsc } from './utils/source.js';
import { runTestCase, tsconfig } from './utils/harness.js';
import testReadonlyPathMap from './utils/ReadonlyPathMap.js';

await test('RemapTsc', async (t) => {
	await runTestCase(import.meta.url, {
		t,
		name: 'sourceFiles',
		spec: {
			'a.ts': '',
			'b.ts': '',
			'tsconfig.json': tsconfig({}),
		},
		async checkResolution (t, { data }) {
			await testReadonlyPathMap(t, data.sourceFiles);
		},
		tscCompatible: false,
		files: {},
	});

	await runTestCase(import.meta.url, {
		t,
		name: 'outputFiles',
		spec: {
			'a.ts': '',
			'b.ts': '',
			'tsconfig.json': tsconfig({}),
		},
		async checkResolution (t, { data }) {
			await testReadonlyPathMap(t, data.outputFiles);
		},
		tscCompatible: false,
		files: {},
	});

	t.equal(new RemapTsc()[Symbol.toStringTag], 'RemapTsc', '@@toStringTag');

	await runTestCase(import.meta.url, {
		t,
		name: 'clear',
		spec: {
			'a.ts': '',
			'b.ts': '',
			'tsconfig.json': tsconfig({}),
		},
		checkResolution (t, { data }) {
			data.clear();

			t.equal(data.sourceFiles.size, 0, 'sourceFiles is empty');
			t.equal(data.outputFiles.size, 0, 'outputFiles is empty');
		},
		tscCompatible: false,
		files: {},
	});

	await t.test('loadConfig', async (t) => {
		await runTestCase(import.meta.url, {
			t,
			name: 'out',
			spec: {
				'a.ts': '',
				'b.ts': '',
				'tsconfig.json': tsconfig({
					compilerOptions: {
						// Out is a deprecated alias for outFile.
						['out' as 'outFile']: 'build.js',
					},
				}),
			},
			tscCompatible: false,
		});

		await runTestCase(import.meta.url, {
			t,
			name: 'outFile',
			spec: {
				'a.ts': '',
				'b.ts': '',
				'tsconfig.json': tsconfig({
					compilerOptions: {
						// We cannot map output to source with outFiles.
						outFile: 'build.js',
					},
				}),
			},
			tscCompatible: false,
		});
	});
});
