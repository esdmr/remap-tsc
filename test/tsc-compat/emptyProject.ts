import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'tsconfig.json': tsconfig({}),
	},
});
