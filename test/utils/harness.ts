import path from 'node:path';
import process from 'node:process';
import { execa } from 'execa';
import semver from 'semver';
import { test } from 'tap';
import { Tsconfig } from 'tsconfig-type';
import readdirp from 'readdirp';
import { OutputFile, TscRemap, SourceFile, ts, mock, isMockingEnabled, RemapOptions } from './source.js';

const isTscEnabled = !isMockingEnabled && Boolean(process.env.TEST_ENABLE_TSC);

export interface TestCase {
	readonly spec: Tap.Fixture.Spec;
	readonly path: string;
	readonly if?: {
		readonly caseSensitive?: boolean;
		readonly node?: string;
		readonly typescript?: string;
		readonly vfs?: boolean;
		readonly tsc?: boolean;
	};
	readonly files?: Files;
}

export type Files = Record<string, readonly string[]>;

export function tsconfig (config: Tsconfig) {
	return JSON.stringify(config);
}

export async function runTestCase (file: string | URL, testCase: TestCase, remapOptions: RemapOptions = {}) {
	const pass = testCase.files !== undefined;
	const skip = shouldSkip(testCase.if);
	const url = new URL(file);

	await test(
		path.basename(url.pathname).replace(/\.js$/i, '').trim()
			+ (url.hash ? '#' + decodeURIComponent(url.hash.slice(1)) : ''),
		{
			skip,
		},
		async (t) => {
			mock(t);
			const dir = path.resolve(t.testdir({
				testdir: testCase.spec,
			}));

			await t.test('via absolute path', async (t) => {
				const data = new TscRemap({
					useRelativePaths: true,
					...remapOptions,
				});
				const root = path.resolve(dir, 'testdir');
				const searchPath = path.join(root, testCase.path);

				if (pass) {
					data.loadConfig(searchPath);

					checkResolution(
						t,
						data,
						testCase.files,
						(file) => path.relative(root, file),
						(file) => path.normalize(file),
					);
				} else {
					t.throws(() => {
						data.loadConfig(searchPath);
					}, 'project should error');
				}
			});

			await t.test('via relative indirect path', async (t) => {
				process.chdir(dir);
				const data = new TscRemap({
					useRelativePaths: true,
					...remapOptions,
				});
				const searchPath = path.join('testdir', testCase.path);

				if (pass) {
					data.loadConfig(searchPath);

					checkResolution(
						t,
						data,
						testCase.files,
						(file) => path.relative('testdir', file),
						(file) => path.normalize(file),
					);
				} else {
					t.throws(() => {
						data.loadConfig(searchPath);
					}, 'project should error');
				}
			});

			await t.test('via relative direct path', async (t) => {
				process.chdir(path.join(dir, 'testdir'));

				let projectDir: string;
				let projectPath: string;

				if (ts.sys.fileExists(testCase.path)) {
					projectDir = path.dirname(testCase.path);
					projectPath = path.basename(testCase.path);
				} else if (ts.sys.directoryExists(testCase.path)) {
					projectDir = testCase.path;
					projectPath = '.';
				} else {
					throw new Error('Test case path is neither a file nor a directory');
				}

				process.chdir(projectDir);
				const data = new TscRemap({
					useRelativePaths: true,
					...remapOptions,
				});

				if (pass) {
					data.loadConfig(projectPath);

					checkResolution(
						t,
						data,
						testCase.files,
						(file) => path.relative('', file),
						(file) => path.relative(projectDir, file),
					);
				} else {
					t.throws(() => {
						data.loadConfig(projectPath);
					}, 'project should error');
				}
			});

			if (isTscEnabled) {
				await t.test('via tsc', async (t) => {
					if (pass) {
						t.strictSame(
							await getTscBuildPaths(testCase, dir),
							getTestCaseBuildPaths(testCase),
							'build paths match',
						);
					} else {
						await t.rejects(runTsc(testCase, dir), 'tsc should error');
					}
				});
			}
		},
	);
}

