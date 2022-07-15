import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				declaration: true,
				emitDeclarationOnly: true,
			},
		}),
	},
	path: '.',
	files: {
		'a.ts': ['a.d.ts'],
	},
});
