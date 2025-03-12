"use client";

// WEBSOCKETS CODE

import Answer from "@/components/Answer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InputArea from "@/components/InputArea";
import SimilarTopics from "@/components/SimilarTopics";
import Sources from "@/components/Sources";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import FileUploadModal from "@/components/FileUploadModal";
import { useRouter } from "next/navigation";
import { WavyBackground } from "../components/ui/wavy-background";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

import { AppProps } from "next/app";
import { useRefreshContext } from "../context/VarContext";

import { useAppModeContext } from "@/context/AppModeContext";

import ReactMarkdown from "react-markdown";
import ReportView from "@/components/ReportView";
import ReportView1 from "@/components/ReportView1";
import ReportView2 from "@/components/ReportView2";
import ReportView3 from "@/components/ReportView3";
import ReportView4 from "@/components/ReportView4";
const SOCKET_SERVER_URL = "http://localhost:7771"; 
import {io} from "socket.io-client";

export default function Home() {
  const [showResult, setShowResult] = useState(false);
  const router = useRouter();
  const handleDashboardClick = () => {
    router.push('/dashboard'); 
};
  const submitQuestion = async (QuestionVariable: string) => {
    try {
      const response = await fetch("http://localhost:5091/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ques: QuestionVariable,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the question");
      }

      const data = await response.json();
      console.log("Response:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const stopHandler = async () => {
    try {
      const response = await fetch("http://localhost:5091/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to submit the stop request");
      }
      const data = await response.json();
      setrefreshVar("stoppedResponse");
      setShowResult(false);
      console.log("Response:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<{ name: string; url: string }[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [answer, setAnswer] = useState("");
  const [similarQuestions, setSimilarQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { refreshVar, setrefreshVar } = useRefreshContext();

  const { AppModeVar, setAppModeVar } = useAppModeContext();

  const switchMode = () => {
    if (AppModeVar == "chatMode") setAppModeVar("reportMode");
    else if (AppModeVar == "reportMode") setAppModeVar("chatMode");
  };

  const handleDisplayResult = async (newQuestion?: string) => {
    newQuestion = promptValue;

    setrefreshVar("ready");

    setShowResult(true);
    setLoading(true);
    setQuestion(newQuestion);
    setPromptValue("");

    submitQuestion(newQuestion);

    // await Promise.all([
    //   handleSourcesAndAnswer(newQuestion),
    //   handleSimilarQuestions(newQuestion),
    // ]);

    setLoading(false);
  };

  const sendQuesReportView = async (newQuestion?: string) => {
    newQuestion = promptValue;

    setrefreshVar("ready");

    setShowResult(true);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:7771/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ques: newQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the question");
      }

      const data = await response.json();
      console.log("Response:", data);
      setReportModeView((parseInt(reportModeView) + 1).toString());
      setAnswerFinal(data.report_text)
    } catch (error) {
      console.error("Error:", error);
    }

    setPromptValue("");

    setLoading(false);
  };

  async function handleSourcesAndAnswer(question: string) {
    console.log("handle Answer called");
    setIsLoadingSources(true);
    // let sourcesResponse = await fetch("/api/getSources", {
    //   method: "POST",
    //   body: JSON.stringify({ question }),
    // });
    // if (sourcesResponse.ok) {
    //   let sources = await sourcesResponse.json();

    //   setSources(sources);
    // } else {
    //   setSources([])
    // }
    // setIsLoadingSources(false);

    const response = await fetch("/api/getAnswer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, sources }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    if (response.status === 202) {
      const fullAnswer = await response.text();
      console.log(fullAnswer);
      setAnswer(fullAnswer);
      return;
    }

    if (response.status == 200) {
      console.log(response);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          setAnswer((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    };

    // https://web.dev/streams/#the-getreader-and-read-methods

    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }
  }

  async function handleSimilarQuestions(question: string) {
    let res = await fetch("/api/getSimilarQuestions", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    let questions = await res.json();
    setSimilarQuestions(questions);
  }

  const reset = () => {
    setShowResult(false);
    setPromptValue("");
    setQuestion("");
    setAnswer("");
    setSources([]);
    setSimilarQuestions([]);
  };

  const [reportModeView, setReportModeView] = useState("1");
  const [messages1, setMessages1] = useState([]);
  const [subQueryArray1, setSubQueryArray1] = useState([]);
  const [answer1, setAnswer1] = useState("");
  const [handlingStatus1, setHandlingStatus1] = useState(false);
  const [subqueryNodeMap1, setSubqueryNodeMap1] = useState<Map<string, string[]>>(
    new Map(),
  );
  const [subqueryStatusMap1, setSubqueryStatusMap1] = useState<
    Map<string, string>
  >(new Map());
  const [messages2, setMessages2] = useState([]);
  const [subQueryArray2, setSubQueryArray2] = useState([]);
  const [answer2, setAnswer2] = useState("");
  const [handlingStatus2, setHandlingStatus2] = useState(false);
  const [subqueryNodeMap2, setSubqueryNodeMap2] = useState<Map<string, string[]>>(
    new Map(),
  );

  const [subqueryStatusMap2, setSubqueryStatusMap2] = useState<
    Map<string, string>
  >(new Map());
  const [messages3, setMessages3] = useState([]);
  const [subQueryArray3, setSubQueryArray3] = useState([]);
  const [answer3, setAnswer3] = useState("");
  const [handlingStatus3, setHandlingStatus3] = useState(false);
  const [subqueryNodeMap3, setSubqueryNodeMap3] = useState<Map<string, string[]>>(
    new Map(),
  );

  const [subqueryStatusMap3, setSubqueryStatusMap3] = useState<
    Map<string, string>
  >(new Map());
  const [answer_final, setAnswerFinal] = useState("");

  const changeReportViewAgent = (val: string) => {
    setReportModeView(val);
  };

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    console.log("useEffect ran");

    // Listen for messages from the backend

    socket.on("message_livestatus", (data) => {
      console.log(data);
      console.log("working conn");
    });

    socket.on("message_to_frontend_subquery_array_1", (data) => {
      // setIsRunning(true);
      console.log("message_to_frontend_subquery_array_1");
      console.log(data);
      data = JSON.parse(data);
      setSubQueryArray1(data);
      // setMessages((prevMessages) => [...prevMessages, data]);
    });
    socket.on("message_to_frontend_subquery_array_2", (data) => {
      // setIsRunning(true);
      console.log("message_to_frontend_subquery_array_2");
      console.log(data);
      data = JSON.parse(data);
      setSubQueryArray2(data);
      // setMessages((prevMessages) => [...prevMessages, data]);
    });
    socket.on("message_to_frontend_subquery_array_3", (data) => {
      // setIsRunning(true);
      console.log("message_to_frontend_subquery_array_3");
      console.log(data);
      data = JSON.parse(data);
      setSubQueryArray3(data);
      // setMessages((prevMessages) => [...prevMessages, data]);
    });
  
    
  }, [])
  

  return (
    <>
      {/* <Header /> */}
      <main className="min-h-[100vh] bg-black px-4 pb-4">
        {!showResult && AppModeVar == "chatMode" && (
          <>
          <WavyBackground className="max-w-4xl mx-auto ">
            
          <Hero
              promptValue={promptValue}
              setPromptValue={setPromptValue}
              handleDisplayResult={handleDisplayResult}
            />
<div className="flex flex-col w-[10%]">
<button 
              onClick={() => setIsModalOpen(true)}
              className="fixed left-[10px] rounded-2xl bg-[#003663] px-6 py-2 pt-2 mt-2 text-blue-300 hover:bg-blue-800">
            Upload Files
            </button>
            <FileUploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

            <button
              className="rounded-2xl bg-[#003663] fixed bottom-[70px] left-[10px] px-6 py-2 pt-2 mt-2 text-blue-300 hover:bg-blue-800"

              onClick={switchMode}
            >
              {AppModeVar}
            </button>
</div>

          </WavyBackground>
            
            
          </>
        )}

        {showResult && AppModeVar == "chatMode" && (
          <div className="flex h-full min-h-[68vh] w-full grow flex-col justify-between">
            <div className="w-full space-y-2">
              <div className="space-y-2">
                {/* question */}
                <div className="container my-10 flex w-full items-center gap-3 px-5 pt-2 lg:px-10">
                  <div className="flex w-fit items-center gap-4">
                    <Image
                      unoptimized
                      src={"/img/message-question-circle.svg"}
                      alt="message"
                      width={30}
                      height={30}
                      className="size-[24px]"
                    />
                    <p className="pr-5 font-bold uppercase leading-[152%] text-[#dddddd]">
                      Question:
                    </p>
                  </div>
                  <div className="grow text-[#aaaaaa]">
                    &quot;{question}&quot;
                  </div>

                  <button
                    className="rounded-2xl bg-[#630303] px-6 py-2 text-red-300"
                    onClick={stopHandler}
                  >
                    STOP
                  </button>

                  <button
                    className="rounded-2xl bg-[#630303] px-6 py-2 text-red-300"
                    onClick={switchMode}
                  >
                    {AppModeVar}
                  </button>
                </div>

                {refreshVar != "stoppedResponse" ? (
                  <Answer answer={answer} />
                ) : null}
              </div>

              <div className="pt-1 sm:pt-2" ref={chatContainerRef}></div>
            </div>

            <div className="container mt-10 px-4 lg:px-0">
              <InputArea
                promptValue={promptValue}
                setPromptValue={setPromptValue}
                handleDisplayResult={handleDisplayResult}
                disabled={loading}
                reset={reset}
              />
            </div>
          </div>
        )}

        {AppModeVar == "reportMode" && (
          <>
            <div className="flex min-h-[100vh] w-full flex-col p-4">
              <div className="flex">
                <div className="fixed flex h-[100vh] w-[50px] flex-col items-center justify-center gap-[20px]">
                  <button
                    className={`h-[50px] w-[50px] rounded-full ${
                      reportModeView === "1" ? "bg-red-500" : "bg-gray-400"
                    }`}
                    onClick={() => changeReportViewAgent("1")}
                  >
                    1
                  </button>

                  <button
                    className={`h-[50px] w-[50px] rounded-full ${
                      reportModeView === "2" ? "bg-red-500" : "bg-gray-400"
                    } `}
                    onClick={() => changeReportViewAgent("2")}
                  >
                    2
                  </button>

                  <button
                    className={`h-[50px] w-[50px] rounded-full ${
                      reportModeView === "3" ? "bg-red-500" : "bg-gray-400"
                    }`}
                    onClick={() => changeReportViewAgent("3")}
                  >
                    3
                  </button>
                  {(<button
                    className={`h-[50px] w-[50px] rounded-full ${
                      reportModeView === "4" ? "bg-red-500" : "bg-gray-400"
                    }`}
                    onClick={() => changeReportViewAgent("4")}
                  >
                    Answer
                  </button>)}
                </div>

                {reportModeView == "1" && (
                  <>
                    <ReportView1 reportModeView={reportModeView} setReportModeView={setReportModeView} message={messages1} setMessages={setMessages1} finalAnswer={answer1} setFinalAnswer={setAnswer1} subQueryArray={subQueryArray1} setSubQueryArray={setSubQueryArray1} subqueryNodeMap={subqueryNodeMap1} setSubqueryNodeMap={setSubqueryNodeMap1} subqueryStatusMap={subqueryStatusMap1} setSubqueryStatusMap={setSubqueryStatusMap1} handlingStatus={handlingStatus1} setHandlingStatus={setHandlingStatus1}/>
                  </>
                )}
                {reportModeView == "2" && <ReportView2 reportModeView={reportModeView} setReportModeView={setReportModeView} message={messages2} setMessages={setMessages2} finalAnswer={answer2} setFinalAnswer={setAnswer2} subQueryArray={subQueryArray2} setSubQueryArray={setSubQueryArray2} subqueryNodeMap={subqueryNodeMap2} setSubqueryNodeMap={setSubqueryNodeMap2} subqueryStatusMap={subqueryStatusMap2} setSubqueryStatusMap={setSubqueryStatusMap2} handlingStatus={handlingStatus2} setHandlingStatus={setHandlingStatus2}/>}
                {reportModeView == "3" && <ReportView3 reportModeView={reportModeView} setReportModeView={setReportModeView} message={messages3} setMessages={setMessages3} finalAnswer={answer3} setFinalAnswer={setAnswer3} subQueryArray={subQueryArray3} setSubQueryArray={setSubQueryArray3} subqueryNodeMap={subqueryNodeMap3} setSubqueryNodeMap={setSubqueryNodeMap3} subqueryStatusMap={subqueryStatusMap3} setSubqueryStatusMap={setSubqueryStatusMap3} handlingStatus={handlingStatus2} setHandlingStatus={setHandlingStatus3}/>}
                {reportModeView == "4" && <ReportView4 reportModeView={reportModeView} setReportModeView={setReportModeView} finalAnswer={answer_final} setFinalAnswer={setAnswerFinal}/>}
              </div>

              <div className="container mt-1 px-4 lg:px-0">
                <InputArea
                  promptValue={promptValue}
                  setPromptValue={setPromptValue}
                  handleDisplayResult={sendQuesReportView}
                  disabled={loading}
                  reset={reset}
                />
              </div>

            
            <button
                className="fixed right-[200px] top-4 w-[150px] rounded-2xl bg-[#630303] px-6 py-2 text-red-300"
                onClick={handleDashboardClick}
            >
                Dashboard
            </button>
            <button
                className="fixed right-4 top-4 w-[150px] rounded-2xl bg-[#630303] px-6 py-2 text-red-300"
                onClick={switchMode}
            >
                {AppModeVar}
            </button>
            
                
            </div>
          </>
        )}
      </main>

      {/* <Footer /> */}
    </>
  );
}
