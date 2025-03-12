import Image from "next/image";
import { FC } from "react";
import InputArea from "./InputArea";

type THeroProps = {
  promptValue: string;
  setPromptValue: React.Dispatch<React.SetStateAction<string>>;
  handleDisplayResult: () => void;
};

const Hero: FC<THeroProps> = ({
  promptValue,
  setPromptValue,
  handleDisplayResult,
}) => {
  const handleClickSuggestion = (value: string) => {
    setPromptValue(value);
  };

  return (
    <div className="my-20 flex flex-col items-center justify-center">
  {/* Main content wrapper */}
  <div className="w-full max-w-[708px] pb-6">
    {/* Powered by section */}
    <div className="mb-4 text-left flex items-center gap-2 text-sm font-light text-gray-100">
      <span>Powered by</span>
      <img 
        src="/pathway_logo.svg" 
        alt="Powered by Pathway" 
        width={65} 
        height={65} 
        className="inline-block"
      />
    </div>

    {/* Input area */}
    <InputArea
      promptValue={promptValue}
      setPromptValue={setPromptValue}
      handleDisplayResult={handleDisplayResult}
    />
  </div>

  {/* Subtle tagline */}
  <div className="mt-4 text-center text-sm font-light italic text-gray-200">
    "Leverage the power of dynamic Pathway vector store"
  </div>

  {/* Suggestions section */}
  <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 pb-[30px] lg:flex-nowrap lg:justify-start">
    {suggestions.map((item) => (
      <div
        key={item.id}
        className="flex h-[35px] cursor-pointer items-center justify-center gap-2 rounded border border-solid border-[#515151] bg-[#212121] px-4 py-2 hover:border-gray-500 hover:bg-[#292929]"
        onClick={() => handleClickSuggestion(item?.name)}
      >
        <span className="text-sm font-light text-white">{item.name}</span>
      </div>
    ))}
  </div>

  {/* GitHub link section */}
  {/* <div className="mt-8 text-center text-sm font-light text-gray-400">
    Fully open source!{" "}
    <span className="font-medium underline">
      <a
        href="https://github.com/Nutlope/turboseek"
        target="_blank"
        rel="noopener noreferrer"
      >
        Star it on GitHub.
      </a>
    </span>
  </div> */}
</div>

  );
};

type suggestionType = {
  id: number;
  name: string;
  icon: string;
};

const suggestions: suggestionType[] = [
  {
    id: 1,
    name: "What are the company's revenue sources?",
    icon: "/img/icon_leaf.svg",
  },
  {
    id: 2,
    name: "Latest financial news?",
    icon: "/img/icon_dumbell.svg",
  },
  {
    id: 3,
    name: "Details on Apple stocks?",
    icon: "/img/icon_atom.svg",
  },
];

export default Hero;
