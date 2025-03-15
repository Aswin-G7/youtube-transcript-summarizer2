import translate from 'google-translate-api-x';

async function translateText() {
  const text = "संयुक्त राष्ट्र के प्रमुख का कहना है कि सीरिया में कोई सैन्य समाधान नहीं है";
  const target = "en"; // Russian

  try {
    const res = await translate(text, { to: target });
    console.log(`Original: ${text}`);
    console.log(`Translated: ${res.text}`);
  } catch (error) {
    console.error("Translation error:", error);
  }
}

translateText();
