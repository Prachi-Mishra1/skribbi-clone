"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomWords = getRandomWords;
exports.generateHints = generateHints;
const WORDS = [
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "butterfly",
    "crocodile", "flamingo", "kangaroo", "octopus", "porcupine", "cheetah",
    "pizza", "spaghetti", "hamburger", "sushi", "tacos", "waffle", "croissant",
    "umbrella", "telescope", "backpack", "compass", "lantern", "scissors",
    "swimming", "dancing", "sleeping", "cooking", "reading", "painting",
    "lighthouse", "volcano", "pyramid", "igloo", "castle", "treehouse",
    "dragon", "wizard", "unicorn", "mermaid", "phoenix", "vampire", "zombie"
];
function getRandomWords(count, exclude = []) {
    const available = WORDS.filter(w => !exclude.includes(w));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
function generateHints(word, revealCount) {
    const chars = word.split("");
    const indices = chars.map((c, i) => c !== " " ? i : -1).filter(i => i !== -1);
    const toReveal = indices.sort(() => Math.random() - 0.5).slice(0, revealCount);
    return chars.map((c, i) => c === " " ? " " : toReveal.includes(i) ? c : "_").join(" ");
}
