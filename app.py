import json
from flask import Flask, render_template, request, jsonify
from agents.mock_pipeline import run_pipeline

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
    result = run_pipeline(query)
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
