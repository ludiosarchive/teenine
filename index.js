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

const dictionary = Object.create(null);
for (const line of fs.readFileSync("count_1w.txt", "utf-8").split("\n")) {
	if(!line) {
		continue;
	}
	const _ = line.split("\t");
	const word = _[0];
	const freq = Number(_[1]);
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

Press Backspace to delete
Press Enter for new line
Press punctuation keys for punctuation
Press ctrl-c or ctrl-d to exit

Start typing:
`);

const punctuationPassthrough = /^[ `~!@#\$%\^&\*\(\)\-=_\+\[\]\{\}\\\|:;'",<\.>\/\?]$/;

let lastLine = "";
let newWordAt = 0;

function redrawLine() {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(lastLine);
}

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	if (key && key.ctrl && (key.name === 'c' || key.name === 'd')) {
		process.exit();
	} else if (key && key.name === 'backspace') {
		lastLine = lastLine.substr(0, lastLine.length - 1);
	} else if (punctuationPassthrough.test(chunk)) {
		lastLine += chunk;
	} else {
		let number = physicalKeyToNumber[chunk];
		if(number) {
			lastLine += number;
		}
		const t9 = lastLine.substr(newWordAt, lastLine.length);
		const candidates = (dictionary[t9] || []).slice();
		// The actual number entered by the user is also a word candidate
		candidates.push([t9, 0]);
		console.log({candidates});
	}
	redrawLine();
});
// Don't let node exit immediately
process.stdin.resume();
