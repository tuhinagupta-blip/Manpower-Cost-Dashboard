# Manpower Cost Dashboard

A clean, professional web-based dashboard for tracking and analyzing manpower costs across the organization with secure authentication and role-based access control.

## Features

### 🔐 Secure Authentication
- Login system with email and password
- Role-based access control (Admin / User)
- Admin-only data upload permissions
- Session management

### 📊 Cost Analytics
- **Monthly Cost**: Current month's manpower expenditure
- **YTD Cost**: Year-to-date cumulative costs
- **Annual Cost**: Full fiscal year projection
- **Prorated Calculations**: Accurate cost allocation based on joining/leaving dates

### 👥 Headcount Tracking
- Current active employees
- Planned new hires
- Total headcount projections
- Employee lifecycle management

### 🔍 Advanced Filtering
Filter data by:
- Cohort
- Department
- HRBP
- Employee Type (Management Cadre / Non-Management Cadre / Consultant)
- Level
- Date Range

### 📈 Visualizations
- Department-wise cost breakdown
- Employee type analysis
- Year-on-year FY cost trends (April-March fiscal year)
- **Interactive charts**: Click any FY column to see department-wise breakdown
- Drill-down from FY overview to department details

### 🎨 Clean Design
- Minimalist black and white interface
- Single-line filters for quick access
- Compact tables for easy scanning
- Responsive design for all devices

## Default Login Credentials

**Admin Account** (Can upload data):
- Email: `admin@sabyasachi.com`
- Password: `admin123`

**User Accounts** (View-only):
- Email: `user1@sabyasachi.com` / Password: `user123`
- Email: `user2@sabyasachi.com` / Password: `user123`

**IMPORTANT**: Change these credentials in the `script.js` file before deploying to production!

## Excel Data Format

Your Excel file should contain the following columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| Employee Code | Unique identifier | EMP001 |
| Name | Employee name | Rajesh Kumar |
| Cohort | Employee cohort/batch | 2023-A |
| Department | Department name | Design |
| HRBP | HRBP name | Priya Sharma |
| Employee Type | Management / Non-Management / Consultant | Management |
| Level | Employee level | L3, Senior Manager, etc. |
| Date of Joining | Join date (DD MMM YYYY or YYYY-MM-DD) | 08 Jul 2009 |
| Date of Leaving | Leave date (blank if active) | 31 Dec 2025 |
| Annual CTC | Annual compensation in INR | 627700 |
| Status | Active / Inactive / Planned | Active |

### Important Notes:
1. **Employee Code** must be unique for each employee
2. **Annual CTC** is the total yearly compensation
3. **Date of Leaving** should be blank for current employees
4. **Status** values:
   - `Active`: Currently employed
   - `Inactive`: Left the organization
   - `Planned`: Future hire (vacancy)

## Cost Calculation Logic

### Monthly Cost
- Divides Annual CTC by 12
- Prorates based on days active in the month
- Formula: `(Annual CTC / 12 / Days in Month) × Days Active`

### YTD Cost
- Sums monthly costs from year start to current date
- Accounts for employees who joined or left mid-year

### Annual Cost
- Calculates full fiscal year cost
- Prorates for employees who joined/left during the year
- Formula: `(Annual CTC / 12) × Months Active`

### Important Considerations
- **Fiscal Year**: FY runs from April 1 to March 31 (e.g., FY 2024-25 = Apr 1, 2024 to Mar 31, 2025)
- **Salary Changes**: Since appraisals occur in January and July, upload updated Excel files after each appraisal cycle
- **Unique Employee Code**: Used to track employees across salary revisions
- **Prorated Costs**: System automatically calculates partial month costs for joiners/leavers

## GitHub Pages Deployment

### Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it: `sabyasachi-hr-dashboard`
4. Make it Public (required for free GitHub Pages)
5. Click "Create repository"

### Step 2: Upload Files
You have two options:

#### Option A: Using GitHub Web Interface
1. On your repository page, click "uploading an existing file"
2. Drag and drop these files:
   - `index.html`
   - `styles.css`
   - `script.js`
3. Click "Commit changes"

