const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'analyst',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Diversity Metrics
      CREATE TABLE IF NOT EXISTS diversity_metrics (
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL,
        metric_type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        period VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        target_value DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Pay Equity
      CREATE TABLE IF NOT EXISTS pay_equity (
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL,
        role_title VARCHAR(255) NOT NULL,
        demographic_group VARCHAR(100) NOT NULL,
        avg_salary DECIMAL(12,2) NOT NULL,
        median_salary DECIMAL(12,2) NOT NULL,
        salary_range_min DECIMAL(12,2),
        salary_range_max DECIMAL(12,2),
        pay_gap_percentage DECIMAL(5,2),
        sample_size INTEGER,
        analysis_period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Hiring Bias Detection
      CREATE TABLE IF NOT EXISTS hiring_bias (
        id SERIAL PRIMARY KEY,
        job_title VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        total_applicants INTEGER NOT NULL,
        demographic_group VARCHAR(100) NOT NULL,
        applicants_in_group INTEGER NOT NULL,
        interviewed INTEGER NOT NULL,
        offered INTEGER NOT NULL,
        hired INTEGER NOT NULL,
        pass_through_rate DECIMAL(5,2),
        bias_score DECIMAL(5,2),
        period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Promotion Bias Detection
      CREATE TABLE IF NOT EXISTS promotion_bias (
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL,
        level_from VARCHAR(100) NOT NULL,
        level_to VARCHAR(100) NOT NULL,
        demographic_group VARCHAR(100) NOT NULL,
        eligible_employees INTEGER NOT NULL,
        nominated INTEGER NOT NULL,
        promoted INTEGER NOT NULL,
        avg_time_to_promotion DECIMAL(5,1),
        promotion_rate DECIMAL(5,2),
        bias_indicator VARCHAR(50),
        period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Compliance Reports
      CREATE TABLE IF NOT EXISTS compliance_reports (
        id SERIAL PRIMARY KEY,
        report_name VARCHAR(255) NOT NULL,
        regulation VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        compliance_score DECIMAL(5,2),
        due_date DATE,
        submitted_date DATE,
        findings TEXT,
        recommendations TEXT,
        assigned_to VARCHAR(255),
        priority VARCHAR(50) DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Benchmarking
      CREATE TABLE IF NOT EXISTS benchmarking (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        our_value DECIMAL(10,2) NOT NULL,
        industry_avg DECIMAL(10,2) NOT NULL,
        top_performer DECIMAL(10,2),
        percentile_rank INTEGER,
        industry VARCHAR(100) NOT NULL,
        source VARCHAR(255),
        measurement_date DATE,
        trend VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Employee Surveys
      CREATE TABLE IF NOT EXISTS employee_surveys (
        id SERIAL PRIMARY KEY,
        survey_name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        demographic_group VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        response_rate DECIMAL(5,2),
        total_respondents INTEGER,
        sentiment VARCHAR(50),
        key_themes TEXT,
        period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Training Programs
      CREATE TABLE IF NOT EXISTS training_programs (
        id SERIAL PRIMARY KEY,
        program_name VARCHAR(255) NOT NULL,
        training_type VARCHAR(100) NOT NULL,
        department VARCHAR(255) NOT NULL,
        total_enrolled INTEGER NOT NULL,
        completed INTEGER NOT NULL,
        completion_rate DECIMAL(5,2),
        avg_score DECIMAL(5,2),
        demographic_group VARCHAR(100),
        delivery_method VARCHAR(50),
        duration_hours DECIMAL(5,1),
        period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Retention Analysis
      CREATE TABLE IF NOT EXISTS retention_analysis (
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL,
        demographic_group VARCHAR(100) NOT NULL,
        total_employees INTEGER NOT NULL,
        departures INTEGER NOT NULL,
        turnover_rate DECIMAL(5,2) NOT NULL,
        voluntary_departures INTEGER,
        involuntary_departures INTEGER,
        avg_tenure DECIMAL(5,1),
        exit_reason VARCHAR(255),
        risk_level VARCHAR(50),
        period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Leadership Pipeline
      CREATE TABLE IF NOT EXISTS leadership_pipeline (
        id SERIAL PRIMARY KEY,
        level VARCHAR(100) NOT NULL,
        department VARCHAR(255) NOT NULL,
        demographic_group VARCHAR(100) NOT NULL,
        total_positions INTEGER NOT NULL,
        filled_positions INTEGER NOT NULL,
        representation_pct DECIMAL(5,2),
        ready_now INTEGER,
        ready_1_2_years INTEGER,
        ready_3_5_years INTEGER,
        succession_coverage DECIMAL(5,2),
        period VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Supplier Diversity
      CREATE TABLE IF NOT EXISTS supplier_diversity (
        id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(255) NOT NULL,
        certification_type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        annual_spend DECIMAL(14,2) NOT NULL,
        contract_value DECIMAL(14,2),
        tier VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        region VARCHAR(100),
        performance_rating DECIMAL(3,1),
        contract_start DATE,
        contract_end DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- ERG Management
      CREATE TABLE IF NOT EXISTS erg_management (
        id SERIAL PRIMARY KEY,
        erg_name VARCHAR(255) NOT NULL,
        focus_area VARCHAR(100) NOT NULL,
        membership_count INTEGER NOT NULL,
        active_members INTEGER,
        executive_sponsor VARCHAR(255),
        budget DECIMAL(10,2),
        events_held INTEGER,
        engagement_score DECIMAL(5,2),
        year_founded INTEGER,
        status VARCHAR(50) NOT NULL,
        impact_summary TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Incident Reports
      CREATE TABLE IF NOT EXISTS incident_reports (
        id SERIAL PRIMARY KEY,
        incident_type VARCHAR(100) NOT NULL,
        department VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        reported_date DATE NOT NULL,
        resolved_date DATE,
        category VARCHAR(100),
        description TEXT,
        action_taken TEXT,
        reporter_demographic VARCHAR(100),
        investigation_outcome VARCHAR(100),
        days_to_resolve INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Accessibility Compliance
      CREATE TABLE IF NOT EXISTS accessibility (
        id SERIAL PRIMARY KEY,
        area VARCHAR(255) NOT NULL,
        compliance_type VARCHAR(100) NOT NULL,
        standard VARCHAR(100) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        accommodations_requested INTEGER,
        accommodations_granted INTEGER,
        avg_response_days DECIMAL(5,1),
        department VARCHAR(255),
        audit_date DATE,
        next_review DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Workforce Demographics
      CREATE TABLE IF NOT EXISTS workforce_demographics (
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL,
        job_level VARCHAR(100) NOT NULL,
        demographic_type VARCHAR(100) NOT NULL,
        demographic_value VARCHAR(100) NOT NULL,
        headcount INTEGER NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        avg_tenure DECIMAL(5,1),
        avg_age DECIMAL(4,1),
        avg_salary DECIMAL(12,2),
        period VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Audit Log
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_name VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        module VARCHAR(100) NOT NULL,
        record_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Alerts
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        module VARCHAR(100) NOT NULL,
        metric_field VARCHAR(100),
        condition VARCHAR(50) NOT NULL,
        threshold DECIMAL(12,2) NOT NULL,
        severity VARCHAR(50) DEFAULT 'medium',
        notify_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Alert History
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
        triggered_value DECIMAL(12,2),
        message TEXT,
        triggered_at TIMESTAMP DEFAULT NOW()
      );

      -- Saved Reports
      CREATE TABLE IF NOT EXISTS saved_reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        modules TEXT,
        report_data TEXT,
        created_by INTEGER,
        created_by_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('All tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, createTables };
