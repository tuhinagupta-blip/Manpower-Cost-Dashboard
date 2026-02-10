// ========== AUTHENTICATION ==========
const USERS = {
    'admin@sabyasachi.com': { password: 'admin123', name: 'Admin', role: 'admin' },
    'user1@sabyasachi.com': { password: 'user123', name: 'User 1', role: 'user' },
    'user2@sabyasachi.com': { password: 'user123', name: 'User 2', role: 'user' }
};

let currentUser = null;
let employeeData = [];
let filteredData = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLogin();
    }
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('backToFY').addEventListener('click', showFYView);
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (USERS[email] && USERS[email].password === password) {
        currentUser = { email, ...USERS[email] };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        document.getElementById('loginError').textContent = 'Invalid credentials';
        document.getElementById('loginError').style.display = 'block';
    }
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    showLogin();
}

function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainDashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
    
    if (currentUser.role === 'admin') {
        document.getElementById('uploadSection').style.display = 'block';
    }
    
    // Initialize Select2 for multi-select
    $('.filter-select').select2({
        placeholder: 'Select options',
        allowClear: true,
        width: '100%'
    });
    
    // Set default dates
    const today = new Date();
    const fyStart = getFYStart(today);
    document.getElementById('startDate').value = `${fyStart.getFullYear()}-04-01`;
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
    
    // Add change listeners
    $('.filter-select, #startDate, #endDate').on('change', applyFilters);
}

// ========== FY UTILITIES ==========
function getFYStart(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    return new Date(month < 3 ? year - 1 : year, 3, 1);
}

function getFYEnd(date) {
    const fyStart = getFYStart(date);
    return new Date(fyStart.getFullYear() + 1, 2, 31);
}

// ========== FILE UPLOAD ==========
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            
            processEmployeeData(jsonData);
            updateLastUpdated();
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function processEmployeeData(rawData) {
    employeeData = rawData.map(row => {
        let ctc = row['Annual CTC'] || row['annual_ctc'] || 0;
        if (typeof ctc === 'string') ctc = parseFloat(ctc.replace(/,/g, ''));
        
        return {
            employeeCode: row['Employee Code'] || '',
            name: row['Name'] || '',
            cohort: row['Cohort'] || '',
            department: row['Department'] || '',
            hrbp: row['HRBP'] || '',
            employeeType: row['Employee Type'] || '',
            level: row['Level'] || '',
            dateOfJoining: parseDate(row['Date of Joining']),
            dateOfLeaving: parseDate(row['Date of Leaving']),
            annualCTC: parseFloat(ctc),
            status: row['Status'] || 'Active'
        };
    });

    populateFilters();
    applyFilters();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        const parts = dateStr.toString().trim().split(/[\s-/]+/);
        if (parts.length === 3) {
            const months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
            if (months[parts[1]] !== undefined) {
                date = new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
            }
        }
    }
    return isNaN(date.getTime()) ? null : date;
}

function populateFilters() {
    const cohorts = [...new Set(employeeData.map(e => e.cohort).filter(Boolean))];
    const departments = [...new Set(employeeData.map(e => e.department).filter(Boolean))];
    const hrbps = [...new Set(employeeData.map(e => e.hrbp).filter(Boolean))];
    const levels = [...new Set(employeeData.map(e => e.level).filter(Boolean))];

    $('#cohortFilter').html('<option value="all">All Cohorts</option>' + cohorts.sort().map(c => `<option value="${c}">${c}</option>`).join(''));
    $('#departmentFilter').html('<option value="all">All Departments</option>' + departments.sort().map(d => `<option value="${d}">${d}</option>`).join(''));
    $('#hrbpFilter').html('<option value="all">All HRBPs</option>' + hrbps.sort().map(h => `<option value="${h}">${h}</option>`).join(''));
    $('#levelFilter').html('<option value="all">All Levels</option>' + levels.sort().map(l => `<option value="${l}">${l}</option>`).join(''));
}

// ========== FILTERING ==========
function applyFilters() {
    const cohorts = $('#cohortFilter').val() || ['all'];
    const departments = $('#departmentFilter').val() || ['all'];
    const hrbps = $('#hrbpFilter').val() || ['all'];
    const types = $('#employeeTypeFilter').val() || ['all'];
    const levels = $('#levelFilter').val() || ['all'];

    filteredData = employeeData.filter(emp => {
        return (cohorts.includes('all') || cohorts.includes(emp.cohort)) &&
               (departments.includes('all') || departments.includes(emp.department)) &&
               (hrbps.includes('all') || hrbps.includes(emp.hrbp)) &&
               (types.includes('all') || types.includes(emp.employeeType)) &&
               (levels.includes('all') || levels.includes(emp.level));
    });

    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    calculateMetrics(startDate, endDate);
}

