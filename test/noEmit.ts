import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				noEmit: true,
			},
		}),
	},
	path: '.',
	// We cannot map files if there is no output.
	files: {},
});
