// Global data storage
let employeeData = [];
let filteredData = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setDefaultDates();
});

function initializeEventListeners() {
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
}

function setDefaultDates() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    document.getElementById('startDate').value = startOfYear.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
}

// File upload and parsing
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
            annualCTC: parseFloat(row['Annual CTC'] || row['annual_ctc'] || 0),
            status: row['Status'] || row['status'] || 'Active' // Active, Inactive, Planned
        };
    });

    // Populate filter dropdowns
    populateFilters();
    
    // Apply initial filters
    applyFilters();
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle various date formats
    const date = new Date(dateStr);
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
    // Keep the "All" option
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

function applyFilters() {
    const selectedCohorts = getSelectedValues('cohortFilter');
    const selectedDepartments = getSelectedValues('departmentFilter');
    const selectedHRBPs = getSelectedValues('hrbpFilter');
    const selectedEmployeeTypes = getSelectedValues('employeeTypeFilter');
    const selectedLevels = getSelectedValues('levelFilter');
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);

    filteredData = employeeData.filter(emp => {
        const cohortMatch = selectedCohorts.includes('all') || selectedCohorts.includes(emp.cohort);
        const deptMatch = selectedDepartments.includes('all') || selectedDepartments.includes(emp.department);
        const hrbpMatch = selectedHRBPs.includes('all') || selectedHRBPs.includes(emp.hrbp);
        const typeMatch = selectedEmployeeTypes.includes('all') || selectedEmployeeTypes.includes(emp.employeeType);
        const levelMatch = selectedLevels.includes('all') || selectedLevels.includes(emp.level);

        return cohortMatch && deptMatch && hrbpMatch && typeMatch && levelMatch;
    });

    calculateAndDisplayMetrics(startDate, endDate);
}

function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    const selected = Array.from(select.selectedOptions).map(opt => opt.value);
    return selected.length === 0 ? ['all'] : selected;
}

function resetFilters() {
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
    });
    setDefaultDates();
    applyFilters();
}

// Cost calculation functions
function calculateAndDisplayMetrics(startDate, endDate) {
    const currentDate = new Date();
    const yearStart = new Date(currentDate.getFullYear(), 0, 1);
    
    // Calculate headcounts
    const currentHeadcount = filteredData.filter(e => 
        e.status === 'Active' && 
        e.dateOfJoining && 
        e.dateOfJoining <= currentDate &&
        (!e.dateOfLeaving || e.dateOfLeaving >= currentDate)
    ).length;
    
    const toBeHired = filteredData.filter(e => e.status === 'Planned').length;
    const totalHeadcount = currentHeadcount + toBeHired;

    // Calculate costs
    const monthlyCost = calculateMonthlyCost(filteredData, currentDate);
    const ytdCost = calculateYTDCost(filteredData, yearStart, currentDate);
    const annualCost = calculateAnnualCost(filteredData, new Date(currentDate.getFullYear(), 0, 1), new Date(currentDate.getFullYear(), 11, 31));

    // Update KPIs
    document.getElementById('currentHeadcount').textContent = currentHeadcount.toLocaleString();
    document.getElementById('toBeHired').textContent = toBeHired.toLocaleString();
    document.getElementById('totalHeadcount').textContent = totalHeadcount.toLocaleString();
    document.getElementById('monthlyCost').textContent = formatCurrency(monthlyCost);
    document.getElementById('ytdCost').textContent = formatCurrency(ytdCost);
    document.getElementById('annualCost').textContent = formatCurrency(annualCost);

    // Update tables
    updateDepartmentTable(filteredData, yearStart, currentDate);
    updateEmployeeTypeTable(filteredData, yearStart, currentDate);

    // Update chart
    updateFYChart();
}

function calculateMonthlyCost(employees, targetDate) {
    let totalCost = 0;
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    employees.forEach(emp => {
        if (!emp.dateOfJoining) return;

        // Check if employee was active in the target month
        const monthStart = new Date(targetYear, targetMonth, 1);
        const monthEnd = new Date(targetYear, targetMonth + 1, 0);

        if (emp.dateOfJoining <= monthEnd && (!emp.dateOfLeaving || emp.dateOfLeaving >= monthStart)) {
            // Calculate monthly CTC
            const monthlyCTC = emp.annualCTC / 12;
            
            // Calculate days active in the month
            const activeStart = emp.dateOfJoining > monthStart ? emp.dateOfJoining : monthStart;
            const activeEnd = emp.dateOfLeaving && emp.dateOfLeaving < monthEnd ? emp.dateOfLeaving : monthEnd;
            
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const daysActive = Math.ceil((activeEnd - activeStart) / (1000 * 60 * 60 * 24)) + 1;
            
            // Prorate the cost
            const proratedCost = (monthlyCTC / daysInMonth) * daysActive;
            totalCost += proratedCost;
        }
    });

    return totalCost;
}

function calculateYTDCost(employees, startDate, endDate) {
    let totalCost = 0;
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    // Calculate for each month from start to end
    for (let year = startYear; year <= endYear; year++) {
        const startMonth = (year === startYear) ? startDate.getMonth() : 0;
        const lastMonth = (year === endYear) ? endMonth : 11;

        for (let month = startMonth; month <= lastMonth; month++) {
            const monthDate = new Date(year, month, 15); // Mid-month
            totalCost += calculateMonthlyCost(employees, monthDate);
        }
    }

    return totalCost;
}