// ========== COST CALCULATIONS ==========
function calculateMetrics(startDate, endDate) {
    const today = new Date();
    const fyStart = getFYStart(endDate);
    const fyEnd = getFYEnd(endDate);
    
    // Headcounts
    const current = filteredData.filter(e => 
        e.status === 'Active' && e.dateOfJoining && 
        e.dateOfJoining <= today && (!e.dateOfLeaving || e.dateOfLeaving >= today)
    ).length;
    
    const toHire = filteredData.filter(e => e.status === 'Planned').length;
    
    // Costs
    const monthly = calculateMonthlyCost(filteredData, today);
    const ytd = calculateYTDCost(filteredData, fyStart, endDate);
    const annual = calculateAnnualProjection(filteredData, fyStart, fyEnd, today);
    
    // Update UI
    document.getElementById('currentHeadcount').textContent = current.toLocaleString();
    document.getElementById('toBeHired').textContent = toHire.toLocaleString();
    document.getElementById('totalHeadcount').textContent = (current + toHire).toLocaleString();
    document.getElementById('monthlyCost').textContent = formatCurrency(monthly);
    document.getElementById('ytdCost').textContent = formatCurrency(ytd);
    document.getElementById('annualCost').textContent = formatCurrency(annual);
    
    // Debug
    console.log('FY:', fyStart.toDateString(), '-', fyEnd.toDateString());
    console.log('Monthly:', monthly, 'YTD:', ytd, 'Annual:', annual);
    
    // Tables
    updateTables(filteredData, fyStart, endDate, fyEnd, today);
    updateFYChart();
}

function calculateMonthlyCost(employees, date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const daysInMonth = monthEnd.getDate();
    
    let total = 0;
    employees.forEach(emp => {
        if (!emp.dateOfJoining || emp.dateOfJoining > monthEnd) return;
        if (emp.dateOfLeaving && emp.dateOfLeaving < monthStart) return;
        
        const start = emp.dateOfJoining > monthStart ? emp.dateOfJoining : monthStart;
        const end = emp.dateOfLeaving && emp.dateOfLeaving < monthEnd ? emp.dateOfLeaving : monthEnd;
        const days = Math.ceil((end - start) / (1000*60*60*24)) + 1;
        
        total += (emp.annualCTC / 12 / daysInMonth) * days;
    });
    return total;
}

function calculateYTDCost(employees, fyStart, endDate) {
    let total = 0;
    let current = new Date(fyStart);
    
    while (current <= endDate) {
        total += calculateMonthlyCost(employees, current);
        current.setMonth(current.getMonth() + 1);
    }
    return total;
}

function calculateAnnualProjection(employees, fyStart, fyEnd, today) {
    const ytd = calculateYTDCost(employees, fyStart, today);
    
    const active = employees.filter(e => 
        e.status === 'Active' && e.dateOfJoining && 
        e.dateOfJoining <= today && (!e.dateOfLeaving || e.dateOfLeaving >= today)
    );
    
    let projection = 0;
    let current = new Date(today);
    current.setMonth(current.getMonth() + 1);
    
    while (current <= fyEnd) {
        active.forEach(emp => projection += emp.annualCTC / 12);
        current.setMonth(current.getMonth() + 1);
    }
    
    return ytd + projection;
}

// ========== TABLES ==========
function updateTables(employees, fyStart, endDate, fyEnd, today) {
    updateCohortTable(employees, fyStart, endDate, fyEnd, today);
    updateEmployeeTypeTable(employees, fyStart, endDate, fyEnd, today);
    updateLevelTable(employees, fyStart, endDate, fyEnd, today);
}

function updateCohortTable(employees, fyStart, endDate, fyEnd, today) {
    const data = {};
    employees.forEach(e => {
        if (!data[e.cohort]) data[e.cohort] = [];
        data[e.cohort].push(e);
    });
    
    const tbody = document.querySelector('#cohortTable tbody');
    tbody.innerHTML = '';
    
    Object.keys(data).sort().forEach(cohort => {
        const emps = data[cohort];
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${cohort || 'Unassigned'}</td>
            <td>${emps.length}</td>
            <td>${formatCurrency(calculateMonthlyCost(emps, today))}</td>
            <td>${formatCurrency(calculateYTDCost(emps, fyStart, endDate))}</td>
            <td>${formatCurrency(calculateAnnualProjection(emps, fyStart, fyEnd, today))}</td>
        `;
    });
}

function updateEmployeeTypeTable(employees, fyStart, endDate, fyEnd, today) {
    const data = {
        'Management': [],
        'Non-Management': [],
        'Consultant': []
    };
    
    employees.forEach(e => {
        if (data[e.employeeType]) data[e.employeeType].push(e);
    });
    
    const tbody = document.querySelector('#employeeTypeTable tbody');
    tbody.innerHTML = '';
    
    ['Management', 'Non-Management', 'Consultant'].forEach(type => {
        const emps = data[type];
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${type}</td>
            <td>${emps.length}</td>
            <td>${formatCurrency(calculateMonthlyCost(emps, today))}</td>
            <td>${formatCurrency(calculateYTDCost(emps, fyStart, endDate))}</td>
            <td>${formatCurrency(calculateAnnualProjection(emps, fyStart, fyEnd, today))}</td>
        `;
    });
}

