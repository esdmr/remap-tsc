import path from 'node:path';
import ts from 'typescript';

const tsConfigFileName = 'tsconfig.json';

const defaultResolutionHost: ResolutionHost = {
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

export interface ResolutionHost {
	readonly formatDiagnostics: ts.FormatDiagnosticsHost;
	readonly parseConfig: ts.ParseConfigHost;
}

export interface ResolutionOptions {
	/**
	 * The paths in {@link sourceFiles} and {@link outputFiles} would be
	 * relative to the current working directory.
	 *
	 * @default false
	 */
	useRelativePaths?: boolean;
	/**
	 * Custom TypeScript host for non-Node.JS environments.
	 */
	host?: ResolutionHost;
	/**
	 * Working directory to resolve relative paths. It will be resolved to a
	 * absolute path first.
	 *
	 * @default process.cwd()
	 */
	workingDirectory?: string;
	/**
	 * If `noEmit` was set in the tsconfig, it would throw an error, instead of
	 * reporting no source/output files.
	 *
	 * @default true
	 */
	throwIfEmitIsDisabled?: boolean;
}

export class ResolutionError extends Error {
	override name = 'ResolutionError';

	constructor (name: string, description: string) {
		super(`${name}\n${description}`);
	}
}

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

export class ResolutionData {
	private readonly _sourceFiles = new Map<string, SourceFile>();
	private readonly _outputFiles = new Map<string, OutputFile>();
	private readonly _useRelativePaths: boolean;
	private readonly _host: ResolutionHost;
	private readonly _workingDirectory: string;
	private readonly _throwIfEmitIsDisabled: boolean;

	get sourceFiles () {
		return this._sourceFiles.entries();
	}

	get outputFiles () {
		return this._outputFiles.entries();
	}

	constructor (options: ResolutionOptions = {}) {
		this._useRelativePaths = options.useRelativePaths ?? false;
		this._host = options.host ?? defaultResolutionHost;
		this._workingDirectory = path.resolve(options.workingDirectory ?? '');
		this._throwIfEmitIsDisabled = options.throwIfEmitIsDisabled ?? true;
	}

	getSourceFile (filePath: string) {
		if (this._useRelativePaths) {
			filePath = path.relative(this._workingDirectory, filePath);
		}

		return this._sourceFiles.get(filePath);
	}

	getOutputFile (filePath: string) {
		if (this._useRelativePaths) {
			filePath = path.relative(this._workingDirectory, filePath);
		}

		return this._outputFiles.get(filePath);
	}

	loadConfig (searchPath: string) {
		const configPath = this._findConfig(
			path.resolve(this._workingDirectory, searchPath),
		);
		const configFile = ts.readConfigFile(
			configPath,
			this._host.parseConfig.readFile,
		);

		if (configFile.error) {
			throw new ResolutionError(
				'Reading the tsconfig failed',
				ts.formatDiagnostics(
					[configFile.error],
					this._host.formatDiagnostics,
				),
			);
		}

		const commandLine = ts.parseJsonConfigFileContent(
			configFile.config,
			this._host.parseConfig,
			path.dirname(configPath),
			undefined,
			configPath,
		);

		if (commandLine.errors.length > 0) {
			throw new ResolutionError(
				'Parsing the tsconfig failed',
				ts.formatDiagnostics(
					commandLine.errors,
					this._host.formatDiagnostics,
				),
			);
		}

		this._validateCommandLine(commandLine);

		if (commandLine.options.noEmit) {
			return;
		}

		for (const file of commandLine.fileNames) {
			this._addMapping(
				file,
				ts.getOutputFileNames(
					commandLine,
					file,
					!this._host.parseConfig.useCaseSensitiveFileNames,
				),
			);
		}
	}

	private _findConfig (searchPath: string) {
		const configPath = ts.findConfigFile(
			searchPath,
			this._host.parseConfig.fileExists,
			tsConfigFileName,
		);

		if (!configPath) {
			throw new ResolutionError(
				'Could not find a tsconfig file',
				`Searched in "${searchPath}".`,
			);
		}

		return path.normalize(configPath);
	}

	private _validateCommandLine (commandLine: ts.ParsedCommandLine) {
		const { noEmit, outFile, out } = commandLine.options;

		if (noEmit && this._throwIfEmitIsDisabled) {
			throw new ResolutionError(
				'Cannot map files when emit is disabled',
				'noEmit is set. You can disable this error via throwIfEmitIsDisabled.',
			);
		}

		if (outFile || out) {
			throw new ResolutionError(
				'Cannot map files with an outFile',
				'If you intend to use a outFile, use a library that can consume source maps instead.',
			);
		}
	}

	private _addMapping (input: string, outputs: readonly string[]) {
		if (outputs.length === 0) {
			return;
		}

		if (this._useRelativePaths) {
			input = path.relative(this._workingDirectory, input);
			outputs = outputs.map((file) =>
				path.relative(this._workingDirectory, file),
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
