import { runTestCase, tsconfig } from './utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'tsconfig.json': tsconfig({
			compilerOptions: {
				// InlineSourceMap is mutually exclusive with sourceMap…
				inlineSourceMap: true,
				sourceMap: true,
			},
		}),
	},
	path: '.',
	files: {
		// … yet TypeScript API does not error.
		'a.ts': ['a.js', 'a.js.map'],
	},
});
