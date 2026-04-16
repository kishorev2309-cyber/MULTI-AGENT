import time

def run_researcher(planner_data):
    """
    Real Dynamic Research Layer.
    Executes live web searches via duckduckgo_search based on Planner strategies.
    Extracts raw structured evidence and clusters them logically.
    Falls back gracefully if duckduckgo_search is unavailable or restricted.
    """
    search_strategies = planner_data.get("search_strategies", [])
    grouped_insights = {}

    # Import inside function so import failure doesn't crash the module on restricted hosts
    try:
        from duckduckgo_search import DDGS
        ddgs = DDGS()
        ddgs_available = True
    except Exception as import_err:
        ddgs_available = False
        ddgs = None

    for strategy in search_strategies:
        evidence_cluster = []
        try:
            if not ddgs_available or ddgs is None:
                raise RuntimeError("duckduckgo_search is not available in this environment.")

            # Perform live web search - limit to 3 results per strategy to minimize latency
            results = list(ddgs.text(strategy, max_results=3))

            if results:
                for r in results:
                    evidence_cluster.append({
                        "title": r.get("title", "No Title"),
                        "snippet": r.get("body", "No Snippet provided."),
                        "source_link": r.get("href", "")
                    })
            else:
                evidence_cluster.append({
                    "title": "No Search Results",
                    "snippet": f"The query '{strategy}' yielded no direct online results.",
                    "source_link": ""
                })
        except Exception as e:
            # Fallback: System must never crash - return informative fallback item
            evidence_cluster.append({
                "title": "Search Unavailable",
                "snippet": (
                    f"Live search for '{strategy}' could not be completed. "
                    f"Reason: {str(e)[:120]}. "
                    "This typically occurs in restricted environments (e.g. Render free tier). "
                    "The reasoning engine will synthesize conclusions from available context."
                ),
                "source_link": ""
            })

        time.sleep(0.2)  # Light rate limiting

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
