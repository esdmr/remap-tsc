import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'b.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				declaration: true,
				declarationDir: 'types',
				emitDeclarationOnly: true,
			},
		}),
	},
	files: {
		'b.ts': ['types/b.d.ts'],
	},
});
