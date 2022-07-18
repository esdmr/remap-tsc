import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({}),
	},
	path: '.',
	files: {
		'a.ts': ['a.js'],
	},
});
