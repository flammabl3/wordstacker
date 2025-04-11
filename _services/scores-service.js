import { db } from "../_utils/firebase";
import { collection, doc, setDoc, getDocs, addDoc, query } from "firebase/firestore";

export async function getItems(date) {
  const collectionRef = collection(db, "scores", date, "users");
  const docsRef = await getDocs(collectionRef);

  console.log("Raw docsRef:", docsRef);
  console.log("docsRef.docs:", docsRef.docs);
  const items = docsRef.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  if (items.length > 0) return items;
  else return [];
}

export async function addScore(date, item) {
  // generate a new user score with a random id 
  const collectionRef = collection(db, "scores", date, "users");
  const docRef = await addDoc(collectionRef, item);

  return docRef.id;
}

export async function addDay(date, word) {
  const docRef = doc(db, "scores", date); // sets the document ID to the date

  await setDoc(docRef, {
    daily_word: word,
    users: {} 
  });

  return docRef.id;
}
