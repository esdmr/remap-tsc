import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		src: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				noEmit: true,
				rootDir: 'src',
			},
		}),
	},
});
