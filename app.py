import streamlit as st
from recursive_calls import recursive_breakdown
from utils import display_task_breakdown
import json

st.set_page_config(layout="wide")
st.title("Project Task Breakdown")

user_prompt = st.text_input("Tell me a little about your project idea and any specific requirements you have:")
if user_prompt:
    st.write("You said:", user_prompt)
    formatted_result = recursive_breakdown(user_prompt)
    
    st.write("Here's the breakdown of your task:")
    # Display the nested task breakdown
    display_task_breakdown(formatted_result)
    
    # Optionally, still provide the raw JSON for reference
    with st.expander("Show raw JSON"):
        st.json(formatted_result)

# CSS Styling
st.markdown("""
<style>
    .stExpander {
        border-left: 1px solid #4CAF50;
        padding-left: 10px;
    }
    .stMarkdown {
        line-height: 1.5;
    }
</style>
""", unsafe_allow_html=True)