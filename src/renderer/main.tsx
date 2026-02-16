import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-2xl font-mono text-amber-400">
        Legends of the Shattered Realm
      </h1>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
