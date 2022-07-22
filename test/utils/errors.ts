export function throws (
	t: Tap.Test,
	fn: () => any,
	Error: new (...args: any[]) => Error,
) {
	try {
		fn();
		return t.fail('expected to throw');
	} catch (error) {
		return t.ok(error instanceof Error, `expected the error to be ${Error.name}`);
	}
}

export async function rejects (
	t: Tap.Test,
	promise: Promise<any>,
	Error: new (...args: any[]) => Error,
) {
	try {
		await promise;
		return t.fail('expected to reject');
	} catch (error) {
		return t.ok(error instanceof Error, `expected the error to be ${Error.name}`);
	}
}
