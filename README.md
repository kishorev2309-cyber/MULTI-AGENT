# Explainable Multi-Agent Cognitive Reasoning Framework

An Evidence-Based Multi-Agent AI system that performs **dynamic query understanding, real-time web research, and explainable reasoning** through a structured agent pipeline.

---

## Project Overview

This project simulates a **multi-agent intelligent system** designed to mimic real-world AI reasoning.

Instead of using fixed answers or predefined datasets, the system:

- Understands user queries dynamically
- Breaks them into sub-questions
- Fetches real-time web evidence
- Performs structured reasoning over collected information
- Produces an explainable final answer

---

## System Architecture

User Query  
&nbsp;&nbsp;&nbsp;&nbsp;⬇  
🧭 Planner Agent (Query Understanding & Decomposition)  
&nbsp;&nbsp;&nbsp;&nbsp;⬇  
🌐 Researcher Agent (Real-Time Web Evidence Collection)  
&nbsp;&nbsp;&nbsp;&nbsp;⬇  
🧠 Decision Agent (Evidence-Based Reasoning & Conclusion)  
&nbsp;&nbsp;&nbsp;&nbsp;⬇  
📊 Final Explainable Output

---

# Agents Description

### 1. 🧭 Planner Agent
- Analyzes user intent
- Extracts meaningful keywords
- Breaks query into sub-questions
- Generates a structured search strategy

---

### 2. 🌐 Researcher Agent
- Uses **DuckDuckGo live search**
- Collects real-time web results
- Extracts structured evidence (titles, snippets, sources)
- Organizes information into multiple perspectives

---

### 3. 🧠 Decision Agent
- Compares evidence from multiple sources
- Performs qualitative reasoning (no fixed scoring system)
- Identifies most reliable conclusion
- Generates final explainable answer

---

## Key Features

-  Real-time web data integration
-  Multi-agent architecture
-  Evidence-based reasoning (no hardcoded answers)
-  Explainable AI outputs
-  Fully web-based interface (Flask)
-  Lightweight and deployable on Render

---

##  Tech Stack

- Python 
- Flask 
- DuckDuckGo Search API 
- HTML, CSS, JavaScript 
- Gunicorn (Production Server)

---

##  Project Structure

│
├── app.py
├── planner.py
├── researcher.py
├── decision.py
│
├── templates/
│ └── index.html
│
├── static/
│ ├── style.css
│ └── script.js
│
├── requirements.txt
└── README.md

\
---

## How It Works

1. User enters a query in the web interface
2. Planner Agent decomposes the query into structured components
3. Researcher Agent retrieves real-time information from the web
4. Decision Agent analyzes and synthesizes the most reliable answer
5. Final explainable output is displayed in the UI

---

## Example Queries

- Best AI tools for coding
- What is quantum computing
- Career options in data science
- Explain machine learning simply

---

## Installation & Run Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run Flask app
python app.py
