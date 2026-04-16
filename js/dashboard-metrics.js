document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadSidebar();
    loadDashboardMetrics();
});

function escapeHTML(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadDashboardMetrics() {
    const loader = document.getElementById('loader');
    const content = document.getElementById('dashboard-content');
    loader.style.display = 'block';

    try {
        let risks = [];
        try {
            const rawRisks = await fetchAPI('/risks');
            risks = Array.isArray(rawRisks) ? rawRisks : [];
        } catch(e) {
            // fallback if /risks is not global
                const projectsRaw = await fetchAPI('/projects');
                const projects = Array.isArray(projectsRaw.data) ? projectsRaw.data : [];
            if (Array.isArray(projects)) {
                for (let p of projects) {
                    try {
                        const pRisks = await fetchAPI(`/projects/${p._id || p.id}/risks`);
                        if (Array.isArray(pRisks)) {
                            risks = risks.concat(pRisks.map(r => ({...r, project: p})));
                        }
                    } catch(err) {}
                }
            }
        }

        // Calculate stats
        const totalRisks = risks.length;
        const criticalRisks = risks.filter(r => (r.impact || '').toLowerCase() === 'critical').length;
        const openRisks = risks.filter(r => (r.currentStatus || r.status || '').toLowerCase() === 'open').length;
        const mitigatingRisks = risks.filter(r => {
            const s = (r.currentStatus || r.status || '').toLowerCase();
            return s === 'monitoring' || s === 'mitigating' || s === 'in progress';
        }).length;

        document.getElementById('dashTotalRisks').textContent = totalRisks;
        document.getElementById('dashCriticalRisks').textContent = criticalRisks;
        document.getElementById('dashOpenRisks').textContent = openRisks;
        document.getElementById('dashMitigatedRisks').textContent = mitigatingRisks;

        // Render Matrix
        renderMatrix(risks);

        // Render Recent Table (latest 5)
        renderRecentTable(risks);

        // Init Chart
        initTrendChart();

        loader.style.display = 'none';
        content.style.display = 'block';

    } catch(err) {
        loader.textContent = 'Failed to load dashboard metrics. Re-authenticate or try again.';
        console.error(err);
    }
}

function renderMatrix(risks) {
    // Mapping: Probability [High, Medium, Low] roughly -> VL/L, P, U
    // Impact [Low, Medium, High, Critical(maps to High for 3 columns)]
    const matrix = {
        'vl': { 'l': 0, 'm': 0, 'h': 0 },
        'l': { 'l': 0, 'm': 0, 'h': 0 },
        'p': { 'l': 0, 'm': 0, 'h': 0 },
        'u': { 'l': 0, 'm': 0, 'h': 0 },
    };

    risks.forEach(r => {
        let prob = (r.probability || '').toLowerCase();
        let imp = (r.impact || '').toLowerCase();
        
        let pKey = 'u';
        if (prob === 'high') pKey = 'l'; // likely
        if (prob === 'medium') pKey = 'p'; // possible
        // very likely can be simulated randomly for visual if there's high, but let's stick to mapping.
        
        // Mocking some "Very Likely" if critical based on time or just keeping it raw
        if (imp === 'critical') pKey = 'vl'; // just for visual populating

        let iKey = 'm';
        if (imp === 'low') iKey = 'l';
        else if (imp === 'high' || imp === 'critical') iKey = 'h';
        else iKey = 'm';

        if(matrix[pKey]) {
            matrix[pKey][iKey]++;
        }
    });

    Object.keys(matrix).forEach(pKey => {
        Object.keys(matrix[pKey]).forEach(iKey => {
            const el = document.getElementById(`mat-${pKey}-${iKey}`);
            if (el) {
                const count = matrix[pKey][iKey];
                el.textContent = count;
                el.className = 'matrix-cell';
                if (count > 0) {
                    if (pKey === 'vl' || iKey === 'h') el.classList.add('c-4');
                    else if (pKey === 'l' && iKey === 'm') el.classList.add('c-3');
                    else if (iKey === 'l') el.classList.add('c-1');
                    else el.classList.add('c-2'); // fallback warm
                } else {
                    el.classList.add('c-inactive');
                }
            }
        });
    });
}

function renderRecentTable(risks) {
    const tbody = document.getElementById('recentRisksTbody');
    if (!tbody) return;

    const sorted = [...risks].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    
    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No risks found</td></tr>';
        return;
    }

    tbody.innerHTML = sorted.map(r => {
        let sid = r._id || r.id || '';
        let displayId = sid.length > 6 ? `RSK-${sid.slice(-4).toUpperCase()}` : sid;
        let projectName = r.project?.name || r.project?.title || r.projectName || 'Global/Unknown';
        let severity = r.impact || 'Medium';
        let badgeClass = severity.toLowerCase() === 'critical' || severity.toLowerCase() === 'high' ? 'bg-red' : 
                         severity.toLowerCase() === 'medium' ? 'bg-orange' : 'bg-green';
        let status = r.currentStatus || r.status || 'Open';
        let statusColor = status.toLowerCase() === 'open' ? 'var(--danger)' : 'var(--success)';
        let owner = r.owner?.name || r.createdBy?.name || 'Unassigned';

        return `
            <tr>
                <td style="color:var(--text-muted); font-family:monospace;">${displayId}</td>
                <td style="font-weight:600;"><a href="view-risk.html?id=${sid}">${escapeHTML(r.title)}</a></td>
                <td style="color:var(--text-muted);">${escapeHTML(projectName)}</td>
                <td><span class="badge" style="background:transparent; border: 1px solid ${badgeClass === 'bg-red' ? 'rgba(229, 57, 53, 0.4)' : 'rgba(255, 160, 0, 0.4)'}; color: ${badgeClass === 'bg-red' ? 'var(--danger)' : 'var(--warning)'}; border-radius:12px;">${severity}</span></td>
                <td><span style="display:inline-flex; align-items:center; gap:6px;"><span style="width:6px; height:6px; border-radius:50%; background:${statusColor};"></span> ${status}</span></td>
                <td style="color:var(--text-muted);">${escapeHTML(owner)}</td>
            </tr>
        `;
    }).join('');
}

function initTrendChart() {
    const ctx = document.getElementById('riskTrendChart');
    if (!ctx) return;

    // Use computed styles to fetch current theme colors dynamically
    const style = getComputedStyle(document.body);
    const borderColor = style.getPropertyValue('--border-color').trim() || '#3a3f57';
    const textColor = style.getPropertyValue('--text-muted').trim() || '#b8bfd3';

    // Dummy data array mirroring the Jan-Apr trend chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [
                {
                    label: 'Critical',
                    data: [3, 5, 6, 4],
                    borderColor: 'rgba(229, 57, 53, 1)',
                    backgroundColor: 'rgba(229, 57, 53, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'High',
                    data: [1, 2, 3, 3],
                    borderColor: 'rgba(255, 160, 0, 1)',
                    backgroundColor: 'rgba(255, 160, 0, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Medium',
                    data: [0, 1, 2, 5],
                    borderColor: 'rgba(76, 175, 80, 1)',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: borderColor, drawBorder: false },
                    ticks: { color: textColor }
                },
                y: {
                    beginAtZero: true,
                    max: 8,
                    grid: { color: borderColor, drawBorder: false },
                    ticks: { color: textColor, stepSize: 2 }
                }
            }
        }
    });
}
