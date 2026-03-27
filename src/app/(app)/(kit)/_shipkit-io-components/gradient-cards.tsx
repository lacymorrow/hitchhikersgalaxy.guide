"use client";

import type React from "react";
import { v4 as uuidv4 } from "uuid";
import { GradientCard } from "@/components/ui/cui/gradient-card";
import { cn } from "@/lib/utils";

interface CardData {
  className?: string;
  description: string;
  title: string;
  content?: string;
}

interface GradientCardsProps {
  cards: CardData[];
  className?: string;
}

const GRID_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

export const GradientCards: React.FC<GradientCardsProps> = ({ cards, className }) => {
  const colsClass = GRID_COLS[Math.min(cards.length, 4)] ?? "md:grid-cols-4";

  return (
    <div
      className={cn(
        "mx-auto relative grid w-5/6 grid-cols-1 gap-2 p-2",
        colsClass,
        className
      )}
    >
      {cards.map((card) => (
        <GradientCard
          key={uuidv4()}
          className={card.className ?? "p-4"}
          description={card.description}
          title={card.title}
        >
          {card.content}
        </GradientCard>
      ))}
    </div>
  );
};
