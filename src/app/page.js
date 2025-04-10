"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MatterHeader from "../../components/matter-header";

export default function HomePage() {
  const router = useRouter();
  const [wordInput, setWordInput] = useState("");

  const navigateToWord = (e) => {
    e.preventDefault();
    if (wordInput.trim()) {
      router.push(`/word-stacker/${wordInput}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen font-serif">
      <div>
        <MatterHeader />
        <h1 className="text-7xl">Word Stacker</h1>
        <input
          type="text"
          value={wordInput}
          onChange={(e) => e.target.value === "" ? alert("Please enter a word.") : setWordInput(e.target.value)}
          placeholder="Enter a word"
          className="border border-cool-grey-300 rounded-md p-2 m-1"
        />
        <button onClick={navigateToWord} className="font-serif bg-cool-grey-700 p-2 m-1 rounded-md">
        Go
        </button>
      </div>
      
      <button className="font-serif bg-cool-grey-700 p-2 rounded-md">Daily Word</button>
      <button onClick={() => router.push("/scores")} className="font-serif bg-cool-grey-700 p-2 m-1 rounded-md">
        See Scores
      </button>
    </div>
  );
}
