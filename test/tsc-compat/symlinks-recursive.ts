import { fixture } from 'tap';
import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		// TypeScript ignores recursive symlinks without any error.
		'b.ts': fixture('symlink', 'b.ts'),
		'tsconfig.json': tsconfig({}),
	},
	files: {
		'a.ts': ['a.js'],
	},
});
