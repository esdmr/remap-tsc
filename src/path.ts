import { path } from './imports.js';

export function isPathUnderRoot (root: string, file: string) {
	const relative = path.relative(root, file);

	return Boolean(relative) && relative.split(path.sep, 1)[0] !== '..' && !path.isAbsolute(relative);
}
