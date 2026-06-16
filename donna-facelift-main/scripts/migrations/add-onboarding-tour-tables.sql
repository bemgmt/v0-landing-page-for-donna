-- Migration: Add Onboarding and Tour System Tables
-- Part of DONNA Onboarding Logic & On-Demand Tour System

-- ========================================
-- Onboarding State Table
-- ========================================
CREATE TABLE IF NOT EXISTS onboarding_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clerk_id VARCHAR(255) NOT NULL,
    
    -- Onboarding fields
    name VARCHAR(255) DEFAULT NULL,
    business_name VARCHAR(255) DEFAULT NULL,
    documents_uploaded BOOLEAN DEFAULT FALSE,
    personality_configured BOOLEAN DEFAULT FALSE,
    
    -- State tracking
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Current step tracking
    current_step VARCHAR(100) DEFAULT NULL, -- 'name', 'business_name', 'documents', 'personality'
    step_data JSONB DEFAULT '{}', -- Store temporary data for current step
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id),
    UNIQUE(clerk_id)
);

-- Indexes for onboarding_state
CREATE INDEX IF NOT EXISTS idx_onboarding_state_user_id ON onboarding_state(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_state_clerk_id ON onboarding_state(clerk_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_state_completed ON onboarding_state(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_state_current_step ON onboarding_state(current_step);

-- ========================================
-- Personality Configuration Table
-- ========================================
CREATE TABLE IF NOT EXISTS personality_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clerk_id VARCHAR(255) NOT NULL,
    
    -- Personality type
    personality_type VARCHAR(50) NOT NULL, -- 'preset', 'custom', 'uploaded'
    personality_name VARCHAR(100) NOT NULL, -- 'sales-driven', 'professional', 'humorous', etc.
    
    -- Configuration data
    config_data JSONB NOT NULL DEFAULT '{}', -- Full personality configuration object
    
    -- Source information
    source_type VARCHAR(50) DEFAULT NULL, -- 'preset', 'upload', 'conversation_sample'
    source_data JSONB DEFAULT '{}', -- Original source data if applicable
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, is_active) WHERE is_active = TRUE
);

-- Indexes for personality_config
CREATE INDEX IF NOT EXISTS idx_personality_config_user_id ON personality_config(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_config_clerk_id ON personality_config(clerk_id);
CREATE INDEX IF NOT EXISTS idx_personality_config_active ON personality_config(is_active);
CREATE INDEX IF NOT EXISTS idx_personality_config_type ON personality_config(personality_type);

-- ========================================
-- Tour Modules Registry Table
-- ========================================
CREATE TABLE IF NOT EXISTS tour_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Module identification
    module_id VARCHAR(100) UNIQUE NOT NULL, -- 'tour_dashboard', 'tour_marketing', 'tour_inbox'
    module_name VARCHAR(255) NOT NULL,
    module_description TEXT,
    
    -- Module configuration
    section_id VARCHAR(100) NOT NULL, -- UI section identifier
    step_sequence JSONB NOT NULL DEFAULT '[]', -- Array of step definitions
    text_payload JSONB NOT NULL DEFAULT '{}', -- Text explanations for each step
    ui_hooks JSONB DEFAULT '{}', -- UI element references (not UI logic)
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tour_modules
CREATE INDEX IF NOT EXISTS idx_tour_modules_module_id ON tour_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_tour_modules_active ON tour_modules(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_modules_section_id ON tour_modules(section_id);

-- ========================================
-- Tour Sessions Table
-- ========================================
CREATE TABLE IF NOT EXISTS tour_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clerk_id VARCHAR(255) NOT NULL,
    
    -- Tour identification
    tour_module_id VARCHAR(100) NOT NULL REFERENCES tour_modules(module_id),
    tour_type VARCHAR(50) NOT NULL, -- 'full', 'section', 'custom'
    
    -- State management
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'paused', 'completed', 'cancelled'
    current_step_index INTEGER DEFAULT 0,
    current_step_id VARCHAR(100) DEFAULT NULL,
    
    -- Progress tracking
    completed_steps JSONB DEFAULT '[]', -- Array of completed step IDs
    skipped_steps JSONB DEFAULT '[]', -- Array of skipped step IDs
    
    -- Session data
    session_data JSONB DEFAULT '{}', -- Additional session-specific data
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    paused_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tour_sessions
CREATE INDEX IF NOT EXISTS idx_tour_sessions_user_id ON tour_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_clerk_id ON tour_sessions(clerk_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_module_id ON tour_sessions(tour_module_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_status ON tour_sessions(status);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_active ON tour_sessions(user_id, status) WHERE status IN ('running', 'paused');

-- ========================================
-- Tour Commands Log Table
-- ========================================
CREATE TABLE IF NOT EXISTS tour_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_session_id UUID REFERENCES tour_sessions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Command information
    command_type VARCHAR(50) NOT NULL, -- 'start', 'stop', 'next', 'skip', 'pause', 'resume'
    command_data JSONB DEFAULT '{}',
    
    -- Intent detection
    original_message TEXT, -- Original user message that triggered the command
    detected_intent VARCHAR(100), -- Detected intent type
    confidence_score DECIMAL(3,2) DEFAULT NULL, -- 0.00 to 1.00
    
    -- Result
    command_result JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tour_commands
CREATE INDEX IF NOT EXISTS idx_tour_commands_session_id ON tour_commands(tour_session_id);
CREATE INDEX IF NOT EXISTS idx_tour_commands_user_id ON tour_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_commands_type ON tour_commands(command_type);
CREATE INDEX IF NOT EXISTS idx_tour_commands_intent ON tour_commands(detected_intent);
CREATE INDEX IF NOT EXISTS idx_tour_commands_executed_at ON tour_commands(executed_at);

-- ========================================
-- Triggers for updated_at
-- ========================================
CREATE TRIGGER update_onboarding_state_updated_at BEFORE UPDATE ON onboarding_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_config_updated_at BEFORE UPDATE ON personality_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_modules_updated_at BEFORE UPDATE ON tour_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_sessions_updated_at BEFORE UPDATE ON tour_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Insert Default Tour Modules
-- ========================================
INSERT INTO tour_modules (module_id, module_name, module_description, section_id, step_sequence, text_payload, order_index) VALUES
('tour_dashboard', 'Dashboard Tour', 'Complete tour of the main dashboard', 'dashboard', 
 '[
   {"step_id": "welcome", "title": "Welcome to DONNA", "description": "Let me show you around your dashboard"},
   {"step_id": "navigation", "title": "Navigation", "description": "Use the sidebar to navigate between sections"},
   {"step_id": "overview", "title": "Overview Cards", "description": "These cards show your key metrics at a glance"}
 ]'::jsonb,
 '{
   "welcome": "Welcome to DONNA! I''m here to help you manage your business efficiently.",
   "navigation": "The sidebar lets you switch between Dashboard, Marketing, Inbox, and other sections.",
   "overview": "These overview cards give you quick insights into your business performance."
 }'::jsonb,
 1)
ON CONFLICT (module_id) DO NOTHING;

INSERT INTO tour_modules (module_id, module_name, module_description, section_id, step_sequence, text_payload, order_index) VALUES
('tour_marketing', 'Marketing Tour', 'Tour of the marketing section', 'marketing',
 '[
   {"step_id": "campaigns", "title": "Campaigns", "description": "Create and manage your marketing campaigns"},
   {"step_id": "analytics", "title": "Analytics", "description": "Track campaign performance and metrics"},
   {"step_id": "templates", "title": "Templates", "description": "Use pre-built templates for quick campaign creation"}
 ]'::jsonb,
 '{
   "campaigns": "In the Marketing section, you can create email campaigns, SMS campaigns, and more.",
   "analytics": "View detailed analytics for each campaign to see open rates, click rates, and conversions.",
   "templates": "Save time by using our pre-built templates for common marketing scenarios."
 }'::jsonb,
 2)
ON CONFLICT (module_id) DO NOTHING;

INSERT INTO tour_modules (module_id, module_name, module_description, section_id, step_sequence, text_payload, order_index) VALUES
('tour_inbox', 'Inbox Tour', 'Tour of the inbox section', 'inbox',
 '[
   {"step_id": "messages", "title": "Messages", "description": "View and manage all incoming messages"},
   {"step_id": "filters", "title": "Filters", "description": "Filter messages by type, priority, or status"},
   {"step_id": "actions", "title": "Quick Actions", "description": "Quick actions for responding to messages"}
 ]'::jsonb,
 '{
   "messages": "Your inbox shows all incoming emails, SMS, and other messages in one place.",
   "filters": "Use filters to find specific messages quickly - by sender, date, or priority.",
   "actions": "Quick actions let you reply, forward, or archive messages with one click."
 }'::jsonb,
 3)
