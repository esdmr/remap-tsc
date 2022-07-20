import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
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
