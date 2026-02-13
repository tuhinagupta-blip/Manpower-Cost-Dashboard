// Credentials
const USERS = {
    'admin@sabyasachi.com': 'admin123',
    'hr@sabyasachi.com': 'sabyasachi2025'
};

// Global Data Storage
let masterData = [];

// 1. RUN ON PAGE LOAD
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in (Session persistence)
    const savedUser = sessionStorage.getItem('userEmail');
    if (savedUser) {
        showDashboard(savedUser);
    }

    // Login Form Listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// 2. LOGIN HANDLER
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();

    console.log("Attempting login for:", email); // Debugging

    if (USERS[email] && USERS[email] === pass) {
        sessionStorage.setItem('userEmail', email);
        showDashboard(email);
    } else {
        alert("Invalid Email or Password. Please try again.");
    }
}

// 3. SHOW DASHBOARD & SET PERMISSIONS
function showDashboard(email) {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('mainDashboard');
    const adminControls = document.getElementById('adminControls');

    if (loginScreen && dashboard) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
    }

    // STRICT ADMIN CHECK: Only show upload button for admin@sabyasachi.com
    if (adminControls) {
        if (email === 'admin@sabyasachi.com') {
            adminControls.style.setProperty('display', 'inline-block', 'important');
            console.log("Admin access granted: Upload button visible.");
        } else {
            adminControls.style.display = 'none';
            console.log("Standard access: Upload button hidden.");
        }
    }

    // Set Default Dates (FY April to March)
    setDefaultDates();
}

// 4. LOGOUT
function handleLogout() {
    sessionStorage.removeItem('userEmail');
    location.reload(); // Refresh to show login screen
}

// 5. DATE UTILITIES (FY Logic)
function setDefaultDates() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    // If we are in Jan/Feb/Mar (0,1,2), the FY started last year
    const fyStartYear = (currentMonth < 3) ? currentYear - 1 : currentYear;
    
    document.getElementById('startDate').value = `${fyStartYear}-04-01`;
    document.getElementById('endDate').valueAsDate = today;
}

// 6. COST CALCULATION ENGINE (Corrected FY logic)
function calculateMetrics() {
    const endDate = new Date(document.getElementById('endDate').value);
    const startDate = new Date(document.getElementById('startDate').value);
    
    // FY Start (Always April 1st of the relevant year)
    const fyStartDate = new Date(endDate.getMonth() < 3 ? endDate.getFullYear() - 1 : endDate.getFullYear(), 3, 1);
    const fyEndDate = new Date(fyStartDate.getFullYear() + 1, 2, 31);

    let monthlyTotal = 0;
    let ytdTotal = 0;
    let activeHC = 0;
    let vacancyHC = 0;

    masterData.forEach(emp => {
        const doj = new Date(emp.DOJ);
        const dol = emp.DOL ? new Date(emp.DOL) : new Date(2099, 11, 31);
        
        // Is employee active in the SPECIFIC month selected in EndDate?
        const selMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        const selMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

        if (doj <= selMonthEnd && dol >= selMonthStart) {
            if (emp.Status === 'Active') {
                activeHC++;
                monthlyTotal += (emp.CTC / 12);
            }
        }
        
        if (emp.Status === 'Vacancy') vacancyHC++;

        // YTD Calculation: April to current selected EndDate
        let runnerDate = new Date(fyStartDate);
        while (runnerDate <= endDate) {
            const mStart = new Date(runnerDate.getFullYear(), runnerDate.getMonth(), 1);
            const mEnd = new Date(runnerDate.getFullYear(), runnerDate.getMonth() + 1, 0);
            
            if (doj <= mEnd && dol >= mStart && emp.Status === 'Active') {
                ytdTotal += (emp.CTC / 12);
            }
            runnerDate.setMonth(runnerDate.getMonth() + 1);
        }
    });

    // Projections
    const monthsPassed = (endDate.getFullYear() - fyStartDate.getFullYear()) * 12 + (endDate.getMonth() - fyStartDate.getMonth()) + 1;
    const monthsRemaining = 12 - monthsPassed;
    const annualProjected = ytdTotal + (monthlyTotal * monthsRemaining);

    // Update UI
    document.getElementById('currentHeadcount').innerText = activeHC;
    document.getElementById('toBeHired').innerText = vacancyHC;
    document.getElementById('totalHeadcount').innerText = activeHC + vacancyHC;
    document.getElementById('monthlyCost').innerText = formatCurrency(monthlyTotal);
    document.getElementById('ytdCost').innerText = formatCurrency(ytdTotal);
    document.getElementById('annualCost').innerText = formatCurrency(annualProjected);
}

function formatCurrency(num) {
    if (num >= 10000000) return "₹" + (num / 10000000).toFixed(2) + " Cr";
    if (num >= 100000) return "₹" + (num / 100000).toFixed(2) + " L";
    return "₹" + num.toLocaleString('en-IN');
}
