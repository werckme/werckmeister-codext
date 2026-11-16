import * as path from 'path';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
		// --no-sandbox: the downloaded test instance has no root owned chrome-sandbox helper
		// --disable-extensions: don't let installed extensions interfere with the tests
		// --user-data-dir: allows running the tests while another VS Code instance is open
		const userDataDir = path.resolve(extensionDevelopmentPath, '.vscode-test/user-data');
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: ['--no-sandbox', '--disable-extensions', `--user-data-dir=${userDataDir}`],
		});
	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
