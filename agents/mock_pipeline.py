import time

def run_pipeline(query):
    query_lower = query.lower()

    # 1. PLANNER AGENT LOGIC
    planner_intent = "General Inquiry"
    planner_keywords = []
    planner_reasoning = "Query doesn't match specific technical topics."

    if "code" in query_lower or "programm" in query_lower or "dev" in query_lower:
        planner_intent = "Coding Assistance"
        planner_keywords = ["coding", "programming", "software"]
        planner_reasoning = "Detected software development related keywords."
    elif "ai" in query_lower or "machine learning" in query_lower:
        planner_intent = "Artificial Intelligence Info"
        planner_keywords = ["ai", "machine learning", "neural networks"]
        planner_reasoning = "Detected 'ai' or 'machine learning' in the query."
    elif "design" in query_lower or "ui" in query_lower or "ux" in query_lower:
        planner_intent = "Design Advice"
        planner_keywords = ["ui", "ux", "design"]
        planner_reasoning = "Detected user interface and design related keywords."
    else:
        # Default extract longest words as keywords
        words = [w for w in query_lower.split() if len(w) > 3]
        planner_keywords = words[:3] if words else ["general"]
        planner_reasoning = "Extracted potential keywords based on word length."

    # 2. RESEARCHER AGENT LOGIC
    researcher_topic = "General Knowledge"
    researcher_alternatives = ["Web search", "Wikipedia"]
    researcher_facts = ["Fact 1: No specific facts found.", "Fact 2: Please provide more context."]
    researcher_reasoning = "Could not map keywords to a specialized database."

    if "coding" in planner_keywords or "programming" in planner_keywords:
        researcher_topic = "Software Engineering Practices"
        researcher_alternatives = ["Algorithms", "System Design"]
        researcher_facts = [
            "Fact 1: Clean code improves maintainability.",
            "Fact 2: Python is popular for AI and simple scripts.",
            "Fact 3: Object-oriented programming encapsulates data and behavior."
        ]
        researcher_reasoning = "Mapped 'coding' intent to software engineering knowledge base."
    elif "ai" in planner_keywords:
        researcher_topic = "Artificial Intelligence Foundations"
        researcher_alternatives = ["Deep Learning", "NLP"]
        researcher_facts = [
            "Fact 1: LLMs use transformers to predict the next token.",
            "Fact 2: Multi-agent systems delegate tasks for complex problem solving.",
            "Fact 3: Reinforcement learning relies on reward maximization."
        ]
        researcher_reasoning = "Mapped 'ai' intent to AI & Machine Learning knowledge base."

    # 3. DECISION AGENT LOGIC
    final_answer = ""
    confidence = 50
    decision_reasoning = []

    if researcher_topic == "Software Engineering Practices":
        final_answer = f"Based on your query regarding coding, it is recommended to focus on clean structure and choose languages suitable for your domain, like Python for scripts."
        confidence = 85
        decision_reasoning = [
            "Analyzed the provided software engineering facts.",
            "Synthesized a recommendation based on languages (Python).",
            "Calculated high confidence due to direct topic match."
        ]
    elif researcher_topic == "Artificial Intelligence Foundations":
        final_answer = f"To understand AI based on your query, focus on foundational concepts such as neural networks and multi-agent systems, as these are driving current innovations."
        confidence = 92
        decision_reasoning = [
            "Analyzed facts related to LLMs and Multi-agent systems.",
            "Formulated an answer prioritizing current high-impact tech.",
            "Calculated very high confidence due to specific AI keyword matches."
        ]
    else:
        final_answer = f"I could not find a highly specific answer for '{query}', but analyzing the intent '{planner_intent}' suggests broadening the search."
        confidence = 45
        decision_reasoning = [
            "Reviewing general facts.",
            "No strong correlation found between query and specific expert domains.",
            "Calculated low confidence and suggesting a broader search."
        ]


    # Build interactions
    interaction_flow = [
        "System received user query.",
        "Planner analyzed query to determine intent and extract keywords.",
        f"Planner passed context to Researcher (Intent: {planner_intent}).",
        f"Researcher retrieved facts for topic: {researcher_topic}.",
        "Decision Agent synthesized facts to form final response.",
        "Final response generated and confidence calculated."
    ]

    return {
        "query": query,
        "planner": {
            "intent": planner_intent,
            "keywords": planner_keywords,
            "reasoning": planner_reasoning
        },
        "researcher": {
            "matched_topic": researcher_topic,
            "alternative_topics": researcher_alternatives,
            "facts": researcher_facts,
            "reasoning": researcher_reasoning
        },
        "decision": {
            "final_answer": final_answer,
            "confidence": confidence,
            "reasoning_steps": decision_reasoning
        },
        "interaction_flow": interaction_flow
    }
