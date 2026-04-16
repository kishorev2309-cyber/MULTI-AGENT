document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('query-form');
    const input = document.getElementById('query-input');
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    const loadStatus = document.querySelector('.loading-status');
    const subStatus = document.getElementById('loading-substatus');
    const loadNodes = document.querySelectorAll('#loading .flow-node');
    const loadArrows = document.querySelectorAll('#loading .flow-arrow');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = input.value.trim();
        if (!query) return;

        // Reset App State
        dashboard.classList.add('hidden');
        loading.classList.remove('hidden');
        
        // Emulate complex loading stages
        runLoadingSequence();

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            // Always parse JSON regardless of HTTP status code
            // Backend is designed to always return valid JSON even on errors
            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                // Only show failure if JSON itself is unparseable (true network/server crash)
                throw new Error('Server returned unparseable response. Backend may be down.');
            }

            console.log("Backend Response:", data);

            // Show dashboard regardless — populateDashboard handles degraded states
            loading.classList.add('hidden');
            dashboard.classList.remove('hidden');
            populateDashboard(data);

        } catch (error) {
            console.error('Fatal pipeline error (server unreachable):', error);
            loadStatus.textContent = "Cannot reach backend server";
            loadStatus.style.color = "#ef4444";
            subStatus.textContent = error.message || "Ensure the Flask server is running and accessible.";
            loadNodes.forEach(n => n.classList.remove('active-pulse'));
        }
    });

    function runLoadingSequence() {
        // Reset styles
        loadNodes.forEach(n => {
            n.classList.remove('active-pulse');
            n.classList.remove('complete');
            n.classList.add('opacity-half');
        });
        loadArrows.forEach(a => a.classList.add('opacity-half'));
        
        loadStatus.style.color = "";
        loadStatus.textContent = "Constructing Query Engine...";
        subStatus.textContent = "Classifying intent & decomposing logic graph.";
        loadNodes[0].classList.remove('opacity-half');
        loadNodes[0].classList.add('active-pulse');

        // Simulate phase transitions for realistic multi-agent feel
        setTimeout(() => {
            loadNodes[0].classList.remove('active-pulse');
            loadNodes[0].classList.add('complete');
            loadArrows[0].classList.remove('opacity-half');
            
            loadNodes[1].classList.remove('opacity-half');
            loadNodes[1].classList.add('active-pulse');
            
            loadStatus.textContent = "Live Web Research Active...";
            subStatus.textContent = "Dispatching DuckDuckGo queries and indexing evidence.";
        }, 1500);

        setTimeout(() => {
            loadNodes[1].classList.remove('active-pulse');
            loadNodes[1].classList.add('complete');
            loadArrows[1].classList.remove('opacity-half');
            
            loadNodes[2].classList.remove('opacity-half');
            loadNodes[2].classList.add('active-pulse');
            
            loadStatus.textContent = "Qualitative Reasoning Engine...";
            subStatus.textContent = "Cross-referencing evidence nodes for logical synthesis.";
        }, 3500);
    }

    function populateDashboard(data) {
        
        // Handle degraded state graceful UI
        if(data.error || !data.planner || !data.researcher || !data.decision) {
            document.getElementById('final-answer').textContent = "System Degraded: " + (data.message || "Invalid JSON schema received.");
            return;
        }

        /* 1. PLANNER DOM UPDATES */
        document.getElementById('intent-tag').textContent = `Intent: ${data.planner.intent || 'Unknown'}`;
        
        // Subquestions
        const subList = document.getElementById('sub-questions');
        subList.innerHTML = '';
        (data.planner.sub_questions || []).forEach(sq => {
            const li = document.createElement('li');
            li.textContent = sq;
            subList.appendChild(li);
        });
        
        // Search Strategies
        const stratRow = document.getElementById('search-strategies');
        stratRow.innerHTML = '';
        (data.planner.search_strategies || []).forEach(ss => {
            const s = document.createElement('span');
            s.className = 'badge';
            s.textContent = ss.length > 30 ? ss.substring(0,30) + '...' : ss;
            stratRow.appendChild(s);
        });

        /* 2. RESEARCHER DOM UPDATES */
        document.getElementById('evidence-count').textContent = data.researcher.total_evidence_points || 0;
        const eviContainer = document.getElementById('evidence-clusters');
        eviContainer.innerHTML = '';
        
        const clusters = data.researcher.grouped_insights || {};
        for (const [strategy, results] of Object.entries(clusters)) {
            // Group Title
            const title = document.createElement('div');
            title.className = 'evidence-cluster-title mt-4';
            title.textContent = `Strategy Group: "${strategy}"`;
            eviContainer.appendChild(title);
            
            // Group Results
            (results || []).forEach(res => {
                const item = document.createElement('div');
                item.className = 'evidence-item';
                
                const urlObj = res.source_link ? getHostName(res.source_link) : 'Internal Diagnostic';
                
                item.innerHTML = `
                    <a href="${res.source_link || '#'}" target="_blank" rel="noreferrer">${res.title || 'Untitled'}</a>
                    <p>${res.snippet || 'No details available.'}</p>
                    <span class="evidence-source-tag">${urlObj}</span>
                `;
                eviContainer.appendChild(item);
            });
        }

        /* 3. DECISION DOM UPDATES */
        document.getElementById('final-answer').textContent = data.decision.best_answer || "No conclusion synthesized.";
        
        // Reasoning Tracer
        const traceList = document.getElementById('reasoning-chain');
        traceList.innerHTML = '';
        (data.decision.reasoning_chain || []).forEach(rc => {
            const li = document.createElement('li');
            li.textContent = rc;
            traceList.appendChild(li);
        });

        // Anomalies / Alternatives
        const altList = document.getElementById('alternative-viewpoints');
        altList.innerHTML = '';
        (data.decision.alternative_viewpoints || []).forEach(av => {
            const li = document.createElement('li');
            li.textContent = av;
            altList.appendChild(li);
        });
    }
    
    function getHostName(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }
});
