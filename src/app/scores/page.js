"use client";
import { getItems } from "../../../_services/scores-service";
import { useState } from "react";

export default function HomePage() {
    // use today's date as default value for the score input
  const [scoreInput, setScoreInput] = useState(() => {
    const date = new Date();
    return {
        day: date.getDate() < 10 ? "0" + date.getUTCDate() : date.getUTCDate(),
        month: date.getMonth() + 1 < 10 ? "0" + (date.getUTCMonth() + 1) : (date.getUTCMonth() + 1),
        year: date.getUTCFullYear(),
      }
    });

  const getScoreFormatted = () =>
  {
    const dateString = scoreInput.day + "." + scoreInput.month + "." + scoreInput.year;
    return dateString;
  };

  const fetchScores = async () => {
    const scores = await getItems(getScoreFormatted());
    setScoresList(scores);
  };

  const [scoresList, setScoresList] = useState(null);

  const days = [
    { value: "01", label: "01" },
    { value: "02", label: "02" },
    { value: "03", label: "03" },
    { value: "04", label: "04" },
    { value: "05", label: "05" },
    { value: "06", label: "06" },
    { value: "07", label: "07" },
    { value: "08", label: "08" },
    { value: "09", label: "09" },
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
    { value: "13", label: "13" },
    { value: "14", label: "14" },
    { value: "15", label: "15" },
    { value: "16", label: "16" },
    { value: "17", label: "17" },
    { value: "18", label: "18" },
    { value: "19", label: "19" },
    { value: "20", label: "20" },
    { value: "21", label: "21" },
    { value: "22", label: "22" },
    { value: "23", label: "23" },
    { value: "24", label: "24" },
    { value: "25", label: "25" },
    { value: "26", label: "26" },
    { value: "27", label: "27" },
    { value: "28", label: "28" },
    { value: "29", label: "29" },
    { value: "30", label: "30" },
    { value: "31", label: "31" },
  ];

  const months = [
    { value: "01", label: "01" },
    { value: "02", label: "02" },
    { value: "03", label: "03" },
    { value: "04", label: "04" },
    { value: "05", label: "05" },
    { value: "06", label: "06" },
    { value: "07", label: "07" },
    { value: "08", label: "08" },
    { value: "09", label: "09" },
    { value: "10", label: "10" },
    { value: "11", label: "11" },
    { value: "12", label: "12" },
  ]

  const formatDate = (date, useUTC = false) => {
    const day = useUTC ? date.getUTCDate() : date.getDate();
    const month = useUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1; // Months are 0-indexed
    const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
  
    const hours = useUTC ? date.getUTCHours() : date.getHours();
    const minutes = useUTC ? date.getUTCMinutes() : date.getMinutes();
  
    // Format as DD/MM/YYYY HH:MM:SS
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year} ${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen mt-4">
        <div className="flex flex-col items-center justify-center w-1/2">
            <h2>This game uses UTC time.</h2>
            <h3>Your time: {formatDate(new Date())}</h3>
            <h3>UTC time: {formatDate(new Date(), true)}</h3>
            <div>
                <select
                    value={scoreInput.day}
                    onChange={(e) =>     setScoreInput({
                        ...scoreInput,
                        day: e.target.value,
                    })}
                    className="border border-anti-flash-white-500 bg-charcoal-700 text-anti-flash-white-500 rounded-md p-4 m-2 text-2xl"
                >
                    {days.map((day) => (
                    <option key={day.value} value={day.value}>
                        {day.label}
                    </option>
                    ))}
                </select>

            <select
                value={scoreInput.month}
                onChange={(e) =>     setScoreInput({
                    ...scoreInput,
                    month: e.target.value,
                })}
                className="border border-anti-flash-white-500 bg-charcoal-700 text-anti-flash-white-500 rounded-md p-4 m-2 text-2xl"
            >
                {months.map((month) => (
                <option key={month.value} value={month.value}>
                    {month.label}
                </option>
                ))}
            </select>

            <input
                type="number"
                value={scoreInput.year}
                onChange={(e) =>     setScoreInput({
                    ...scoreInput,
                    year: e.target.value,
                })}
                placeholder="Year"
                className="border border-anti-flash-white-500 text-anti-flash-white-500 bg-charcoal-700 rounded-md p-4 m-2 text-2xl"
            />

            
            </div>
            <button onClick={fetchScores} 
            className="bg-viridian-600 text-anti-flash-white-500 px-4 py-2 rounded-md cursor-pointer hover:bg-viridian-700 transition duration-300 shadow-md text-2xl">
            See Scores
            </button>
        </div>
        
        <div className="w-1/2 flex-1 flex-col items-center justify-start m-4">
        { scoresList && scoresList.length > 0 && 
            <ol>
                {scoresList.map((item) => (
                    <li key={item.id} className="text-flash-white-500 border-b border-t border-anti-flash-white-500 p-4 w-full">
                        <h2 className="text-lg font-bold">{item.name}</h2>
                        <p>Score: {item.score}</p>
                        <p>Word: {item.word}</p>
                        <p>Daily Word: {item.wordOfTheDay == true ? "Yes" : "No"}</p>
                    </li>
                ))}
            </ol>
        }
        { scoresList && scoresList.length === 0 && 
            <h2 className="text-anti-flash-white-500 text-center p-4 m-4">No scores found for this date.</h2>
        }
        </div>
    </div>
  );
}
