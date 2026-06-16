---
name: Settings Cog Interface Implementation Plan
overview: ""
todos: []
---

# Settings Cog Interface Implementation Plan

## Overview

Rebuild the settings interface to match the comprehensive 9-section structure outlined in `Settings Cog.txt`, replacing the current basic 6-tab interface with a fully-featured settings system that covers Profile & Identity, Behavior & Personality, Knowledge & Memory, Tools & Integrations, Communication Channels, Automations & Workflows, Privacy & Security, Notifications, and Billing. Additionally includes future-proofing for Telnyx integration, vertical-specific configurations, analytics/APM, CRM features, and performance optimization.

## Current State

- Basic settings interface exists at `components/interfaces/settings-interface.tsx` with 6 tabs (profile, notifications, security, appearance, integrations, advanced)
- Settings modal wrapper at `components/SettingsModal.tsx` handles opening/closing
- Settings button at `components/SettingsButton.tsx` triggers the modal
- API endpoint at `api/chatbot_settings.php` handles GET/POST/PUT/DELETE operations
- UI components available: Switch, Select, Input, Textarea, Checkbox, RadioGroup, Tabs, Accordion, etc.
- Telnyx integration exists (`api/telnyx/webhook.php`, `voice_system/telnyx_voice_client.php`)
- Vertical modules implemented (Hospitality, Real Estate, Professional Services)
- Analytics system exists (`logic/analytics_logic.php`)

## Implementation Strategy

### 1. Data Structure & Types

Create TypeScript types for all settings sections:

- `types/settings.ts` - Define comprehensive settings interfaces matching all 9 sections plus future features
- Include nested types for integrations, channels, workflows, verticals, Telnyx, analytics, CRM, etc.
- Support for tier-based features (Pro & Enterprise)
- Include types for:
  - Telnyx voice/SMS configuration
  - Vertical-specific settings
  - Analytics/APM configuration
  - CRM pipeline settings
  - Performance/caching settings
  - WebRTC/WebSocket configuration
  - Gmail Pub/Sub settings (future)

### 2. Settings Interface Component

Rebuild `components/interfaces/settings-interface.tsx`:

- Replace 6-tab structure with 9-section navigation plus expanded subsections
- Use sidebar navigation with icons for each section
- Implement collapsible "Advanced/Developer" section (collapsed by default)
- Each section as a separate component for maintainability
- Support for conditional rendering based on plan tier and enabled features

### 3. Section Components

Create individual section components in `components/settings/`:

- `ProfileIdentitySection.tsx` - DONNA name, business info, timezone, language, brand voice, **vertical selection with vertical-specific config panels**
- `BehaviorPersonalitySection.tsx` - Response style, confidence level, escalation, autonomy
- `KnowledgeMemorySection.tsx` - Document uploads, memory scope, reset controls
- `ToolsIntegrationsSection.tsx` - Email, Calendar, CRM, Payments, Forms, Zapier, APIs with permissions, **Telnyx Voice & SMS configuration**, **Gmail Pub/Sub settings**
- `CommunicationChannelsSection.tsx` - Website, SMS, Email, Voice, Dashboard with per-channel settings, **WebRTC/Real-time Voice configuration**, **Telnyx channel-specific settings**
- `AutomationsWorkflowsSection.tsx` - Active workflows, triggers, conditional logic
- `PrivacySecuritySection.tsx` - Data retention, access logs, RBAC, compliance, AI transparency
- `NotificationsSection.tsx` - Alert types and delivery methods
- `BillingPlanSection.tsx` - Plan tier, usage, invoices, payment methods
- `AdvancedDeveloperSection.tsx` - API keys, webhooks, sandbox, debug logs, reset, **Performance & Caching settings**, **Analytics/APM configuration**
- `VerticalSpecificSettings.tsx` (new) - Industry-specific configuration panels
- `TelnyxSettings.tsx` (new) - Telnyx voice and SMS detailed configuration
- `AnalyticsSettings.tsx` (new) - Analytics, APM, and monitoring configuration
- `CRMSettings.tsx` (new) - CRM pipeline and deal configuration
- `SettingsFormField.tsx` (reusable field component)
- `SettingsSectionWrapper.tsx` (common wrapper)

### 4. Form Components & State Management

- Use React Hook Form for form state management
- Create reusable form field components using existing UI components
- Implement validation for all fields including nested structures
- Add auto-save functionality with debouncing
- Show unsaved changes indicator
- Support conditional field visibility based on plan tier and feature flags

### 5. API Integration

Extend `api/chatbot_settings.php`:

- Update `validateSettings()` to handle all new setting categories
- Add validation for nested structures (integrations, channels, workflows, Telnyx config, verticals, CRM, analytics)
- Support tier-based feature validation
- Maintain backward compatibility with existing settings
- Add validation for:
  - Telnyx configuration (phone numbers, connection IDs, webhook URLs)
  - Vertical-specific settings
  - CRM pipeline configurations
  - Analytics/APM settings
  - Performance/caching settings
  - WebRTC configuration

### 6. UI/UX Enhancements

- Use Accordion component for collapsible subsections
- Implement proper loading states
- Add success/error toast notifications
- Create visual indicators for enabled/disabled integrations
- Add tooltips for complex settings
- Implement search/filter for long lists (integrations, workflows, verticals)
- Add feature badges for Pro/Enterprise-only features
- Show connection status indicators for integrations (Telnyx, Gmail, etc.)

### 7. Integration with Existing Systems

- Connect to existing authentication system
- Integrate with billing/subscription system for plan tier checks
- Connect to document upload system for Knowledge & Memory section
- Link to workflow engine for Automations section
- Integrate with Telnyx API for connection status and configuration validation
- Connect to vertical system (`lib/Verticals.php`) for vertical-specific settings
- Link to analytics system for APM configuration
- Connect to CRM system (when implemented) for pipeline configuration

## File Structure

```
components/
  settings/
    ProfileIdentitySection.tsx
    BehaviorPersonalitySection.tsx
    KnowledgeMemorySection.tsx
    ToolsIntegrationsSection.tsx
    CommunicationChannelsSection.tsx
    AutomationsWorkflowsSection.tsx
    PrivacySecuritySection.tsx
    NotificationsSection.tsx
    BillingPlanSection.tsx
    AdvancedDeveloperSection.tsx
    VerticalSpecificSettings.tsx (new)
    TelnyxSettings.tsx (new)
    AnalyticsSettings.tsx (new)
    CRMSettings.tsx (new)
    SettingsFormField.tsx (reusable field component)
    SettingsSectionWrapper.tsx (common wrapper)
  interfaces/
    settings-interface.tsx (main component, updated)
types/
  settings.ts (new - comprehensive types including future features)
api/
  chatbot_settings.php (extended validation)
```

## Key Features to Implement

### Profile & Identity

- Text inputs for DONNA name, business name, primary contact
- Select dropdowns for industry/vertical, timezone, language
- Radio group for brand voice preset (Professional, Friendly, DONNA, Custom)
- Conditional Custom voice editor (Pro/Enterprise only)
- **Vertical Selection Panel** - Dropdown with vertical options (Hospitality, Real Estate, Professional Services)
- **Vertical-Specific Configuration** - Conditional panels that show when a vertical is selected:
  - Hospitality: Front desk automation settings, reservation handling preferences
  - Real Estate: Lead qualification rules, showing scheduling preferences
  - Professional Services: Email triage rules, meeting notes preferences

### Behavior & Personality

- Radio group for Response Style (Concise, Balanced, Detailed)
- Radio group for Confidence Level (Conservative, Balanced, Assertive)
- Select for Escalation Threshold
- Radio group for Autonomy Level (Inform only, Suggest actions, Execute actions)

### Knowledge & Memory

- File upload interface for documents (PDFs, Docs, SOPs, Contracts)
- Multi-select for website sources
- Toggle for CRM/Data Feeds
- Textarea for Manual Notes
- Radio group for Memory Scope (Per conversation, Per user, Global)
- Button for Forget/Reset Controls with confirmation

### Tools & Integrations

- List of integrations with toggle switches for Enable/Disable
- Permission toggles (Read vs Write) per integration
- Checkbox for "Human approval required" per integration
- Connection status indicators
- "Connect" buttons for unconnected integrations

**Email Integration:**
- Gmail OAuth connection status
- Gmail API settings
- **Gmail Pub/Sub Configuration** (future):
  - Pub/Sub subscription settings
  - Topic configuration
  - Push endpoint URL
  - Polling fallback toggle

**Telnyx Integration (New Detailed Section):**
- **Voice Configuration:**
  - API Key input (masked)
  - Connection ID selector
  - Phone number selector (inbound/outbound)
  - Webhook URL configuration
  - Call recording toggle (enable/disable)
  - Recording storage location
  - Call control preferences (answer, hangup, transfer rules)
- **SMS/MMS Configuration:**
  - Messaging Profile ID
  - Phone number for SMS
  - Delivery status tracking toggle
  - MMS media support toggle
  - Webhook URL for messaging events
- **Connection Status:**
  - Real-time connection indicator
  - Test connection button
  - Last successful connection timestamp

**CRM Integration:**
- CRM provider selection (Salesforce, HubSpot, custom)
- Connection status
- **CRM Pipeline Configuration** (when CRM features are enabled):
  - Deal pipeline stage definitions
  - Custom field mappings
  - Pipeline automation rules
  - Multi-tenant reporting preferences
  - Forecasting model settings

