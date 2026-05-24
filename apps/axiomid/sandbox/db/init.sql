-- sandbox/db/init.sql
-- AxiomID Sandbox Database Initialization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification sessions table
CREATE TABLE verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'
);

-- Biometric templates storage
CREATE TABLE biometric_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    template_data BYTEA NOT NULL,
    template_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'
);

-- Verification agents registry
CREATE TABLE verification_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    config JSONB DEFAULT '{}',
    capabilities TEXT[]
);

-- Verification results storage
CREATE TABLE verification_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES verification_sessions(id),
    agent_id UUID REFERENCES verification_agents(id),
    result_data JSONB,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_ms INTEGER
);

-- Sybil detection data
CREATE TABLE sybil_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    analysis_data JSONB,
    risk_score DECIMAL(5,2),
    detected_patterns TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavioral patterns
CREATE TABLE behavioral_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pattern_type VARCHAR(50),
    pattern_data JSONB,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Test data seeding
INSERT INTO users (id, email) VALUES 
('11111111-1111-1111-1111-111111111111', 'test1@example.com'),
('22222222-2222-2222-2222-222222222222', 'test2@example.com'),
('33333333-3333-3333-3333-333333333333', 'test3@example.com');

INSERT INTO verification_agents (agent_type, status, capabilities) VALUES
('primary_coordinator', 'active', ARRAY['orchestration', 'workflow_management']),
('biometric_analyzer', 'active', ARRAY['face_recognition', 'liveness_detection']),
('social_graph_investigator', 'active', ARRAY['relationship_analysis', 'network_mapping']),
('blockchain_verifier', 'active', ARRAY['wallet_validation', 'transaction_analysis']),
('security_monitor', 'active', ARRAY['threat_detection', 'anomaly_monitoring']);

-- Indexes for performance optimization
CREATE INDEX idx_verification_sessions_user ON verification_sessions(user_id);
CREATE INDEX idx_verification_sessions_token ON verification_sessions(session_token);
CREATE INDEX idx_biometric_templates_user ON biometric_templates(user_id);
CREATE INDEX idx_biometric_templates_hash ON biometric_templates(template_hash);
CREATE INDEX idx_verification_results_session ON verification_results(session_id);
CREATE INDEX idx_verification_results_created ON verification_results(created_at);
CREATE INDEX idx_sybil_analysis_user ON sybil_analysis(user_id);
CREATE INDEX idx_behavioral_patterns_user ON behavioral_patterns(user_id);
CREATE INDEX idx_behavioral_patterns_type ON behavioral_patterns(pattern_type);

-- Sample verification session
INSERT INTO verification_sessions (id, user_id, session_token, expires_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'test-session-token-123', NOW() + INTERVAL '1 hour');