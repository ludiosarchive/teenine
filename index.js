"use strict";

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

const letterToNumbers = Object.create(null);

for (const number of Object.keys(numberToLetters)) {
	for (const letter of numberToLetters[number]) {
		letterToNumbers[letter] = number;
	}
}

assert.strictEqual(Object.keys(numberToLetters).length, 8);
assert.strictEqual(Object.keys(letterToNumbers).length, 26);

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

console.log(
`Upside-down T9 IME

        8     9
       abc   def

  4     5     6
 ghi   jkl   mno

  1     2     3
 pqrs  tuv  wxyz

If you have no number pad, you can use
'789' for 789 and
'uio' for 456 and
'jkl' for 123
`);

keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function(chunk, key) {
	process.stdout.write('Get Chunk: ' + chunk + '\n');
	if (key && key.ctrl && key.name == 'c') {
		process.exit();
	}
});
process.stdin.resume();
