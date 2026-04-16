def run_planner(query):
    """
    Acts as a Query Understanding Engine.
    Decomposes the main query into sub-questions and formulates specific search strategies.
    NO hardcoded facts. Pure intent and logical extraction.
    """
    query_lower = query.lower()
    
    # 1. Intent Classification
    intent = "General Information Synthesis"
    if any(word in query_lower for word in ["best", "vs", "compare", "recommend", "which"]):
        intent = "Comparative Analysis"
    elif any(word in query_lower for word in ["how to", "guide", "tutorial", "build"]):
        intent = "Actionable Instruction"
    elif any(word in query_lower for word in ["what is", "define", "explain", "meaning"]):
        intent = "Definitional Extraction"
    
    # 2. Query Decomposition (Sub-questions)
    # Simple heuristic to decompose based on intent
    sub_questions = []
    if intent == "Comparative Analysis":
        sub_questions.append(f"What are the core features of the entities mentioned in: {query}?")
        sub_questions.append("What are the key differences or comparative advantages?")
        sub_questions.append("Are there any notable drawbacks or community consensus?")
    elif intent == "Actionable Instruction":
        sub_questions.append(f"What are the prerequisite step-by-step concepts for: {query}?")
        sub_questions.append("What is the standard widely-accepted method?")
    else:
        sub_questions.append(f"What is the primary definition or context of: {query}?")
        sub_questions.append("What are the recent developments or related key concepts?")

    # 3. Search Strategy Generation (Query Expansions)
    words = [w for w in query.split() if len(w) > 3]
    core_concept = " ".join(words) if words else query
    
    search_strategies = [
        query,  # Base query
        f"{core_concept} analysis", # Broad
        f"{core_concept} latest news" # Context
    ]
    
    # Optional constraint: limit to 3 strategies to save latency
    search_strategies = list(set(search_strategies))[:3]

    return {
        "intent": intent,
        "sub_questions": sub_questions,
        "search_strategies": search_strategies
    }