#### Option B: Using Git Command Line
```bash
# Navigate to the folder containing your files
cd /path/to/dashboard/files

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial dashboard setup"

# Add remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/sabyasachi-hr-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click "Settings" → "Pages" (in the left sidebar)
3. Under "Source", select "main" branch
4. Click "Save"
5. Wait 2-3 minutes for deployment

Your dashboard will be live at:
`https://YOUR-USERNAME.github.io/sabyasachi-hr-dashboard/`

## Usage Instructions

### Logging In
1. Open the dashboard URL
2. Enter your email and password
3. Click "Login"

### For Admin Users
1. After logging in, you'll see the "Upload Data" button in the header
2. Click "Upload Data" to select and upload Excel file
3. Dashboard will automatically refresh with new data

### For Regular Users
1. View all dashboard metrics and charts
2. Use filters to analyze specific segments
3. Click on FY chart columns to see department breakdown
4. Cannot upload data (admin-only feature)

### Using the Dashboard
1. **Filters**: Select options from the single-line filter bar - changes apply automatically
2. **FY Chart Interaction**: Click any column in the Year-on-Year chart to view department-wise breakdown for that FY
3. **Back Navigation**: Click "Back to FY Overview" to return from department view
4. **Tables**: Scroll through compact tables for Cohort, Employee Type, and Level breakdowns

### Monthly Updates
1. Prepare updated Excel file with:
   - New joiners
   - Employees who left
   - Updated salaries (after appraisals)
   - New planned hires
2. Upload the file to refresh all metrics

## Security Considerations

⚠️ **Important Security Notes:**

1. **Change Default Passwords**: Edit `script.js` and change the default credentials before deploying
2. **Data Privacy**: This dashboard runs entirely in the browser. Your data is NOT sent to any server.
3. **Session Storage**: Login sessions are stored in browser session storage (cleared when browser closes)
4. **Public Repository**: Since the code is on a public GitHub repo, do NOT hardcode any sensitive data in the files.
5. **Excel Upload**: Upload files locally each time - they are not stored anywhere.
6. **Access Control**: Only admin@sabyasachi.com can upload data; other users are view-only
7. **For Production**: Consider:
   - Implementing server-side authentication
   - Using environment variables for credentials
   - Making the repository private (requires GitHub Pro)
   - Hosting on internal servers instead
   - Adding password encryption

## Browser Compatibility

Tested and works on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Dashboard not loading?
- Check browser console for errors (F12)
- Ensure all three files (HTML, CSS, JS) are uploaded
- Clear browser cache

### Excel upload failing?
- Verify file format (.xlsx or .xls)
- Check all required columns are present
- Ensure dates are in proper format
- Validate Employee Codes are unique

### Incorrect calculations?
- Verify Date of Joining and Date of Leaving formats
- Check Annual CTC values are numeric
- Ensure Status field has valid values

### Charts not displaying?
- Check if you have at least one employee with valid data
- Ensure dates are within the past 5 years

## Customization

### Changing Colors
Edit `styles.css` and modify the CSS variables at the top:
```css
:root {
    --sabyasachi-burgundy: #6B1F3D;
    --sabyasachi-gold: #D4AF37;
    /* etc. */
}
```

### Adding More Filters
1. Add new `<select>` in `index.html` under `.filters-grid`
2. Update `populateFilters()` in `script.js`
3. Modify `applyFilters()` to include new filter

### Modifying KPIs
Edit the `.kpi-grid` section in `index.html` to add/remove KPI cards.

## Support

For issues or questions:
1. Check this README first
2. Review browser console for errors
3. Verify Excel data format matches specification

## Version History

**v2.0.0** - Major Redesign
- Clean black & white minimalist design
- Login/authentication system with role-based access
- Admin-only data upload controls
- Interactive FY charts with department drill-down
- Fiscal year calculations (April-March)
- Single-line filter bar
- Compact tables (Cohort, Employee Type, Level)
- Auto-applying filters

**v1.0.0** - Initial Release
- Core dashboard functionality
- Excel upload and parsing
- Advanced filtering
- Cost calculations (Monthly, YTD, Annual)
- Year-over-year trend chart

---

Built for Sabyasachi HR Team 🎨
