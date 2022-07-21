import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({}),
	},
	// `tsc` does not look in upper directories.
	paths: ['src'],
});
