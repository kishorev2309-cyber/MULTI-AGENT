/* =====================================================
   COGNITIVE REASONING ENGINE — FRONTEND CONTROLLER
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── ELEMENT REFS ────────────────────────────── */
    const form            = document.getElementById('query-form');
    const queryInput      = document.getElementById('query-input');
    const loadingSkeletons= document.getElementById('loading-skeletons');
    const dashboard       = document.getElementById('dashboard');
    const sidebar         = document.getElementById('timeline-sidebar');
    const pipelineStatus  = document.getElementById('pipeline-status');

    const stepPlanner     = document.getElementById('step-planner');
    const stepResearcher  = document.getElementById('step-researcher');
    const stepDecision    = document.getElementById('step-decision');

    /* ─── FORM SUBMIT ─────────────────────────────── */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = queryInput.value.trim();
        if (!query) return;

        // Reset UI
        dashboard.classList.add('hidden');
        loadingSkeletons.classList.remove('hidden');
        sidebar.classList.remove('hidden');
        startPipelineAnimation();

        try {
            const res = await fetch('/analyze', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify({ query })
            });

            let data;
            try { data = await res.json(); }
            catch { throw new Error('Unparseable server response.'); }

            console.debug('[AI Framework] Backend payload:', data);

            // Give the last animation step a moment to land
            setTimeout(() => {
                loadingSkeletons.classList.add('hidden');
                dashboard.classList.remove('hidden');
                populateDashboard(data);
                finalisePipeline();
            }, 900);

        } catch (err) {
            console.error('[AI Framework] Fatal error:', err);
            loadingSkeletons.classList.add('hidden');
            sidebar.classList.add('hidden');
            alert('Cannot reach the backend server. Please ensure Flask is running.');
        }
    });

    /* ─── TIMELINE HELPERS ────────────────────────── */
    function setStep(el, state) {
        el.className = 'timeline-step';
        const status = el.querySelector('.step-status');
        if (state === 'active') {
            el.classList.add('active');
            status.textContent = 'Processing…';
            status.style.color  = 'var(--accent-blue)';
        } else if (state === 'completed') {
            el.classList.add('completed');
            status.textContent = 'Completed';
            status.style.color  = 'var(--accent-green)';
        } else {
            status.textContent = 'Pending';
            status.style.color  = 'var(--text-muted)';
        }
    }

    function startPipelineAnimation() {
        pipelineStatus.textContent   = 'Live';
        pipelineStatus.style.cssText = '';
        pipelineStatus.className     = 'status-badge live-pulse';

        setStep(stepPlanner,    'active');
        setStep(stepResearcher, 'pending');
        setStep(stepDecision,   'pending');

        setTimeout(() => {
            setStep(stepPlanner,    'completed');
            setStep(stepResearcher, 'active');
        }, 1300);

        setTimeout(() => {
            setStep(stepResearcher, 'completed');
            setStep(stepDecision,   'active');
        }, 3100);
    }

    function finalisePipeline() {
        setStep(stepDecision, 'completed');
        pipelineStatus.textContent = 'Rendered';
        pipelineStatus.className   = 'status-badge';
        pipelineStatus.style.cssText =
            'background:rgba(71,85,105,0.2);color:var(--text-secondary);border-color:var(--border);';
    }

    /* ─── POPULATE DASHBOARD ──────────────────────── */
    function populateDashboard(data) {
        if (!data.planner || !data.researcher || !data.decision) {
            document.getElementById('final-answer').textContent = 'System degraded — invalid payload.';
            return;
        }

        const { planner, researcher, decision } = data;
        const clusters = researcher.grouped_insights || {};

        /* 1 ── METRICS ─────────────────────────────── */
        const totalPoints = researcher.total_evidence_points || 0;
        document.getElementById('metric-evidence').textContent = totalPoints;

        // Unique domains (only real URLs)
        const domains = new Set();
        Object.values(clusters).forEach(items => {
            (items || []).forEach(it => {
                if (it.source_link) domains.add(hostname(it.source_link));
            });
        });
        document.getElementById('metric-sources').textContent = domains.size;

        // Query complexity from sub-question count
        const sqLen = (planner.sub_questions || []).length;
        const complexity = sqLen >= 3 ? 'High' : sqLen === 2 ? 'Medium' : 'Low';
        document.getElementById('metric-complexity').textContent = complexity;

        /* 2 ── CANDIDATE SYNTHESES (dynamic) ───────── */
        buildCandidates(researcher, decision, clusters);

        /* 3 ── INTENT / PLANNER ────────────────────── */
        document.getElementById('intent-tag').textContent = planner.intent || '—';

        const subList = document.getElementById('sub-questions');
        subList.innerHTML = '';
        (planner.sub_questions || []).forEach(sq => {
            const li = document.createElement('li');
            li.textContent = sq;
            subList.appendChild(li);
        });

        const stratContainer = document.getElementById('search-strategies');
        stratContainer.innerHTML = '';
        (planner.search_strategies || []).forEach(ss => {
            const span = document.createElement('span');
            span.className   = 'strategy-badge';
            span.textContent = ss.length > 40 ? ss.slice(0, 40) + '…' : ss;
            stratContainer.appendChild(span);
        });

        /* 4 ── REASONING CHAIN ───────────────────────*/
        const traceList = document.getElementById('reasoning-chain');
        traceList.innerHTML = '';
        (decision.reasoning_chain || []).forEach(rc => {
            const li = document.createElement('li');
            li.textContent = rc;
            traceList.appendChild(li);
        });

        /* 5 ── DECISION CONCLUSION ───────────────────*/
        document.getElementById('final-answer').textContent =
            decision.best_answer || 'No conclusion synthesized.';

        // Confidence badge depends on researcher status and evidence count
        const confBadge = document.getElementById('confidence-badge');
        if (researcher.status === 'Success' && totalPoints >= 4) {
            confBadge.textContent = 'High Confidence';
            confBadge.className   = 'badge green';
        } else if (totalPoints >= 1) {
            confBadge.textContent = 'Medium Confidence';
            confBadge.className   = 'badge amber';
        } else {
            confBadge.textContent = 'Low Confidence';
            confBadge.className   = 'badge gray';
        }

        /* 6 ── ALTERNATIVE ALERT ─────────────────────*/
        const altAlert = document.getElementById('alternative-alert');
        const alts      = decision.alternative_viewpoints || [];
        const hasRealAlt = alts.length > 0
            && !alts[0].includes('Insufficient distinct evidence')
            && !alts[0].includes('Connectivity issues')
            && !alts[0].includes('Cross-validation confirmed high consistency');

        if (hasRealAlt) {
            const cleanText = alts[0]
                .replace('An alternative or nuanced finding suggests: ', '')
                .replace('While the primary consensus points one way, isolated evidence introduces a counter-perspective: ', '');
            document.getElementById('alt-text').textContent = cleanText;
            altAlert.classList.remove('hidden');
        } else {
            altAlert.classList.add('hidden');
        }

        /* 7 ── EVIDENCE CLUSTERS ─────────────────────*/
        buildEvidence(clusters);
    }

    /* ─── DYNAMIC CANDIDATE SCORING ──────────────── */
    /**
     * Derive candidate scores purely from actual backend data:
     *
     * PRIMARY candidate  = the main synthesized answer
     *   Score = percentage of strategies that returned at least one real URL
     *           (i.e. real web results vs total strategies run)
     *
     * SECONDARY candidate = alternative interpretation (if any)
     *   Score = proportional to how many NON-primary snippets exist
     *           vs total snippets (diversity ratio, capped at 65%)
     *
     * TERTIARY  = strategies that yielded Zero real results (error rates)
     *   Shown only when present, labelled "Coverage Gap"
     */
    function buildCandidates(researcher, decision, clusters) {
        const candidateList = document.getElementById('candidate-list');
        candidateList.innerHTML = '';

        const strategies        = Object.keys(clusters);
        const totalStrategies   = strategies.length || 1;

        // Count strategies with at least one real URL
        let realHits  = 0;
        let failedStrats = 0;
        let totalSnippets = 0;

        strategies.forEach(strat => {
            const items = clusters[strat] || [];
            const hasReal = items.some(it => !!it.source_link);
            if (hasReal) realHits++;
            else         failedStrats++;
            totalSnippets += items.length;
        });

        // Primary score — fraction of strategies that returned real data
        const primaryPct = Math.round((realHits / totalStrategies) * 100);

        // Coverage gap — percentage of strategies that failed
        const gapPct = Math.round((failedStrats / totalStrategies) * 100);

        // Alternative score — if alternative viewpoints exist, derive a diversity score
        const alts         = decision.alternative_viewpoints || [];
        const hasRealAlt   = alts.length > 0
            && !alts[0].includes('Insufficient distinct evidence')
            && !alts[0].includes('Connectivity issues')
            && !alts[0].includes('Cross-validation confirmed high consistency');
        // Cap at 65%: a divergent view is always less confident than primary
        const altPct = hasRealAlt
            ? Math.min(65, Math.round(((totalSnippets - realHits) / Math.max(totalSnippets, 1)) * 100) + 30)
            : 0;

        // Update evidence status badge
        const statusBadge = document.getElementById('evidence-status-badge');
        if (primaryPct === 100) {
            statusBadge.textContent = 'Full Coverage';
            statusBadge.className   = 'badge green';
        } else if (primaryPct > 50) {
            statusBadge.textContent = 'Partial Coverage';
            statusBadge.className   = 'badge amber';
        } else {
            statusBadge.textContent = 'Limited Coverage';
            statusBadge.className   = 'badge gray';
        }

        /* ── Render rows ── */

        // 1. Primary (always shown)
        candidateList.appendChild(makeCandidate({
            label   : 'Optimal Resolution',
            subLabel: `${realHits} of ${totalStrategies} strategies resolved`,
            score   : primaryPct,
            colorClass: primaryPct >= 75 ? 'green' : primaryPct >= 40 ? 'amber' : 'gray',
            badge   : { text: 'Selected', cls: 'green' }
        }));

        // 2. Alternative interpretation (shown only when a real alternative exists)
        if (hasRealAlt) {
            candidateList.appendChild(makeCandidate({
                label     : 'Divergent Perspective',
                subLabel  : 'Tertiary evidence cluster',
                score     : altPct,
                colorClass: 'amber',
                badge     : { text: 'Divergent', cls: 'amber' }
            }));
        }

        // 3. Coverage Gap row (shown if any strategy had zero results)
        if (failedStrats > 0) {
            candidateList.appendChild(makeCandidate({
                label     : 'Coverage Gap',
                subLabel  : `${failedStrats} strateg${failedStrats > 1 ? 'ies' : 'y'} returned no results`,
                score     : gapPct,
                colorClass: 'gray',
                badge     : { text: 'Incomplete', cls: 'gray' }
            }));
        }
    }

    function makeCandidate({ label, subLabel, score, colorClass, badge }) {
        const row = document.createElement('div');
        row.className = 'candidate-row';
        row.innerHTML = `
            <div class="candidate-header">
                <div class="candidate-name">
                    ${label}
                    <span class="badge ${badge.cls}">${badge.text}</span>
                </div>
                <div class="candidate-score">${score}%</div>
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.4rem;">${subLabel}</div>
            <div class="bar-track">
                <div class="bar-fill ${colorClass}" style="width:0%" data-target="${score}%"></div>
            </div>
        `;
        // Animate bar in after paint
        requestAnimationFrame(() => {
            setTimeout(() => {
                const fill = row.querySelector('.bar-fill');
                if (fill) fill.style.width = fill.dataset.target;
            }, 80);
        });
        return row;
    }

    /* ─── EVIDENCE CLUSTERS ───────────────────────── */
    function buildEvidence(clusters) {
        const container = document.getElementById('evidence-clusters');
        container.innerHTML = '';

        for (const [strategy, items] of Object.entries(clusters)) {
            const grp = document.createElement('div');
            grp.className = 'evidence-cluster-group';

            // Cluster header (collapsible)
            const header = document.createElement('div');
            header.className = 'cluster-header';
            header.innerHTML = `<i class="ph ph-caret-down"></i><span>${strategy}</span>`;

            const itemsWrapper = document.createElement('div');
            itemsWrapper.className = 'evidence-items';

            header.addEventListener('click', () => {
                const visible = itemsWrapper.style.display !== 'none';
                itemsWrapper.style.display = visible ? 'none' : 'flex';
                header.querySelector('i').className =
                    visible ? 'ph ph-caret-right' : 'ph ph-caret-down';
            });

            grp.appendChild(header);

            // Evidence items
            (items || []).forEach(item => {
                const card     = document.createElement('div');
                card.className = 'evidence-item';

                const domain = item.source_link ? hostname(item.source_link) : null;
                const isSys  = !domain;

                card.innerHTML = `
                    <div class="evidence-item-header">
                        <a href="${item.source_link || '#'}" target="_blank" rel="noreferrer noopener">
                            ${escapeHTML(item.title || 'Untitled')}
                        </a>
                        <span class="domain-tag${isSys ? ' sys' : ''}">${isSys ? 'SYS:DIAG' : domain}</span>
                    </div>
                    <p>${escapeHTML(item.snippet || 'No context extracted.')}</p>
                `;
                itemsWrapper.appendChild(card);
            });

            grp.appendChild(itemsWrapper);
            container.appendChild(grp);
        }

        // Collapse / expand all
        const expandBtn = document.getElementById('evidence-expand-btn');
        if (expandBtn) {
            expandBtn.onclick = () => {
                const isCollapsing = expandBtn.textContent.trim() === 'Collapse All';
                document.querySelectorAll('.evidence-items').forEach(w => {
                    w.style.display = isCollapsing ? 'none' : 'flex';
                });
                document.querySelectorAll('.cluster-header i').forEach(icon => {
                    icon.className = isCollapsing ? 'ph ph-caret-right' : 'ph ph-caret-down';
                });
                expandBtn.textContent = isCollapsing ? 'Expand All' : 'Collapse All';
            };
        }
    }

    /* ─── UTILS ───────────────────────────────────── */
    function hostname(url) {
        try { return new URL(url).hostname.replace(/^www\./, ''); }
        catch { return url; }
    }

    function escapeHTML(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

});
