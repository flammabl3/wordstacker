import { db } from "../_utils/firebase";
import { collection, doc, setDoc, getDocs, getDoc, addDoc, query } from "firebase/firestore";

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

export async function dateDocExists(date) { 
  const docRef = doc(db, "scores", date); 
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return true;
  }
  else {
    return false;
  }
}

export async function getDailyWord() {
  const date = new Date().toISOString().split("T")[0].split("-").reverse().join(".")
  const docRef = doc(db, "scores", date);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data().daily_word;
  } else {
    return null;
  }
}

export async function addScore(item) {
  
  const date = new Date().toISOString().split("T")[0].split("-").reverse().join(".")
  // generate a new user score with a random id 
  const collectionRef = collection(db, "scores", date, "users");
  const docRef = await addDoc(collectionRef, item);

  return docRef.id;
}

export async function addDay(date, word) {
  const docRef = doc(db, "scores", date); // sets the document ID to the date

  await setDoc(docRef, {
    daily_word: word,
  });

  const usersCollection = collection(db, "scores", date, "users");
  await addDoc(usersCollection, {});

  return docRef.id;
}
