import wordsArray from "./words.json";
import { addDay, dateDocExists } from "../_services/scores-service";
import { collection, query, where, getDocs } from "firebase/firestore"; 
import { db } from "../_utils/firebase"; 

export default async function handler(req, res) {
  const today = new Date().toISOString().split("T")[0].split("-").reverse().join(".");

  const exists = await dateDocExists(today);

  console.log("Date exists:", exists);

  if (exists == false) {
    let word;
    let isDuplicate = true;

    // keep selecting a random word until it's not a duplicate
    while (isDuplicate) {
      word = wordsArray[Math.floor(Math.random() * wordsArray.length)];

      // query firestore to check if the word already exists
      const scoresCollection = collection(db, "scores");
      const q = query(scoresCollection, where("daily_word", "==", word));
      const querySnapshot = await getDocs(q);

      isDuplicate = !querySnapshot.empty; // if the query returns results, it's a duplicate
      console.log("Word exists:", isDuplicate);
    }

    // add the new daily word to the database
    await addDay(today, word);

    console.log("Generated word:", word);

    res.status(200).json({ success: true, word });
  } else {
    res.status(400).json({ success: false, message: "Document already exists" });
  }
}