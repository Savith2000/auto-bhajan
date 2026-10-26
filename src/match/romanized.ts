// Romanised lyrics → rough Devanagari, for the few bhajans catalogued without
// any Devanagari.
//
// This is not transliteration anyone should read. It only has to sound right
// *after normalisation*, which already throws away vowel length, aspiration,
// which nasal and which sibilant. So "Rama", "Raama" and "Ram" may all come out
// slightly differently here and still meet the model's output in the middle.

const CONSONANTS: [string, string][] = [
  ["ksh", "क्ष"],
  ["chh", "छ"],
  ["kh", "ख"],
  ["gh", "घ"],
  ["ch", "च"],
  ["jh", "झ"],
  ["th", "थ"],
  ["dh", "ध"],
  ["ph", "फ"],
  ["bh", "भ"],
  ["sh", "श"],
  ["k", "क"],
  ["g", "ग"],
  ["c", "च"],
  ["j", "ज"],
  ["t", "त"],
  ["d", "द"],
  ["n", "न"],
  ["p", "प"],
  ["b", "ब"],
  ["m", "म"],
  ["y", "य"],
  ["r", "र"],
  ["l", "ल"],
  ["v", "व"],
  ["w", "व"],
  ["s", "स"],
  ["h", "ह"],
  ["f", "फ"],
  ["z", "ज"],
  ["q", "क"],
  ["x", "क्स"],
];

/** [romanised, independent vowel, vowel sign after a consonant] */
const VOWELS: [string, string, string][] = [
  ["aa", "आ", "ा"],
  ["ai", "ऐ", "ै"],
  ["au", "औ", "ौ"],
  ["ee", "ई", "ी"],
  ["ii", "ई", "ी"],
  ["oo", "ऊ", "ू"],
  ["uu", "ऊ", "ू"],
  ["a", "अ", ""],
  ["i", "इ", "ि"],
  ["u", "उ", "ु"],
  ["e", "ए", "े"],
  ["o", "ओ", "ो"],
];

const VIRAMA = "्";

function convertWord(word: string): string {
  let out = "";
  let afterConsonant = false;
  let i = 0;
  while (i < word.length) {
    const vowel = VOWELS.find(([latin]) => word.startsWith(latin, i));
    if (vowel) {
      out += afterConsonant ? vowel[2] : vowel[1];
      afterConsonant = false;
      i += vowel[0].length;
      continue;
    }
    const consonant = CONSONANTS.find(([latin]) => word.startsWith(latin, i));
    if (consonant) {
      // Two consonants in a row form a cluster.
      if (afterConsonant) out += VIRAMA;
      out += consonant[1];
      afterConsonant = true;
      i += consonant[0].length;
      continue;
    }
    i++; // anything else (apostrophes, digits) is dropped
  }
  // A word-final consonant keeps its inherent vowel unwritten, Hindi-style:
  // "Ram" → राम, which is how the model writes it.
  return out;
}

export function romanizedToDevanagari(text: string): string {
  return text
    .toLowerCase()
    .split("\n")
    .map((line) =>
      line
        .split(/[^a-z']+/)
        .filter(Boolean)
        .map(convertWord)
        .join(" "),
    )
    .join("\n");
}
