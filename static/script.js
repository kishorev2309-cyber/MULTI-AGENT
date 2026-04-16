document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('query-form');
    const input = document.getElementById('query-input');
    const loadingSkeletons = document.getElementById('loading-skeletons');
    const dashboard = document.getElementById('dashboard');
    const timelineSidebar = document.getElementById('timeline-sidebar');
    
    // Timeline steps
    const stepPlanner = document.getElementById('step-planner');
    const stepResearcher = document.getElementById('step-researcher');
    const stepDecision = document.getElementById('step-decision');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = input.value.trim();
        if (!query) return;

        // Reset App State
        dashboard.classList.add('hidden');
        timelineSidebar.classList.remove('hidden');
        loadingSkeletons.classList.remove('hidden');
        
        // Initiate step sequence animation
        runPipelineSequence();

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                throw new Error('Server returned unparseable response.');
            }

            console.log("Backend Response:", data);

            // Give the animation time to 'finish' cleanly
            setTimeout(() => {
                loadingSkeletons.classList.add('hidden');
                dashboard.classList.remove('hidden');
                populateDashboard(data);
                
                // Set final pipeline state
                stepDecision.classList.remove('active');
                stepDecision.classList.add('completed');
                stepDecision.querySelector('.step-status').textContent = "Completed";
                document.querySelector('.status-badge').classList.remove('live-pulse');
                document.querySelector('.status-badge').textContent = "Rendered";
                document.querySelector('.status-badge').style.color = "var(--text-muted)";
                document.querySelector('.status-badge').style.background = "var(--border-color)";
                
            }, 1000); // Slight delay for UX smoothness

        } catch (error) {
            console.error('Fatal pipeline error:', error);
            alert("Backend unreachable. Ensure server is running.");
        }
    });

    function setStepState(stepElem, stateStr) {
        stepElem.className = 'timeline-step'; // reset
        if (stateStr === 'active') {
            stepElem.classList.add('active');
            stepElem.querySelector('.step-status').textContent = "Processing...";
            stepElem.querySelector('.step-status').style.color = "var(--accent-blue)";
        } else if (stateStr === 'completed') {
            stepElem.classList.add('completed');
            stepElem.querySelector('.step-status').textContent = "Completed";
            stepElem.querySelector('.step-status').style.color = "var(--accent-green)";
        } else {
            stepElem.querySelector('.step-status').textContent = "Pending";
            stepElem.querySelector('.step-status').style.color = "var(--text-muted)";
        }
    }

    function runPipelineSequence() {
        // Reset sidebar status
        document.querySelector('.status-badge').classList.add('live-pulse');
        document.querySelector('.status-badge').textContent = "Live";
        document.querySelector('.status-badge').style.color = "var(--accent-green)";
        document.querySelector('.status-badge').style.background = "rgba(16, 185, 129, 0.1)";

        setStepState(stepPlanner, 'active');
        setStepState(stepResearcher, 'pending');
        setStepState(stepDecision, 'pending');

        setTimeout(() => {
            setStepState(stepPlanner, 'completed');
            setStepState(stepResearcher, 'active');
        }, 1200);

        setTimeout(() => {
            setStepState(stepResearcher, 'completed');
            setStepState(stepDecision, 'active');
        }, 3200);
    }

    function populateDashboard(data) {
        if(data.error || !data.planner || !data.researcher || !data.decision) {
            document.getElementById('final-answer').textContent = "System Degraded.";
            return;
        }

        /** 1. METRICS ROW CALCULATION */
        document.getElementById('metric-evidence').textContent = data.researcher.total_evidence_points || 0;
        
        let subQCount = (data.planner.sub_questions || []).length;
        document.getElementById('metric-complexity').textContent = subQCount > 2 ? 'High' : (subQCount === 2 ? 'Medium' : 'Low');

        // Calculate unique domains
        const clusters = data.researcher.grouped_insights || {};
        let domains = new Set();
        Object.values(clusters).forEach(results => {
            (results || []).forEach(res => {
                if(res.source_link) domains.add(getHostName(res.source_link));
            });
        });
        document.getElementById('metric-sources').textContent = domains.size;


        /** 2. PLANNER DOM UPDATES */
        document.getElementById('intent-tag').textContent = data.planner.intent || 'Unknown context';
        
        const subList = document.getElementById('sub-questions');
        subList.innerHTML = '';
        (data.planner.sub_questions || []).forEach(sq => {
            const li = document.createElement('li');
            li.textContent = sq;
            subList.appendChild(li);
        });
        
        const stratRow = document.getElementById('search-strategies');
        stratRow.innerHTML = '';
        (data.planner.search_strategies || []).forEach(ss => {
            const s = document.createElement('span');
            s.className = 'badge';
            s.textContent = ss.length > 35 ? ss.substring(0,35) + '...' : ss;
            stratRow.appendChild(s);
        });

        /** 3. RESEARCHER (EVIDENCE CARDS) UPDATES */
        const eviContainer = document.getElementById('evidence-clusters');
        eviContainer.innerHTML = '';
        
        for (const [strategy, results] of Object.entries(clusters)) {
            const grp = document.createElement('div');
            grp.className = 'evidence-cluster-group';
            
            const title = document.createElement('div');
            title.className = 'cluster-header';
            title.innerHTML = `<i class="ph ph-caret-down"></i> Strat: ${strategy}`;
            title.onclick = () => {
                const els = grp.querySelectorAll('.evidence-item');
                const i = title.querySelector('i');
                els.forEach(el => el.classList.toggle('hidden'));
                i.className = els[0].classList.contains('hidden') ? 'ph ph-caret-right' : 'ph ph-caret-down';
            };
            grp.appendChild(title);
            
            (results || []).forEach(res => {
                const item = document.createElement('div');
                item.className = 'evidence-item';
                
                const urlObj = res.source_link ? getHostName(res.source_link) : 'SYS_DIAGNOSTIC';
                const tagColor = urlObj === 'SYS_DIAGNOSTIC' ? 'amber' : 'blue';
                
                item.innerHTML = `
                    <div class="evidence-item-header">
                        <a href="${res.source_link || '#'}" target="_blank" rel="noreferrer">${res.title || 'Untitled'}</a>
                        <span class="domain-tag">${urlObj}</span>
                    </div>
                    <p>${res.snippet || 'No context extracted.'}</p>
                `;
                grp.appendChild(item);
            });
            eviContainer.appendChild(grp);
        }

        // Collapse/Expand all feature
        const expandBtn = document.getElementById('evidence-expand-btn');
        expandBtn.onclick = () => {
            const isCollapsing = expandBtn.textContent === 'Collapse All';
            document.querySelectorAll('.evidence-item').forEach(el => {
                if(isCollapsing) el.classList.add('hidden');
                else el.classList.remove('hidden');
            });
            document.querySelectorAll('.cluster-header i').forEach(icon => {
                icon.className = isCollapsing ? 'ph ph-caret-right' : 'ph ph-caret-down';
            });
            expandBtn.textContent = isCollapsing ? 'Expand All' : 'Collapse All';
        };

        /** 4. DECISION SYNTHESIS & CANDIDATES */
        document.getElementById('final-answer').innerHTML = data.decision.best_answer || "No conclusion reached.";
        
        // Handle Reasoning Chain
        const traceList = document.getElementById('reasoning-chain');
        traceList.innerHTML = '';
        (data.decision.reasoning_chain || []).forEach(rc => {
            const li = document.createElement('li');
            li.textContent = rc;
            traceList.appendChild(li);
        });

        // Handle Candidates and Alternative Views Panel
        const altRow = document.getElementById('alt-candidate-row');
        const altAlert = document.getElementById('alternative-alert');
        altRow.innerHTML = '';
        
        const alts = data.decision.alternative_viewpoints || [];
        // Alternative Viewpoints are usually full texts, we'll try to extract them neatly
        if (alts.length > 0 && !alts[0].includes("Insufficient distinct evidence") && !alts[0].includes("Connectivity issues")) {
            // We have a valid alternative viewpoint, render it in candidates and highlight box
            altRow.innerHTML = `
                <div class="candidate-info">
                    <div class="candidate-name">Tertiary Perspective <span class="badge amber">Divergent</span></div>
                    <div class="candidate-score">55% Confidence</div>
                </div>
                <div class="bar-bg"><div class="bar-fill amber" style="width: 55%;"></div></div>
            `;
            
            // Clean up the text for the alert box
            let rawText = alts[0];
            let cleanText = rawText.replace("An alternative or nuanced finding suggests: ", "").replace("While the primary consensus points one way, isolated evidence introduces a counter-perspective: ", "");
            
            altAlert.classList.remove('hidden');
            document.getElementById('alt-text').textContent = cleanText;
        } else {
            // No alternatives, hide alert, show single confident candidate
            altAlert.classList.add('hidden');
            altRow.innerHTML = `
                <div class="candidate-info">
                    <div class="candidate-name">No Conflicting Topologies</div>
                    <div class="candidate-score">N/A</div>
                </div>
                <div class="bar-bg"><div class="bar-fill" style="width: 5%; background: rgba(255,255,255,0.1);"></div></div>
            `;
        }
    }
    
    function getHostName(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }
});
