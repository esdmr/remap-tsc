import path from 'node:path';
import ts from 'typescript';

const tsConfigFileName = 'tsconfig.json';

function isJavaScriptFile (path: string) {
	return /\.[cm]?js$/i.exec(path);
}

export class ResolutionError extends Error {
	override name = 'ResolutionError';
}

export class SourceFile {
	readonly outputFile: string;

	constructor (outputs: readonly string[]) {
		const outputFile = outputs.find((file) => isJavaScriptFile(file));

		if (!outputFile) {
			throw new ResolutionError('File does not have a JavaScript output');
		}

		this.outputFile = outputFile;
	}
}

export class OutputFile {
	constructor (readonly sourceFile: string) {}
}

export interface ResolutionHost {
	readonly formatDiagnostics: ts.FormatDiagnosticsHost;
	readonly parseConfig: ts.ParseConfigHost;
}

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

export class ResolutionData {
	private readonly _sourceFiles = new Map<string, SourceFile>();
	private readonly _outputFiles = new Map<string, OutputFile>();
	private readonly _useRelativePaths: boolean;
	private readonly _host: ResolutionHost;

	get sourceFiles (): ReadonlyMap<string, SourceFile> {
		return this._sourceFiles;
	}

	get outputFiles (): ReadonlyMap<string, OutputFile> {
		return this._outputFiles;
	}

	constructor (
		options: {
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
		} = {},
	) {
		this._useRelativePaths = options.useRelativePaths ?? false;
		this._host = options.host ?? defaultResolutionHost;
	}

	getSourceFile (filePath: string) {
		if (this._useRelativePaths) {
			filePath = path.relative('', filePath);
		}

		return this._sourceFiles.get(filePath);
	}

	getOutputFile (filePath: string) {
		if (this._useRelativePaths) {
			filePath = path.relative('', filePath);
		}

		return this._outputFiles.get(filePath);
	}

	loadConfig (searchPath: string) {
		const configPath = this.findConfig(path.resolve(searchPath));
		const configFile = ts.readConfigFile(
			configPath,
			this._host.parseConfig.readFile,
		);

		if (configFile.error) {
			throw new ResolutionError(
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
				ts.formatDiagnostics(
					commandLine.errors,
					this._host.formatDiagnostics,
				),
			);
		}

		this.validateCommandLine(commandLine);

		for (const file of commandLine.fileNames) {
			this.addMapping(
				file,
				ts.getOutputFileNames(
					commandLine,
					file,
					!this._host.parseConfig.useCaseSensitiveFileNames,
				),
			);
		}
	}

	private findConfig (searchPath: string) {
		const configPath = ts.findConfigFile(
			searchPath,
			this._host.parseConfig.fileExists,
			tsConfigFileName,
		);

		if (!configPath) {
			throw new ResolutionError('Could not find a tsconfig file.');
		}

		return path.normalize(configPath);
	}

	private validateCommandLine (commandLine: ts.ParsedCommandLine) {
		const { noEmit, emitDeclarationOnly, outFile, out }
			= commandLine.options;

		if (noEmit || emitDeclarationOnly) {
			throw new ResolutionError('Cannot map files when emit is disabled');
		}

		if (outFile || out) {
			throw new ResolutionError('Cannot map files with an outFile');
		}
	}

	private addMapping (input: string, outputs: readonly string[]) {
		if (this._useRelativePaths) {
			input = path.relative('', input);
			outputs = outputs.map((file) => path.relative('', file));
		}

		if (this._sourceFiles.has(input)) {
			throw new ResolutionError('This input was already processed');
		}

		const sourceFile = new SourceFile(outputs);

		if (this._outputFiles.has(sourceFile.outputFile)) {
			throw new ResolutionError(
				'Multiple sources emit to the same output file',
			);
		}

		this._sourceFiles.set(input, sourceFile);
		this._outputFiles.set(sourceFile.outputFile, new OutputFile(input));
	}
}
