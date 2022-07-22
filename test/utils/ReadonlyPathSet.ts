import path from 'node:path';
import { ReadonlyPathSet } from './source.js';

export default async function testReadonlyPathSet (t: Tap.Test, instance: ReadonlyPathSet) {
	await t.test('is a valid ReadonlyPathSet', async (t) => {
		t.equal(instance[Symbol.toStringTag], 'PathSet', '@@toStringTag');

		t.equal(typeof instance[Symbol.iterator], 'function', 'typeof @@iterator');

		let size = 0;

		for (const file of instance) {
			const relative = path.relative('', file);
			size++;

			t.ok(instance.has(relative), `has('${relative}')`);
		}

		t.equal(instance.size, size, 'size');
	});
}