function getTestCaseBuildPaths (testCase: TestCase) {
	const buildPaths = new Set<string>();

	for (const files of Object.values(testCase.files!)) {
		for (const file of files) {
			buildPaths.add(path.normalize(file));
		}
	}

	return buildPaths;
}

async function getTscBuildPaths (testCase: TestCase, dir: string) {
	const sourcePaths = new Set<string>();

	for await (const item of readdirp(path.resolve(dir, 'testdir'))) {
		sourcePaths.add(item.path);
	}

	await runTsc(testCase, dir);
	const buildPaths = new Set<string>();

	for await (const item of readdirp(path.resolve(dir, 'testdir'))) {
		if (!sourcePaths.has(item.path) && !item.path.endsWith('.tsbuildinfo')) {
			buildPaths.add(item.path);
		}
	}

	return buildPaths;
}

async function runTsc (testCase: TestCase, dir: string) {
	return execa('pnpm', ['exec', 'tsc', '-p', path.resolve(dir, 'testdir', testCase.path)], {
		stdio: 'inherit',
	});
}

function checkResolution (
	t: Tap.Test,
	data: TscRemap,
	files: Files,
	fixUpActual: (file: string) => string,
	fixUpExpected: (file: string) => string,
) {
	if (!ts.sys.useCaseSensitiveFileNames) {
		const originalFixUpActual = fixUpActual;
		fixUpActual = (file) => originalFixUpActual(file).toLowerCase();

		const originalFixUpExpected = fixUpExpected;
		fixUpExpected = (file) => originalFixUpExpected(file).toLowerCase();
	}

	const actualSourceFiles = new Map<string, SourceFile>();
	const actualOutputFiles = new Map<string, OutputFile>();

	for (const [key, value] of data.sourceFiles) {
		actualSourceFiles.set(
			fixUpActual(key),
			new SourceFile(
				[...value.outputFiles].map((file) => fixUpActual(file)),
			),
		);
	}

	for (const [key, value] of data.outputFiles) {
		actualOutputFiles.set(
			fixUpActual(key),
			new OutputFile(fixUpActual(value.sourceFile)),
		);
	}

	const expectedSourceFiles = new Map<string, SourceFile>();
	const expectedOutputFiles = new Map<string, OutputFile>();

	for (const [key, value] of Object.entries(files)) {
		const sourceFile = new SourceFile(
			value.map((file) => fixUpExpected(file)),
		);
		expectedSourceFiles.set(fixUpExpected(key), sourceFile);

		for (const outputFile of sourceFile.outputFiles) {
			expectedOutputFiles.set(
				outputFile,
				new OutputFile(fixUpExpected(key)),
			);
		}
	}

	t.strictSame(
		{
			sourceFiles: actualSourceFiles,
			outputFiles: actualOutputFiles,
		},
		{
			sourceFiles: expectedSourceFiles,
			outputFiles: expectedOutputFiles,
		},
		'resolution matches',
	);
}

function shouldSkip (conditions: TestCase['if'] = {}) {
	if (
		conditions.caseSensitive !== undefined
		&& conditions.caseSensitive !== ts.sys.useCaseSensitiveFileNames
	) {
		return `${
			conditions.caseSensitive ? 'case-sensitive' : 'case-insensitive'
		} file system required`;
	}

	if (
		conditions.node !== undefined
		&& !semver.satisfies(process.versions.node, conditions.node)
	) {
		return `Node.JS “${conditions.node}” required`;
	}

	if (
		conditions.typescript !== undefined
		&& !semver.satisfies(ts.version, conditions.typescript)
	) {
		return `TypeScript “${conditions.typescript}” required`;
	}

	if (
		conditions.vfs !== undefined
		&& conditions.vfs !== isMockingEnabled
	) {
		return `Virtual file system must be ${
			conditions.vfs ? 'enabled' : 'disabled'
		}`;
	}

	if (
		conditions.tsc !== undefined
		&& conditions.tsc !== isTscEnabled
	) {
		return `tsc must be ${
			conditions.vfs ? 'enabled' : 'disabled'
		}`;
	}

	return undefined;
}