### Communication Channels

- Toggle switches for each channel (Website Chat, SMS, Email, Voice, Dashboard)
- Per-channel settings panel (tone override, business hours, auto-reply rules, escalation path, signature)
- Time picker for business hours
- Textarea for signature/closing style

**Real-time Voice / WebRTC Configuration (New):**
- WebRTC connection settings
- VAD (Voice Activity Detection) toggle
- Reconnection settings:
  - Max retry attempts
  - Backoff strategy (exponential, linear)
  - Reconnection timeout
- WebSocket proxy configuration (if retained):
  - Proxy URL
  - Authentication settings
  - Rate limiting preferences

**Telnyx Channel-Specific Settings:**
- Voice channel:
  - Telnyx phone number assignment
  - Call routing rules
  - Recording preferences per channel
- SMS channel:
  - Telnyx messaging profile assignment
  - Delivery confirmation settings
  - Auto-reply templates

### Automations & Workflows

- List of active workflows with enable/disable toggles
- Add new workflow button
- Workflow editor with trigger rules, time-based actions, conditional logic
- Human-in-the-loop toggle per workflow
- **Vertical-Specific Workflow Templates** - Pre-configured workflows based on selected vertical

### Privacy, Security & Governance

- Select for Data Retention Policies
- Link/button to Access Logs viewer
- Role-based permissions manager
- Admin vs Operator role selector
- Export/Delete Data buttons with confirmations
- Compliance checkboxes (GDPR, CCPA, etc.)
- Link to AI Usage Transparency Log

### Notifications & Alerts

- Toggle switches for each alert type (escalation, task completion, errors, patterns, summaries)
- Multi-select for delivery methods (Email, SMS, Dashboard, Silent log)
- Per-alert-type delivery method configuration
- **Telnyx SMS Delivery** - Configure SMS delivery via Telnyx for critical alerts

### Billing & Plan

- Display current plan tier
- Usage statistics display
- Add-ons list with enable/disable
- Invoices list with download links
- Payment methods management
- Upgrade/downgrade buttons

### Advanced / Developer

- Collapsible section (collapsed by default)
- API keys list with show/hide/regenerate
- Webhooks configuration
- Sandbox mode toggle
- Debug logs viewer
- Reset DONNA to default button (with confirmation)

**Performance & Caching (New):**
- Redis cache configuration (when implemented):
  - Cache TTL settings
  - Cache invalidation rules
  - Cache key prefixes
- Job queue configuration:
  - Queue provider selection
  - Retry settings
  - Priority levels
- Performance optimization preferences:
  - Enable/disable caching
  - Cache warming settings
  - Query optimization toggles

**Analytics & APM Configuration (New):**
- Tracing configuration:
  - Enable/disable tracing
  - Sampling rate (percentage)
  - Trace retention period
- SLA threshold settings:
  - Response time thresholds
  - Error rate thresholds
  - Uptime requirements
- Performance monitoring:
  - Enable/disable APM
  - Metrics collection interval
  - Alert thresholds
- Dashboard customization:
  - Default dashboard layout
  - Custom metric preferences
  - Report generation schedule
- Sentry integration settings:
  - Error tracking toggle
  - Performance monitoring toggle
  - Release tracking

## Technical Considerations

- Use existing UI component library (shadcn/ui based)
- Maintain glass-dark styling consistent with app theme
- Implement proper error handling and validation
- Add loading skeletons for async data
- Optimize re-renders with React.memo where appropriate
- Use React Query or SWR for data fetching/caching
- Implement optimistic updates for better UX
- Support feature flags for future functionality (graceful degradation)
- Validate Telnyx configuration against Telnyx API before saving
- Cache vertical-specific settings for performance
- Implement progressive enhancement for advanced features

## Future-Proofing Considerations

- Design settings structure to accommodate new integrations easily
- Use plugin/extension pattern for integration-specific settings
- Support for custom verticals (future expansion)
- Prepare for multi-tenant settings (organization-level vs user-level)
- Design for internationalization (i18n) support
- Consider settings import/export for backup and migration

## Testing Requirements

- Unit tests for each section component
- Integration tests for API calls
- E2E tests for critical user flows (save settings, reset, etc.)
- Validation tests for all form fields
- Tests for Telnyx configuration validation
- Tests for vertical-specific settings
- Tests for tier-based feature gating
- Performance tests for settings page load with many integrations

## Migration Strategy

- Maintain backward compatibility with existing settings structure
- Create migration script to convert old settings format to new structure
- Support gradual rollout with feature flags
- Provide default values for all new settings fields
