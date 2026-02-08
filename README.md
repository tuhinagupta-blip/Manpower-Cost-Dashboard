# Sabyasachi HR Manpower Cost Dashboard

A sophisticated web-based dashboard for tracking and analyzing manpower costs across the organization.

## Features

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
- Year-on-year FY cost trends

## Excel Data Format

Your Excel file should contain the following columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| Employee Code | Unique identifier | EMP001 |
| Name | Employee name | Rajesh Kumar |
| Cohort | Employee cohort/batch | 2023-A |
| Department | Department name | Design |
| HRBP | HRBP name | Priya Sharma |
| Employee Type | Management Cadre / Non-Management Cadre / Consultant | Management Cadre |
| Level | Employee level | L3, Senior Manager, etc. |
| Date of Joining | Join date (DD/MM/YYYY or YYYY-MM-DD) | 2023-07-15 |
| Date of Leaving | Leave date (blank if active) | 2025-12-31 |
| Annual CTC | Annual compensation in INR | 1200000 |
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

### First Time Setup
1. Open the dashboard URL
2. Click "Upload Excel Data"
3. Select your employee data Excel file
4. Dashboard will automatically populate

### Monthly Updates
1. Prepare updated Excel file with:
   - New joiners
   - Employees who left
   - Updated salaries (after appraisals)
   - New planned hires
2. Upload the file to refresh all metrics

### Using Filters
1. Select desired filter criteria (you can select multiple values)
2. Click "Apply Filters"
3. Dashboard updates in real-time
4. Click "Reset" to clear all filters

## Security Considerations

⚠️ **Important Security Notes:**

1. **Data Privacy**: This dashboard runs entirely in the browser. Your data is NOT sent to any server.
2. **Public Repository**: Since the code is on a public GitHub repo, do NOT hardcode any sensitive data in the files.
3. **Excel Upload**: Upload files locally each time - they are not stored anywhere.
4. **Sensitive Data**: For highly sensitive salary data, consider:
   - Making the repository private (requires GitHub Pro)
   - Hosting on internal servers instead
   - Adding password protection

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

**v1.0.0** - Initial Release
- Core dashboard functionality
- Excel upload and parsing
- Advanced filtering
- Cost calculations (Monthly, YTD, Annual)
- Year-over-year trend chart

---

Built with care for Sabyasachi HR Team 🎨
