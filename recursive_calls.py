import os
from groq import Groq
import re
import json

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def extract_json(text):
    """Extract JSON from text, even if there's additional content."""
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        return json_match.group(0)
    return None

def recursive_breakdown(task, depth=0, max_depth=3):
    if depth >= max_depth:
        return {"task": task, "subtasks": []}

    prompt = f"""
    As an experienced technical software engineering project manager at Google, break down the following task into 3-5 smaller subtasks:
    Task: {task}

    For each subtask, provide:
    1. A brief description
    2. An indepth technical description of the subtask (150-250 words)
    3. Estimated time to complete (in hours)

    Format your response STRICTLY as a JSON object with the following structure, and NOTHING ELSE:
    {{
        "task": "Main task description",
        "subtasks": [
            {{
                "description": "Subtask 1 description",
                "technical_description": "Subtask 1 technical description",
                "estimated_time": "X hours"
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
        json_content = extract_json(content)

        if json_content:
            result = json.loads(json_content)
        else:
            print(f"Error: Could not extract JSON from API response: {content}")
            return {"task": task, "subtasks": []}

    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON response from API: {e}")
        print(f"Raw response: {content}")
        return {"task": task, "subtasks": []}
    except Exception as e:
        print(f"Error occurred while processing the API response: {e}")
        return {"task": task, "subtasks": []}

    for subtask in result.get("subtasks", []):
        subtask_breakdown = recursive_breakdown(subtask["description"], depth + 1, max_depth)
        subtask["subtasks"] = subtask_breakdown.get("subtasks", [])

    return result

