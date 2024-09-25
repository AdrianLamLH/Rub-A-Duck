import streamlit as st
import json
def display_task_breakdown(task_data, level=0):
    # Ensure task_data is a dictionary
    if isinstance(task_data, str):
        task_data = json.loads(task_data)
    
    # Display the main task
    st.markdown(f"{'#' * (level + 2)} {task_data['task']}")
    
    # Display subtasks
    for subtask in task_data.get('subtasks', []):
        col1, col2 = st.columns([3, 1])
        with col1:
            st.markdown(f"{'&nbsp;&nbsp;&nbsp;&nbsp;' * level}• **{subtask['description']}**")
        with col2:
            st.markdown(f"*{subtask['estimated_time']}*")
        
        # If this is the lowest level (no more subtasks), add toggle for technical description
        if 'subtasks' not in subtask or not subtask['subtasks']:
            if 'technical_description' in subtask:
                with st.expander("Show technical description", expanded=False):
                    st.markdown(subtask['technical_description'])
        else:
            # If this subtask has its own subtasks, recursively display them
            display_task_breakdown({'task': subtask['description'], 'subtasks': subtask['subtasks']}, level + 1)
