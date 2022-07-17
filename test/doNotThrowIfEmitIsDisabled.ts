import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		src: {
			'a.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				noEmit: true,
			},
		}),
	},
	path: '.',
	files: {},
}, {
	throwIfEmitIsDisabled: false,
});
