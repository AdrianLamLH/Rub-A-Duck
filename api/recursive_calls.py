from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
# from groq import Groq
from cerebras.cloud.sdk import Cerebras
import re
import json
import logging
from jira import JIRA
from jira.exceptions import JIRAError
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL"),"http://localhost:3000"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

## Groq Client
# client = Groq(
#     api_key=os.environ.get("GROQ_API_KEY"),
# )

## Cerebras Client
client = Cerebras(
    # This is the default and can be omitted
    api_key=os.environ.get("CEREBRAS_API_KEY"),
)

class Subtask(BaseModel):
    description: str
    technical_description: str
    estimated_time: str
    subtasks: List['Subtask'] = []

class Task(BaseModel):
    description: str
    technical_description: str
    estimated_time: str
    subtasks: List[Subtask] = []

class ProjectRequest(BaseModel):
    query: str

# Global variable to store progress
progress = {"current_depth": 0, "max_depth": 2}

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

def recursive_breakdown(description, initial_prompt, depth=0, max_depth=2):
    global progress
    progress["current_depth"] = depth
    progress["max_depth"] = max_depth
    logger.info(f"Progress updated: depth={depth}, max_depth={max_depth}")

    logger.info(f"Processing task at depth {depth}: {description}")
    if depth >= max_depth:
        logger.info(f"Reached max depth. Returning basic task.")
        return Task(description=description, estimated_time="", technical_description="", subtasks=[])

    prompt = f"""
    As an experienced technical software engineering project manager at Google, break down the following task into 3-5 smaller subtasks:
    
    Initial Project: {initial_prompt}
    Current Task: {description}

    Remember to keep the subtasks specific and always relate them back to the initial project. Each subtask should be a concrete step towards completing the overall project.

    For each subtask, provide:
    1. A brief description that clearly relates to both the current task and the initial project (MUST BE LESS THAN 255 characters)
    2. An in-depth technical description of the subtask (150-250 words) that explains how it fits into the overall project
    3. Estimated time to complete (in hours)

    Format your response STRICTLY as a JSON object with the following structure, and NOTHING ELSE:
    {{
        "description": "Current task description (MUST BE LESS THAN 255 characters)",
        "estimated_time": "Total estimated time in hours",
        "technical_description": "Detailed technical description of the current task",
        "subtasks": [
            {{
                "description": "Subtask 1 brief description (MUST BE LESS THAN 255 characters)",
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
            model="llama3.1-8b",
        )

        content = response.choices[0].message.content
        logger.info(f"Received response from API: {content}")
        result = extract_json(content)

        if result is None:
            logger.error("Could not extract valid JSON from API response")
            return Task(description=description, estimated_time="", technical_description="", subtasks=[])

        task_result = Task(**result)
        for subtask in task_result.subtasks:
            subtask_breakdown = recursive_breakdown(subtask.description, initial_prompt, depth + 1, max_depth)
            subtask.subtasks = subtask_breakdown.subtasks
            
        logger.info(f"Completed processing at depth {depth}")
        return task_result

    except Exception as e:
        logger.error(f"Error occurred while processing the API response: {str(e)}")
        return Task(description=description, estimated_time="", technical_description="", subtasks=[])

def get_jira_client():
    jira_server = os.environ.get("JIRA_SERVER")
    jira_email = os.environ.get("JIRA_EMAIL")
    jira_api_key = os.environ.get("JIRA_API_KEY")
    
    logger.debug(f"JIRA_SERVER: {jira_server}")
    logger.debug(f"JIRA_EMAIL: {jira_email}")
    logger.debug(f"JIRA_API_KEY: {'*' * len(jira_api_key) if jira_api_key else 'Not set'}")
    
    return JIRA(
        server=jira_server,
        basic_auth=(jira_email, jira_api_key)
    )

@app.get("/api/test_jira_connection")
async def test_jira_connection():
    try:
        jira = get_jira_client()
        
        # Test server info (doesn't require full authentication)
        server_info = jira.server_info()
        logger.info(f"Successfully connected to Jira. Server version: {server_info['version']}")
        
        # Test authentication using projects() method
        try:
            projects = jira.projects()
            logger.info(f"Successfully authenticated. Found {len(projects)} projects.")
            project_keys = [project.key for project in projects]
            logger.info(f"Project keys: {project_keys}")
        except JIRAError as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication failed")
        
        # If we get here, authentication was successful
        return {
            "status": "success",
            "server_version": server_info['version'],
            "authenticated": True,
            "project_count": len(projects),
            "project_keys": project_keys
        }
    except JIRAError as e:
        logger.error(f"JIRA Error: {str(e)}")
        logger.error(f"JIRA Error details: {e.text}")
        raise HTTPException(status_code=500, detail=f"JIRA Error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def create_jira_issues(task: Task, depth=0, parent_issue=None):
    """Recursively create Jira issues for tasks and subtasks, skipping the initial project request."""
    if depth == 0:
        # Skip creating an issue for the initial project request
        jira_issues = []
        for subtask in task.subtasks:
            subtask_issues = create_jira_issues(subtask, depth+1, None)
            jira_issues.extend(subtask_issues)
        return jira_issues

    try:
        jira = get_jira_client()
        # Create task
        issue_dict = {
            'project': {'key': os.environ.get("JIRA_PROJECT_KEY")},
            'summary': task.description[:255],  # Ensure summary is not too long
            'description': f"{task.technical_description}\n\nEstimated time: {task.estimated_time}",
        }
        
        if depth > 1 and parent_issue:
            issue_dict['issuetype'] = {'name': 'Subtask'}
            issue_dict['parent'] = {'key': parent_issue.key}
        else:
            issue_dict['issuetype'] = {'name': 'Task'}
        
        issue = jira.create_issue(fields=issue_dict)
        logger.info(f"Created Jira issue: {issue.key}")
        
        # Create subtasks
        subtask_issues = [issue]
        for subtask in task.subtasks:
            subtask_issues.extend(create_jira_issues(subtask, depth+1, issue))
        
        return subtask_issues
    except Exception as e:
        logger.error(f"Error creating Jira issue: {str(e)}")
        return []

@app.post("/api/query")
async def process_query(request: ProjectRequest):
    try:
        result = recursive_breakdown(request.query, request.query)
        
        # Create Jira issues
        jira_issues = create_jira_issues(result)
        
        return {
            "task_breakdown": result,
            "jira_main_issue_key": [issue.key for issue in jira_issues] if jira_issues else []
        }
    except Exception as e:
        logger.error(f"Error in process_query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/progress")
async def get_progress():
    global progress
    return progress

class CodeGenerationRequest(BaseModel):
    project_breakdown: Dict[str, Any]

def generate_fullstack_app(project_breakdown: Dict[str, Any]) -> Dict[str, str]:
    prompt = f"""
    As an expert full-stack developer, your task is to generate a comprehensive, working full-stack web application based on the following project breakdown:

    {json.dumps(project_breakdown, indent=2)}

    Follow these strict guidelines:

    1. Frontend (React with Redux or Next.js):
       - Create a 'frontend' directory with all necessary files.
       - Implement ALL features described in the project breakdown.
       - Use modern React practices (hooks, functional components).
       - Implement proper state management using Redux or React Context.
       - Create reusable components where appropriate.
       - Implement responsive design using CSS or a UI framework.

    2. Backend (FastAPI or Django REST Framework):
       - Create a 'backend' directory with all necessary files.
       - Implement ALL API endpoints required by the frontend.
       - Use proper routing and follow RESTful principles.
       - Implement error handling and input validation.
       - If using a database, include models and migrations.

    3. README.md:
       - Provide clear setup instructions for both frontend and backend.
       - List all major features of the application.
       - Include any necessary environment variables.
       - Describe the project structure.

    4. Additional components (if relevant to the project):
       - Database models and migrations
       - Authentication and authorization
       - API documentation (e.g., Swagger for FastAPI)
       - Basic unit tests for critical components
       - A simple Dockerfile for containerization

    IMPORTANT:
    - Make sure to include a readme file with clear instructions on how to run the application.
    - Ensure ALL code is complete, functional, and free of placeholders or TODOs.
    - ALL files must work together cohesively to create a fully functional application.
    - Do NOT omit any necessary code or configurations.
    - Provide DETAILED comments explaining complex logic or configurations.
    - Ensure that the generated code EXACTLY matches the requirements in the project breakdown.

    Format your response as follows:
    1. Start each file with a markdown code block: ```filename
    2. End each file with: ```
    3. Provide a brief explanation before each file about its purpose and how it fits into the overall application.

    Begin generating the full-stack application now.
    """

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert full-stack developer."},
                {"role": "user", "content": prompt}
            ],
            model="llama3.1-8b",
        )

        generated_code = response.choices[0].message.content
        
        # Parse the generated code into separate files
        files = {}
        current_file = ""
        current_content = []

        for line in generated_code.split('\n'):
            if line.startswith('```') and line.strip() != '```':
                if current_file:
                    files[current_file] = '\n'.join(current_content)
                    current_content = []
                current_file = line.strip('`').strip()
            elif line.strip() == '```' and current_file:
                files[current_file] = '\n'.join(current_content)
                current_file = ""
                current_content = []
            elif current_file:
                current_content.append(line)

        return files

    except Exception as e:
        logger.error(f"Error in code generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate code")

@app.post("/api/generate_fullstack_app")
async def generate_fullstack_app_endpoint(request: CodeGenerationRequest):
    try:
        logger.info(f"Received project breakdown: {request.project_breakdown}")
        generated_files = generate_fullstack_app(request.project_breakdown)
        return {"generated_files": generated_files}
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))