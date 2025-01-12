"use client";

import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";

const AIEditor = () => {
  const [inputText, setInputText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchSuggestion = debounce(async (text: string) => {
    if (text.trim() === "") {
      setSuggestion("");
      return;
    }

    try {
      const response = await fetch("/type-ahead/api/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      // Optionally, handle error state here
    }
  }, 500);

  useEffect(() => {
    void fetchSuggestion(inputText);
  }, [inputText, fetchSuggestion]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setInputText(inputText + suggestion);
      setSuggestion("");
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="relative z-10 box-border h-64 w-full resize-none bg-transparent p-4 text-base text-black"
        style={{ caretColor: "black" }}
      />
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 top-4 z-0 whitespace-pre-wrap break-words p-4 text-base text-gray-400 opacity-60">
        {inputText}
        <span>{suggestion}</span>
      </div>
    </div>
  );
};

export default AIEditor;
