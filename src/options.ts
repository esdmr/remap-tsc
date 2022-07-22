import { ts } from './imports.js';

const defaultHost: Host = {
	formatDiagnostics: {
		getCanonicalFileName: (path) => path,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		getNewLine: () => ts.sys.newLine,
	},
	parseConfig: {
		fileExists: ts.sys.fileExists,
		readDirectory: ts.sys.readDirectory,
		readFile: ts.sys.readFile,
		useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
	},
};

export function getPreferences (options: Options): Preferences {
	return {
		host: defaultHost,
		...options,
	};
}

export interface Host {
	readonly formatDiagnostics: ts.FormatDiagnosticsHost;
	readonly parseConfig: ts.ParseConfigHost;
}

export interface Options {
	/**
	 * Custom TypeScript host for non-Node.JS environments.
	 */
	host?: Host;
}

export type Preferences = Required<Options>;
