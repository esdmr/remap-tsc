export class RemapTscError extends Error {
	override name = RemapTscError.name;

	constructor (...lines: readonly [string, string?]) {
		super(lines.join('\n'));
	}
}
