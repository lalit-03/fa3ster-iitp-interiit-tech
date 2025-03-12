import os
import streamlit as st
from pprint import pprint
import sys
import io
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from langchain_community.callbacks import get_openai_callback
import matplotlib.pyplot as plt
import json
import os
import re
import time
import logging
from reportlab.lib.pagesizes import letter
from tools.helper import save_to_pdf 
import uuid
from pprint import pprint
from typing import List
from tools.helper import MoveCharts
from guardrails.llamaguard import llamaguard
# from guardrails.PII import pii_remover
from tools.helper import append_to_file

def load_environment_variables():
    """Load environment variables from a .env file."""
    load_dotenv()

    os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
    os.environ["COHERE_API_KEY"] = os.getenv("COHERE_API_KEY")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./credentials.json"
    os.environ["TAVILY_API_KEY"] = os.getenv("TAVILY_API_KEY")
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")


load_environment_variables()

from agents.Chart_Agent import chart_generator
from agents.SQLAgent import SQLAgent
from agents.TableMaker import TableMaker
from agents.FDD_Agents import executive_agent_mode,key_metrics_agent_mode,business_model_agent_mode
from agents.FDD_generator import FDD_Generator_handeler
from agents.visual_json import get_json
from agents.Disc_reframer import Disc_question_reframer
from agents.answer_aggregator import aggregator
from agents.answer_grader import answer_grader
from agents.document_relevent_router import relevency_router
from agents.finance_react_agent import finance_react_agent
from agents.finance_agent import finance_agent
from agents.hallucination_grader import hallucination_grader
from agents.main_router import question_router
from agents.query_decomposition import decomposer
from agents.question_rewritter import question_rewriter
from agents.reasoning_agent import reasoner
from agents.rectifier import rectifier
from agents.retrieval_grader import retrieval_grader
from agents.verification_agent import verifier
from langchain.schema import Document
from langgraph.graph import END, START, StateGraph
from IPython.display import Image, display
from langchain_core.runnables.graph import CurveStyle, MermaidDrawMethod, NodeStyles
from rag.rag import (
    compress_documents,
    create_compressor,
    create_groq_llm,
    create_openai_llm,
    create_pathway_client,
    create_prompt_template,
    get_answer,
    retrieve_relevant_documents,
)
from tools.bar_maker import generate_bar_chart
from tools.line_maker import generate_line_chart
from tools.pie_maker import generate_pie_chart
from tools.tools import web_search_tool
from tools.tools import duckduckgo_tool
from typing_extensions import TypedDict

llm = create_openai_llm()
prompt = create_prompt_template()
BASELINE_VERIFICATION_QUESTIONS = []

# need to add this as a state value in workflow, havent done it yet
NOT_SUPPORTED_COUNTER = 0
WEB_SEARCH_COUNTER = 0

# Redirecting stdout to capture print statements (for logging)
class StreamToLogger(io.StringIO):
    def __init__(self):
        super().__init__()
        self.log = ""
    
    def write(self, message):
        self.log += message + "\n"  # Add newline to each log message for clarity
        sys.__stdout__.write(message)  # Also write to the original stdout
    
    def get_logs(self):
        logs = self.log.strip()  # Remove any leading/trailing whitespace
        self.clear_logs()  # Clear logs after retrieval to prevent duplication
        return logs
    
    def clear_logs(self):
        self.log = ""  # Clear stored logs

logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    force=True,
    format="G2%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)    

