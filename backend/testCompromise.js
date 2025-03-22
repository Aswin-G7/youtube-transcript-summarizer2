import natural from "natural";

function segmentText(text) {
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text);
    const segments = [];
    let currentSegment = [];

    for (let word of words) {
        currentSegment.push(word);

        // Heuristic: Split every 6 words
        if (currentSegment.length >= 6) {
            segments.push(currentSegment.join(" "));
            currentSegment = [];
        }
    }

    if (currentSegment.length) {
        segments.push(currentSegment.join(" "));
    }

    return segments;
}

const text = "this is a test this is another test here is another example without punctuation";
console.log(segmentText(text));
