from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from groq import Groq
import re
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

class Subtask(BaseModel):
    description: str
    technical_description: str
    estimated_time: str
    subtasks: List['Subtask'] = []

class Task(BaseModel):
    task: str
    estimated_time: str
    technical_description: str
    subtasks: List[Subtask] = []

class ProjectRequest(BaseModel):
    query: str

# Global variable to store progress
progress = {"current_depth": 0, "max_depth": 3}

def extract_json(text):
    """Extract JSON from text, even if there's additional content."""
    logger.info(f"Attempting to extract JSON from: {text}")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'(\{[\s\S]*\})', text)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
    
    logger.warning("Failed to extract JSON from text")
    return None

def recursive_breakdown(task, initial_prompt, depth=0, max_depth=3):
    global progress
    progress["current_depth"] = depth
    progress["max_depth"] = max_depth

    logger.info(f"Processing task at depth {depth}: {task}")
    if depth >= max_depth:
        return Task(task=task, estimated_time="", technical_description="", subtasks=[])

    prompt = f"""
    As an experienced technical software engineering project manager at Google, break down the following task into 3-5 smaller subtasks:
    
    Initial Project: {initial_prompt}
    Current Task: {task}

    Remember to keep the subtasks specific and always relate them back to the initial project. Each subtask should be a concrete step towards completing the overall project.

    For each subtask, provide:
    1. A brief description that clearly relates to both the current task and the initial project
    2. An in-depth technical description of the subtask (150-250 words) that explains how it fits into the overall project
    3. Estimated time to complete (in hours)

    Format your response STRICTLY as a JSON object with the following structure, and NOTHING ELSE:
    {{
        "task": "Current task description",
        "estimated_time": "Total estimated time in hours",
        "technical_description": "Detailed technical description of the current task",
        "subtasks": [
            {{
                "description": "Subtask 1 brief description",
                "estimated_time": "Estimated time for subtask 1",
                "technical_description": "Detailed technical description of subtask 1"
            }},
            ...
        ]
    }}
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful project management assistant. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama3-8b-8192",
        )

        content = response.choices[0].message.content
        logger.info(f"Received response from API: {content}")
        result = extract_json(content)

        if result is None:
            logger.error("Could not extract valid JSON from API response")
            return Task(task=task, estimated_time="", technical_description="", subtasks=[])

        task_result = Task(**result)
        for subtask in task_result.subtasks:
            try:
                subtask_breakdown = recursive_breakdown(subtask.description, initial_prompt, depth + 1, max_depth)
                subtask.subtasks = subtask_breakdown.subtasks
            except Exception as e:
                logger.error(f"Error processing subtask: {str(e)}")
                continue

        return task_result

    except Exception as e:
        logger.error(f"Error occurred while processing the API response: {str(e)}")
        return Task(task=task, estimated_time="", technical_description="", subtasks=[])

@app.post("/api/query")
async def process_query(request: ProjectRequest):
    try:
        result = recursive_breakdown(request.query, request.query)  # Pass initial prompt
        return result
    except Exception as e:
        logger.error(f"Error in process_query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/progress")
async def get_progress():
    global progress
    return progress

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)