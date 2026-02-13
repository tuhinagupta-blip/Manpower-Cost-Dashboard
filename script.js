// admin@sabyasachi.com
// Pass: admin123

let rawEmployeeData = [];
let filteredData = [];

// ... [Existing Login Logic but add this check] ...
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'block';
    
    // ADMIN ACCESS CONTROL
    if (currentUser.email === 'admin@sabyasachi.com') {
        document.getElementById('adminControls').style.display = 'block';
    }
    
    initializeFilters();
}

// ========== ACCURATE CALCULATIONS ==========

function calculateMetrics() {
    const startRange = new Date(document.getElementById('startDate').value);
    const endRange = new Date(document.getElementById('endDate').value);
    
    // 1. Headcounts (As of End Date)
    const activeHC = filteredData.filter(e => 
        e.status === 'Active' && 
        new Date(e.dateOfJoining) <= endRange && 
        (!e.dateOfLeaving || new Date(e.dateOfLeaving) > endRange)
    ).length;

    const plannedHC = filteredData.filter(e => e.status === 'Vacancy' || e.status === 'Planned').length;

    // 2. Monthly Cost (For the month of the End Date)
    const monthlyCost = getMonthlyTotal(filteredData, endRange);

    // 3. YTD Cost (From April 1st of selected FY to End Date)
    const fyStartDate = getFYStart(endRange);
    const ytdCost = getRangeTotal(filteredData, fyStartDate, endRange);

    // 4. Annual Projection (YTD + Projected months until March 31st)
    const fyEndDate = new Date(fyStartDate.getFullYear() + 1, 2, 31);
    const monthsRemaining = Math.max(0, (fyEndDate.getFullYear() - endRange.getFullYear()) * 12 + (fyEndDate.getMonth() - endRange.getMonth()));
    const projectedAnnual = ytdCost + (monthlyCost * monthsRemaining);

    // Update UI
    document.getElementById('currentHeadcount').innerText = activeHC;
    document.getElementById('toBeHired').innerText = plannedHC;
    document.getElementById('totalHeadcount').innerText = activeHC + plannedHC;
    document.getElementById('monthlyCost').innerText = formatCurrency(monthlyCost);
    document.getElementById('ytdCost').innerText = formatCurrency(ytdCost);
    document.getElementById('annualCost').innerText = formatCurrency(projectedAnnual);

    updateTables(fyStartDate, endRange);
    updateFYChart();
}

function getMonthlyTotal(emps, date) {
    const mStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const mEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    return emps.reduce((acc, emp) => {
        const join = new Date(emp.dateOfJoining);
        const leave = emp.dateOfLeaving ? new Date(emp.dateOfLeaving) : new Date(2099, 1, 1);
        
        if (join <= mEnd && leave >= mStart) {
            // Simple monthly logic: if active during month, count full month (or use pro-rata)
            return acc + (emp.annualCTC / 12);
        }
        return acc;
    }, 0);
}

function getRangeTotal(emps, start, end) {
    let total = 0;
    let curr = new Date(start);
    while (curr <= end) {
        total += getMonthlyTotal(emps, curr);
        curr.setMonth(curr.getMonth() + 1);
    }
    return total;
}

function getFYStart(date) {
    const year = date.getFullYear();
    return date.getMonth() < 3 ? new Date(year - 1, 3, 1) : new Date(year, 3, 1);
}

// ... [Add Table Update and Chart functions here] ...
