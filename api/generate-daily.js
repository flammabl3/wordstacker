import wordsArray from "./words.json";
import {addDay, dateDocExists} from "../_services/scores-service";
import path from "path";
import fs from "fs";

export default async function handler(req, res) {
    const today = new Date().toLocaleDateString("en-GB").split("/").join(".");

    const exists = await dateDocExists(today);

    console.log("Date exists:", exists);

    if (exists == false) {
        const word = wordsArray[Math.floor(Math.random() * wordsArray.length)];

        const updatedWordsArray = wordsArray.filter((w) => w !== word);

        const filePath = path.resolve("./api/words.json");
        fs.writeFileSync(filePath, JSON.stringify(updatedWordsArray, null, 2));

        await addDay(today, word);

        console.log("Generated word:", word);
    
        res.status(200).json({ success: true, word });
    } else {
        res.status(400).json({ success: false, message: "Document already exists" });
    }
}
  