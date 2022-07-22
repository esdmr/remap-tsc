import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				// EmitDeclarationOnly requires either declaration or composite
				// to be enabled.
				emitDeclarationOnly: true,
			},
		}),
	},
});
