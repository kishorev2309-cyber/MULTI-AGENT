import time

def run_researcher(planner_data):
    """
    Real Dynamic Research Layer.
    Executes live web searches via duckduckgo_search based on Planner strategies.
    Extracts raw structured evidence and clusters them logically.
    Falls back gracefully if duckduckgo_search is unavailable or restricted.

    Fix: duckduckgo-search<=5.3.x had a bug where it passed a timedelta object
    to str.format() with a date format string (%Y-%m-%d), causing:
      'unsupported format string passed to datetime.timedelta.__format__'
    We now instantiate DDGS with an explicit timeout and catch TypeError
    separately so the real root cause is surfaced in the fallback message.
    """
    search_strategies = planner_data.get("search_strategies", [])
    grouped_insights = {}

    # Check if duckduckgo_search can be imported at all
    try:
        from duckduckgo_search import DDGS
        ddgs_available = True
    except Exception:
        ddgs_available = False

    for strategy in search_strategies:
        evidence_cluster = []
        try:
            if not ddgs_available:
                raise RuntimeError("duckduckgo_search is not available in this environment.")

            # Re-create the session per strategy to avoid stale internal state.
            # Explicit timeout avoids timedelta arithmetic bugs in older versions.
            ddgs = DDGS(timeout=20)

            # Perform live web search - limit to 3 results per strategy
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

        except TypeError as te:
            # Root cause: duckduckgo-search bug with timedelta formatting.
            # Upgrade duckduckgo-search to >=6.2.0 to permanently fix this.
            error_hint = (
                "Internal library error (timedelta format bug). "
                "Please upgrade: pip install -U duckduckgo-search"
            )
            evidence_cluster.append({
                "title": "Search Library Error",
                "snippet": (
                    f"Live search for '{strategy}' failed due to a library bug. "
                    f"Technical detail: {str(te)[:100]}. "
                    f"{error_hint}"
                ),
                "source_link": ""
            })

        except Exception as e:
            # Generic fallback — network issues, rate limits, env restrictions, etc.
            evidence_cluster.append({
                "title": "Search Unavailable",
                "snippet": (
                    f"Live search for '{strategy}' could not be completed. "
                    f"Reason: {str(e)[:150]}. "
                    "The reasoning engine will synthesize conclusions from available context."
                ),
                "source_link": ""
            })

        time.sleep(0.3)  # Light rate limiting between strategies

        # Cluster the evidence under the strategy used
        grouped_insights[strategy] = evidence_cluster

    # Flatten all evidence for quick downstream processing
    all_evidence = []
    for cluster in grouped_insights.values():
        all_evidence.extend(cluster)

    # A result is only "Success" if at least one item has a real source link
    has_real_results = any(
        item.get("source_link") for items in grouped_insights.values() for item in items
    )

    return {
        "grouped_insights": grouped_insights,
        "total_evidence_points": len(all_evidence),
        "status": "Success" if has_real_results else "Degraded"
    }
