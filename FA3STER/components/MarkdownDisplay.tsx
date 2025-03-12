import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./markdownDisplay.css";

const MarkdownDisplay = ({ content }: { content: string }) => {
  return (
    <div className="markdown-body text-[#aaaaaa]">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};

export default MarkdownDisplay;
