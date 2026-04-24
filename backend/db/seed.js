const bcrypt = require('bcryptjs');
const { pool, createTables } = require('./schema');

const seed = async () => {
  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query(`
      TRUNCATE users, diversity_metrics, pay_equity, hiring_bias,
      promotion_bias, compliance_reports, benchmarking,
      employee_surveys, training_programs, retention_analysis,
      leadership_pipeline, supplier_diversity, erg_management,
      incident_reports, accessibility, workforce_demographics,
      audit_log, alerts, alert_history, saved_reports RESTART IDENTITY CASCADE;
    `);

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@deicorp.com', $1, 'Sarah Johnson', 'admin'),
      ('analyst@deicorp.com', $1, 'Michael Chen', 'analyst'),
      ('manager@deicorp.com', $1, 'Priya Patel', 'manager');
    `, [hashedPassword]);

    // Seed Diversity Metrics (15+ items)
    await client.query(`
      INSERT INTO diversity_metrics (department, metric_type, category, value, period, year, target_value, notes) VALUES
      ('Engineering', 'Gender', 'Female', 32.5, 'Q1', 2024, 40.0, 'Increased from 28% last year'),
      ('Engineering', 'Gender', 'Male', 65.0, 'Q1', 2024, 55.0, 'Gradually decreasing toward parity'),
      ('Engineering', 'Gender', 'Non-Binary', 2.5, 'Q1', 2024, 5.0, 'New tracking category'),
      ('Engineering', 'Ethnicity', 'Asian', 35.0, 'Q1', 2024, 30.0, 'Above industry average'),
      ('Engineering', 'Ethnicity', 'Black', 8.5, 'Q1', 2024, 13.0, 'Below target, initiatives underway'),
      ('Engineering', 'Ethnicity', 'Hispanic', 10.2, 'Q1', 2024, 15.0, 'Partnership with Hispanic-serving institutions'),
      ('Engineering', 'Ethnicity', 'White', 42.3, 'Q1', 2024, 35.0, 'Trending toward better representation'),
      ('Marketing', 'Gender', 'Female', 58.0, 'Q1', 2024, 50.0, 'Above target'),
      ('Marketing', 'Gender', 'Male', 40.0, 'Q1', 2024, 45.0, 'Stable representation'),
      ('Marketing', 'Ethnicity', 'Black', 15.0, 'Q1', 2024, 13.0, 'Exceeds target'),
      ('Sales', 'Gender', 'Female', 42.0, 'Q1', 2024, 50.0, 'Improving steadily'),
      ('Sales', 'Ethnicity', 'Hispanic', 18.5, 'Q1', 2024, 15.0, 'Strong pipeline'),
      ('HR', 'Gender', 'Female', 72.0, 'Q1', 2024, 55.0, 'Need more gender balance'),
      ('Finance', 'Gender', 'Female', 45.0, 'Q1', 2024, 50.0, 'Near target'),
      ('Finance', 'Ethnicity', 'Asian', 22.0, 'Q1', 2024, 20.0, 'Meeting target'),
      ('Executive', 'Gender', 'Female', 28.0, 'Q1', 2024, 40.0, 'Key focus area'),
      ('Executive', 'Ethnicity', 'Black', 6.0, 'Q1', 2024, 13.0, 'Leadership development program launched'),
      ('Product', 'Gender', 'Female', 38.0, 'Q1', 2024, 45.0, 'Growing representation'),
      ('Product', 'Ethnicity', 'Hispanic', 12.0, 'Q1', 2024, 15.0, 'Targeted recruiting active');
    `);

    // Seed Pay Equity (15+ items)
    await client.query(`
      INSERT INTO pay_equity (department, role_title, demographic_group, avg_salary, median_salary, salary_range_min, salary_range_max, pay_gap_percentage, sample_size, analysis_period, notes) VALUES
      ('Engineering', 'Software Engineer', 'Female', 125000, 122000, 95000, 165000, -4.2, 45, 'Q1 2024', 'Gap narrowing with new equity adjustments'),
      ('Engineering', 'Software Engineer', 'Male', 130500, 128000, 95000, 170000, 0.0, 120, 'Q1 2024', 'Baseline comparison group'),
      ('Engineering', 'Software Engineer', 'Hispanic', 121000, 118000, 92000, 158000, -7.3, 18, 'Q1 2024', 'Equity review scheduled'),
      ('Engineering', 'Senior Engineer', 'Female', 165000, 162000, 140000, 200000, -5.1, 22, 'Q1 2024', 'Retention risk identified'),
      ('Engineering', 'Senior Engineer', 'Black', 158000, 155000, 135000, 195000, -9.2, 8, 'Q1 2024', 'Immediate action required'),
      ('Marketing', 'Marketing Manager', 'Female', 95000, 93000, 75000, 120000, 2.1, 30, 'Q1 2024', 'Women slightly above average'),
      ('Marketing', 'Marketing Manager', 'Male', 93000, 91000, 72000, 118000, 0.0, 25, 'Q1 2024', 'Baseline group'),
      ('Sales', 'Account Executive', 'Female', 88000, 85000, 65000, 115000, -6.8, 35, 'Q1 2024', 'Commission structure review needed'),
      ('Sales', 'Account Executive', 'Black', 84000, 82000, 60000, 110000, -10.5, 12, 'Q1 2024', 'Significant gap detected'),
      ('Sales', 'Sales Director', 'Female', 145000, 142000, 120000, 180000, -3.5, 8, 'Q1 2024', 'Bonus equity being addressed'),
      ('HR', 'HR Business Partner', 'Male', 82000, 80000, 65000, 100000, -4.0, 10, 'Q1 2024', 'Male HRBPs paid less than female'),
      ('Finance', 'Financial Analyst', 'Female', 78000, 76000, 60000, 98000, -5.5, 20, 'Q1 2024', 'Adjustment planned for Q2'),
      ('Finance', 'Financial Analyst', 'Asian', 81000, 79000, 62000, 100000, -2.0, 15, 'Q1 2024', 'Near parity'),
      ('Product', 'Product Manager', 'Female', 135000, 132000, 110000, 165000, -3.8, 18, 'Q1 2024', 'Market rate adjustment needed'),
      ('Product', 'Product Manager', 'Hispanic', 130000, 127000, 105000, 160000, -7.2, 6, 'Q1 2024', 'Small sample size noted'),
      ('Executive', 'VP', 'Female', 210000, 205000, 180000, 280000, -12.0, 4, 'Q1 2024', 'Critical gap at leadership level'),
      ('Engineering', 'Engineering Manager', 'Female', 175000, 172000, 150000, 210000, -6.5, 10, 'Q1 2024', 'Leadership pipeline focus');
    `);

    // Seed Hiring Bias (15+ items)
    await client.query(`
      INSERT INTO hiring_bias (job_title, department, total_applicants, demographic_group, applicants_in_group, interviewed, offered, hired, pass_through_rate, bias_score, period, notes) VALUES
      ('Software Engineer', 'Engineering', 500, 'Female', 150, 45, 12, 8, 5.3, -2.1, 'Q1 2024', 'Below expected hiring rate'),
      ('Software Engineer', 'Engineering', 500, 'Male', 320, 110, 35, 25, 7.8, 0.5, 'Q1 2024', 'Slightly above average'),
      ('Software Engineer', 'Engineering', 500, 'Black', 40, 10, 3, 2, 5.0, -2.5, 'Q1 2024', 'Pipeline diversity issue'),
      ('Software Engineer', 'Engineering', 500, 'Hispanic', 55, 15, 4, 3, 5.5, -1.8, 'Q1 2024', 'Interview stage bottleneck'),
      ('Data Scientist', 'Engineering', 200, 'Female', 65, 22, 8, 5, 7.7, -0.3, 'Q1 2024', 'Near parity achieved'),
      ('Data Scientist', 'Engineering', 200, 'Asian', 80, 30, 12, 8, 10.0, 1.5, 'Q1 2024', 'Above average'),
      ('Product Manager', 'Product', 150, 'Female', 70, 28, 10, 6, 8.6, 0.2, 'Q1 2024', 'Good representation'),
      ('Product Manager', 'Product', 150, 'Black', 15, 4, 1, 0, 0.0, -5.0, 'Q1 2024', 'Zero hires - investigation needed'),
      ('Marketing Analyst', 'Marketing', 120, 'Female', 75, 30, 12, 8, 10.7, 1.0, 'Q1 2024', 'Above average hiring'),
      ('Marketing Analyst', 'Marketing', 120, 'Hispanic', 20, 6, 2, 1, 5.0, -2.0, 'Q1 2024', 'Below expected rate'),
      ('Sales Representative', 'Sales', 300, 'Female', 130, 50, 18, 12, 9.2, 0.5, 'Q1 2024', 'Positive trend'),
      ('Sales Representative', 'Sales', 300, 'Black', 45, 12, 3, 2, 4.4, -3.0, 'Q1 2024', 'Screening stage bias suspected'),
      ('HR Generalist', 'HR', 80, 'Male', 20, 5, 2, 1, 5.0, -1.5, 'Q1 2024', 'Male underrepresentation'),
      ('Financial Analyst', 'Finance', 100, 'Female', 45, 18, 7, 5, 11.1, 1.2, 'Q1 2024', 'Strong female pipeline'),
      ('Financial Analyst', 'Finance', 100, 'Black', 10, 2, 0, 0, 0.0, -4.5, 'Q1 2024', 'Critical gap in financial roles'),
      ('UX Designer', 'Product', 90, 'Female', 55, 25, 10, 7, 12.7, 2.0, 'Q1 2024', 'Excellent diversity'),
      ('DevOps Engineer', 'Engineering', 180, 'Female', 25, 8, 3, 2, 8.0, -0.5, 'Q1 2024', 'Low application volume from women');
    `);

    // Seed Promotion Bias (15+ items)
    await client.query(`
      INSERT INTO promotion_bias (department, level_from, level_to, demographic_group, eligible_employees, nominated, promoted, avg_time_to_promotion, promotion_rate, bias_indicator, period, notes) VALUES
      ('Engineering', 'Junior', 'Mid-Level', 'Female', 25, 18, 12, 1.8, 48.0, 'Slight Negative', 'Q1 2024', 'Longer time to promotion than male peers'),
      ('Engineering', 'Junior', 'Mid-Level', 'Male', 60, 48, 38, 1.4, 63.3, 'Neutral', 'Q1 2024', 'Baseline comparison'),
      ('Engineering', 'Mid-Level', 'Senior', 'Female', 15, 8, 4, 2.5, 26.7, 'Negative', 'Q1 2024', 'Significant gap at senior level'),
      ('Engineering', 'Mid-Level', 'Senior', 'Black', 5, 2, 1, 3.0, 20.0, 'Negative', 'Q1 2024', 'Small cohort but concerning pattern'),
      ('Engineering', 'Senior', 'Lead', 'Female', 8, 3, 1, 3.2, 12.5, 'Strong Negative', 'Q1 2024', 'Glass ceiling effect observed'),
      ('Engineering', 'Senior', 'Lead', 'Hispanic', 4, 1, 0, 0.0, 0.0, 'Strong Negative', 'Q1 2024', 'Zero promotions this period'),
      ('Marketing', 'Associate', 'Manager', 'Female', 20, 15, 10, 1.5, 50.0, 'Positive', 'Q1 2024', 'Equitable promotion rate'),
      ('Marketing', 'Associate', 'Manager', 'Black', 6, 4, 2, 2.0, 33.3, 'Slight Negative', 'Q1 2024', 'Time to promotion longer'),
      ('Sales', 'Junior', 'Senior', 'Female', 18, 10, 6, 2.0, 33.3, 'Slight Negative', 'Q1 2024', 'Commission-based advancement gap'),
      ('Sales', 'Junior', 'Senior', 'Hispanic', 8, 5, 3, 1.8, 37.5, 'Neutral', 'Q1 2024', 'Comparable to overall average'),
      ('HR', 'Specialist', 'Manager', 'Male', 6, 3, 1, 2.5, 16.7, 'Negative', 'Q1 2024', 'Men underrepresented in HR leadership'),
      ('Finance', 'Analyst', 'Senior Analyst', 'Female', 12, 8, 5, 1.6, 41.7, 'Neutral', 'Q1 2024', 'Meeting expected rates'),
      ('Finance', 'Analyst', 'Senior Analyst', 'Black', 3, 1, 0, 0.0, 0.0, 'Strong Negative', 'Q1 2024', 'No promotions - mentorship program needed'),
      ('Product', 'Associate PM', 'PM', 'Female', 10, 7, 5, 1.4, 50.0, 'Positive', 'Q1 2024', 'Strong female promotion pipeline'),
      ('Product', 'PM', 'Senior PM', 'Hispanic', 3, 1, 0, 0.0, 0.0, 'Strong Negative', 'Q1 2024', 'Pipeline gap at senior level'),
      ('Executive', 'Director', 'VP', 'Female', 5, 2, 0, 0.0, 0.0, 'Strong Negative', 'Q1 2024', 'Critical leadership gap'),
      ('Engineering', 'Lead', 'Manager', 'Female', 6, 2, 1, 2.8, 16.7, 'Negative', 'Q1 2024', 'Management track barrier');
    `);

    // Seed Compliance Reports (15+ items)
    await client.query(`
      INSERT INTO compliance_reports (report_name, regulation, status, compliance_score, due_date, submitted_date, findings, recommendations, assigned_to, priority, notes) VALUES
      ('EEO-1 Annual Report 2024', 'Title VII - Civil Rights Act', 'Completed', 95.0, '2024-03-31', '2024-03-15', 'All categories reported accurately. Minor discrepancy in job classification.', 'Review job classification mapping for next cycle', 'Sarah Johnson', 'high', 'Submitted ahead of deadline'),
      ('OFCCP AAP - Engineering', 'Executive Order 11246', 'In Progress', 78.0, '2024-06-30', NULL, 'Underutilization identified in 3 job groups for women and minorities', 'Expand recruiting partnerships, implement mentoring program', 'Michael Chen', 'high', 'Action plan development in progress'),
      ('ADA Compliance Review', 'Americans with Disabilities Act', 'Completed', 92.0, '2024-02-28', '2024-02-20', 'Workplace accommodations meeting standards. Website accessibility needs improvement.', 'Engage accessibility consultant for digital properties', 'Priya Patel', 'medium', 'Digital accessibility audit scheduled'),
      ('Pay Transparency Report - CA', 'California SB 1162', 'Completed', 88.0, '2024-05-15', '2024-05-10', 'Pay ranges published for all CA positions. Some ranges need narrowing.', 'Review and tighten pay bands for senior roles', 'Sarah Johnson', 'high', 'Second year of compliance'),
      ('Pay Transparency Report - NY', 'NYC Local Law 144', 'Pending', 0.0, '2024-07-01', NULL, NULL, NULL, 'Michael Chen', 'high', 'New requirement - preparing first submission'),
      ('VETS-4212 Report', 'Vietnam Era Veterans Act', 'Completed', 100.0, '2024-09-30', '2024-09-15', 'All veteran hiring data accurately reported', 'Continue veteran recruitment partnerships', 'Priya Patel', 'medium', 'Consistent compliance'),
      ('Diversity Dashboard Audit', 'Internal Policy', 'In Progress', 65.0, '2024-04-30', NULL, 'Data collection gaps in voluntary self-identification. 30% response rate.', 'Launch new self-ID campaign with improved UX', 'Sarah Johnson', 'medium', 'Employee engagement campaign planned'),
      ('Gender Pay Gap Report - UK', 'UK Equality Act 2010', 'Completed', 72.0, '2024-04-04', '2024-04-01', 'Mean gender pay gap of 15.2%. Median gap of 11.8%.', 'Address senior leadership pipeline, review bonus structure', 'Michael Chen', 'high', 'Gap decreased 2% from previous year'),
      ('Board Diversity Disclosure', 'SEC / Nasdaq Rules', 'Completed', 85.0, '2024-12-31', '2024-12-15', 'Board meets Nasdaq diversity requirements. Matrix disclosed.', 'Continue diverse candidate pipeline for board seats', 'Priya Patel', 'high', 'Proxy statement updated'),
      ('Anti-Harassment Training Compliance', 'State Laws (CA, NY, IL)', 'In Progress', 82.0, '2024-06-30', NULL, '82% completion rate. Engineering and Sales lagging.', 'Send targeted reminders, escalate to department heads', 'Sarah Johnson', 'high', 'Deadline approaching'),
      ('Accommodation Request Audit', 'ADA / State Laws', 'Completed', 90.0, '2024-03-15', '2024-03-10', '45 accommodation requests, 42 approved. Avg processing time 5 days.', 'Streamline approval workflow, reduce to 3-day target', 'Michael Chen', 'low', 'Process improvement opportunity'),
      ('Supplier Diversity Report', 'Internal / Client Requirements', 'In Progress', 58.0, '2024-06-30', NULL, 'Current diverse supplier spend at 12% vs 20% target', 'Identify additional MBE/WBE suppliers, adjust procurement policies', 'Priya Patel', 'medium', 'Behind target - needs acceleration'),
      ('EEOC Charge Response', 'Title VII', 'Pending', 0.0, '2024-05-01', NULL, NULL, NULL, 'Sarah Johnson', 'critical', 'External counsel engaged'),
      ('Illinois BIPA Compliance', 'IL Biometric Information Privacy Act', 'Completed', 95.0, '2024-01-31', '2024-01-25', 'Biometric data policies updated. Employee consent obtained.', 'Annual review of biometric data retention', 'Michael Chen', 'medium', 'Proactive compliance achieved'),
      ('DEI Strategic Plan Review', 'Internal Governance', 'In Progress', 70.0, '2024-07-31', NULL, 'Progress on 8 of 12 strategic objectives. Lagging on leadership diversity.', 'Reallocate resources to leadership development programs', 'Priya Patel', 'high', 'Board review scheduled Q3'),
      ('Whistleblower Report Analysis', 'SOX / Dodd-Frank', 'Completed', 88.0, '2024-03-31', '2024-03-28', '12 reports received, all investigated. 3 substantiated findings.', 'Enhance anonymous reporting channels, follow up on substantiated cases', 'Sarah Johnson', 'high', 'No retaliation incidents');
    `);

    // Seed Benchmarking (15+ items)
    await client.query(`
      INSERT INTO benchmarking (metric_name, category, our_value, industry_avg, top_performer, percentile_rank, industry, source, measurement_date, trend, notes) VALUES
      ('Women in Engineering', 'Gender Diversity', 32.5, 28.0, 42.0, 68, 'Technology', 'McKinsey Women in Tech 2024', '2024-03-01', 'Improving', 'Above industry average, below top performers'),
      ('Women in Leadership', 'Gender Diversity', 28.0, 32.0, 48.0, 35, 'Technology', 'Catalyst Women in Leadership', '2024-03-01', 'Stable', 'Below average - key improvement area'),
      ('Black Employees Overall', 'Racial Diversity', 10.5, 12.0, 18.0, 40, 'Technology', 'Bureau of Labor Statistics', '2024-03-01', 'Improving', 'Trending up from 8% two years ago'),
      ('Hispanic Employees Overall', 'Racial Diversity', 12.0, 14.0, 22.0, 42, 'Technology', 'Bureau of Labor Statistics', '2024-03-01', 'Improving', 'Active recruitment programs'),
      ('Gender Pay Gap', 'Pay Equity', 5.2, 8.5, 1.0, 72, 'Technology', 'Glassdoor Pay Gap Report', '2024-03-01', 'Improving', 'Better than average, room for improvement'),
      ('Racial Pay Gap', 'Pay Equity', 7.8, 10.2, 2.0, 65, 'Technology', 'PayScale Comp Report', '2024-03-01', 'Improving', 'Equity adjustments showing results'),
      ('Employee Engagement - Belonging', 'Culture', 72.0, 68.0, 85.0, 62, 'Technology', 'Gallup Engagement Survey', '2024-03-01', 'Stable', 'Above average but plateau detected'),
      ('Voluntary Turnover - Diverse Employees', 'Retention', 14.0, 18.0, 8.0, 70, 'Technology', 'SHRM Benchmarking', '2024-03-01', 'Improving', 'Better retention than peers'),
      ('ERG Participation Rate', 'Culture', 35.0, 25.0, 55.0, 72, 'Technology', 'Internal + Great Place to Work', '2024-03-01', 'Improving', 'Strong ERG engagement'),
      ('Disability Representation', 'Disability Inclusion', 4.5, 7.0, 12.0, 30, 'Technology', 'Disability:IN DEI', '2024-03-01', 'Stable', 'Self-ID campaign needed'),
      ('LGBTQ+ Representation', 'LGBTQ+ Inclusion', 6.0, 5.0, 10.0, 62, 'Technology', 'HRC Corporate Equality Index', '2024-03-01', 'Stable', 'Above average representation'),
      ('Diverse Supplier Spend %', 'Supply Chain', 12.0, 15.0, 30.0, 38, 'Technology', 'NMSDC Benchmark Report', '2024-03-01', 'Declining', 'Below target - action needed'),
      ('DEI Training Completion', 'Training', 82.0, 75.0, 98.0, 65, 'Technology', 'Brandon Hall Group', '2024-03-01', 'Improving', 'Above average but not top tier'),
      ('Inclusive Hiring Score', 'Hiring', 3.8, 3.2, 4.5, 70, 'Technology', 'Textio Inclusive Language Score', '2024-03-01', 'Improving', 'Job descriptions scoring well'),
      ('Board Diversity %', 'Governance', 33.0, 30.0, 55.0, 55, 'All Industries', 'Spencer Stuart Board Index', '2024-03-01', 'Improving', 'Meeting minimum standards'),
      ('Manager DEI Competency Score', 'Leadership', 3.5, 3.0, 4.8, 62, 'Technology', 'Internal Assessment', '2024-03-01', 'Improving', 'Training program showing results'),
      ('Accessibility Compliance Score', 'Disability Inclusion', 78.0, 65.0, 95.0, 72, 'Technology', 'WebAIM / Level Access', '2024-03-01', 'Improving', 'Digital accessibility improvements underway');
    `);

    // Seed Employee Surveys (15+ items)
    await client.query(`
      INSERT INTO employee_surveys (survey_name, department, demographic_group, category, score, response_rate, total_respondents, sentiment, key_themes, period, notes) VALUES
      ('Annual Engagement Survey', 'Engineering', 'Female', 'Belonging', 72.0, 78.5, 45, 'Positive', 'Team inclusion, mentorship opportunities', 'Q1 2024', 'Improved from 68 last year'),
      ('Annual Engagement Survey', 'Engineering', 'Male', 'Belonging', 81.0, 82.0, 120, 'Positive', 'Career growth, team collaboration', 'Q1 2024', 'Stable score'),
      ('Annual Engagement Survey', 'Engineering', 'Black', 'Belonging', 64.0, 70.0, 12, 'Mixed', 'Representation concerns, sponsorship gaps', 'Q1 2024', 'Below department average'),
      ('Annual Engagement Survey', 'Engineering', 'Hispanic', 'Belonging', 68.0, 73.0, 18, 'Neutral', 'Career development, cultural events', 'Q1 2024', 'Slight improvement'),
      ('Pulse Survey - Inclusion', 'Marketing', 'Female', 'Inclusion', 85.0, 88.0, 30, 'Positive', 'Flexible work, inclusive leadership', 'Q2 2024', 'Highest score in company'),
      ('Pulse Survey - Inclusion', 'Marketing', 'Black', 'Inclusion', 74.0, 80.0, 8, 'Positive', 'Representation in campaigns, ERG support', 'Q2 2024', 'Good improvement trend'),
      ('Pulse Survey - Inclusion', 'Sales', 'Female', 'Inclusion', 62.0, 65.0, 35, 'Neutral', 'Client-facing bias, pay transparency', 'Q2 2024', 'Needs attention'),
      ('Pulse Survey - Inclusion', 'Sales', 'Hispanic', 'Inclusion', 70.0, 72.0, 15, 'Positive', 'Bilingual recognition, community', 'Q2 2024', 'Trending upward'),
      ('Annual Engagement Survey', 'HR', 'Male', 'Career Growth', 58.0, 85.0, 10, 'Negative', 'Limited advancement, role stereotyping', 'Q1 2024', 'Men feel undervalued in HR'),
      ('Annual Engagement Survey', 'Finance', 'Female', 'Pay Fairness', 55.0, 75.0, 20, 'Negative', 'Pay transparency, promotion criteria', 'Q1 2024', 'Linked to pay equity findings'),
      ('DEI Climate Survey', 'Engineering', 'Asian', 'Psychological Safety', 76.0, 80.0, 40, 'Positive', 'Technical respect, leadership access', 'Q1 2024', 'Strong technical culture'),
      ('DEI Climate Survey', 'Product', 'Female', 'Psychological Safety', 71.0, 77.0, 18, 'Positive', 'Voice in meetings, idea attribution', 'Q1 2024', 'Improvement from awareness training'),
      ('DEI Climate Survey', 'Executive', 'Female', 'Leadership Trust', 60.0, 90.0, 4, 'Mixed', 'Board representation, decision influence', 'Q1 2024', 'Small sample but critical'),
      ('Onboarding Survey', 'Engineering', 'Female', 'Welcome Experience', 82.0, 92.0, 12, 'Positive', 'Buddy program, orientation quality', 'Q1 2024', 'New onboarding program effective'),
      ('Onboarding Survey', 'Engineering', 'Black', 'Welcome Experience', 75.0, 88.0, 5, 'Positive', 'ERG introduction, manager support', 'Q1 2024', 'ERG welcome events well received'),
      ('Exit Survey Analysis', 'Engineering', 'Female', 'Departure Reasons', 42.0, 60.0, 8, 'Negative', 'Growth ceiling, work-life balance, culture', 'Q1 2024', 'Higher attrition than male peers');
    `);

    // Seed Training Programs (15+ items)
    await client.query(`
      INSERT INTO training_programs (program_name, training_type, department, total_enrolled, completed, completion_rate, avg_score, demographic_group, delivery_method, duration_hours, period, notes) VALUES
      ('Unconscious Bias Fundamentals', 'DEI Core', 'Engineering', 180, 152, 84.4, 82.0, 'All', 'Virtual', 2.0, 'Q1 2024', 'Mandatory for all engineers'),
      ('Unconscious Bias Fundamentals', 'DEI Core', 'Marketing', 55, 50, 90.9, 88.0, 'All', 'Virtual', 2.0, 'Q1 2024', 'Highest completion in company'),
      ('Unconscious Bias Fundamentals', 'DEI Core', 'Sales', 90, 68, 75.6, 78.0, 'All', 'Virtual', 2.0, 'Q1 2024', 'Field team lagging'),
      ('Inclusive Leadership Workshop', 'Leadership', 'Engineering', 25, 22, 88.0, 85.0, 'Managers', 'In-Person', 8.0, 'Q1 2024', 'Strong positive feedback'),
      ('Inclusive Leadership Workshop', 'Leadership', 'Sales', 15, 12, 80.0, 79.0, 'Managers', 'In-Person', 8.0, 'Q1 2024', 'Schedule conflicts noted'),
      ('Women in Tech Mentorship', 'Mentorship', 'Engineering', 30, 28, 93.3, 90.0, 'Female', 'Hybrid', 20.0, 'Q1 2024', 'Year-long program showing results'),
      ('Black Leadership Accelerator', 'Leadership Development', 'All', 18, 16, 88.9, 87.0, 'Black', 'Hybrid', 40.0, 'Q1 2024', 'Executive sponsorship program'),
      ('Hispanic Professional Network', 'Professional Development', 'All', 22, 20, 90.9, 84.0, 'Hispanic', 'Hybrid', 16.0, 'Q1 2024', 'Bilingual skills recognized'),
      ('Accessibility Awareness', 'Compliance', 'Engineering', 180, 140, 77.8, 80.0, 'All', 'Virtual', 1.5, 'Q2 2024', 'WCAG guidelines focus'),
      ('Anti-Harassment Training', 'Compliance', 'All', 450, 369, 82.0, 76.0, 'All', 'Virtual', 1.0, 'Q1 2024', 'State-mandated training'),
      ('Allyship in Action', 'DEI Core', 'Product', 40, 35, 87.5, 86.0, 'All', 'Virtual', 3.0, 'Q2 2024', 'Interactive scenario-based'),
      ('Culturally Responsive Management', 'Leadership', 'HR', 15, 15, 100.0, 92.0, 'All', 'In-Person', 6.0, 'Q1 2024', 'HR leads by example'),
      ('Disability Inclusion Essentials', 'DEI Core', 'All', 450, 310, 68.9, 81.0, 'All', 'Virtual', 1.5, 'Q2 2024', 'New course, ramping up completion'),
      ('Equitable Hiring Practices', 'Hiring', 'Engineering', 30, 28, 93.3, 88.0, 'Hiring Managers', 'Virtual', 4.0, 'Q1 2024', 'Part of structured interview rollout'),
      ('Equitable Hiring Practices', 'Hiring', 'Sales', 18, 14, 77.8, 82.0, 'Hiring Managers', 'Virtual', 4.0, 'Q1 2024', 'Follow-up coaching recommended'),
      ('LGBTQ+ Inclusive Workplace', 'DEI Core', 'All', 450, 338, 75.1, 83.0, 'All', 'Virtual', 1.5, 'Q2 2024', 'Pronoun usage and inclusive language');
    `);

    // Seed Retention Analysis (15+ items)
    await client.query(`
      INSERT INTO retention_analysis (department, demographic_group, total_employees, departures, turnover_rate, voluntary_departures, involuntary_departures, avg_tenure, exit_reason, risk_level, period, notes) VALUES
      ('Engineering', 'Female', 65, 8, 12.3, 6, 2, 2.8, 'Limited growth opportunities', 'High', 'Q1 2024', 'Above department average turnover'),
      ('Engineering', 'Male', 175, 12, 6.9, 8, 4, 3.5, 'Market compensation', 'Low', 'Q1 2024', 'Below industry average'),
      ('Engineering', 'Black', 18, 4, 22.2, 3, 1, 1.9, 'Lack of belonging', 'Critical', 'Q1 2024', 'Urgent intervention needed'),
      ('Engineering', 'Hispanic', 25, 3, 12.0, 2, 1, 2.5, 'Career development', 'Medium', 'Q1 2024', 'Mentorship program initiated'),
      ('Engineering', 'Asian', 80, 6, 7.5, 5, 1, 3.2, 'External opportunity', 'Low', 'Q1 2024', 'Competitive offers from FAANG'),
      ('Marketing', 'Female', 35, 2, 5.7, 2, 0, 4.1, 'Personal reasons', 'Low', 'Q1 2024', 'Stable retention'),
      ('Marketing', 'Black', 9, 1, 11.1, 1, 0, 2.2, 'Better opportunity elsewhere', 'Medium', 'Q1 2024', 'Small team, each departure impactful'),
      ('Sales', 'Female', 55, 7, 12.7, 5, 2, 2.3, 'Commission structure concerns', 'High', 'Q1 2024', 'Pay equity review triggered'),
      ('Sales', 'Male', 75, 6, 8.0, 4, 2, 3.0, 'Performance management', 'Low', 'Q1 2024', 'Within expected range'),
      ('Sales', 'Hispanic', 24, 2, 8.3, 2, 0, 2.8, 'Relocation', 'Low', 'Q1 2024', 'Non-systemic departures'),
      ('HR', 'Male', 8, 2, 25.0, 2, 0, 1.5, 'Role stereotyping, limited advancement', 'Critical', 'Q1 2024', 'Gender imbalance driving attrition'),
      ('Finance', 'Female', 22, 3, 13.6, 2, 1, 2.6, 'Pay inequity concerns', 'High', 'Q1 2024', 'Connected to pay gap findings'),
      ('Finance', 'Black', 5, 1, 20.0, 1, 0, 1.8, 'Lack of representation', 'High', 'Q1 2024', 'Only team member departed'),
      ('Product', 'Female', 20, 1, 5.0, 1, 0, 3.5, 'Work-life balance', 'Low', 'Q1 2024', 'Strong retention in Product'),
      ('Executive', 'Female', 7, 1, 14.3, 1, 0, 3.0, 'Glass ceiling perception', 'High', 'Q1 2024', 'Senior woman leader departed'),
      ('Product', 'Hispanic', 8, 1, 12.5, 1, 0, 2.0, 'Career progression', 'Medium', 'Q1 2024', 'Development plan created');
    `);

    // Seed Leadership Pipeline (15+ items)
    await client.query(`
      INSERT INTO leadership_pipeline (level, department, demographic_group, total_positions, filled_positions, representation_pct, ready_now, ready_1_2_years, ready_3_5_years, succession_coverage, period, notes) VALUES
      ('Director', 'Engineering', 'Female', 8, 2, 25.0, 1, 2, 3, 75.0, 'Q1 2024', 'Pipeline improving but current representation low'),
      ('Director', 'Engineering', 'Black', 8, 0, 0.0, 0, 1, 2, 37.5, 'Q1 2024', 'Zero representation at director level'),
      ('Director', 'Engineering', 'Hispanic', 8, 1, 12.5, 0, 1, 1, 25.0, 'Q1 2024', 'One director, limited pipeline'),
      ('VP', 'Engineering', 'Female', 3, 0, 0.0, 0, 1, 1, 66.7, 'Q1 2024', 'No women VPs in Engineering'),
      ('Manager', 'Engineering', 'Female', 20, 5, 25.0, 3, 4, 6, 65.0, 'Q1 2024', 'Growing pipeline at manager level'),
      ('Manager', 'Engineering', 'Black', 20, 2, 10.0, 1, 2, 3, 30.0, 'Q1 2024', 'Accelerator program participants'),
      ('Director', 'Marketing', 'Female', 5, 3, 60.0, 2, 2, 1, 100.0, 'Q1 2024', 'Strong female leadership'),
      ('Director', 'Marketing', 'Black', 5, 1, 20.0, 0, 1, 1, 40.0, 'Q1 2024', 'Above company average'),
      ('Manager', 'Sales', 'Female', 12, 4, 33.3, 2, 3, 4, 75.0, 'Q1 2024', 'Pipeline growing steadily'),
      ('Manager', 'Sales', 'Hispanic', 12, 2, 16.7, 1, 2, 2, 41.7, 'Q1 2024', 'Development plans in place'),
      ('Director', 'Finance', 'Female', 4, 1, 25.0, 1, 1, 2, 100.0, 'Q1 2024', 'Good succession coverage'),
      ('VP', 'All', 'Female', 10, 3, 30.0, 1, 2, 3, 60.0, 'Q1 2024', 'Below 40% target'),
      ('VP', 'All', 'Black', 10, 1, 10.0, 0, 1, 1, 20.0, 'Q1 2024', 'Critical underrepresentation'),
      ('C-Suite', 'All', 'Female', 6, 2, 33.3, 1, 1, 2, 66.7, 'Q1 2024', 'CEO and CFO positions held by women'),
      ('C-Suite', 'All', 'Black', 6, 0, 0.0, 0, 0, 1, 16.7, 'Q1 2024', 'No Black C-suite representation'),
      ('Manager', 'HR', 'Male', 6, 1, 16.7, 1, 1, 2, 66.7, 'Q1 2024', 'Gender imbalance in HR leadership');
    `);

    // Seed Supplier Diversity (15+ items)
    await client.query(`
      INSERT INTO supplier_diversity (supplier_name, certification_type, category, annual_spend, contract_value, tier, status, region, performance_rating, contract_start, contract_end, notes) VALUES
      ('TechBridge Solutions', 'MBE', 'IT Services', 850000, 2500000, 'Tier 1', 'Active', 'Northeast', 4.5, '2024-01-15', '2026-01-14', 'Minority-owned IT consulting firm'),
      ('Innovative Cloud Inc', 'MBE', 'Cloud Infrastructure', 1200000, 3600000, 'Tier 1', 'Active', 'West', 4.2, '2024-03-01', '2027-02-28', 'Cloud services provider, Black-owned'),
      ('Verdant Office Supplies', 'WBE', 'Office Supplies', 320000, 960000, 'Tier 2', 'Active', 'Midwest', 4.0, '2024-02-01', '2025-01-31', 'Woman-owned office supply distributor'),
      ('Global Lingua Services', 'MBE', 'Translation Services', 180000, 540000, 'Tier 2', 'Active', 'Southeast', 4.8, '2024-01-01', '2025-12-31', 'Hispanic-owned translation and localization'),
      ('SecureNet Cyber', 'VOSB', 'Cybersecurity', 950000, 2850000, 'Tier 1', 'Active', 'Mid-Atlantic', 4.3, '2024-04-01', '2026-03-31', 'Veteran-owned security firm'),
      ('Pinnacle Staffing Group', 'WBE', 'Staffing', 600000, 1800000, 'Tier 1', 'Active', 'Northeast', 3.8, '2024-01-15', '2025-07-14', 'Women-owned staffing agency'),
      ('EcoClean Facilities', 'MBE', 'Facilities Management', 420000, 1260000, 'Tier 2', 'Active', 'West', 4.1, '2024-06-01', '2026-05-31', 'Asian-owned janitorial services'),
      ('DataViz Analytics', 'WBE', 'Data Analytics', 280000, 840000, 'Tier 2', 'Under Review', 'South', 3.5, '2024-03-15', '2025-03-14', 'Contract renewal under evaluation'),
      ('Heritage Catering Co', 'MBE', 'Food Services', 150000, 450000, 'Tier 2', 'Active', 'Midwest', 4.6, '2024-02-01', '2025-01-31', 'Black-owned catering, employee events'),
      ('Accessible Design Studio', 'DOBE', 'UX/Design', 350000, 1050000, 'Tier 1', 'Active', 'West', 4.7, '2024-01-01', '2025-12-31', 'Disability-owned design consultancy'),
      ('Spectrum Marketing Group', 'LGBTBE', 'Marketing Services', 520000, 1560000, 'Tier 1', 'Active', 'Northeast', 4.4, '2024-05-01', '2026-04-30', 'LGBTQ+ owned marketing agency'),
      ('Prairie Wind Energy', 'MBE', 'Energy Consulting', 200000, 600000, 'Tier 2', 'Pending', 'Midwest', 0.0, '2024-07-01', '2026-06-30', 'Native American-owned, new vendor onboarding'),
      ('Bright Future Learning', 'WBE', 'Training Services', 380000, 1140000, 'Tier 1', 'Active', 'Southeast', 4.3, '2024-01-01', '2025-12-31', 'Woman-owned L&D company'),
      ('Phoenix Legal Partners', 'MBE', 'Legal Services', 450000, 1350000, 'Tier 1', 'Active', 'West', 4.0, '2024-03-01', '2026-02-28', 'Hispanic-owned law firm'),
      ('Summit HR Technologies', 'VOSB', 'HR Software', 680000, 2040000, 'Tier 1', 'Active', 'Mid-Atlantic', 4.5, '2024-01-15', '2026-01-14', 'Veteran-owned SaaS provider'),
      ('NexGen Print Solutions', 'MBE', 'Printing Services', 95000, 285000, 'Tier 2', 'Expired', 'South', 3.2, '2023-01-01', '2024-01-01', 'Contract expired, renewal discussions ongoing');
    `);

    // Seed ERG Management (15+ items)
    await client.query(`
      INSERT INTO erg_management (erg_name, focus_area, membership_count, active_members, executive_sponsor, budget, events_held, engagement_score, year_founded, status, impact_summary, notes) VALUES
      ('Women in Tech Alliance', 'Gender Equity', 145, 98, 'Sarah Johnson (CTO)', 75000, 12, 88.0, 2019, 'Established', 'Drove mentorship program resulting in 15% increase in female promotions', 'Largest ERG by membership'),
      ('Black Professionals Network', 'Racial Equity', 68, 52, 'James Williams (COO)', 60000, 10, 85.0, 2020, 'Growing', 'Launched leadership accelerator, 8 participants promoted', 'Strong executive engagement'),
      ('LatinX Unidos', 'Cultural Heritage', 55, 40, 'Maria Garcia (VP Sales)', 45000, 8, 82.0, 2021, 'Growing', 'Hispanic Heritage Month events reached 500+ employees', 'Community outreach partnership'),
      ('Pride Alliance', 'LGBTQ+ Inclusion', 92, 65, 'Alex Rivera (VP Marketing)', 50000, 14, 90.0, 2018, 'Established', 'Influenced inclusive benefits policy, domestic partner coverage', 'Highest engagement score'),
      ('Asian Pacific Collective', 'Cultural Heritage', 110, 72, 'David Kim (VP Engineering)', 40000, 9, 79.0, 2020, 'Established', 'AAPI Heritage Month programming, bias awareness workshops', 'Cross-company partnerships'),
      ('Veterans & Allies', 'Military Community', 35, 28, 'Robert Thompson (CFO)', 30000, 6, 76.0, 2022, 'Active', 'Military-to-civilian transition support, 12 veteran hires influenced', 'Growing membership steadily'),
      ('Abilities Alliance', 'Disability Inclusion', 42, 30, 'Jennifer Lee (CHRO)', 35000, 7, 80.0, 2021, 'Active', 'Accessibility audit advocacy, accommodation process improvement', 'Partnered with Disability:IN'),
      ('Working Parents Network', 'Work-Life Balance', 130, 85, 'Lisa Chen (General Counsel)', 55000, 11, 86.0, 2019, 'Established', 'Influenced parental leave policy extension to 16 weeks', 'Cross-functional membership'),
      ('Interfaith Dialogue Circle', 'Religious Inclusion', 28, 18, 'Amir Hassan (VP Product)', 20000, 5, 72.0, 2023, 'New', 'Holiday inclusion guide distributed company-wide', 'Building awareness and membership'),
      ('Indigenous Peoples Alliance', 'Cultural Heritage', 15, 12, 'Sarah Johnson (CTO)', 25000, 4, 74.0, 2023, 'New', 'Land acknowledgment practice initiated, cultural education', 'Smallest but highly engaged'),
      ('Neurodiversity Network', 'Neurodiversity', 38, 25, 'Jennifer Lee (CHRO)', 30000, 6, 78.0, 2022, 'Active', 'Workplace accommodation guide, sensory-friendly spaces', 'Growing awareness and support'),
      ('Young Professionals Forum', 'Career Development', 95, 70, 'Alex Rivera (VP Marketing)', 35000, 10, 84.0, 2020, 'Established', 'Reverse mentoring program with executives, career workshops', 'High participation rate'),
      ('Sustainability Champions', 'Environmental Justice', 60, 42, 'Robert Thompson (CFO)', 25000, 8, 77.0, 2022, 'Active', 'Environmental justice focus intersecting with DEI initiatives', 'Cross-ERG collaboration'),
      ('Multicultural Mosaic', 'Cross-Cultural', 75, 50, 'Maria Garcia (VP Sales)', 40000, 9, 81.0, 2021, 'Active', 'Cultural exchange events, international employee support', 'Monthly cultural showcases'),
      ('Women of Color Collective', 'Intersectionality', 48, 38, 'James Williams (COO)', 45000, 8, 87.0, 2021, 'Growing', 'Intersectional leadership development, advocacy for equitable policies', 'Strong voice for intersectional issues'),
      ('Mental Health Advocates', 'Wellbeing', 82, 55, 'Jennifer Lee (CHRO)', 40000, 10, 83.0, 2022, 'Active', 'Destigmatization campaign, trained 25 mental health first aiders', 'Broad cross-functional impact');
    `);

    // Seed Incident Reports (15+ items)
    await client.query(`
      INSERT INTO incident_reports (incident_type, department, severity, status, reported_date, resolved_date, category, description, action_taken, reporter_demographic, investigation_outcome, days_to_resolve, notes) VALUES
      ('Microaggression', 'Engineering', 'Medium', 'Resolved', '2024-01-15', '2024-02-02', 'Verbal', 'Repeated comments questioning technical competence based on gender', 'Coaching for offending employee, team training scheduled', 'Female', 'Substantiated', 18, 'Pattern identified with same individual'),
      ('Harassment', 'Sales', 'High', 'Resolved', '2024-01-22', '2024-03-05', 'Verbal', 'Inappropriate jokes targeting ethnic background during team meeting', 'Written warning issued, mandatory training assigned', 'Hispanic', 'Substantiated', 43, 'Escalated to HR leadership'),
      ('Discrimination', 'Finance', 'High', 'Investigating', '2024-02-10', NULL, 'Promotion', 'Allegation of being passed over for promotion due to race', 'Investigation in progress, external counsel consulted', 'Black', 'Pending', NULL, 'EEOC complaint may follow'),
      ('Microaggression', 'Product', 'Low', 'Closed', '2024-01-08', '2024-01-22', 'Verbal', 'Name mispronunciation despite repeated corrections', 'Awareness conversation conducted, name pronunciation guide created', 'Asian', 'Substantiated', 14, 'Systemic solution implemented'),
      ('Retaliation', 'Engineering', 'Critical', 'Investigating', '2024-03-01', NULL, 'Workplace', 'Negative performance review following DEI complaint filing', 'Interim protective measures in place, external investigator retained', 'Female', 'Pending', NULL, 'Legal team involved'),
      ('Harassment', 'Marketing', 'Medium', 'Resolved', '2024-02-05', '2024-02-28', 'Digital', 'Exclusionary comments in team Slack channel targeting LGBTQ+ employee', 'Offender counseled, Slack guidelines updated', 'LGBTQ+', 'Substantiated', 23, 'Channel moderation enhanced'),
      ('Bias in Hiring', 'Engineering', 'Medium', 'Resolved', '2024-01-30', '2024-02-20', 'Hiring', 'Candidate rejected with comments referencing cultural fit concerns', 'Hiring manager retrained, structured interview process mandated', 'Black', 'Substantiated', 21, 'Hiring process redesigned'),
      ('Accessibility Barrier', 'All', 'Medium', 'Resolved', '2024-02-12', '2024-03-01', 'Physical', 'Conference room not wheelchair accessible for team meetings', 'Room reassigned, facilities renovation ordered', 'Disability', 'Substantiated', 18, 'ADA compliance review triggered'),
      ('Microaggression', 'Sales', 'Low', 'Closed', '2024-03-05', '2024-03-15', 'Verbal', 'Assumptions about language ability based on ethnicity', 'Individual coaching session conducted', 'Asian', 'Substantiated', 10, 'Resolved informally'),
      ('Discrimination', 'Engineering', 'High', 'Resolved', '2024-01-18', '2024-03-20', 'Compensation', 'Pay disparity discovered between employees of different demographics in same role', 'Pay equity adjustment implemented, comprehensive review launched', 'Female', 'Substantiated', 62, 'Connected to broader pay equity audit'),
      ('Hostile Environment', 'Sales', 'High', 'Investigating', '2024-03-10', NULL, 'Workplace', 'Pattern of exclusion from client meetings and social events', 'Interim measures in place, witness interviews ongoing', 'Black', 'Pending', NULL, 'Multiple complainants'),
      ('Religious Accommodation', 'Engineering', 'Low', 'Closed', '2024-02-20', '2024-02-25', 'Accommodation', 'Request for prayer space and flexible break times denied by manager', 'Manager educated, accommodation granted, quiet room designated', 'Muslim', 'Substantiated', 5, 'Policy clarification issued'),
      ('Harassment', 'Finance', 'Medium', 'Resolved', '2024-02-01', '2024-03-01', 'Verbal', 'Age-related comments during team discussions about technology adoption', 'Team training on ageism, offender coached', 'Over 50', 'Substantiated', 29, 'Generational inclusion training added'),
      ('Bias in Performance Review', 'Marketing', 'Medium', 'Resolved', '2024-01-25', '2024-02-15', 'Performance', 'Subjective criteria applied differently across demographic groups', 'Review criteria standardized, calibration sessions mandated', 'Female', 'Substantiated', 21, 'Systemic fix implemented'),
      ('Microaggression', 'HR', 'Low', 'Closed', '2024-03-12', '2024-03-20', 'Verbal', 'Comments about male employee being in HR as unusual', 'Team conversation about gender stereotyping in professions', 'Male', 'Substantiated', 8, 'Part of broader HR culture initiative'),
      ('Disability Discrimination', 'Product', 'High', 'Resolved', '2024-02-08', '2024-03-15', 'Accommodation', 'Remote work accommodation for disability denied without interactive process', 'Accommodation approved, manager trained on interactive process', 'Disability', 'Substantiated', 36, 'ADA compliance training scheduled');
    `);

    // Seed Accessibility (15+ items)
    await client.query(`
      INSERT INTO accessibility (area, compliance_type, standard, score, status, accommodations_requested, accommodations_granted, avg_response_days, department, audit_date, next_review, notes) VALUES
      ('Website - Main', 'Digital', 'WCAG 2.1 AA', 82.0, 'Partial', 0, 0, 0, 'Engineering', '2024-01-15', '2024-07-15', 'Color contrast and alt text issues identified'),
      ('Website - Careers', 'Digital', 'WCAG 2.1 AA', 68.0, 'Non-Compliant', 0, 0, 0, 'Engineering', '2024-01-15', '2024-04-15', 'Application form not screen-reader compatible'),
      ('Mobile App - iOS', 'Digital', 'WCAG 2.1 AA', 75.0, 'Partial', 0, 0, 0, 'Product', '2024-02-01', '2024-08-01', 'VoiceOver support incomplete'),
      ('Mobile App - Android', 'Digital', 'WCAG 2.1 AA', 70.0, 'Partial', 0, 0, 0, 'Product', '2024-02-01', '2024-08-01', 'TalkBack navigation issues'),
      ('Internal HR Portal', 'Digital', 'WCAG 2.1 AA', 60.0, 'Non-Compliant', 0, 0, 0, 'HR', '2024-02-15', '2024-05-15', 'Legacy system, upgrade planned Q3'),
      ('Office - HQ Floor 1', 'Physical', 'ADA', 95.0, 'Compliant', 5, 5, 3, 'Facilities', '2024-01-10', '2025-01-10', 'Fully accessible, recent renovation'),
      ('Office - HQ Floor 2', 'Physical', 'ADA', 88.0, 'Partial', 3, 3, 5, 'Facilities', '2024-01-10', '2024-07-10', 'Restroom modifications needed'),
      ('Office - HQ Floor 3', 'Physical', 'ADA', 92.0, 'Compliant', 2, 2, 2, 'Facilities', '2024-01-10', '2025-01-10', 'Adjustable desks available'),
      ('Office - West Campus', 'Physical', 'ADA', 78.0, 'Partial', 8, 6, 8, 'Facilities', '2024-03-01', '2024-09-01', 'Elevator and signage improvements needed'),
      ('Assistive Technology', 'Workplace', 'Section 508', 85.0, 'Compliant', 12, 11, 4, 'IT', '2024-02-01', '2025-02-01', 'Screen readers, magnifiers, speech-to-text available'),
      ('Learning Management System', 'Digital', 'WCAG 2.1 AA', 72.0, 'Partial', 0, 0, 0, 'HR', '2024-02-20', '2024-08-20', 'Video captions incomplete, keyboard navigation limited'),
      ('Interview Process', 'Process', 'ADA', 90.0, 'Compliant', 15, 14, 2, 'HR', '2024-01-05', '2025-01-05', 'Accommodation requests processed promptly'),
      ('Employee Onboarding', 'Process', 'ADA', 86.0, 'Compliant', 8, 8, 3, 'HR', '2024-01-20', '2025-01-20', 'Materials available in multiple formats'),
      ('Company Events', 'Physical', 'ADA', 80.0, 'Partial', 6, 5, 5, 'All', '2024-03-10', '2024-09-10', 'Venue accessibility varies by location'),
      ('Customer Support Portal', 'Digital', 'WCAG 2.1 AA', 77.0, 'Partial', 0, 0, 0, 'Product', '2024-03-01', '2024-09-01', 'Chat widget not fully accessible'),
      ('Emergency Procedures', 'Safety', 'ADA', 94.0, 'Compliant', 4, 4, 1, 'Facilities', '2024-01-15', '2025-01-15', 'Visual alarms and evacuation chairs in place');
    `);

    // Seed Workforce Demographics (15+ items)
    await client.query(`
      INSERT INTO workforce_demographics (department, job_level, demographic_type, demographic_value, headcount, percentage, avg_tenure, avg_age, avg_salary, period, year, notes) VALUES
      ('Engineering', 'Individual Contributor', 'Gender', 'Female', 50, 28.6, 2.5, 31, 128000, 'Q1', 2024, 'Below 40% target for women in engineering'),
      ('Engineering', 'Individual Contributor', 'Gender', 'Male', 120, 68.6, 3.4, 33, 135000, 'Q1', 2024, 'Majority representation'),
      ('Engineering', 'Individual Contributor', 'Gender', 'Non-Binary', 5, 2.9, 1.8, 28, 125000, 'Q1', 2024, 'Growing representation'),
      ('Engineering', 'Individual Contributor', 'Ethnicity', 'Asian', 70, 40.0, 3.2, 32, 133000, 'Q1', 2024, 'Largest ethnic group in engineering'),
      ('Engineering', 'Individual Contributor', 'Ethnicity', 'Black', 15, 8.6, 2.0, 30, 126000, 'Q1', 2024, 'Below 13% target'),
      ('Engineering', 'Individual Contributor', 'Ethnicity', 'Hispanic', 20, 11.4, 2.3, 31, 127000, 'Q1', 2024, 'Growing through partnerships'),
      ('Engineering', 'Individual Contributor', 'Ethnicity', 'White', 65, 37.1, 3.5, 34, 134000, 'Q1', 2024, 'Second largest ethnic group'),
      ('Engineering', 'Manager', 'Gender', 'Female', 5, 25.0, 4.2, 38, 175000, 'Q1', 2024, 'Pipeline improving'),
      ('Engineering', 'Manager', 'Gender', 'Male', 15, 75.0, 5.0, 40, 182000, 'Q1', 2024, 'Overrepresented at management'),
      ('Marketing', 'Individual Contributor', 'Gender', 'Female', 32, 58.2, 3.5, 30, 85000, 'Q1', 2024, 'Strong female representation'),
      ('Marketing', 'Individual Contributor', 'Gender', 'Male', 22, 40.0, 3.0, 32, 87000, 'Q1', 2024, 'Balanced team'),
      ('Sales', 'Individual Contributor', 'Gender', 'Female', 48, 42.1, 2.5, 29, 82000, 'Q1', 2024, 'Improving toward parity'),
      ('Sales', 'Individual Contributor', 'Ethnicity', 'Hispanic', 22, 19.3, 2.8, 30, 80000, 'Q1', 2024, 'Strong representation'),
      ('Finance', 'Individual Contributor', 'Gender', 'Female', 20, 45.5, 3.0, 33, 78000, 'Q1', 2024, 'Near parity'),
      ('Finance', 'Individual Contributor', 'Ethnicity', 'Black', 5, 11.4, 2.2, 29, 75000, 'Q1', 2024, 'Below target, pipeline initiatives active'),
      ('HR', 'Individual Contributor', 'Gender', 'Female', 18, 72.0, 3.8, 35, 72000, 'Q1', 2024, 'Overrepresented, need gender balance'),
      ('HR', 'Individual Contributor', 'Gender', 'Male', 7, 28.0, 2.0, 30, 74000, 'Q1', 2024, 'Recruitment focus for male candidates'),
      ('Executive', 'C-Suite', 'Gender', 'Female', 2, 33.3, 5.0, 48, 320000, 'Q1', 2024, 'CEO and CFO are women'),
      ('Executive', 'C-Suite', 'Ethnicity', 'Black', 0, 0.0, 0, 0, 0, 'Q1', 2024, 'No Black C-suite representation');
    `);

    console.log('All seed data inserted successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

const run = async () => {
  try {
    await createTables();
    await seed();
    console.log('Database setup and seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