function calculateAnnualCost(employees, yearStart, yearEnd) {
    let totalCost = 0;

    employees.forEach(emp => {
        if (!emp.dateOfJoining) return;

        // Determine the overlap between employee tenure and the year
        const activeStart = emp.dateOfJoining > yearStart ? emp.dateOfJoining : yearStart;
        const activeEnd = emp.dateOfLeaving && emp.dateOfLeaving < yearEnd ? emp.dateOfLeaving : yearEnd;

        if (activeStart <= activeEnd) {
            // Calculate months active
            const monthsActive = (activeEnd.getFullYear() - activeStart.getFullYear()) * 12 +
                               (activeEnd.getMonth() - activeStart.getMonth()) + 1;

            // Calculate cost (monthly CTC * months active)
            const monthlyCTC = emp.annualCTC / 12;
            const cost = monthlyCTC * monthsActive;
            
            totalCost += cost;
        }
    });

    return totalCost;
}

function updateDepartmentTable(employees, yearStart, currentDate) {
    const departmentData = {};

    employees.forEach(emp => {
        if (!departmentData[emp.department]) {
            departmentData[emp.department] = {
                headcount: 0,
                employees: []
            };
        }
        departmentData[emp.department].headcount++;
        departmentData[emp.department].employees.push(emp);
    });

    const tbody = document.querySelector('#departmentTable tbody');
    tbody.innerHTML = '';

    Object.keys(departmentData).sort().forEach(dept => {
        const data = departmentData[dept];
        const monthlyCost = calculateMonthlyCost(data.employees, currentDate);
        const ytdCost = calculateYTDCost(data.employees, yearStart, currentDate);
        const annualCost = calculateAnnualCost(data.employees, new Date(currentDate.getFullYear(), 0, 1), new Date(currentDate.getFullYear(), 11, 31));

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${dept || 'Unassigned'}</td>
            <td>${data.headcount}</td>
            <td>${formatCurrency(monthlyCost)}</td>
            <td>${formatCurrency(ytdCost)}</td>
            <td>${formatCurrency(annualCost)}</td>
        `;
    });
}

function updateEmployeeTypeTable(employees, yearStart, currentDate) {
    const typeData = {};

    employees.forEach(emp => {
        if (!typeData[emp.employeeType]) {
            typeData[emp.employeeType] = {
                headcount: 0,
                employees: []
            };
        }
        typeData[emp.employeeType].headcount++;
        typeData[emp.employeeType].employees.push(emp);
    });

    const tbody = document.querySelector('#employeeTypeTable tbody');
    tbody.innerHTML = '';

    const typeOrder = ['Management Cadre', 'Non-Management Cadre', 'Consultant'];
    typeOrder.forEach(type => {
        if (typeData[type]) {
            const data = typeData[type];
            const monthlyCost = calculateMonthlyCost(data.employees, currentDate);
            const ytdCost = calculateYTDCost(data.employees, yearStart, currentDate);
            const annualCost = calculateAnnualCost(data.employees, new Date(currentDate.getFullYear(), 0, 1), new Date(currentDate.getFullYear(), 11, 31));

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

function updateFYChart() {
    const currentYear = new Date().getFullYear();
    const years = [];
    const costs = [];

    // Calculate costs for past 5 years including current
    for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        
        // Filter employees who were active in this year
        const yearEmployees = employeeData.filter(emp => {
            if (!emp.dateOfJoining) return false;
            return emp.dateOfJoining <= yearEnd && (!emp.dateOfLeaving || emp.dateOfLeaving >= yearStart);
        });

        const yearCost = calculateAnnualCost(yearEmployees, yearStart, yearEnd);
        
        years.push(`FY ${year}-${(year + 1).toString().slice(-2)}`);
        costs.push(yearCost / 10000000); // Convert to Crores
    }

    const ctx = document.getElementById('fyTrendChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.fyChart) {
        window.fyChart.destroy();
    }

    window.fyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [{
                label: 'Total Manpower Cost (₹ Cr)',
                data: costs,
                backgroundColor: 'rgba(107, 31, 61, 0.8)',
                borderColor: 'rgba(107, 31, 61, 1)',
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: 'rgba(139, 46, 74, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Montserrat',
                            size: 13,
                            weight: '500'
                        },
                        color: '#2C2C2C'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(107, 31, 61, 0.95)',
                    titleFont: {
                        family: 'Cormorant Garamond',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Montserrat',
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `Cost: ₹ ${context.parsed.y.toFixed(2)} Cr`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Montserrat',
                            size: 12
                        },
                        color: '#5A5A5A'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 197, 185, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Montserrat',
                            size: 12
                        },
                        color: '#5A5A5A',
                        callback: function(value) {
                            return '₹ ' + value.toFixed(1) + ' Cr';
                        }
                    }
                }
            }
        }
    });
}

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
    document.getElementById('lastUpdated').textContent = `Last updated: ${formatted}`;
}
