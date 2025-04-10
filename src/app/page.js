"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MatterHeader from "../../components/matter-header";

export default function HomePage() {
  const router = useRouter();
  const [wordInput, setWordInput] = useState("");
  const [isEmpty, setIsEmpty] = useState(false);

  const navigateToWord = (e) => {
    e.preventDefault();
    if (wordInput.trim() !== "") {
      router.push(`/word-stacker/${wordInput}`);
    } else {
      setIsEmpty(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen font-serif">
      <MatterHeader />
      
      <h1 className="text-2xl mb-5">(Word Stacker)</h1>
      <div className="flex flex-col items-center justify-start h-2/3 w-2/3">
        <div className="w-full flex flex-row items-center justify-center h-full m-1">        
          <input
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder={isEmpty ? "Please enter a word" : "Enter a word"}
            className={"hover:bg-charcoal-600 transition duration-300 shadow-md text-3xl border-viridian-300 rounded-sm m-2 p-2 w-7/10 h-6/10" + (isEmpty ? " text-cool-grey-300" : " text-viridian-300")}
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
      </div>
    </div>
  );
}