logger_stream = StreamToLogger()
sys.stdout = logger_stream  # Redirects print statements to this logger

        
class GraphState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        question: question
        generation: LLM generation
        documents: list of documents
        max_revision: int
    """

    question: str
    generation: str
    documents: List[str]
    revision_number: int
    max_revisions: int
    final_generation: str
    first_attempt: bool

tokens=0
inp_tok=0

async def retrieve(state):
    """
    Retrieve documents based on the current state.

    Args:
        state (dict): The current graph state.

    Returns:
        dict: Updated state with the key "documents" containing retrieved and compressed documents.
    """
    if "revision_number" not in state or "question" not in state:
        raise ValueError("State must contain 'revision_number' and 'question' keys.")

    question = state["question"]

    # Initialize token tracking
    global tokens
    global inp_tok
    tok = 0
    pr_tok = 0
    try:

        # if state.get("revision_number", 0) == 0:
        print("---RETRIEVE---")
        #print("Question",state["question"])
        # Retrieval
        retriever = await create_pathway_client()
        compressor = create_compressor()

        tok, pr_tok, compressed_docs = compress_documents(retriever, question, compressor)
        tokens += tok
        inp_tok += pr_tok
        print("Len Docs:",len(compressed_docs))
        if not compressed_docs:
            print("No documents retrieved or compressed.")

        return {
            "documents": compressed_docs,
            "question": question,
            # "revision_number": state["revision_number"] + 1,
            "revision_number": state["revision_number"],
            "max_revisions": state["max_revisions"],
            "first_attempt": state["first_attempt"]
        }

    except:
        return web_search(state)


def generate(state):
    """
    Generate answer

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): New key added to state, generation, that contains LLM generation
    """
    print("---GENERATE---")
    print("Question",state["question"])
    global tokens, inp_tok

    question = state["question"]
    documents = state["documents"]
    print(f"In GETANSWER {documents}")

    final_answer_pairs = ""
    for doc in documents:
        try:
            final_answer_pairs += "###Document::\n" + f'content: {doc.page_content} || doc name :{doc.metadata["name"]} || page number: {doc.metadata["page_number"]}'
        except:
            final_answer_pairs += "###Document::\n" + f'content: {doc.page_content} || metadata: {doc.metadata}'
        
        
    tok, pr_tok, generation = get_answer(final_answer_pairs, question, llm, prompt)
    tokens += tok
    inp_tok += pr_tok
    print("Generate node output: ", generation)
    print(f"Total tokens: {tok}")
    print(f"Prompt tokens: {pr_tok}")
    print("First Generation: ", state["first_attempt"])

    return {
        "documents": documents,
        "question": question,
        "final_generation": generation,
        "revision_number": state["revision_number"],
        "max_revisions": state["max_revisions"],
        "first_attempt": state["first_attempt"]
    }



def grade_documents(state):
    global tokens
    global inp_tok
    """
    Determines whether the retrieved documents are relevant to the question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates documents key with only filtered relevant documents
    """

    print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
    print("Question",state["question"])
    question = state["question"]
    documents = state["documents"]

    # Score each document
    filtered_docs = []
    for doc in documents:
        with get_openai_callback() as cb:
            score = retrieval_grader.invoke({"question": question, "document": doc.page_content})
        tokens += cb.total_tokens
        inp_tok += cb.prompt_tokens
        print(cb.total_tokens)
        print(cb.prompt_tokens)
        
        if score.binary_score == "yes":
            print("---GRADE: DOCUMENT RELEVANT---")
            filtered_docs.append(doc)
        else:
            print("---GRADE: DOCUMENT NOT RELEVANT---")

    if state["revision_number"] == state["max_revisions"]:
        print("----MAXIMUM REVISIONS REACHED, NOT FILTERING DOCUMENTS----")
        return {"documents": documents, "question": question}

    return {
        "documents": filtered_docs,
        "question": question,
        "revision_number": state["revision_number"],
        "max_revisions": state["max_revisions"],
        "first_attempt": state["first_attempt"]
    }


def transform_query(state):
    global tokens
    global inp_tok
    """
    Transform the query to produce a better question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates question key with a re-phrased question
    """

    print("---TRANSFORM QUERY---")
    print("Question",state["question"])
    question = state["question"]
    documents = state["documents"]

    # Re-write the question
    with get_openai_callback() as cb:
        better_question = question_rewriter.invoke({"question": question})
        state["revision_number"] += 1

    # Update token counts
    tokens += cb.total_tokens
    inp_tok += cb.prompt_tokens

    print(f"Total tokens: {cb.total_tokens}")
    print(f"Prompt tokens: {cb.prompt_tokens}")
    
    if state["first_attempt"] == True:
        state["first_attempt"] = False

    return {
        "documents": documents,
        "question": better_question,
        "revision_number": state["revision_number"],
        "max_revisions": state["max_revisions"],
        "first_attempt": state["first_attempt"]
    }


def web_search(state):
    """
    Web search based on the re-phrased question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates documents key with appended web results
    """

    question = state["question"]
    state["documents"]=state.get("documents",[])
    
    for doc in state["documents"]:
        if doc.metadata.get("source")=="web_search":
           return state 
    
    print("---WEB SEARCH---")
    print("Question",state["question"])
        
    # Perform web search
    try:
        search_results = web_search_tool.invoke({"query": question})
    except Exeption as e:
        print(f"Tavily Web search failed...{e}")
        try:
            print("Using DuckDuck go search...")
            search_results = duckduckgo_tool.invoke(question)
            search_results = [{"content": result} for result in search_results]
            
        except Exception as e:
            print(f"DuckDuckGo search failed...{e}")
            search_results = []
    
    # Combine search results into a single document
    try:
        combined_results = "\n".join([result["content"] for result in search_results])
    except Exception as e:
        print(f"Error combining search results: {e}")
        print("Search results: ", search_results)
        combined_results = ""
    web_document = Document(page_content=combined_results, metadata={"source": "web_search"})
    state["documents"].extend([web_document])
    # print("DOCUMENTS-WEB_SEARCH",state["documents"])
    global WEB_SEARCH_COUNTER
    WEB_SEARCH_COUNTER += 1
    return {
        "documents": state["documents"], 
        "question": question,
        "revision_number": state["revision_number"],
        "max_revisions": state["max_revisions"],
        "first_attempt": state["first_attempt"]
    }


### Edges ###


def route_question(state):
    """
    Route question to web search or RAG.

    Args:
        state (dict): The current graph state

    Returns:
        str: Next node to call
    """

    print("---ROUTE QUESTION---")
    print("Question",state["question"])
    global tokens, inp_tok
    question = state["question"]

    # Determine routing using question_router with token tracking
    with get_openai_callback() as callback:
        routing_result = question_router.invoke({"question": question})
        
        # Update token counters
        tokens += callback.total_tokens
        inp_tok += callback.prompt_tokens
        
        # Log token usage
        print(f"Total tokens: {callback.total_tokens}")
        print(f"Prompt tokens: {callback.prompt_tokens}")

    # Route based on determined data source
    if routing_result.datasource == "web_search":
        print("---ROUTE QUESTION TO WEB SEARCH---")
        return "web_search"
    else:  # vectorstore case
        print("---ROUTE QUESTION TO RAG---")
        return "vectorstore"

def decide_to_retrieve(state):
    """
    Determines whether to retrieve a question (compressed or without compression handled inside retriever) 
    or web-search
    Args:
        state (dict): The current graph state
    Returns:
        str: Next node to call
    """
    print("---Decide To Review---")
    print("Question",state["question"])
    if state["revision_number"] <= 1:
        return "retrieve"
    else:
        return "web_search"
    
    
def decide_to_generate(state):
    """
    Determines whether to generate an answer, re-generate a question, 
    or route to financial or SQL agents based on the document structure.

    Args:
        state (dict): The current graph state

    Returns:
        str: Next node to call
    """
    global tokens
    global inp_tok
    print("---ASSESS GRADED DOCUMENTS---")
    print("Question",state["question"])
    question = state["question"]
    filtered_documents = state["documents"]
    # print("filtered documents: ", filtered_documents)
    filtered_documents = [doc.page_content for doc in filtered_documents]
    
    with get_openai_callback() as cb:
        answerability = relevency_router.invoke({"question": question, "context": filtered_documents})
    
    tokens += cb.total_tokens
    inp_tok += cb.prompt_tokens
    
    print(cb.total_tokens)
    print(cb.prompt_tokens)
    print("Answerability: ", answerability)
    
    if filtered_documents and answerability.datasource != "answerable" and state["first_attempt"]==False:
        print("---DECISION: REDIRECTING TO FINANCE AGENT ---")
        return "not_answerable"

    # Check if all documents are filtered out and if more revisions are allowed
    if not filtered_documents and state["revision_number"] < state["max_revisions"]:
        print("---DECISION: ALL DOCUMENTS ARE NOT RELEVANT TO QUESTION, TRANSFORM QUERY---")
        return "transform_query"

    # Check for multiple tables in "text_as_html"
    
    total_table_count = 0
    for doc in filtered_documents:
        # st.write(doc)
        if "text_as_html" in doc:
            soup = BeautifulSoup(doc["text_as_html"], "html.parser")
            total_table_count += len(soup.find_all("table"))

    if total_table_count >= 2:
        print("---DECISION: MULTIPLE TABLES DETECTED, ROUTING TO SQL_AGENT---")
        return "sql_agents"

    # We have relevant documents, so generate answer
    print("---DECISION: GENERATE---")
    return "generate"


def grade_generation_v_documents_and_question(state):
    global tokens
    global inp_tok
    """
    Determines whether the generation is grounded in the document and answers question.

    Args:
        state (dict): The current graph state

    Returns:
        str: Decision for next node to call
    """

    print("---CHECK HALLUCINATIONS---")
    print("Question",state["question"])
    global tokens, inp_tok
    question = state["question"]
    documents = state["documents"]
    documents_content = [doc.page_content for doc in documents]
    generation = state["final_generation"]

    # Check for hallucinations
    with get_openai_callback() as cb:
        score = hallucination_grader.invoke({"documents": documents_content, "generation": generation})
        hallucination_grade = score.binary_score
    tokens += cb.total_tokens
    inp_tok += cb.prompt_tokens
    print(cb.total_tokens)
    print(cb.prompt_tokens)

    if hallucination_grade == "yes":
        print("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---")
        
        # Check if the generation answers the question
        print("---GRADE GENERATION vs QUESTION---")
        with get_openai_callback() as cb:
            score = answer_grader.invoke({"question": question, "generation": generation})
            answer_grade = score.binary_score
        tokens += cb.total_tokens
        inp_tok += cb.prompt_tokens
        print(cb.total_tokens)
        print(cb.prompt_tokens)

        if answer_grade == "yes":
            print("---DECISION: GENERATION ADDRESSES QUESTION---")
            return "useful"
        else:
            if state["first_attempt"] == True:
                return "not useful"
                
            if state["revision_number"] >= state["max_revisions"]:
                print("---DECISION: MAX REVISIONS REACHED, STOPPING---")
                return "stop"
            else:
                print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---")
                return "not useful"
    else:
        if state["first_attempt"] == True:
            return "not useful"
        
        if state["revision_number"] >= state["max_revisions"]:
            print("---DECISION: MAX REVISIONS REACHED, STOPPING---")
            return "stop"
        else:
            global NOT_SUPPORTED_COUNTER
            NOT_SUPPORTED_COUNTER += 1
            if NOT_SUPPORTED_COUNTER >= 3:
                print("---DECISION: TOO MANY UNSUPPORTED GENERATIONS, STOPPING---")
                return "stop" #We changed it because as sosn as main roter routes a query to web_search and the retrieved content doesn't satisfy for 3 continious web search rather than going to financial agent it stops and generate irrelevant result. 
                # return "financial_agent"
            print("---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, RE-TRYING---")
            return "not supported"


def finance_tool_agent(state):
    """
    Call finance agent tools.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): New key added to state, generation, that contains LLM generation
    """
    print("---FINANCE AGENT---",state["question"])
    question = state["question"]
    documents = state["documents"]
    global tokens
    global inp_tok
    
    # Invoke the finance agent
    with get_openai_callback() as cb:
        generation = finance_agent.invoke(question)
        web_search_flag = False
        for gen in generation:
            # print("GEN",gen)
            try:
                if "Will be right back" in gen['output'][0][0]:
                  web_search_flag = True
            except Exception as e:
                pass
            try:
                if "Failed to get" in gen['output']:
                  web_search_flag = True
            except Exception as e:
                pass
        # print("GENERATION",generation)
    tokens += cb.total_tokens
    inp_tok += cb.prompt_tokens
    print(cb.total_tokens)
    print(cb.prompt_tokens)
    
    global WEB_SEARCH_COUNTER
    if web_search_flag and WEB_SEARCH_COUNTER == 0:
        generation.append({"output": web_search(state)["documents"][-1].page_content})
    
    final_generation = [item['output'] for item in generation]

    if len(final_generation)==0:
        final_generation = [web_search(state)["documents"][-1].page_content]
        
    final_generation_string=f"{final_generation}"
    
    return {
        "documents": documents,
        "question": question,
        "generation": final_generation_string,
        "revision_number": state["revision_number"], 
        "max_revisions": state["max_revisions"],
    }


def chart_Agents(generation):
    print("---CHART CREATING AGENT---")

    # Generate the chart reasoning response
    chart_data_response = chart_generator.invoke({"generation": generation})
    print(f"Chart Data Response: {chart_data_response}")

    # Check if the response indicates no chart is possible
    if "No chart possible" in chart_data_response:
        print("No chart can be generated from this context.")
        return "No chart created."

    try:
        # Extract the JSON from the response using regex
        json_match = re.search(r"\{.*\}", chart_data_response, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON found in the response.")

        json_text = json_match.group(0)  # Extract the JSON string
        chart_data = json.loads(json_text)  # Parse the JSON string

        # Determine chart type and delegate to the appropriate function
        chart_type = chart_data.get("chartType", "").lower()

        # Generate a unique file path
        save_dir = "charts"
        os.makedirs(save_dir, exist_ok=True)

        # Check if file already exists and create a unique name
        base_filename = "chart.png"
        save_path = os.path.join(save_dir, base_filename)
        counter = 1
        while os.path.exists(save_path):
            save_path = os.path.join(save_dir, f"chart_{counter}.png")
            counter += 1

        if chart_type == "bar":
            return generate_bar_chart(chart_data, save_path)
        elif chart_type == "line":
            return generate_line_chart(chart_data, save_path)
        elif chart_type == "pie":
            return generate_pie_chart(chart_data, save_path)
        else:
            raise ValueError(f"Unsupported chart type: {chart_type}")

    except json.JSONDecodeError as jde:
        print(f"JSON parsing error: {jde}")
        return "Failed to create chart due to JSON parsing error."
    except Exception as e:
        print(f"Error in chart generation: {e}")
        return "Failed to create chart."


def reasoning_agent(state):
    """
    Reason based on the question and documents.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): New key added to state, generation, that contains LLM generation
    """
    print("---REASON AGENT---")
    print("Question",state["question"])
    question = state["question"]
    documents = state["documents"]
    finance_agent_generation = state["generation"]
    # docs_content = [doc.page_content for doc in documents]
    global tokens, inp_tok

    with get_openai_callback() as cb:
        reasoning_output = reasoner.invoke({"question": question, "documents": finance_agent_generation})

        new_document = Document(page_content=reasoning_output, metadata={"source":"web search or finance tools"})
        state['documents'].append(new_document)

        if any(keyword in reasoning_output.lower() for keyword in ["chart", "graph", "visualize", "plot"]):
            print("Reasoning indicates a chart may need to be created. Trying to create the chart\n")
            save_path = chart_Agents(reasoning_output)
            if save_path is not None:
                print(f"Saved the image in: {save_path}")

    tokens += cb.total_tokens
    inp_tok += cb.prompt_tokens
    print(cb.total_tokens)
    print(cb.prompt_tokens)

    return {
        "documents": state['documents'],
        "question": question,
        "revision_number": state["revision_number"],
        "max_revisions": state["max_revisions"],
    }


def sql_agents(state):
    """
    Handle SQL-based questions by processing metadata and querying the database.

    Args:
        state (dict): The current graph state.

    Returns:
        state (dict): Updated state with the SQL query result.
    """
    print("---SQL QUERY---")
    print("Question",state["question"])
    # Process metadata and populate the database
    chunk = state["document"]
    table_maker = TableMaker(db_name="testDB.db")
    table_maker.process_chunk(chunk)

    # Initialize the SQLAgent
    sql_agent = SQLAgent(
        api_key=os.getenv["GROQ_API_KEY"],
        db_path="example.db",
        google_api_key=os.getenv("GOOGLE_API_KEY")
    )

    # Ask the SQLAgent for the answer
    question = state["question"]
    answer = sql_agent.ask_question(question)
    answer_string=f"{answer}"
    # print(f"SQL Query Result: {answer}")
    state["documents"].append(Document(page_content=answer_string), metadata={"source":"sql_agent_output"})
    state["first_attempt"] = False
    return state


workflow = StateGraph(GraphState)

# Define the nodes (same as provided)
workflow.add_node("web_search", web_search)  
workflow.add_node("retrieve", retrieve) 
workflow.add_node("grade_documents", grade_documents)  
workflow.add_node("generate", generate) 
workflow.add_node("transform_query", transform_query)
workflow.add_node("finance_agent", finance_tool_agent) 
workflow.add_node("reasoning_agent", reasoning_agent) 
workflow.add_node("sql_agents", sql_agents)

# Directly add an edge from START to the "retrieve" node
workflow.add_edge(START, "retrieve")

# workflow.add_edge("web_search", "generate")
workflow.add_edge("retrieve", "grade_documents") #Based on web search it oftent directly generates output without financial tools
workflow.add_edge("web_search", "finance_agent")

workflow.add_conditional_edges(
    "grade_documents",
    decide_to_generate,
    {
        "transform_query": "transform_query",
        "not_answerable": "finance_agent",
        "generate": "generate",
        "sql_agents" : "sql_agents",
    },
)

workflow.add_edge("finance_agent", "reasoning_agent")
workflow.add_edge("reasoning_agent", "generate")
workflow.add_conditional_edges(
    "transform_query",
    decide_to_retrieve,
    {
        "retrieve": "retrieve",
        "web_search": "web_search",
    },
)

workflow.add_conditional_edges(
    "sql_agents",
    grade_generation_v_documents_and_question,
    {
        "not supported": "generate",
        "useful": END,
        "not useful": "transform_query",
        "stop": END,
    },
)

workflow.add_conditional_edges(
    "generate",
    grade_generation_v_documents_and_question,
    {
        "not supported": "generate",
        "useful": END,
        "not useful": "transform_query",
        "stop": END,
    },
)



# Compile
app = workflow.compile()

from PIL import Image as PILImage
import io
import asyncio
import os 

output_dir =  os.path.join(os.getcwd()  ,"Pathway_chatbot")
os.makedirs(output_dir, exist_ok=True)

try:
    image_data = app.get_graph().draw_mermaid_png(
        draw_method=MermaidDrawMethod.API,
    )
    image = PILImage.open(io.BytesIO(image_data))
    image.save("workflow.png")

    # Write the mermaid code to a txt file
    mermaid_code = app.get_graph().draw_mermaid()
    with open("workflow_mermaid.txt", "w") as file:
        file.write(mermaid_code)
except Exception as e:
    print(f"An error occurred: {e}")


import asyncio

from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware



# Define a Pydantic model to parse the input data
class RequestModel(BaseModel):
    ques: str
    
appFAPI = FastAPI()

import socketio
import eventlet
import eventlet.wsgi
from flask import Flask
import json


# app = FastAPI()
appSock = FastAPI()
current_task = None
sio = socketio.AsyncServer(async_mode="asgi",cors_allowed_origins="*")  # AsyncServer for FastAPI
appSock = socketio.ASGIApp(sio, other_asgi_app=appFAPI)  # Integrate Socket.IO with FastAPI app


#FAST API POST REQUEST PART


# Handle connections from frontend
#----------------------------------------------------------

@sio.event
def connect(sid, environ):
    # sio.emit('message_to_frontend_answer', json.dumps("yayyyy bitch"))
    print(f'Client connected: {sid}')
    # sio.emit('message_to_frontend_subquery_start', json.dumps("connnected bitch"))

@sio.event
def disconnect(sid):
    print(f'Client disconnected: {sid}')
    
#----------------------------------------------------------


async def Generator(subQueries, verification=" "):
    generations = []  # To store all generations

    async def process_subquery(sub_query):
        print(f"#### Processing {verification} query: {sub_query}")
        try:
            await sio.emit('message_to_frontend_subquery_start', json.dumps(sub_query))
        except Exception as e:
            print("not able to send subquery start msgs",e)
        print("-" * 50)

        count = 0
        # Run the streaming process for each query
        async for output in app.astream({"question": sub_query, "revision_number": 0, "max_revisions": 2, "first_attempt":True }):
            # Capture output generation steps
            for key, value in output.items():
                print(f"#### At Node {key}")
                data = {
                        "sub_query": sub_query,  # Add sub_query
                        "node": key               # Add key
                    }
                
                await sio.emit('message_to_frontend_atnode', json.dumps(data))

            logs = logger_stream.get_logs()
            if logs:
                print("Logs:")
                print(logs)
            
        print(f"Subquery {sub_query} processed successfully") 
        data = {
                "sub_query": sub_query,  # Add sub_query
            }
        await sio.emit('message_to_frontend_subquery_end', json.dumps(data))
        return {"query": sub_query, "generation": value["final_generation"]}
        count += 1

    tasks = [process_subquery(sub_query) for sub_query in subQueries]
    generations = await asyncio.gather(*tasks)
    
    if(generations):
        await sio.emit('message_to_frontend_all_subs_processed', "hello")

    return generations


data = {
        "question_by_key": """ """,
        "question_by_business": """ """,
        "question_by_executive": """ """,
        "answer_for_key": """ """,
        "answer_for_business" : """ """,
        "answer_for_executive" : """ """,
        "agent_used" : """""",
        "suggestion_by_key" : """ """,
        "suggestion_by_business" : """ """,
        "suggestion_by_executive": """ """,
        "Is_key_metrics_satisfied" : "0",
        "Is_business_metrics_satisfied" : "0",
        "Is_executive_metrics_satisfied" : "0"
    }

filename = "text_output.txt"
FDD_rev = 0
Rev_limit = 2
from tools.helper import append_to_file



async def getFDD(query):
    #hello
    return 0

async def getFinalAnswer(query_input):
    if query_input:
        logger_stream.clear_logs()  # Clear any previous logs

        # Decompose the input query into sub-queries
        inputs = {"question": query_input, "revision_number": 0, "max_revisions": 2, "first_attempt":True}
        
        # Initialize the NOT_SUPPORTED_COUNTER
        NOT_SUPPORTED_COUNTER = 0

        with get_openai_callback() as cb:
            subQueries = decomposer.invoke(inputs).sub_queries

        # Track token usage
        tokens = cb.total_tokens
        inp_tok = cb.prompt_tokens

        print("### Sub-queries:", subQueries)
        await sio.emit('message_to_frontend_subquery_array', json.dumps(subQueries))

        # Generate outputs for the sub-queries
        generations = await Generator(subQueries, verification=" ")
        answers = []
        for gen in generations:
            if gen and "generation" in gen:
                answers.append(gen["generation"])

        # Aggregate answers and display final answer
        final_answer = None
        if generations:
            with get_openai_callback() as cb:
                ans = aggregator.invoke({"question": query_input, "answers": ", ".join(answers)})
            tokens += cb.total_tokens
            inp_tok += cb.prompt_tokens
            final_answer = ans.answer
            # print(f"Tokens used: {tokens}")
            # print(f"Input tokens used: {inp_tok}")

        # Optional: Verification Chain (uncomment if needed)
        # baseline_response = ans.answer
        # BASELINE_VERIFICATION_QUESTIONS.extend(verifier.invoke({"query": query_input, "baseline_response":baseline_response}).verification_questions)
        # verification_query_responses = await Generator(BASELINE_VERIFICATION_QUESTIONS, verification=" verification ")
        # verified_answers = []
        # for gen in verification_query_responses:
        #     verified_answers.append(gen["generation"])
        # verified_answer = rectifier.invoke({"query": query_input, "baseline_response": baseline_response, "verified_answers": verified_answers}).corrected_baseline
        # print("### Verified Final Answer:")
        # print(verified_answer)

        # Show final log state
        # print("Logs:")
        # print(logger_stream.get_logs())
        
        return final_answer
    

# Define the allowed origins (e.g., specific frontend URL or "*")
origins = [
    "http://localhost:3000",  # React app running on localhost:3000
    "http://localhost:5173",  # Another local frontend
    "*"  # Allows all origins (not recommended for production)
]

# Add CORSMiddleware to allow cross-origin requests
appFAPI.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows requests from these origins
    allow_credentials=True,  # Allows sending cookies or authentication headers
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers (Content-Type, Authorization, etc.)
)





@appFAPI.post("/ask")
async def add(request: RequestModel):
    global current_task  # Reference the global task variable
    
      # If there's an ongoing task, cancel it before starting a new one
    if current_task and not current_task.done():
        current_task.cancel()
    
    # Start the task to get the final answer
    current_task = asyncio.create_task(getFinalAnswer(request.ques))
    
    try:
        final_answer = await current_task
        if final_answer:
            await sio.emit('message_to_frontend_answer', json.dumps(final_answer))
            return {"final ans": final_answer}
        else:
            return {"error": "No final answer"}
    except asyncio.CancelledError:
        return {"status": "Task was cancelled"}
    
@appFAPI.post("/stop")
async def stop_execution():
    global current_task  # Reference the global task variable
    
    if current_task and not current_task.done():
        print("current task cancelled")
        current_task.cancel()  # Cancel the ongoing task
        return {"status": "Task has been cancelled"}
    else:
        print("No running task to cancel")
        return {"status": "No running task to cancel"}


import threading

# Color codes for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"

    
import logging


    
# Custom logger for FastAPI
fastapi_logger = logging.getLogger("fastapi_logger")
fastapi_handler = logging.StreamHandler(sys.stdout)
fastapi_handler.setFormatter(logging.Formatter(f"{YELLOW}%(asctime)s - FastAPI - %(message)s{RESET}"))
fastapi_logger.addHandler(fastapi_handler)
fastapi_logger.setLevel(logging.INFO)

# Custom logger for Flask
flask_logger = logging.getLogger("flask_logger")
flask_handler = logging.StreamHandler(sys.stdout)
flask_handler.setFormatter(logging.Formatter(f"{GREEN}%(asctime)s - Flask - %(message)s{RESET}"))
flask_logger.addHandler(flask_handler)
flask_logger.setLevel(logging.INFO)


# Override Uvicorn's logger configuration
class UvicornCustomLogger(logging.Filter):
    def filter(self, record):
        # Modify record.msg to add color
        record.msg = f"{YELLOW}{record.msg}{RESET}"
        return True

uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.addFilter(UvicornCustomLogger())
uvicorn_logger.setLevel(logging.INFO)

# Override Flask's logger configuration
flask_log = logging.getLogger('flask.app')
for handler in flask_log.handlers:
    flask_log.removeHandler(handler)
flask_log.addHandler(flask_handler)
flask_log.setLevel(logging.INFO)


def run_fastapi():
    fastapi_logger.info("Starting FastAPI server on port 5091...")
    uvicorn.run(appFAPI, host="0.0.0.0", port=5091, log_level="info")

def run_sock():
    fastapi_logger.info("Starting FastAPI server on port 7770...")
    uvicorn.run(appSock, host="0.0.0.0", port=7770)



if __name__ == "__main__":
    # asyncio.run(main())
    # uvicorn.run(appFAPI, host="0.0.0.0", port=5091)
    # eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 7770)), appFlask)
    
    
    fastapi_thread = threading.Thread(target=run_fastapi)
    flask_thread = threading.Thread(target=run_sock)

    fastapi_thread.start()
    flask_thread.start()

    fastapi_thread.join()
    flask_thread.join()