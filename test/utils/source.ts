import process from 'node:process';
import type EventEmitter from 'node:events';
import mockFs from 'mock-fs';

declare global {
	// Internally, `Tap.Test` is a `EventEmitter`, but this fact is not
	// reflected in the type definitions. We need the `EventEmitter` aspect of
	// it to detect when to stop mocking the file system.
	//
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Tap {
		interface Test extends EventEmitter {}
	}
}

export const isMockingEnabled = !process.env.TEST_DISABLE_VFS;
let shouldMock = false;

export const mock = isMockingEnabled
	? (t: Tap.Test) => {
		shouldMock = true;
		mockFs();

		// This runs before the fixture teardown.
		t.teardown(() => {
			shouldMock = false;
		});

		// This runs after the fixture teardown.
		t.once('teardown', () => {
			// This handles a race condition: The next test starts before
			// the previous test teardown.
			if (shouldMock) {
				console.warn('Skipped restoring the file system.');
			} else {
				mockFs.restore();
			}
		});
	}
	: () => {
		// Do nothing.
	};

export * from '@esdmr/remap-tsc';
export { default as ts } from 'typescript';
