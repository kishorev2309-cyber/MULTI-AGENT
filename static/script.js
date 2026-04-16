document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('query-form');
    const input = document.getElementById('query-input');
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const query = input.value.trim();
        if (!query) return;

        // UI Reset & Loading State
        dashboard.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Populate UI Elements with deliberate delays for effect
            populateDashboard(data);
            
            // Hide loading, show dashboard
            loading.classList.add('hidden');
            dashboard.classList.remove('hidden');
            
            // Trigger animations
            animateFlow();
            
        } catch (error) {
            console.error('Error fetching data:', error);
            alert("An error occurred while processing the query.");
            loading.classList.add('hidden');
        }
    });

    function populateDashboard(data) {
        // 1. Planner Data
        document.getElementById('planner-intent').textContent = data.planner.intent;
        
        const keywordContainer = document.getElementById('planner-keywords');
        keywordContainer.innerHTML = '';
        data.planner.keywords.forEach(kw => {
            const span = document.createElement('span');
            span.className = 'badge';
            span.textContent = kw;
            keywordContainer.appendChild(span);
        });
        
        document.getElementById('planner-reasoning').textContent = data.planner.reasoning;

        // 2. Researcher Data
        document.getElementById('researcher-topic').textContent = data.researcher.matched_topic;
        
        const factsList = document.getElementById('researcher-facts');
        factsList.innerHTML = '';
        data.researcher.facts.forEach(fact => {
            const li = document.createElement('li');
            li.textContent = fact;
            factsList.appendChild(li);
        });
        
        document.getElementById('researcher-reasoning').textContent = data.researcher.reasoning;

        // 3. Decision Data
        document.getElementById('final-answer').textContent = data.decision.final_answer;
        
        const reasoningList = document.getElementById('decision-reasoning');
        reasoningList.innerHTML = '';
        data.decision.reasoning_steps.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            reasoningList.appendChild(li);
        });

        // Confidence progress bar
        const confidenceBar = document.getElementById('confidence-bar');
        // Reset to 0 first for animation
        confidenceBar.style.width = '0%';
        confidenceBar.textContent = '0%';
        setTimeout(() => {
            confidenceBar.style.width = data.decision.confidence + '%';
            confidenceBar.textContent = data.decision.confidence + '%';
        }, 500);

        // 4. Interaction Timeline
        const timelineList = document.getElementById('interaction-timeline');
        timelineList.innerHTML = '';
        data.interaction_flow.forEach((action, index) => {
            const li = document.createElement('li');
            li.textContent = action;
            // cascade animation
            li.style.opacity = '0';
            li.style.animation = `fadeIn 0.5s ${index * 0.2}s forwards`;
            timelineList.appendChild(li);
        });
    }

    function animateFlow() {
        const nodes = document.querySelectorAll('.flow-node');
        nodes.forEach(node => {
            node.style.transform = 'scale(0.9)';
            node.style.transition = 'transform 0.5s ease';
            setTimeout(() => {
                node.style.transform = 'scale(1)';
            }, 100);
        });
    }
});
