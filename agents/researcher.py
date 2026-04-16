from duckduckgo_search import DDGS
import time

def run_researcher(planner_data):
    """
    Real Dynamic Research Layer.
    Executes live web searches via duckduckgo_search based on Planner strategies.
    Extracts raw structured evidence and clusters them logically.
    """
    search_strategies = planner_data.get("search_strategies", [])
    grouped_insights = {}
    
    ddgs = DDGS()
    
    for strategy in search_strategies:
        evidence_cluster = []
        try:
            # Perform live web search - limit to 3 results per strategy to minimize latency
            results = ddgs.text(strategy, max_results=3)
            
            if results:
                for r in results:
                    evidence_cluster.append({
                        "title": r.get("title", "No Title"),
                        "snippet": r.get("body", "No Snippet provided."),
                        "source_link": r.get("href", "#")
                    })
            else:
                evidence_cluster.append({
                    "title": "No Search Results",
                    "snippet": f"The query '{strategy}' yielded no direct online results.",
                    "source_link": ""
                })
        except Exception as e:
            # Fallback logic: System must never crash
            evidence_cluster.append({
                "title": "Search Service Interruption",
                "snippet": f"Could not retrieve live data for '{strategy}' due to an error: {str(e)}",
                "source_link": ""
            })
            
        time.sleep(0.5) # Gentle rate limiting
        
        # Cluster the evidence under the strategy used
        grouped_insights[strategy] = evidence_cluster

    # Extract all linear evidence instances for quick processing down the line
    all_evidence = []
    for cluster in grouped_insights.values():
        all_evidence.extend(cluster)

    return {
        "grouped_insights": grouped_insights,
        "total_evidence_points": len(all_evidence),
        "status": "Success" if len(all_evidence) > 0 else "Degraded"
    }
