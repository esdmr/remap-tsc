import { RemapTscError } from './errors.js';
import { path, ts } from './imports.js';
import { getPreferences, Options, Preferences } from './options.js';
import { PathMap, PathSet, ReadonlyPathMap, ReadonlyPathSet } from './path.js';
import { validateCommandLine, validateFile } from './validators.js';

export class SourceFile {
	readonly javaScriptFile: string | undefined;
	readonly declarationFile: string | undefined;
	readonly sourceMapFiles: ReadonlyPathSet;
	readonly outputFiles: ReadonlyPathSet;

	get [Symbol.toStringTag] () {
		return SourceFile.name;
	}

	/** @internal */
	constructor (outputFiles: readonly string[]) {
		const sourceMapFiles = new Set<string>();

		for (const path of outputFiles) {
			if (/\.[cm]?js$/i.exec(path) !== null) {
				this.javaScriptFile = path;
			} else if (/\.d\.[cm]?ts$/i.exec(path) !== null) {
				this.declarationFile = path;
			} else if (/\.map$/i.exec(path) !== null) {
				sourceMapFiles.add(path);
			}
		}

		this.sourceMapFiles = new PathSet(sourceMapFiles);
		this.outputFiles = new PathSet(outputFiles);

		Object.defineProperties(this, {
			javaScriptFile: {
				writable: false,
				configurable: false,
			},
			declarationFile: {
				writable: false,
				configurable: false,
			},
			sourceMapFiles: {
				writable: false,
				configurable: false,
			},
			outputFiles: {
				writable: false,
				configurable: false,
			},
		});
	}
}

export class OutputFile {
	get [Symbol.toStringTag] () {
		return OutputFile.name;
	}

	/** @internal */
	constructor (readonly sourceFile: string) {
		Object.defineProperty(this, 'sourceFile', {
			writable: false,
			configurable: false,
		});
	}
}

export class RemapTsc {
	private readonly _sourceFiles = new PathMap<SourceFile>();
	private readonly _outputFiles = new PathMap<OutputFile>();
	private readonly _preferences: Preferences;

	get sourceFiles (): ReadonlyPathMap<SourceFile> {
		return this._sourceFiles;
	}

	get outputFiles (): ReadonlyPathMap<OutputFile> {
		return this._outputFiles;
	}

	get [Symbol.toStringTag] () {
		return RemapTsc.name;
	}

	constructor (options: Options = {}) {
		this._preferences = getPreferences(options);

		Object.defineProperties(this, {
			_sourceFiles: {
				writable: false,
				enumerable: false,
				configurable: false,
			},
			_outputFiles: {
				writable: false,
				enumerable: false,
				configurable: false,
			},
			_preferences: {
				writable: false,
				enumerable: false,
				configurable: false,
			},
		});
	}

	clear () {
		this._sourceFiles.clear();
		this._outputFiles.clear();
	}

	loadConfig (projectPath: string) {
		const configPath = this._findConfig(projectPath);
		const configFile = ts.readConfigFile(
			configPath,
			this._preferences.host.parseConfig.readFile,
		);

		if (configFile.error) {
			throw new RemapTscError(
				'Reading the tsconfig failed.',
				ts.formatDiagnostics(
					[configFile.error],
					this._preferences.host.formatDiagnostics,
				),
			);
		}

		const commandLine = ts.parseJsonConfigFileContent(
			configFile.config,
			this._preferences.host.parseConfig,
			path.dirname(configPath),
			undefined,
			configPath,
		);

		if (commandLine.errors.length > 0) {
			throw new RemapTscError(
				'Parsing the tsconfig failed.',
				ts.formatDiagnostics(
					commandLine.errors,
					this._preferences.host.formatDiagnostics,
				),
			);
		}

		validateCommandLine(commandLine);

		const { composite, rootDir } = commandLine.options;
		let effectiveRoot: string | undefined;

		// If composite is set, the default [rootDir] is […] the directory
		// containing the tsconfig.json file.
		if (composite || rootDir !== undefined) {
			effectiveRoot = path.resolve(
				path.dirname(configPath),
				rootDir ?? '.',
			);
		}

		for (const fileName of commandLine.fileNames) {
			validateFile(fileName, effectiveRoot, this._preferences);

			if (commandLine.options.noEmit) {
				continue;
			}

			this._addMapping(
				path.normalize(fileName),
				ts.getOutputFileNames(
					commandLine,
					fileName,
					!this._preferences.host.parseConfig.useCaseSensitiveFileNames,
				).map((file) => path.normalize(file)),
			);
		}
	}

	private _findConfig (projectPath: string) {
		projectPath = path.resolve(projectPath);

		if (this._preferences.host.parseConfig.fileExists(projectPath)) {
			return projectPath;
		}

		const configPath = path.join(projectPath, 'tsconfig.json');

		if (this._preferences.host.parseConfig.fileExists(configPath)) {
			return configPath;
		}

		throw new RemapTscError(
			'Could not find a tsconfig file.',
			`Searched in "${projectPath}".`,
		);
	}

	private _addMapping (input: string, outputs: readonly string[]) {
		if (outputs.length === 0) {
			return;
		}

		if (outputs.includes(input)) {
			throw new RemapTscError(
				'TS5055: Cannot write file because it would overwrite input file.',
				`The input file is at "${input}".`,
			);
		}

		const oldSourceFile = this._sourceFiles.get(input);

		if (oldSourceFile !== undefined) {
			outputs = [...oldSourceFile.outputFiles, ...outputs];
		}

		const sourceFile = new SourceFile(outputs);
		this._sourceFiles.set(input, sourceFile);

		for (const outputFile of sourceFile.outputFiles) {
			this._outputFiles.set(outputFile, new OutputFile(input));
		}
	}
}

Object.defineProperties(RemapTsc.prototype, {
	sourceFiles: {
		enumerable: true,
		configurable: false,
	},
	outputFiles: {
		enumerable: true,
		configurable: false,
	},
});

export { RemapTscError } from './errors.js';
export type { Host as TscRemapHost, Options as TscRemapOptions } from './options.js';
export type { ReadonlyPathMap, ReadonlyPathSet } from './path.js';
