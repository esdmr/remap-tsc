#!/usr/bin/env node
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { execa } from 'execa';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
	console.log(`\
Usage: node scripts/build-server.js [options]

Options:
--tsc         Run tsc in the background
--watch       Watch for changes`);
}

const shouldWatch = process.argv.includes('--watch');
const shouldRunTsc = process.argv.includes('--tsc');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
	absWorkingDir: resolvePath('..'),
	platform: 'node',
	watch: shouldWatch,
	minify: true,
	keepNames: true,
	sourcemap: true,
	sourcesContent: false,
	plugins: [nodeExternalsPlugin()],
	target: 'node14',
};

const esmResult = await build({
	...buildOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.js',
	format: 'esm',
});

const cjsResult = await build({
	...buildOptions,
	entryPoints: ['src/index.ts'],
	outfile: 'build/index.cjs',
	format: 'cjs',
});

/** @type {import('execa').ExecaChildProcess | undefined} */
let tscResult;

if (shouldRunTsc) {
	/** @type {string[]} */
	const options = ['exec', 'tsc', '-b', '--preserveWatchOutput'];

	if (shouldWatch) {
		options.push('-w');
	}

	tscResult = execa('pnpm', options, {
		cwd: resolvePath('..'),
		stdio: 'inherit',
	});

	if (!shouldWatch) {
		await tscResult;
	}
}

if (shouldWatch) {
	console.log('Watching for changes…');

	process.once('SIGINT', () => {
		console.log('\rStopping…');
		esmResult.stop?.();
		cjsResult.stop?.();
		tscResult?.kill();
		process.exit(0);
	});
}

/** @param {string} path */
function resolvePath (path) {
	return fileURLToPath(new URL(path, import.meta.url));
}
