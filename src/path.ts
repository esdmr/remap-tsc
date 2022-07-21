import { path } from './imports.js';

export function isPathUnderRoot (root: string, file: string) {
	const relative = path.relative(root, file);

	return (
		Boolean(relative)
		&& relative.split(path.sep, 1)[0] !== '..'
		&& !path.isAbsolute(relative)
	);
}

export class PathMap<T> extends Map<string, T> {
	override get [Symbol.toStringTag] () {
		return PathMap.name;
	}

	override get (key: string): T | undefined {
		return super.get(path.resolve(key));
	}

	override has (key: string): boolean {
		return super.has(path.resolve(key));
	}
}

export type ReadonlyPathMap<T> = ReadonlyMap<string, T>;

// This is a constructor, not a variable.
//
// eslint-disable-next-line @typescript-eslint/naming-convention
const ReadonlySet: new <T>(iterable: Iterable<T>) => ReadonlySet<T> = Set;

export class ReadonlyPathSet extends ReadonlySet<string> {
	override get [Symbol.toStringTag] () {
		return ReadonlyPathSet.name;
	}

	override has (key: string): boolean {
		return super.has(path.resolve(key));
	}
}
