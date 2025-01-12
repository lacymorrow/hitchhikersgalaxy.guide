"use client";

import AIEditor from "@/app/(app)/(ai)/type-ahead/_components/AIEditor";

export default function TypeAheadPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">AI-Powered Document Editor</h1>
      <AIEditor />
    </div>
  );
}