ON CONFLICT (module_id) DO NOTHING;

-- ========================================
-- Views for Common Queries
-- ========================================

-- View for user onboarding status
CREATE OR REPLACE VIEW user_onboarding_status AS
SELECT 
    u.id as user_id,
    u.clerk_id,
    u.email,
    u.name,
    os.onboarding_completed,
    os.current_step,
    os.name as onboarding_name,
    os.business_name,
    os.documents_uploaded,
    os.personality_configured,
    os.onboarding_started_at,
    os.onboarding_completed_at,
    CASE 
        WHEN os.onboarding_completed THEN 'completed'
        WHEN os.current_step IS NOT NULL THEN 'in_progress'
        ELSE 'not_started'
    END as onboarding_status
FROM users u
LEFT JOIN onboarding_state os ON u.id = os.user_id;

-- View for active tour sessions
CREATE OR REPLACE VIEW active_tour_sessions AS
SELECT 
    ts.id,
    ts.user_id,
    ts.clerk_id,
    ts.tour_module_id,
    tm.module_name,
    tm.section_id,
    ts.status,
    ts.current_step_index,
    ts.current_step_id,
    ts.started_at,
    ts.paused_at
FROM tour_sessions ts
JOIN tour_modules tm ON ts.tour_module_id = tm.module_id
WHERE ts.status IN ('running', 'paused')
ORDER BY ts.started_at DESC;

