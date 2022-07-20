import { path, ts } from './imports.js';
import { getPreferences, Options, Preferences } from './options.js';
import { RemapTscError } from './errors.js';
import { validateCommandLine, validateFile } from './validators.js';

export class SourceFile {
	readonly javaScriptFile: string | undefined;
	readonly declarationFile: string | undefined;
	readonly sourceMapFiles: ReadonlySet<string>;
	readonly outputFiles: ReadonlySet<string>;

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

		this.sourceMapFiles = sourceMapFiles;
		this.outputFiles = new Set(outputFiles);
	}
}

export class OutputFile {
	constructor (readonly sourceFile: string) {}
}

export class RemapTsc {
	private readonly _sourceFiles = new Map<string, SourceFile>();
	private readonly _outputFiles = new Map<string, OutputFile>();
	private readonly _preferences: Preferences;

	get sourceFiles () {
		return this._sourceFiles.entries();
	}

	get outputFiles () {
		return this._outputFiles.entries();
	}

	constructor (options: Options = {}) {
		this._preferences = getPreferences(options);
	}

	getSourceFile (filePath: string) {
		return this._sourceFiles.get(path.resolve(filePath));
	}

	getOutputFile (filePath: string) {
		return this._outputFiles.get(path.resolve(filePath));
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
			effectiveRoot = path.resolve(path.dirname(configPath), rootDir ?? '.');
		}

		for (const fileName of commandLine.fileNames) {
			validateFile(fileName, effectiveRoot, this._preferences);

			if (commandLine.options.noEmit) {
				continue;
			}

			this._addMapping(
				fileName,
				ts.getOutputFileNames(
					commandLine,
					fileName,
					!this._preferences.host.parseConfig.useCaseSensitiveFileNames,
				),
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

export type { Options as TscRemapOptions, Host as TscRemapHost } from './options.js';
export { RemapTscError } from './errors.js';
