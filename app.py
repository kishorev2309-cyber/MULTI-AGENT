import json
from flask import Flask, render_template, request, jsonify
from agents.planner import run_planner
from agents.researcher import run_researcher
from agents.decision import run_decision

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    # Only parsing JSON payload.
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
    
    query = data['query']
    
    try:
        # Phase 1: Planning and Decomposition
        planner_output = run_planner(query)
        
        # Phase 2: Live Dynamic Evidence Retrieval
        researcher_output = run_researcher(planner_output)
        
        # Phase 3: Qualitative Synthesis
        decision_output = run_decision(researcher_output, planner_output)
        
        return jsonify({
            "query": query,
            "planner": planner_output,
            "researcher": researcher_output,
            "decision": decision_output
        })
    except Exception as e:
        # System must never crash and always return valid JSON
        return jsonify({
            "error": "Pipeline Error",
            "message": str(e),
            "fallback_trigger": True
        }), 500

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
