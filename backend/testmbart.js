import { pipeline } from '@xenova/transformers';

async function testTranslation() {
    try {
        console.log("Loading translation model...");
        
        // Load the translation pipeline
        let translator = await pipeline('translation', 'Xenova/mbart-large-50-many-to-many-mmt');

        console.log("Model loaded successfully!");

        // Translate text from Hindi to French
        let output = await translator('संयुक्त राष्ट्र के प्रमुख का कहना है कि सीरिया में कोई सैन्य समाधान नहीं है', {
            src_lang: 'hi_IN', // Hindi
            tgt_lang: 'ta_IN', // French
        });

        console.log("Translation output:", output);
    } catch (error) {
        console.error("Translation failed:", error);
    }
}

testTranslation();
