import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({}),
	},
	paths: ['tsconfig.json'],
	files: {
		'a.ts': ['a.js'],
	},
});
