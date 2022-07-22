import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import semver from 'semver';
import t from 'tap';
import { Tsconfig } from 'tsconfig-type';
import readdirp from 'readdirp';
import * as source from './source.js';
import { rejects, throws } from './errors.js';

const rootTestDir = fileURLToPath(new URL('..', import.meta.url));
const { useCaseSensitiveFileNames } = source.ts.sys;
const isTscEnabled = !source.isMockingEnabled && Boolean(process.env.TEST_ENABLE_TSC);

export interface CheckResolutionOptions {
	readonly data: source.RemapTsc;
	readonly testCase: TestCase;
	readonly getPath: (file: string) => string;
	readonly fixUpActual: (file: string) => string;
	readonly fixUpExpected: (file: string) => string;
}

export interface TestCase {
	readonly t: Tap.Test;
	readonly name: string;
	readonly spec: Tap.Fixture.Spec;
	readonly paths: readonly [string, ...string[]];
	readonly getRemapTsc: () => source.RemapTsc;
	readonly loadConfig: (
		data: source.RemapTsc,
		...paths: [string, ...string[]]
	) => void;
	readonly checkResolution: (
		t: Tap.Test,
		options: CheckResolutionOptions,
	) => void | Promise<void>;
	readonly if: {
		readonly caseSensitive?: boolean;
		readonly node?: string;
		readonly typescript?: string;
		readonly vfs?: boolean;
	};
	readonly tscCompatible: boolean;
	readonly files: Record<string, readonly string[]> | undefined;
}

export function tsconfig (config: Tsconfig) {
	return JSON.stringify(config);
}

export async function runTestCase (
	file: string | URL,
	partialTestCase: Partial<TestCase>,
) {
	const testCase: TestCase = {
		t,
		name: '',
		spec: {},
		paths: ['.'],
		getRemapTsc: () => new source.RemapTsc(),
		loadConfig (data, ...paths) {
			for (const path of paths) {
				data.loadConfig(path);
			}
		},
		checkResolution,
		if: {},
		tscCompatible: true,
		files: undefined,
		...partialTestCase,
	};

	const skip = shouldSkip(testCase.if);

	await testCase.t.test(
		getTestCaseName(file, testCase),
		{
			skip,
		},
		async (t) => {
			source.mock(t);
			const dir = path.resolve(
				t.testdir({
					testdir: testCase.spec,
				}),
			);
			process.chdir(dir);

			await t.test('via absolute path', async (t) => {
				const root = path.resolve(dir, 'testdir');
				await runTestScenario(t, testCase, root);
			});

			await t.test('via relative path', async (t) => {
				const root = 'testdir';
				await runTestScenario(t, testCase, root);
			});

			if (!isTscEnabled) {
				return;
			}

			await t.test(
				'via tsc',
				{
					skip: testCase.tscCompatible
						? false
						: 'Incompatible with tsc',
				},
				async (t) => {
					if (testCase.files === undefined) {
						await rejects(t,
							runTsc(testCase, dir),
							source.RemapTscError,
						);
					} else {
						t.strictSame(
							await getTscBuildPaths(testCase, dir),
							getTestCaseBuildPaths(testCase),
							'build paths match',
						);
					}
				},
			);
		},
	);
}

function getTestCaseName (file: string | URL, { name }: TestCase) {
	const fileName = path.relative(rootTestDir, fileURLToPath(file))
		.replace(/\.js$/i, '')
		.trim();

	return name || fileName;
}

async function runTestScenario (t: Tap.Test, testCase: TestCase, root: string) {
	const data = testCase.getRemapTsc();
	const searchPaths = testCase.paths.map((searchPath) =>
		path.join(root, searchPath),
	) as [string, ...string[]];

	if (testCase.files === undefined) {
		throws(t, () => {
			testCase.loadConfig(data, ...searchPaths);
		}, source.RemapTscError);
	} else {
		testCase.loadConfig(data, ...searchPaths);

		await testCase.checkResolution(t, {
			data,
			testCase,
			getPath: (file) => path.join(root, file),
			fixUpActual: (file) =>
				normalizePathForComparison(path.relative(root, file)),
			fixUpExpected: (file) => normalizePathForComparison(file),
		});
	}
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
		if (
			!sourcePaths.has(item.path)
			&& !item.path.endsWith('.tsbuildinfo')
		) {
			buildPaths.add(item.path);
		}
	}

	return buildPaths;
}

async function runTsc (testCase: TestCase, dir: string) {
	const abortController = new AbortController();

	try {
		await Promise.all(
			testCase.paths.map(async (searchPath) =>
				execa(
					'pnpm',
					[
						'exec',
						'tsc',
						'-p',
						path.resolve(dir, 'testdir', searchPath),
					],
					{
						stdio: 'inherit',
						signal: abortController.signal,
					},
				),
			),
		);
	} finally {
		abortController.abort();
	}
}

function checkResolution (t: Tap.Test, options: CheckResolutionOptions) {
	const actualSourceFiles = new Map<string, source.SourceFile>();
	const actualOutputFiles = new Map<string, source.OutputFile>();

	for (const [key, value] of options.data.sourceFiles) {
		actualSourceFiles.set(
			options.fixUpActual(key),
			new source.SourceFile(
				[...value.outputFiles].map((file) => options.fixUpActual(file)),
			),
		);
	}

	for (const [key, value] of options.data.outputFiles) {
		actualOutputFiles.set(
			options.fixUpActual(key),
			new source.OutputFile(options.fixUpActual(value.sourceFile)),
		);
	}

	const expectedSourceFiles = new Map<string, source.SourceFile>();
	const expectedOutputFiles = new Map<string, source.OutputFile>();

	for (const [key, value] of Object.entries(options.testCase.files!)) {
		const sourceFile = new source.SourceFile(
			value.map((file) => options.fixUpExpected(file)),
		);
		expectedSourceFiles.set(options.fixUpExpected(key), sourceFile);

		for (const outputFile of sourceFile.outputFiles) {
			expectedOutputFiles.set(
				outputFile,
				new source.OutputFile(options.fixUpExpected(key)),
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

function normalizePathForComparison (filePath: string) {
	filePath = path.normalize(filePath);

	return useCaseSensitiveFileNames ? filePath : filePath.toLowerCase();
}

function shouldSkip (conditions: TestCase['if']) {
	if (
		conditions.caseSensitive !== undefined
		&& conditions.caseSensitive !== source.ts.sys.useCaseSensitiveFileNames
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
		&& !semver.satisfies(source.ts.version, conditions.typescript)
	) {
		return `TypeScript “${conditions.typescript}” required`;
	}

	if (conditions.vfs !== undefined && conditions.vfs !== source.isMockingEnabled) {
		return `Virtual file system must be ${
			conditions.vfs ? 'enabled' : 'disabled'
		}`;
	}

	return undefined;
}
