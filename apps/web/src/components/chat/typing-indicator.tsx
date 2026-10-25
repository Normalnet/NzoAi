import React from "react";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted rounded-2xl w-fit">
      <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"></div>
    </div>
  );
}
