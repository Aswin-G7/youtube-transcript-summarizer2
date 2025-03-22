import { pipeline } from "@xenova/transformers";

async function segmentText(text) {
    const segmenter = await pipeline("text2text-generation", "Xenova/sentence-segmentation");
    const result = await segmenter(text, { max_length: 512 });

    return result[0].generated_text.split("\n"); // Returns segmented sentences
}

// Example unpunctuated text (like YouTube transcripts)
const transcript = "how to be confident always see first who said you're not confident have you ever seen a kid who wasn't confident a one-year-old or a 2-year-old they walk around like they own the world right you were that kid that's the truth no one is born without confidence confidence is natural and it's your default setting so the real question is not why am I not confident but what happened to my natural confidence";

segmentText(transcript).then(sentences => {
    console.log(sentences);
});
