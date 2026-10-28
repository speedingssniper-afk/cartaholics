"use client";

import { useState } from "react";

export function CopyAddress({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <button
        className="btn"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setDone(true);
          } catch {
            setDone(false);
          }
        }}
      >
        {done ? "Copied." : "Copy address"}
      </button>
      <button className="btn ghost" type="button" onClick={() => window.print()}>
        Print slip
      </button>
    </>
  );
}
