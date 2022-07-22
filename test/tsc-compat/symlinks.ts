import { fixture } from 'tap';
import { runTestCase, tsconfig } from '../utils/harness.js';

await runTestCase(import.meta.url, {
	spec: {
		'a.ts': '',
		'b.ts': fixture('symlink', 'a.ts'),
		'tsconfig.json': tsconfig({}),
	},
	files: {
		'a.ts': ['a.js'],
		'b.ts': ['b.js'],
	},
});
