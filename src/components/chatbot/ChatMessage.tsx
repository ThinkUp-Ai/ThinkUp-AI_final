import React from "react";

type Props = {
  role: "user" | "model";
  text: string;
};

function renderFormattedText(text: string) {
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    const pattern = /(\*[^*\n]+\*|_[^_\n]+_)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const token = match[0];

      if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <strong key={`${lineIndex}-${match.index}`} className="font-semibold">
            {token.slice(1, -1)}
          </strong>
        );
      } else if (token.startsWith("_") && token.endsWith("_")) {
        parts.push(
          <span key={`${lineIndex}-${match.index}`} className="italic">
            {token.slice(1, -1)}
          </span>
        );
      } else {
        parts.push(token);
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

const ChatMessage: React.FC<Props> = ({ role, text }) => {
  const isUser = role === "user";

  return (
    <div
      className={`mb-4 rounded-2xl px-4 py-3 shadow ${
        isUser
          ? "bg-[#0b0b0b] text-white border border-white/10"
          : "bg-black text-white border border-[#58FFE9]/20"
      }`}
    >
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
        {renderFormattedText(text)}
      </div>
    </div>
  );
};

export default ChatMessage;
