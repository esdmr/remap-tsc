import { ts } from './imports.js';
import { RemapTscError } from './errors.js';
import { Preferences } from './options.js';
import { isPathUnderRoot } from './path.js';

export function validateCommandLine (commandLine: ts.ParsedCommandLine) {
	const {
		composite,
		declaration,
		emitDeclarationOnly,
		inlineSourceMap,
		out,
		outFile,
		sourceMap,
	} = commandLine.options;

	if (outFile || out) {
		throw new RemapTscError(
			'Cannot map files with an outFile.',
			'If you intend to use an outFile, use a library that can consume source maps instead.',
		);
	}

	if (sourceMap && inlineSourceMap) {
		throw new RemapTscError(
			'TS5053: Option sourceMap cannot be specified with option inlineSourceMap.',
			'sourceMap and inlineSourceMap are mutually exclusive.',
		);
	}

	if (emitDeclarationOnly && !declaration && !composite) {
		throw new RemapTscError(
			'TS5069: Option emitDeclarationOnly cannot be specified without specifying option declaration or option composite.',
			'emitDeclarationOnly requires declarations to be emitted.',
		);
	}
}

export function validateFile (
	fileName: string,
	effectiveRoot: string | undefined,
	preferences: Preferences,
) {
	if (!preferences.host.parseConfig.fileExists(fileName)) {
		throw new RemapTscError(
			'TS6053: File not found.',
			`The file would have been at "${fileName}". All specified files must exist.`,
		);
	}

	if (
		effectiveRoot !== undefined
		&& !isPathUnderRoot(effectiveRoot, fileName)
	) {
		throw new RemapTscError(
			'TS6059: File is not under rootDir.',
			`The file is at "${fileName}" and the rootDir is at "${effectiveRoot}". rootDir is expected to contain all source files.`,
		);
	}
}
