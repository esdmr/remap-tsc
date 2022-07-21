import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript does not err that outputs will overwrite the input when
		// not actually emitting. We manually err in this case.
		'a.js': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				allowJs: true,
			},
		}),
	},
});
