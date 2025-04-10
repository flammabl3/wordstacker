"use client";
import { getItems } from "../../../_services/scores-service";
import { useState } from "react";

export default function HomePage() {
    // use today's date as default value for the score input
  const [scoreInput, setScoreInput] = useState(() => {
    const date = new Date();
    return {
        day: date.getDate() < 10 ? "0" + date.getDate() : date.getDate(),
        month: date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1),
        year: date.getFullYear(),
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

  const [scoresList, setScoresList] = useState([]);

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

  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <div>
            <div>
                <select
                    value={scoreInput.day}
                    onChange={(e) =>     setScoreInput({
                        ...scoreInput,
                        day: e.target.value,
                    })}
                    className="border border-gray-300 text-red-900 rounded-md p-2"
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
                className="border border-gray-300 text-red-900 rounded-md p-2"
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
                className="border border-gray-300 text-red-900 rounded-md p-2 w-20"
            />

            
            </div>
            <button onClick={fetchScores} 
            className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-600 transition duration-300 shadow-md">
            See Scores
            </button>
        </div>
        <div>
            <ol>
                {scoresList.map((item) => (
                    <li key={item.id} className="text-red-900 border-b border-gray-300 py-2">
                        <h2>{item.user_name} {item.score}</h2>
                        <p>Word: {item.word}</p>
                    </li>
                ))}
            </ol>
        </div>
    </div>
  );
}
