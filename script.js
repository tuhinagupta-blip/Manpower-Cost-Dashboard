// Save as script.js
const USERS = {
    'admin@sabyasachi.com': 'admin123',
    'hr@sabyasachi.com': 'sabyasachi2024'
};

let masterData = [];
let currentFYData = [];

// --- LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    if (USERS[email] === pass) {
        sessionStorage.setItem('userEmail', email);
        initDashboard();
    } else {
        alert("Invalid Credentials");
    }
});

function initDashboard() {
    const email = sessionStorage.getItem('userEmail');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'block';

    // Admin only upload
    if (email === 'admin@sabyasachi.com') {
        document.getElementById('adminControls').style.display = 'inline';
    }

    // Initialize Select2 and Date defaults
    const today = new Date();
    document.getElementById('endDate').valueAsDate = today;
    const fyStart = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
    document.getElementById('startDate').value = `${fyStart}-04-01`;
}

// --- CALCULATION CORE ---
function calculateMetrics() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    // FY Start for YTD (April 1st)
    const fyStartDate = new Date(endDate.getMonth() < 3 ? endDate.getFullYear() - 1 : endDate.getFullYear(), 3, 1);

    let activeHC = 0;
    let plannedHC = 0;
    let monthlyCostTotal = 0;
    let ytdCostTotal = 0;

    masterData.forEach(emp => {
        const doj = new Date(emp.DOJ);
        const dol = emp.DOL ? new Date(emp.DOL) : new Date(2099, 11, 31);
        
        // 1. Is Active during the current month selected?
        if (doj <= endDate && dol >= endDate && emp.Status === 'Active') {
            activeHC++;
            monthlyCostTotal += (emp.CTC / 12);
        }

        if (emp.Status === 'Vacancy') plannedHC++;

        // 2. YTD Calculation (April to Selected End Date)
        // We calculate per month to handle mid-year joining/leaving
        let tempDate = new Date(fyStartDate);
        while (tempDate <= endDate) {
            const mStart = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
            const mEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
            if (doj <= mEnd && dol >= mStart && emp.Status === 'Active') {
                ytdCostTotal += (emp.CTC / 12);
            }
            tempDate.setMonth(tempDate.getMonth() + 1);
        }
    });

    // 3. Annual Projection
    // (YTD actuals) + (Current Monthly Cost * Months left in FY)
    const fyEndDate = new Date(fyStartDate.getFullYear() + 1, 2, 31);
    const monthsLeft = (fyEndDate.getFullYear() - endDate.getFullYear()) * 12 + (fyEndDate.getMonth() - endDate.getMonth());
    const annualProjected = ytdCostTotal + (monthlyCostTotal * monthsLeft);

    // Update Tiles
    document.getElementById('currentHeadcount').innerText = activeHC;
    document.getElementById('toBeHired').innerText = plannedHC;
    document.getElementById('totalHeadcount').innerText = activeHC + plannedHC;
    document.getElementById('monthlyCost').innerText = formatCr(monthlyCostTotal);
    document.getElementById('ytdCost').innerText = formatCr(ytdCostTotal);
    document.getElementById('annualCost').innerText = formatCr(annualProjected);
}

function formatCr(amt) {
    if (amt >= 10000000) return "₹" + (amt / 10000000).toFixed(2) + " Cr";
    return "₹" + (amt / 100000).toFixed(2) + " L";
}
