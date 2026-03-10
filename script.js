// --- DATA: Sample Risks ---
const riskData = [
    { id: 'RSK-002', name: 'Supply Chain Disruption', category: 'Operational', prob: 'High', probClass: 'badge-high', impact: 'High', impactClass: 'badge-high', score: 9, scoreClass: 'badge-high', status: 'In Progress', statusClass: 'status-progress' },
    { id: 'RSK-001', name: 'Data Breach Vulnerability', category: 'Security', prob: 'Medium', probClass: 'badge-medium', impact: 'Critical', impactClass: 'badge-critical', score: 8, scoreClass: 'badge-high', status: 'Open', statusClass: 'status-open' },
    { id: 'RSK-003', name: 'Regulatory Compliance Gap', category: 'Compliance', prob: 'Medium', probClass: 'badge-medium', impact: 'High', impactClass: 'badge-high', score: 6, scoreClass: 'badge-high', status: 'Open', statusClass: 'status-open' },
    { id: 'RSK-005', name: 'Currency Exchange Fluctuation', category: 'Financial', prob: 'High', probClass: 'badge-high', impact: 'Medium', impactClass: 'badge-medium', score: 6, scoreClass: 'badge-high', status: 'Open', statusClass: 'status-open' },
    { id: 'RSK-006', name: 'System Downtime', category: 'Technical', prob: 'Low', probClass: 'badge-low', impact: 'Critical', impactClass: 'badge-critical', score: 4, scoreClass: 'badge-medium', status: 'In Progress', statusClass: 'status-progress' },
];

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. HANDLE LOGIN (Only runs if on login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // In a real app, you would check credentials here.
            // For this demo, simply redirect:
            window.location.href = 'dashboard.html';
        });
    }

    // 2. INITIALIZE DASHBOARD (Only runs if on dashboard.html)
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        // Load data into table
        renderTable();
        // Load charts
        initCharts();
    }
});

// --- FUNCTION: Render Risk Table ---
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = ''; // Clear existing

    riskData.forEach(risk => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium">${risk.id}</td>
            <td class="px-6 py-4 font-semibold text-gray-800">${risk.name}</td>
            <td class="px-6 py-4">${risk.category}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-semibold ${risk.probClass}">${risk.prob}</span></td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-semibold ${risk.impactClass}">${risk.impact}</span></td>
            <td class="px-6 py-4">
                <span class="font-bold text-gray-700 mr-2">${risk.score}</span>
                <span class="px-2 py-1 rounded text-xs font-semibold ${risk.scoreClass}">${risk.score >= 8 ? 'High' : (risk.score >= 4 ? 'Medium' : 'Low')}</span>
            </td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${risk.statusClass}">${risk.status}</span></td>
            <td class="px-6 py-4 text-right">
                <button class="text-gray-400 hover:text-blue-600 mx-1"><i class="fa-regular fa-eye"></i></button>
                <button class="text-gray-400 hover:text-blue-600 mx-1"><i class="fa-solid fa-pencil"></i></button>
                <button class="text-gray-400 hover:text-red-600 mx-1"><i class="fa-regular fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FUNCTION: Navigation Switching ---
function switchTab(tabId) {
    // 1. Hide all Content Views
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // 2. Remove 'active' class from all Nav Links
    document.querySelectorAll('.sidebar-link').forEach(el => {
        el.classList.remove('active');
        el.classList.remove('bg-gray-800'); // Remove background highlight
        el.classList.remove('border-l-4');
        el.classList.remove('border-blue-500');
    });

    // 3. Show selected View
    const view = document.getElementById('view-' + tabId);
    if(view) view.classList.remove('hidden');

    // 4. Add 'active' class to selected Nav Link
    const nav = document.getElementById('nav-' + tabId);
    if(nav) nav.classList.add('active');

    // 5. Update Header Title
    const titles = {
        'dashboard': 'Dashboard',
        'risks': 'Risk Registry',
        'reports': 'Risk Reports'
    };
    const headerTitle = document.getElementById('page-header-title');
    if(headerTitle) headerTitle.innerText = titles[tabId];
}

// --- FUNCTION: Charts ---
function initCharts() {
    // Donut Chart
    const ctxDist = document.getElementById('chartDistribution');
    if (ctxDist) {
        new Chart(ctxDist.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Critical', 'High', 'Medium', 'Low'],
                datasets: [{
                    data: [0, 4, 3, 1],
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
                cutout: '65%'
            }
        });
    }

    // Bar Chart
    const ctxCat = document.getElementById('chartCategory');
    if (ctxCat) {
        new Chart(ctxCat.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Operational', 'Security', 'Compliance', 'Financial', 'Technical', 'Reputational', 'Strategic'],
                datasets: [{
                    label: 'Risks',
                    data: [2, 1, 1, 1, 1, 1, 1],
                    backgroundColor: '#3b82f6',
                    borderRadius: 4,
                    barThickness: 15
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { beginAtZero: true, grid: { display: true, borderDash: [2, 2] } },
                    y: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}