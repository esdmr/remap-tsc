import path from 'node:path';
import { ReadonlyPathMap } from './source.js';

export default async function testReadonlyPathMap<T> (t: Tap.Test, instance: ReadonlyPathMap<T>) {
	await t.test('is a valid ReadonlyPathMap', async (t) => {
		t.equal(instance[Symbol.toStringTag], 'PathMap', '@@toStringTag');

		t.equal(typeof instance[Symbol.iterator], 'function', 'typeof @@iterator');

		let size = 0;

		for (const [file, value] of instance) {
			const relative = path.relative('', file);
			size++;

			await t.test(relative, async (t) => {
				t.equal(instance.get(relative), value, 'get');
				t.ok(instance.has(relative), 'has');
			});
		}

		t.equal(instance.size, size, 'size');
	});
}
