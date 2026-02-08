// ========== AUTHENTICATION SYSTEM ==========
const USERS = {
    'admin@sabyasachi.com': { password: 'admin123', name: 'Admin', role: 'admin' },
    'user1@sabyasachi.com': { password: 'user123', name: 'User 1', role: 'user' },
    'user2@sabyasachi.com': { password: 'user123', name: 'User 2', role: 'user' }
};

let currentUser = null;
let employeeData = [];
let filteredData = [];
let selectedFY = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLogin();
    }
    
    // Set up event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('backToFY').addEventListener('click', showFYView);
    
    // Filters auto-apply on change
    ['cohortFilter', 'departmentFilter', 'hrbpFilter', 'employeeTypeFilter', 'levelFilter', 'startDate', 'endDate'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (USERS[email] && USERS[email].password === password) {
        currentUser = { email, ...USERS[email] };
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        document.getElementById('loginError').textContent = 'Invalid email or password';
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
    
    // Show upload button only for admin
    if (currentUser.role === 'admin') {
        document.getElementById('uploadSection').style.display = 'block';
    } else {
        document.getElementById('uploadSection').style.display = 'none';
    }
    
    setDefaultDates();
}

function setDefaultDates() {
    const today = new Date();
    const currentFY = getCurrentFY();
    
    document.getElementById('startDate').value = `${currentFY.start.year}-04-01`;
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// ========== FISCAL YEAR UTILITIES ==========
function getCurrentFY() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();
    
    // If current month is Jan-Mar (0-2), FY started last year
    // If current month is Apr-Dec (3-11), FY started this year
    const fyStartYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const fyEndYear = fyStartYear + 1;
    
    return {
        start: { year: fyStartYear, month: 3, day: 1 }, // April 1
        end: { year: fyEndYear, month: 2, day: 31 }, // March 31
        label: `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`
    };
}

function getFYForDate(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const fyStartYear = month < 3 ? year - 1 : year;
    const fyEndYear = fyStartYear + 1;
    
    return {
        start: new Date(fyStartYear, 3, 1), // April 1
        end: new Date(fyEndYear, 2, 31), // March 31
        label: `FY ${fyStartYear}-${fyEndYear.toString().slice(-2)}`,
        startYear: fyStartYear
    };
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
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
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
        // Parse Annual CTC - remove commas and convert to number
        let ctcValue = row['Annual CTC'] || row['annual_ctc'] || 0;
        if (typeof ctcValue === 'string') {
            ctcValue = parseFloat(ctcValue.replace(/,/g, ''));
        } else {
            ctcValue = parseFloat(ctcValue);
        }
        
        return {
            employeeCode: row['Employee Code'] || row['employee_code'] || '',
            name: row['Name'] || row['name'] || '',
            cohort: row['Cohort'] || row['cohort'] || '',
            department: row['Department'] || row['department'] || '',
            hrbp: row['HRBP'] || row['hrbp'] || '',
            employeeType: row['Employee Type'] || row['employee_type'] || '',
            level: row['Level'] || row['level'] || '',
            dateOfJoining: parseDate(row['Date of Joining'] || row['date_of_joining']),
            dateOfLeaving: parseDate(row['Date of Leaving'] || row['date_of_leaving']),
            annualCTC: ctcValue,
            status: row['Status'] || row['status'] || 'Active'
        };
    });

    populateFilters();
    applyFilters();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle various date formats
    // Try direct parsing first
    let date = new Date(dateStr);
    
    // If invalid, try DD MMM YYYY format (e.g., "08 Jul 2009")
    if (isNaN(date.getTime())) {
        const parts = dateStr.toString().trim().split(/[\s-/]+/);
        if (parts.length === 3) {
            const months = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            // Try DD MMM YYYY
            if (months[parts[1]] !== undefined) {
                date = new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
            }
            // Try YYYY MMM DD
            else if (months[parts[1]] !== undefined) {
                date = new Date(parseInt(parts[0]), months[parts[1]], parseInt(parts[2]));
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

    populateSelect('cohortFilter', cohorts);
    populateSelect('departmentFilter', departments);
    populateSelect('hrbpFilter', hrbps);
    populateSelect('levelFilter', levels);
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    const allOption = select.querySelector('option[value="all"]');
    select.innerHTML = '';
    if (allOption) select.appendChild(allOption);
    
    options.sort().forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

// ========== FILTERING ==========
function applyFilters() {
    const selectedCohort = document.getElementById('cohortFilter').value;
    const selectedDepartment = document.getElementById('departmentFilter').value;
    const selectedHRBP = document.getElementById('hrbpFilter').value;
    const selectedType = document.getElementById('employeeTypeFilter').value;
    const selectedLevel = document.getElementById('levelFilter').value;
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    filteredData = employeeData.filter(emp => {
        const cohortMatch = selectedCohort === 'all' || emp.cohort === selectedCohort;
        const deptMatch = selectedDepartment === 'all' || emp.department === selectedDepartment;
        const hrbpMatch = selectedHRBP === 'all' || emp.hrbp === selectedHRBP;
        const typeMatch = selectedType === 'all' || emp.employeeType === selectedType;
        const levelMatch = selectedLevel === 'all' || emp.level === selectedLevel;

        return cohortMatch && deptMatch && hrbpMatch && typeMatch && levelMatch;
    });

    calculateAndDisplayMetrics(startDate, endDate);
}

// ========== COST CALCULATIONS ==========
function calculateAndDisplayMetrics(startDate, endDate) {
    const currentDate = new Date();
    const currentFY = getCurrentFY();
    const fyStart = new Date(currentFY.start.year, currentFY.start.month, currentFY.start.day);
    const fyEnd = new Date(currentFY.end.year, currentFY.end.month, currentFY.end.day);
    
    // Headcounts
    const currentHeadcount = filteredData.filter(e => 
        e.status === 'Active' && 
        e.dateOfJoining && 
        e.dateOfJoining <= currentDate &&
        (!e.dateOfLeaving || e.dateOfLeaving >= currentDate)
    ).length;
    
    const toBeHired = filteredData.filter(e => e.status === 'Planned').length;
    const totalHeadcount = currentHeadcount + toBeHired;

    // Costs
    const monthlyCost = calculateMonthlyCost(filteredData, currentDate);
    const ytdCost = calculateYTDCost(filteredData, fyStart, currentDate);
    const annualCost = calculateAnnualCost(filteredData, fyStart, fyEnd);

    // Update KPIs
    document.getElementById('currentHeadcount').textContent = currentHeadcount.toLocaleString();
    document.getElementById('toBeHired').textContent = toBeHired.toLocaleString();
    document.getElementById('totalHeadcount').textContent = totalHeadcount.toLocaleString();
    document.getElementById('monthlyCost').textContent = formatCurrency(monthlyCost);
    document.getElementById('ytdCost').textContent = formatCurrency(ytdCost);
    document.getElementById('annualCost').textContent = formatCurrency(annualCost);

    // Update tables
    updateCohortTable(filteredData, fyStart, currentDate);
    updateEmployeeTypeTable(filteredData, fyStart, currentDate);
    updateLevelTable(filteredData, fyStart, currentDate);

    // Update FY chart
    updateFYChart();
}

function calculateMonthlyCost(employees, targetDate) {
    let totalCost = 0;
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    employees.forEach(emp => {
        if (!emp.dateOfJoining) return;

        const monthStart = new Date(targetYear, targetMonth, 1);
        const monthEnd = new Date(targetYear, targetMonth + 1, 0);

        if (emp.dateOfJoining <= monthEnd && (!emp.dateOfLeaving || emp.dateOfLeaving >= monthStart)) {
            const monthlyCTC = emp.annualCTC / 12;
            const activeStart = emp.dateOfJoining > monthStart ? emp.dateOfJoining : monthStart;
            const activeEnd = emp.dateOfLeaving && emp.dateOfLeaving < monthEnd ? emp.dateOfLeaving : monthEnd;
            
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const daysActive = Math.ceil((activeEnd - activeStart) / (1000 * 60 * 60 * 24)) + 1;
            
            const proratedCost = (monthlyCTC / daysInMonth) * daysActive;
            totalCost += proratedCost;
        }
    });

    return totalCost;
}

function calculateYTDCost(employees, fyStart, endDate) {
    let totalCost = 0;
    const startYear = fyStart.getFullYear();
    const startMonth = fyStart.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    for (let year = startYear; year <= endYear; year++) {
        const firstMonth = (year === startYear) ? startMonth : 0;
        const lastMonth = (year === endYear) ? endMonth : 11;

        for (let month = firstMonth; month <= lastMonth; month++) {
            const monthDate = new Date(year, month, 15);
            totalCost += calculateMonthlyCost(employees, monthDate);
        }
    }

    return totalCost;
}

function calculateAnnualCost(employees, fyStart, fyEnd) {
    return calculateYTDCost(employees, fyStart, fyEnd);
}

// ========== TABLES ==========
function updateCohortTable(employees, fyStart, currentDate) {
    const cohortData = {};

    employees.forEach(emp => {
        if (!cohortData[emp.cohort]) {
            cohortData[emp.cohort] = { headcount: 0, employees: [] };
        }
        cohortData[emp.cohort].headcount++;
        cohortData[emp.cohort].employees.push(emp);
    });

    const tbody = document.querySelector('#cohortTable tbody');
    tbody.innerHTML = '';

    Object.keys(cohortData).sort().forEach(cohort => {
        const data = cohortData[cohort];
        const monthlyCost = calculateMonthlyCost(data.employees, currentDate);
        const ytdCost = calculateYTDCost(data.employees, fyStart, currentDate);
        const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
        const annualCost = calculateAnnualCost(data.employees, fyStart, fyEnd);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${cohort || 'Unassigned'}</td>
            <td>${data.headcount}</td>
            <td>${formatCurrency(monthlyCost)}</td>
            <td>${formatCurrency(ytdCost)}</td>
            <td>${formatCurrency(annualCost)}</td>
        `;
    });
}

function updateEmployeeTypeTable(employees, fyStart, currentDate) {
    const typeData = {};

    employees.forEach(emp => {
        if (!typeData[emp.employeeType]) {
            typeData[emp.employeeType] = { headcount: 0, employees: [] };
        }
        typeData[emp.employeeType].headcount++;
        typeData[emp.employeeType].employees.push(emp);
    });

    const tbody = document.querySelector('#employeeTypeTable tbody');
    tbody.innerHTML = '';

    const typeOrder = ['Management', 'Non-Management', 'Consultant'];
    typeOrder.forEach(type => {
        if (typeData[type]) {
            const data = typeData[type];
            const monthlyCost = calculateMonthlyCost(data.employees, currentDate);
            const ytdCost = calculateYTDCost(data.employees, fyStart, currentDate);
            const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
            const annualCost = calculateAnnualCost(data.employees, fyStart, fyEnd);

            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${type}</td>
                <td>${data.headcount}</td>
                <td>${formatCurrency(monthlyCost)}</td>
                <td>${formatCurrency(ytdCost)}</td>
                <td>${formatCurrency(annualCost)}</td>
            `;
        }
    });
}

function updateLevelTable(employees, fyStart, currentDate) {
    const levelData = {};

    employees.forEach(emp => {
        if (!levelData[emp.level]) {
            levelData[emp.level] = { headcount: 0, employees: [] };
        }
        levelData[emp.level].headcount++;
        levelData[emp.level].employees.push(emp);
    });

    const tbody = document.querySelector('#levelTable tbody');
    tbody.innerHTML = '';

    Object.keys(levelData).sort().forEach(level => {
        const data = levelData[level];
        const monthlyCost = calculateMonthlyCost(data.employees, currentDate);
        const ytdCost = calculateYTDCost(data.employees, fyStart, currentDate);
        const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
        const annualCost = calculateAnnualCost(data.employees, fyStart, fyEnd);

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${level || 'Unassigned'}</td>
            <td>${data.headcount}</td>
            <td>${formatCurrency(monthlyCost)}</td>
            <td>${formatCurrency(ytdCost)}</td>
            <td>${formatCurrency(annualCost)}</td>
        `;
    });
}

// ========== CHARTS ==========
function updateFYChart() {
    const currentDate = new Date();
    const currentFYInfo = getCurrentFY();
    const years = [];
    const costs = [];

    // Get past 5 FYs
    for (let i = 4; i >= 0; i--) {
        const fyStartYear = currentFYInfo.start.year - i;
        const fyStart = new Date(fyStartYear, 3, 1); // April 1
        const fyEnd = new Date(fyStartYear + 1, 2, 31); // March 31
        
        const yearEmployees = employeeData.filter(emp => {
            if (!emp.dateOfJoining) return false;
            return emp.dateOfJoining <= fyEnd && (!emp.dateOfLeaving || emp.dateOfLeaving >= fyStart);
        });

        const yearCost = calculateAnnualCost(yearEmployees, fyStart, fyEnd);
        
        years.push(`FY ${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`);
        costs.push({ value: yearCost / 10000000, year: fyStartYear });
    }

    const ctx = document.getElementById('fyTrendChart').getContext('2d');
    
    if (window.fyChart) {
        window.fyChart.destroy();
    }

    window.fyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Total Manpower Cost (₹ Cr)',
                data: costs.map(c => c.value),
                backgroundColor: '#000000',
                borderColor: '#000000',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    selectedFY = costs[index].year;
                    showDepartmentView(selectedFY);
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#000000',
                    padding: 12,
                    callbacks: {
                        label: (context) => `Cost: ₹ ${context.parsed.y.toFixed(2)} Cr`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#333333', font: { size: 12 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#e0e0e0' },
                    ticks: {
                        color: '#333333',
                        font: { size: 12 },
                        callback: (value) => '₹ ' + value.toFixed(1) + ' Cr'
                    }
                }
            }
        }
    });
}

function showDepartmentView(fyStartYear) {
    const fyStart = new Date(fyStartYear, 3, 1);
    const fyEnd = new Date(fyStartYear + 1, 2, 31);
    
    // Filter employees active in this FY
    const fyEmployees = employeeData.filter(emp => {
        if (!emp.dateOfJoining) return false;
        return emp.dateOfJoining <= fyEnd && (!emp.dateOfLeaving || emp.dateOfLeaving >= fyStart);
    });
    
    // Group by department
    const deptData = {};
    fyEmployees.forEach(emp => {
        if (!deptData[emp.department]) {
            deptData[emp.department] = [];
        }
        deptData[emp.department].push(emp);
    });
    
    const departments = Object.keys(deptData).sort();
    const costs = departments.map(dept => {
        const cost = calculateAnnualCost(deptData[dept], fyStart, fyEnd);
        return cost / 10000000; // Convert to Cr
    });
    
    // Update view
    document.getElementById('fyView').classList.remove('active');
    document.getElementById('deptView').classList.add('active');
    document.getElementById('deptViewTitle').textContent = `Department-wise Cost: FY ${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;
    
    // Create chart
    const ctx = document.getElementById('deptChart').getContext('2d');
    
    if (window.deptChart) {
        window.deptChart.destroy();
    }

    window.deptChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: departments,
            datasets: [{
                label: 'Department Cost (₹ Cr)',
                data: costs,
                backgroundColor: '#000000',
                borderColor: '#000000',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#000000',
                    padding: 12,
                    callbacks: {
                        label: (context) => `Cost: ₹ ${context.parsed.x.toFixed(2)} Cr`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: '#e0e0e0' },
                    ticks: {
                        color: '#333333',
                        callback: (value) => '₹ ' + value.toFixed(1) + ' Cr'
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#333333', font: { size: 11 } }
                }
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
    if (amount >= 10000000) {
        return '₹ ' + (amount / 10000000).toFixed(2) + ' Cr';
    } else if (amount >= 100000) {
        return '₹ ' + (amount / 100000).toFixed(2) + ' L';
    } else {
        return '₹ ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
}

function updateLastUpdated() {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', { 
        day: 'numeric',
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = `Updated: ${formatted}`;
}
