import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
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
