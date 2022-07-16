import path from 'node:path';
import ts from 'typescript';

const defaultRemapHost: RemapHost = {
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

export interface RemapHost {
	readonly formatDiagnostics: ts.FormatDiagnosticsHost;
	readonly parseConfig: ts.ParseConfigHost;
}

export interface RemapOptions {
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
	host?: RemapHost;
	/**
	 * Working directory to resolve relative paths. It will be resolved to an
	 * absolute path first.
	 *
	 * @default process.cwd()
	 */
	workingDirectory?: string;
	/**
	 * Since the entire point of {@link TscRemap} is to map source/output files,
	 * it would be useless if there are no output. Nevertheless, by disabling
	 * this flag, loading a tsconfig with `noEmit` would return silently without
	 * adding any source/output file.
	 *
	 * @default true
	 */
	throwIfEmitIsDisabled?: boolean;
	/**
	 * The tsconfig would be contained within the search path. Otherwise, a
	 * tsconfig may be found at any upper directory.
	 *
	 * @default true
	 */
	searchPathIsRoot?: boolean;
}

export class RemapError extends Error {
	override name = RemapError.name;

	constructor (...lines: readonly [string, string?]) {
		super(lines.join('\n'));
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

function isPathUnderRoot (root: string, file: string) {
	const relative = path.relative(root, file);

	return relative && relative.split(path.sep, 1)[0] !== '..' && !path.isAbsolute(relative);
}

export class TscRemap {
	private readonly _sourceFiles = new Map<string, SourceFile>();
	private readonly _outputFiles = new Map<string, OutputFile>();
	private readonly _options: Required<RemapOptions>;

	get sourceFiles () {
		return this._sourceFiles.entries();
	}

	get outputFiles () {
		return this._outputFiles.entries();
	}

	constructor (options: RemapOptions = {}) {
		this._options = {
			useRelativePaths: false,
			host: defaultRemapHost,
			throwIfEmitIsDisabled: true,
			searchPathIsRoot: true,
			...options,
			workingDirectory: path.resolve(options.workingDirectory ?? ''),
		};
	}

	getSourceFile (filePath: string) {
		if (this._options.useRelativePaths) {
			filePath = path.relative(this._options.workingDirectory, filePath);
		}

		return this._sourceFiles.get(filePath);
	}

	getOutputFile (filePath: string) {
		if (this._options.useRelativePaths) {
			filePath = path.relative(this._options.workingDirectory, filePath);
		}

		return this._outputFiles.get(filePath);
	}

	loadConfig (searchPath: string) {
		const configPath = this._findConfig(
			path.resolve(this._options.workingDirectory, searchPath),
		);
		const configFile = ts.readConfigFile(
			configPath,
			this._options.host.parseConfig.readFile,
		);

		if (configFile.error) {
			throw new RemapError(
				'Reading the tsconfig failed.',
				ts.formatDiagnostics(
					[configFile.error],
					this._options.host.formatDiagnostics,
				),
			);
		}

		const commandLine = ts.parseJsonConfigFileContent(
			configFile.config,
			this._options.host.parseConfig,
			path.dirname(configPath),
			undefined,
			configPath,
		);

		if (commandLine.errors.length > 0) {
			throw new RemapError(
				'Parsing the tsconfig failed.',
				ts.formatDiagnostics(
					commandLine.errors,
					this._options.host.formatDiagnostics,
				),
			);
		}

		this._validateCommandLine(commandLine);

		if (commandLine.options.noEmit) {
			return;
		}

		const { composite, rootDir } = commandLine.options;
		let effectiveRoot: string | undefined;

		// If composite is set, the default [rootDir] is […] the directory
		// containing the tsconfig.json file.
		if (composite || rootDir !== undefined) {
			effectiveRoot = path.resolve(path.dirname(configPath), rootDir ?? '.');
		}

		for (const fileName of commandLine.fileNames) {
			this._validateFile(fileName, effectiveRoot);

			this._addMapping(
				fileName,
				ts.getOutputFileNames(
					commandLine,
					fileName,
					!this._options.host.parseConfig.useCaseSensitiveFileNames,
				),
			);
		}
	}

	private _findConfig (searchPath: string) {
		const configPath = ts.findConfigFile(
			searchPath,
			this._options.host.parseConfig.fileExists,
		);

		const formattedSearchPath = this._options.useRelativePaths
			? path.relative(this._options.workingDirectory, searchPath) || '.'
			: searchPath;

		if (!configPath) {
			throw new RemapError(
				'Could not find a tsconfig file.',
				`Searched in "${formattedSearchPath}".`,
			);
		}

		const formattedConfigPath = this._options.useRelativePaths
			? path.relative(this._options.workingDirectory, configPath)
			: configPath;

		if (
			this._options.searchPathIsRoot
			&& !isPathUnderRoot(searchPath, configPath)
		) {
			throw new RemapError(
				'Found tsconfig file is not under the search path.',
				`Searched in "${formattedSearchPath}" and found a tsconfig at "${formattedConfigPath}".`,
			);
		}

		return path.normalize(configPath);
	}

	private _validateCommandLine (commandLine: ts.ParsedCommandLine) {
		const {
			composite,
			declaration,
			emitDeclarationOnly,
			inlineSourceMap,
			noEmit,
			out,
			outFile,
			sourceMap,
		} = commandLine.options;

		if (noEmit && this._options.throwIfEmitIsDisabled) {
			throw new RemapError(
				'Cannot map files when emit is disabled.',
				'noEmit is set. (You can disable this error via throwIfEmitIsDisabled.)',
			);
		}

		if (outFile || out) {
			throw new RemapError(
				'Cannot map files with an outFile.',
				'If you intend to use an outFile, use a library that can consume source maps instead.',
			);
		}

		if (sourceMap && inlineSourceMap) {
			throw new RemapError(
				'TS5053: Option sourceMap cannot be specified with option inlineSourceMap.',
				'sourceMap and inlineSourceMap are mutually exclusive.',
			);
		}

		if (emitDeclarationOnly && !declaration && !composite) {
			throw new RemapError(
				'TS5069: Option emitDeclarationOnly cannot be specified without specifying option declaration or option composite.',
				'emitDeclarationOnly requires declarations to be emitted.',
			);
		}
	}

	private _validateFile (fileName: string, effectiveRoot: string | undefined) {
		const formattedFileName = this._options.useRelativePaths
			? path.relative(this._options.workingDirectory, fileName)
			: fileName;

		if (!ts.sys.fileExists(fileName)) {
			throw new RemapError(
				'TS6053: File not found.',
				`The file would have been at "${formattedFileName}". All specified files must exist.`,
			);
		}

		if (effectiveRoot !== undefined && !isPathUnderRoot(effectiveRoot, fileName)) {
			const formattedRoot = this._options.useRelativePaths
				? path.relative(this._options.workingDirectory, effectiveRoot) || '.'
				: effectiveRoot;

			throw new RemapError(
				'TS6059: File is not under rootDir.',
				`The file is at "${formattedFileName}" and the rootDir is at "${formattedRoot}". rootDir is expected to contain all source files.`,
			);
		}
	}

	private _addMapping (input: string, outputs: readonly string[]) {
		if (outputs.length === 0) {
			return;
		}

		if (this._options.useRelativePaths) {
			input = path.relative(this._options.workingDirectory, input);
			outputs = outputs.map((file) =>
				path.relative(this._options.workingDirectory, file),
			);
		}

		if (outputs.includes(input)) {
			throw new RemapError(
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
