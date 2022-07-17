import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({}),
	},
	path: 'src',
	files: {
		'src/a.ts': ['src/a.js'],
	},
}, {
	searchPathIsRoot: false,
});
