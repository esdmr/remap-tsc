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

export type ReadonlyPathMap<T> = Omit<PathMap<T>, 'set' | 'delete' | 'clear'>;

export class PathSet extends Set<string> {
	override get [Symbol.toStringTag] () {
		return PathSet.name;
	}

	override has (key: string): boolean {
		return super.has(path.resolve(key));
	}
}

export type ReadonlyPathSet = Omit<PathSet, 'add' | 'delete' | 'clear'>;
