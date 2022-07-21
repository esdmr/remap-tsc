import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				sourceMap: true,
			},
		}),
	},
	files: {
		'a.ts': ['a.js', 'a.js.map'],
	},
});
