import * as assert from 'assert';
import * as vscode from 'vscode';
import { WMCommandTransposeOctaveUp, WMCommandTransposeOctaveDown } from '../../extension';

/**
 * Integration tests for the "transpose selection one octave up/down" commands.
 * The detailed cases are tested in packages/werckmeister-parser/test/transpose.test.ts,
 * here we test the editor integration (selection handling, applying the edits).
 *
 * `«` and `»` mark a selection, `|` an empty selection (cursor) is not used because
 * `|` is a bar line in werckmeister.
 */
function parseMarked(marked: string): { text: string, selections: Array<[number, number]> } {
	const selections: Array<[number, number]> = [];
	let text = '';
	let start = -1;
	for (const c of marked) {
		if (c === '«') {
			start = text.length;
		} else if (c === '»') {
			selections.push([start, text.length]);
		} else {
			text += c;
		}
	}
	return { text, selections };
}

async function run(command: string, marked: string): Promise<string> {
	const { text, selections } = parseMarked(marked);
	const document = await vscode.workspace.openTextDocument({ language: 'werckmeister', content: text });
	const editor = await vscode.window.showTextDocument(document);
	editor.selections = selections.map(([a, b]) => new vscode.Selection(document.positionAt(a), document.positionAt(b)));
	await vscode.commands.executeCommand(command);
	const result = document.getText();
	await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
	return result;
}

const up = (marked: string) => run(WMCommandTransposeOctaveUp, marked);
const down = (marked: string) => run(WMCommandTransposeOctaveDown, marked);

suite('Transpose Octave', () => {
	test('notes and degrees', async () => {
		assert.strictEqual(await up('[{ «c I» }]'), "[{ c' I' }]");
		assert.strictEqual(await down('[{ «c I» }]'), '[{ c, I, }]');
	});

	test('only the selected events', async () => {
		assert.strictEqual(await up("[{ c «d e» f }]"), "[{ c d' e' f }]");
	});

	test('multiple bars and lines', async () => {
		assert.strictEqual(
			await up('[{\n  c «d e |\n  f g |\n  a» b\n}]'),
			"[{\n  c d' e' |\n  f' g' |\n  a' b\n}]");
	});

	test('between two voices', async () => {
		assert.strictEqual(
			await up('[\n{\n -- from here\n «c d\n}\n{\n  e f\n  -- to here»\n}\n]'),
			"[\n{\n -- from here\n c' d'\n}\n{\n  e' f'\n  -- to here\n}\n]");
	});

	test('mixed events: volume and meta events are untouched', async () => {
		assert.strictEqual(
			await down('[{ «\\p c !ff d /cc: 7 100/ e» }]'),
			'[{ \\p c, !ff d, /cc: 7 100/ e, }]');
	});

	test('tagged events', async () => {
		assert.strictEqual(await up('[{ «"myTag"@I "t"@<c e>» }]'), "[{ \"myTag\"@I' \"t\"@<c' e'> }]");
	});

	test('octave limit: notes at the limit are skipped', async () => {
		assert.strictEqual(await up("[{ «c''''' d» }]"), "[{ c''''' d' }]");
		assert.strictEqual(await down("[{ «c,,,,, d» }]"), "[{ c,,,,, d, }]");
	});

	test('multiple selections', async () => {
		assert.strictEqual(await up('[{ «c» d «e» }]'), "[{ c' d e' }]");
	});

	test('multi line document with CRLF line endings', async () => {
		assert.strictEqual(await up('[{\r\n «c\r\n d» \r\n}]'), "[{\r\n c'\r\n d' \r\n}]");
	});
});
