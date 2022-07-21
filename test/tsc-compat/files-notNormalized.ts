import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({
			files: ['src//a.ts'],
		}),
	},
	files: {
		'src/a.ts': ['src/a.js'],
	},
});
