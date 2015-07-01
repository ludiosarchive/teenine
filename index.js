"use strict";

const assert = require("assert");

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

for(const number of Object.keys(numberToLetters)) {
	for(const letter of numberToLetters[number]) {
		letterToNumbers[letter] = number;
	}
}

assert.strictEqual(Object.keys(numberToLetters).length, 8);
assert.strictEqual(Object.keys(letterToNumbers).length, 26);

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
