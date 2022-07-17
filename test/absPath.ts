import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			files: ['a.ts'],
		}),
	},
	path: '.',
	files: {
		'a.ts': ['a.js'],
	},
}, {
	useRelativePaths: false,
});
