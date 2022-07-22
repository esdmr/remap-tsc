import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript does not emit JSON files if not explicitly included.
		'a.json': 'null',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				resolveJsonModule: true,
			},
		}),
	},
});
