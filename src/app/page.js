"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getItems } from "../../_services/scores-service";

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
    <div>
      <h1>Word Stack</h1>
      <input
        type="text"
        value={wordInput}
        onChange={(e) => setWordInput(e.target.value)}
        placeholder="Enter a word"
      />
      <button onClick={navigateToWord} className="bg-red-500">
        Go
      </button>
      <button onClick={getItems} className="bg-red-500">
        Test
      </button>
      <button className="bg-red-500">Daily Word</button>
    </div>
  );
}
