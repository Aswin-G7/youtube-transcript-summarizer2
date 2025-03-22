import axios from 'axios';

const FLASK_API_URL = "https://6de9-34-86-31-254.ngrok-free.app/punctuate"; // Update this

async function sendText(text) {
    try {
        const response = await axios.post(FLASK_API_URL, { text });
        const punctuatedText = response.data.punctuated_text;

        console.log("Punctuated Text:", punctuatedText);

        // Split into sentences using regex
        const sentences = punctuatedText.split(/(?<=[.?!:;])\s+/);

        console.log("\nSplit Sentences:");
        sentences.forEach((sentence, index) => {
            console.log(`${index + 1}. ${sentence}`);
        });

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

// Example Usage
const inputText = "how to be confident always see first who said you're not confident have you ever seen a kid who wasn't confident a one-year-old or a 2-year-old they walk around like they own the world right you were that kid that's the truth no one is born without confidence confidence is natural and it's your default setting so the real question is not why am I not confident but what happened to my natural confidence";
sendText(inputText);
