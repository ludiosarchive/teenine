"use strict";

const fs = require("fs");
const assert = require("assert");
const keypress = require("keypress");

// We use upside-down T9, because the number pad starts
// with 7 8 9, unlike phone keypads which start with 1 2 3.
const numberToLetters = {
	8: "abc",
	9: "def",

	4: "ghi",
	5: "jkl",
	6: "mno",

	1: "pqrs",
	2: "tuv",
	3: "wxyz"
}

const letterToNumber = Object.create(null);

for (const number of Object.keys(numberToLetters)) {
	for (const letter of numberToLetters[number]) {
		letterToNumber[letter] = number;
	}
}

assert.strictEqual(Object.keys(numberToLetters).length, 8);
assert.strictEqual(Object.keys(letterToNumber).length, 26);

// Some users have no number pad, so let them use
// the keys below the 789 keys in their number row.
const numberToPhysicalKeys = {
	7: "7",
	8: "8",
	9: "9",

	4: "u4",
	5: "i5",
	6: "o6",

	1: "j1",
	2: "k2",
	3: "l3"
}

const physicalKeyToNumber = Object.create(null);

for (const number of Object.keys(numberToPhysicalKeys)) {
	for (const letter of numberToPhysicalKeys[number]) {
		physicalKeyToNumber[letter] = number;
	}
}

assert.strictEqual(Object.keys(numberToPhysicalKeys).length, 9);
assert.strictEqual(Object.keys(physicalKeyToNumber).length, 9 + 6);

function wordToT9(word) {
	let s = "";
	for (const letter of word) {
		s += letterToNumber[letter];
	}
	return s;
}

// Tweak frequency for some words to get better results
function adjustFrequency(word, freq) {
	if(word === "hi") {
		return freq * 3;
	} else if(word === "ii") {
		return freq / 2;
	}
	return freq;
}

const dictionary = Object.create(null);
for (const line of fs.readFileSync("count_1w.txt", "utf-8").split("\n")) {
	if(!line) {
		continue;
	}
	const _ = line.split("\t");
	const word = _[0];
	const freq = adjustFrequency(word, Number(_[1]));
	const t9 = wordToT9(word);
	if(!dictionary[t9]) {
		dictionary[t9] = [];
	}
	dictionary[t9].push([word, freq]);
}

console.log(
`Upside-down T9 IME

        8     9
       abc   def

  4     5     6
 ghi   jkl   mno

  1     2     3
 pqrs  tuv  wxyz

If you have no number pad, you can use the
keys below the 789 keys in your number row:
'789' for 789 and
'uio' for 456 and
'jkl' for 123

Press p or Down arrow to select the next T9 match
Press h or y or Up arrow to select the previous T9 match
Press Space to confirm match

Press Backspace to delete
Press punctuation keys for punctuation
Press ctrl-c or ctrl-d to exit

Start typing:
`);

function underlined(s) {
	// 4 = underlined
	// 22 = normal color
	return `\x1b[4;22m${s}\x1b[0m`;
}

const punctuationPassthrough = /^[ `~!@#\$%\^&\*\(\)\-=_\+\[\]\{\}\\\|:;'",<\.>\/\?]$/;

class LineEditor {
	constructor() {
		// Everything to the left of the currently-edited word
		this.left = "";

		// T9 for the word we're editing
		this.t9 = "";

		// Word candidates for the current T9
		this.candidates = null;

		// Which candidate is currently selected
		this.candidateIdx = 0;

		// Everything to the right of the currently-edited word
		this.right = "";

		this._boundOnKeypress = this.onKeypress.bind(this);
	}

	grabStdin() {
		keypress(process.stdin);
		process.stdin.setRawMode(true);
		// Don't let node exit immediately
		process.stdin.resume();
		process.stdin.on('keypress', this._boundOnKeypress);
	}

	releaseStdin() {
		process.stdin.setRawMode(false);
		process.stdin.removeListener('keypress', this._boundOnKeypress);
		process.stdin.pause();
	}

	getCandidateWord() {
		if (this.candidates === null) {
			return "";
		}
		return this.candidates[this.candidateIdx][0];
	}

	redrawLine() {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`${this.left}${underlined(this.getCandidateWord())}${this.right}`);
	}

	backspace() {
		if (this.t9.length) {
			this.t9 = this.t9.substr(0, this.t9.length - 1);
			this.updateCandidates();
		} else if (this.left.length) {
			this.left = this.left.substr(0, this.left.length - 1);
		}
	}

	setCandidates(candidates) {
		assert(candidates.length >= 0, candidates);
		this.candidates = candidates;
		// Old index might now be out of bounds
		this.candidateIdx = 0;
	}

	updateCandidates() {
		const candidates = (dictionary[this.t9] || []).slice();
		// Sort by word frequency, most frequent first
		candidates.sort(function(c1, c2) {
			return c2[1] > c1[1] ? 1 : -1;
		});
		// The actual number entered by the user is also a word candidate
		candidates.push([this.t9, 0]);
		this.setCandidates(candidates);
	}

	jumpCandidate(idx) {
		if (this.candidates === null) {
			return;
		}
		this.candidateIdx += idx;
		if (this.candidateIdx >= this.candidates.length) {
			this.candidateIdx = 0;
		} else if (this.candidateIdx < 0) {
			this.candidateIdx = this.candidates.length - 1;
		}
	}

	acceptCandidate() {
		this.left += this.getCandidateWord();
		this.t9 = "";
		this.candidates = null;
		this.candidateIdx = 0;
	}

	onKeypress(chunk, key) {
		if (key && key.ctrl && (key.name === 'c' || key.name === 'd')) {
			this.releaseStdin();
		} else if (key && key.name === 'backspace') {
			this.backspace();
		} else if (key && (key.name === 'p' || key.name === 'down')) {
			this.jumpCandidate(1);
		} else if (key && (key.name === 'y' || key.name === 'h' || key.name === 'up')) {
			this.jumpCandidate(-1);
		} else if (punctuationPassthrough.test(chunk)) {
			this.acceptCandidate();
			this.left += chunk;
		} else {
			const digit = physicalKeyToNumber[chunk];
			if (digit) {
				this.t9 += digit;
			}
			this.updateCandidates();
		}
		this.redrawLine();
	}
}

const editor = new LineEditor();
editor.grabStdin();
