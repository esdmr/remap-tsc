import path from 'node:path';
import process from 'node:process';
import semver from 'semver';
import { test } from 'tap';
import { Tsconfig } from 'tsconfig-type';
import { OutputFile, ResolutionData, SourceFile, ts, mock } from './source.js';

export interface TestCase {
	readonly spec: Tap.Fixture.Spec;
	readonly path: string;
	readonly if?: {
		readonly 'case-sensitive'?: boolean;
		readonly node?: string;
		readonly typescript?: string;
	};
	readonly files: Files;
}

export type Files = Record<string, readonly string[]>;

export function tsconfig (config: Tsconfig) {
	return JSON.stringify(config);
}

export async function runTestCase (url: string, json: TestCase) {
	const pass = Object.keys(json.files).length > 0;
	const skip = shouldSkip(json.if);

	await test(path.basename(url).replace(/\.js$/i, ''), {
		skip,
	}, async (t) => {
		mock(t);
		const dir = t.testdir({
			testdir: json.spec,
		});

		await t.test('absolute', async (t) => {
			const data = new ResolutionData({
				useRelativePaths: true,
			});
			const root = path.resolve(dir, 'testdir');
			const searchPath = path.join(root, json.path);

			if (pass) {
				data.loadConfig(searchPath);

				checkResolution(
					t,
					data,
					json.files,
					(file) => path.relative(root, file),
					String,
				);
			} else {
				t.throws(() => {
					data.loadConfig(searchPath);
				}, 'project should error');
			}
		});

		await t.test('relative indirect', async (t) => {
			process.chdir(dir);
			const data = new ResolutionData({
				useRelativePaths: true,
			});
			const searchPath = path.join('testdir', json.path);

			if (pass) {
				data.loadConfig(searchPath);

				checkResolution(
					t,
					data,
					json.files,
					(file) => path.relative('testdir', file),
					String,
				);
			} else {
				t.throws(() => {
					data.loadConfig(searchPath);
				}, 'project should error');
			}
		});

		await t.test('relative direct', async (t) => {
			process.chdir(path.join(dir, 'testdir', json.path));
			const data = new ResolutionData({
				useRelativePaths: true,
			});

			if (pass) {
				data.loadConfig('.');

				checkResolution(t, data, json.files, String, (file) =>
					path.relative(json.path, file),
				);
			} else {
				t.throws(() => {
					data.loadConfig('.');
				}, 'project should error');
			}
		});
	});
}

function checkResolution (
	t: Tap.Test,
	data: ResolutionData,
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
			new SourceFile([fixUpActual(value.outputFile)]),
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
		const sourceFile = new SourceFile(value.map((file) => fixUpExpected(file)));
		expectedSourceFiles.set(fixUpExpected(key), sourceFile);
		expectedOutputFiles.set(
			sourceFile.outputFile,
			new OutputFile(fixUpExpected(key)),
		);
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
	if (conditions['case-sensitive'] !== undefined && conditions['case-sensitive'] !== ts.sys.useCaseSensitiveFileNames) {
		return `${conditions['case-sensitive'] ? 'case-sensitive' : 'case-insensitive'} file system required`;
	}

	if (conditions.node !== undefined && !semver.satisfies(process.versions.node, conditions.node)) {
		return `Node.JS “${conditions.node}” required`;
	}

	if (conditions.typescript !== undefined && !semver.satisfies(ts.version, conditions.typescript)) {
		return `TypeScript “${conditions.typescript}” required`;
	}

	return undefined;
}
