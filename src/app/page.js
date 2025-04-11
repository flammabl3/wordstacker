"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MatterHeader from "../../components/matter-header";
import {addDay} from "../../_services/scores-service";

export default function HomePage() {
  const router = useRouter();
  const [wordInput, setWordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  const navigateToWord = (e) => {
    e.preventDefault();
    const word = wordInput.trim().toLowerCase();
    if (word.length > 10) {
      setErrorMessage("Word is too long. Please enter a word with 10 characters or less.");
    } else if (word === "") {
      setErrorMessage("No word was entered.");
    } else {
      setErrorMessage(null);
      router.push(`/word-stacker/${wordInput}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen font-serif">
      <MatterHeader />
      
      <h1 className="text-2xl mb-5">{errorMessage ? errorMessage : "(Word Stacker)"}</h1>

      <div className="flex flex-col items-center justify-start h-2/3 w-2/3">
        <div className="w-full flex flex-row items-center justify-center h-full m-1">        
          <input
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder={"Enter a word"}
            className={"hover:bg-charcoal-600 transition duration-300 shadow-md text-3xl border-viridian-300 rounded-sm m-2 p-2 w-7/10 h-6/10 text-viridian-300"}
          />
          <button onClick={navigateToWord} className="font-serif text-3xl bg-viridian-700 p-2 h-6/10 w-2/10 rounded-md cursor-pointer hover:bg-viridian-800 transition duration-300 shadow-md">
          Go
          </button>
        </div>
        <div className="w-full flex flex-row items-center justify-center h-full m-1">        
          <button className="font-serif text-3xl bg-viridian-700 p-2 m-4 rounded-md h-6/10 w-9/10 cursor-pointer hover:bg-viridian-800 transition duration-300 shadow-md">Daily Word</button>
        </div>
        <div className="w-full flex flex-row items-center justify-center h-full m-1">        
          <button onClick={() => router.push("/scores")} className="font-serif text-3xl bg-viridian-700 p-2 m-4 rounded-md h-6/10 w-9/10 cursor-pointer hover:bg-viridian-800 transition duration-300 shadow-md">
            See Scores
          </button>
        </div>

        <div className="w-full flex flex-row items-center justify-center h-full m-1">        
          <button onClick={async () => {await test()}} className="font-serif text-3xl bg-viridian-700 p-2 m-4 rounded-md h-6/10 w-9/10 cursor-pointer hover:bg-viridian-800 transition duration-300 shadow-md">
            See test
          </button>
        </div>
      </div>
    </div>
  );
}
