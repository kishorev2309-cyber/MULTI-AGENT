import json
from flask import Flask, render_template, request, jsonify
from agents.planner import run_planner
from agents.researcher import run_researcher
from agents.decision import run_decision
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json(silent=True)
    if not data or 'query' not in data:
        return jsonify({
            "query": "",
            "planner": {"intent": "Unknown", "sub_questions": [], "search_strategies": []},
            "researcher": {"grouped_insights": {}, "total_evidence_points": 0, "status": "Error"},
            "decision": {"best_answer": "No query was provided.", "reasoning_chain": [], "alternative_viewpoints": []}
        }), 200

    query = data['query']

    # --- Guaranteed fallback payloads (always valid schema) ---
    planner_output = {
        "intent": "General Information Synthesis",
        "sub_questions": [f"What is the core context of: {query}?"],
        "search_strategies": [query]
    }
    researcher_output = {
        "grouped_insights": {
            query: [{
                "title": "Fallback Result",
                "snippet": "Live search was unavailable. Results are generated from heuristic analysis.",
                "source_link": ""
            }]
        },
        "total_evidence_points": 1,
        "status": "Degraded"
    }
    decision_output = {
        "best_answer": (
            f"Based on heuristic analysis of '{query}': The system was unable to retrieve live evidence. "
            "Please try again or check network connectivity on Render."
        ),
        "reasoning_chain": [
            "Attempted to run full agent pipeline.",
            "Evidence retrieval encountered an error.",
            "Fallback reasoning applied to produce a minimal response."
        ],
        "alternative_viewpoints": [
            "Live web search may be restricted in this deployment environment.",
            "Running locally with internet access will produce full evidence-based output."
        ]
    }

    # --- Phase 1: Planner (isolated try/except) ---
    try:
        planner_output = run_planner(query)
    except Exception as e:
        planner_output["sub_questions"] = [f"Planner encountered an issue: {str(e)}"]

    # --- Phase 2: Researcher (isolated try/except) ---
    try:
        researcher_output = run_researcher(planner_output)
    except Exception as e:
        researcher_output["grouped_insights"] = {
            query: [{
                "title": "Researcher Agent Error",
                "snippet": f"Could not complete research phase: {str(e)}",
                "source_link": ""
            }]
        }
        researcher_output["total_evidence_points"] = 1

    # --- Phase 3: Decision (isolated try/except) ---
    try:
        decision_output = run_decision(researcher_output, planner_output)
    except Exception as e:
        decision_output["reasoning_chain"].append(f"Decision synthesis error: {str(e)}")

    # Always return 200 with complete valid JSON — frontend must never get a 500
    return jsonify({
        "query": query,
        "planner": planner_output,
        "researcher": researcher_output,
        "decision": decision_output
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
