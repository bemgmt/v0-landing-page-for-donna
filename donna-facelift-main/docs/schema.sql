-- PostgreSQL Schema for Donna Interactive
-- Part of WS4 - Data Management, Logging & Error Handling
-- Phase 4 Task 4.4: Minimal DB pilot

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Users Table (Pilot Entity)
-- ========================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    vertical VARCHAR(50) DEFAULT NULL CHECK (vertical IS NULL OR vertical IN ('hospitality', 'real_estate', 'professional_services')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active'
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_vertical ON users(vertical);

-- ========================================
-- Chat Sessions Table
-- ========================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    profile VARCHAR(50) DEFAULT 'general',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active'
);

-- Indexes for chat_sessions table
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chat_id ON chat_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_profile ON chat_sessions(profile);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at);

-- ========================================
-- Messages Table
-- ========================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sequence_number INTEGER NOT NULL,
    token_count INTEGER,
    abuse_flagged BOOLEAN DEFAULT FALSE
);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_chat_session ON messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_sequence ON messages(chat_session_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_abuse_flagged ON messages(abuse_flagged);

-- Composite index for chat history queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_recent ON messages(chat_session_id, created_at DESC);

-- ========================================
-- User Memory Table
-- ========================================

CREATE TABLE IF NOT EXISTS user_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    memory_type VARCHAR(100) NOT NULL, -- 'profile', 'preferences', 'context'
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, memory_type, key)
);

-- Indexes for user_memory table
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_type ON user_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memory_expires ON user_memory(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_memory_lookup ON user_memory(user_id, memory_type, key);

-- ========================================
-- System Logs Table (Optional)
-- ========================================

CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    trace_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for system_logs table
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_trace_id ON system_logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_memory_updated_at BEFORE UPDATE ON user_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Views for Common Queries
-- ========================================

-- View for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.clerk_id,
    u.email,
    u.name,
    u.last_active_at,
    COUNT(DISTINCT cs.id) as total_sessions,
    COALESCE(SUM(cs.message_count), 0) as total_messages,
    MAX(cs.last_message_at) as last_message_time
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
GROUP BY u.id, u.clerk_id, u.email, u.name, u.last_active_at;

-- View for recent chat activity
CREATE OR REPLACE VIEW recent_chat_activity AS
SELECT 
    cs.chat_id,
    cs.title,
    cs.profile,
    cs.message_count,
    cs.last_message_at,
    u.name as user_name,
    u.email as user_email
FROM chat_sessions cs
LEFT JOIN users u ON cs.user_id = u.id
WHERE cs.last_message_at > NOW() - INTERVAL '7 days'
ORDER BY cs.last_message_at DESC;

-- ========================================
-- Sample Data for Testing (Optional)
-- ========================================

-- Insert sample user for testing
INSERT INTO users (clerk_id, email, name, profile) 
VALUES ('test_clerk_pilot', 'pilot@example.com', 'Pilot User', '{"role": "tester", "pilot": true}')
ON CONFLICT (clerk_id) DO NOTHING;

-- ========================================
-- Database Maintenance
-- ========================================

-- Function to clean up expired memory entries
CREATE OR REPLACE FUNCTION cleanup_expired_memory()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_memory 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old system logs
CREATE OR REPLACE FUNCTION archive_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM system_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Permissions (Run as superuser)
-- ========================================

-- Create database user for the application
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'donna_user') THEN
--         CREATE ROLE donna_user WITH LOGIN PASSWORD 'secure_password_change_me';
--     END IF;
-- END
-- $$;

-- Grant permissions
-- GRANT CONNECT ON DATABASE donna TO donna_user;
-- GRANT USAGE ON SCHEMA public TO donna_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO donna_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO donna_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO donna_user;

-- Grant permissions on future tables
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO donna_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO donna_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO donna_user;