function updateLevelTable(employees, fyStart, endDate, fyEnd, today) {
    const data = {};
    employees.forEach(e => {
        if (!data[e.level]) data[e.level] = [];
        data[e.level].push(e);
    });
    
    const tbody = document.querySelector('#levelTable tbody');
    tbody.innerHTML = '';
    
    Object.keys(data).sort().forEach(level => {
        const emps = data[level];
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${level || 'Unassigned'}</td>
            <td>${emps.length}</td>
            <td>${formatCurrency(calculateMonthlyCost(emps, today))}</td>
            <td>${formatCurrency(calculateYTDCost(emps, fyStart, endDate))}</td>
            <td>${formatCurrency(calculateAnnualProjection(emps, fyStart, fyEnd, today))}</td>
        `;
    });
}

// ========== CHARTS ==========
function updateFYChart() {
    const today = new Date();
    const currentFY = getFYStart(today).getFullYear();
    
    const years = [];
    const costs = [];
    
    for (let i = 4; i >= 0; i--) {
        const fyYear = currentFY - i;
        const start = new Date(fyYear, 3, 1);
        const end = new Date(fyYear + 1, 2, 31);
        
        const fyEmps = employeeData.filter(e => 
            e.dateOfJoining && e.dateOfJoining <= end && (!e.dateOfLeaving || e.dateOfLeaving >= start)
        );
        
        years.push(`FY ${fyYear}-${(fyYear+1).toString().slice(-2)}`);
        costs.push({
            value: calculateYTDCost(fyEmps, start, end) / 10000000,
            year: fyYear
        });
    }
    
    const ctx = document.getElementById('fyTrendChart').getContext('2d');
    if (window.fyChart) window.fyChart.destroy();
    
    window.fyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                data: costs.map(c => c.value),
                backgroundColor: '#000000',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements[0]) showDepartmentView(costs[elements[0].index].year);
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#000',
                    callbacks: { label: ctx => `₹ ${ctx.parsed.y.toFixed(2)} Cr` }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => `₹ ${v.toFixed(1)} Cr` }
                }
            }
        }
    });
}

function showDepartmentView(fyYear) {
    const start = new Date(fyYear, 3, 1);
    const end = new Date(fyYear + 1, 2, 31);
    
    const fyEmps = filteredData.filter(e => 
        e.dateOfJoining && e.dateOfJoining <= end && (!e.dateOfLeaving || e.dateOfLeaving >= start)
    );
    
    const depts = {};
    fyEmps.forEach(e => {
        const dept = e.department || 'Unassigned';
        if (!depts[dept]) depts[dept] = [];
        depts[dept].push(e);
    });
    
    const labels = Object.keys(depts).sort();
    const costs = labels.map(d => calculateYTDCost(depts[d], start, end) / 10000000);
    
    document.getElementById('fyView').classList.remove('active');
    document.getElementById('deptView').classList.add('active');
    document.getElementById('deptViewTitle').textContent = `Department Cost: FY ${fyYear}-${(fyYear+1).toString().slice(-2)}`;
    
    const ctx = document.getElementById('deptChart').getContext('2d');
    if (window.deptChart) window.deptChart.destroy();
    
    window.deptChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ data: costs, backgroundColor: '#000', borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#000',
                    callbacks: { label: ctx => `₹ ${ctx.parsed.x.toFixed(2)} Cr` }
                }
            },
            scales: {
                x: { beginAtZero: true, ticks: { callback: v => `₹ ${v.toFixed(1)} Cr` } },
                y: { grid: { display: false } }
            }
        }
    });
}

function showFYView() {
    document.getElementById('deptView').classList.remove('active');
    document.getElementById('fyView').classList.add('active');
}

// ========== UTILITIES ==========
function formatCurrency(amount) {
    if (amount >= 10000000) return '₹ ' + (amount / 10000000).toFixed(2) + ' Cr';
    if (amount >= 100000) return '₹ ' + (amount / 100000).toFixed(2) + ' L';
    return '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function updateLastUpdated() {
    const now = new Date();
    document.getElementById('lastUpdated').textContent = `Updated: ${now.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })}`;
}
