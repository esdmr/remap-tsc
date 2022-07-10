import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				emitDeclarationOnly: true,
			},
		}),
	},
	path: '.',
	// Currently, we do not map declaration files.
	files: {},
});
