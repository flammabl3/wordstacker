import wordsArray from "../../data/words.json";

export default async function handler(req, res) {

    const word = wordsArray[Math.floor(Math.random() * wordsArray.length)];
    const today = new Date().toLocaleDateString("en-GB").split("/").join(".");
    await addDay(today, word);

    console.log("Generated word:", word);
  
    res.status(200).json({ success: true, word });
}
  