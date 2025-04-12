"use client";
import { getDailyWord } from "../../../../_services/scores-service";
import MatterScene from "../../../../components/matter-scene";
import { useState, useEffect } from "react";

export default function WordStackPage() {
  const [dailyWord, setDailyWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyWord = async () => {
      try {
        const date = new Date().toISOString().split("T")[0].split("-").reverse().join(".");
        const word = await getDailyWord(date);
        setDailyWord(word);
      } catch (error) {
        console.error("Error fetching daily word:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyWord();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-viridian-700"></div>
      </div>
    );
  }

  if (!dailyWord) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Failed to load the daily word. Please try again later.</p>
      </div>
    );
  }

  return <MatterScene word={dailyWord} dailyWord={true} />;
}