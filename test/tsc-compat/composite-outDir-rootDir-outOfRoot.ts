import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		// TypeScript does not err on “a.ts” being outside of rootDir when not
		// actually emitting. We manually err in this case.
		'a.ts': '',
		src: {
			'b.ts': '',
		},
		'tsconfig.json': tsconfig({
			compilerOptions: {
				composite: true,
				outDir: 'build',
				rootDir: 'src',
			},
		}),
	},
});
