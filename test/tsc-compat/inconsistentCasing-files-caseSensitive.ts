import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			// TypeScript does not err that some files do not exist when not
			// actually emitting. We manually err in this case.
			files: ['A.ts'],
		}),
	},
	if: {
		caseSensitive: true,
	},
});
