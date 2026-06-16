import { TourConfig } from '@/types/onboarding'

export const dashboardTour: TourConfig = {
  id: 'dashboard-full-tour',
  type: 'full',
  title: 'Welcome to Your DONNA Dashboard',
  description: 'Let me show you around your new AI-powered workspace',
  canSkip: true,
  canPause: true,
  autoStart: false,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome to DONNA! 🎉',
      description: 'I\'m excited to show you around! This tour will help you discover all the powerful features at your fingertips. You can pause or skip anytime.',
      placement: 'center'
    },
    {
      id: 'chat-widget',
      target: '[aria-label="Open DONNA Chat"]',
      title: 'Your AI Assistant',
      description: 'Click here anytime to chat with me! I can help with tasks, answer questions, and guide you through any feature. I\'m always here to help.',
      placement: 'left',
      highlightPadding: 12
    },
    {
      id: 'dashboard-grid',
      target: '.grid',
      title: 'Your Dashboard',
      description: 'This is your command center. Each card represents a different area of your business. Hover over any card to see a preview, then click to dive in.',
      placement: 'top',
      highlightPadding: 16
    },
    {
      id: 'email-section',
      target: '[data-tour="email-interface"]',
      title: 'Email Management',
      description: 'Manage all your emails in one place. I can help you draft responses, organize your inbox, and never miss an important message.',
      placement: 'bottom',
      highlightPadding: 8,
      beforeShow: async () => {
        // Scroll to email section if needed
        const element = document.querySelector('[data-tour="email-interface"]')
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    {
      id: 'analytics-section',
      target: '[data-tour="analytics-interface"]',
      title: 'Analytics & Insights',
      description: 'Track your business metrics and get AI-powered insights. I analyze your data and provide actionable recommendations.',
      placement: 'bottom',
      highlightPadding: 8
    },
    {
      id: 'settings',
      target: '[aria-label="Settings"]',
      title: 'Settings & Preferences',
      description: 'Customize your experience here. Adjust my personality, set up integrations, and configure your preferences.',
      placement: 'left',
      highlightPadding: 8
    },
    {
      id: 'voice-controls',
      target: '[aria-label="Voice Controls"]',
      title: 'Voice Interaction',
      description: 'Prefer to talk? Click here to enable voice mode. You can speak to me naturally, and I\'ll respond with voice too!',
      placement: 'bottom',
      highlightPadding: 8
    },
    {
      id: 'complete',
      target: 'body',
      title: 'You\'re All Set! 🚀',
      description: 'That\'s the quick tour! Remember, you can always ask me for help or request a deeper tour of any section. Ready to get started?',
      placement: 'center'
    }
  ],
  onComplete: () => {
    // Save tour completion
    localStorage.setItem('donna_dashboard_tour_completed', 'true')
    // Trigger celebration animation
    window.dispatchEvent(new CustomEvent('donna:tour-complete', {
      detail: { tourId: 'dashboard-full-tour' }
    }))
  },
  onSkip: () => {
    localStorage.setItem('donna_dashboard_tour_skipped', 'true')
  }
}

export const emailSectionTour: TourConfig = {
  id: 'email-section-tour',
  type: 'section',
  title: 'Email Management Deep Dive',
  description: 'Master your email workflow with DONNA',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'inbox',
      target: '[data-tour="email-inbox"]',
      title: 'Your Inbox',
      description: 'All your emails in one place. I automatically categorize and prioritize them for you.',
      placement: 'right'
    },
    {
      id: 'compose',
      target: '[data-tour="email-compose"]',
      title: 'AI-Powered Composition',
      description: 'Let me help you write emails! Just tell me what you want to say, and I\'ll draft it in your style.',
      placement: 'left'
    },
    {
      id: 'filters',
      target: '[data-tour="email-filters"]',
      title: 'Smart Filters',
      description: 'Filter by priority, sender, or category. I learn what\'s important to you over time.',
      placement: 'bottom'
    },
    {
      id: 'templates',
      target: '[data-tour="email-templates"]',
      title: 'Email Templates',
      description: 'Save time with templates. I can create custom templates based on your most common emails.',
      placement: 'top'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_email_tour_completed', 'true')
  }
}

export const analyticsSectionTour: TourConfig = {
  id: 'analytics-section-tour',
  type: 'section',
  title: 'Analytics & Insights',
  description: 'Understand your business metrics',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'overview',
      target: '[data-tour="analytics-overview"]',
      title: 'Performance Overview',
      description: 'See your key metrics at a glance. I highlight trends and anomalies automatically.',
      placement: 'bottom'
    },
    {
      id: 'charts',
      target: '[data-tour="analytics-charts"]',
      title: 'Visual Analytics',
      description: 'Interactive charts help you understand your data. Click any chart for deeper insights.',
      placement: 'top'
    },
    {
      id: 'insights',
      target: '[data-tour="analytics-insights"]',
      title: 'AI Insights',
      description: 'I analyze your data and provide actionable recommendations to improve your business.',
      placement: 'left'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_analytics_tour_completed', 'true')
  }
}

export const quickTips: TourConfig = {
  id: 'quick-tips',
  type: 'mini',
  title: 'Quick Tips',
  description: 'Helpful shortcuts and features',
  canSkip: true,
  canPause: false,
  steps: [
    {
      id: 'keyboard-shortcuts',
      target: 'body',
      title: 'Keyboard Shortcuts',
      description: 'Press Ctrl+K (Cmd+K on Mac) to quickly open the command palette. Press / to focus search.',
      placement: 'center'
    },
    {
      id: 'ask-donna',
      target: '[aria-label="Open DONNA Chat"]',
      title: 'Just Ask!',
      description: 'Not sure how to do something? Just ask me! I can guide you through any task or feature.',
      placement: 'left'
    }
  ]
}

export const marketingSectionTour: TourConfig = {
  id: 'marketing-section-tour',
  type: 'section',
  title: 'Marketing Tools',
  description: 'Discover powerful marketing features',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'campaigns',
      target: '[data-tour="marketing-campaigns"]',
      title: 'Campaign Management',
      description: 'Create and manage your marketing campaigns all in one place. I can help you optimize campaigns for better results.',
      placement: 'bottom',
      chatMessage: 'This is where you manage all your marketing campaigns. Create new campaigns, track their performance, and I can help optimize them for better results.'
    },
    {
      id: 'analytics',
      target: '[data-tour="marketing-analytics"]',
      title: 'Marketing Analytics',
      description: 'Track campaign performance, engagement rates, and ROI. I analyze trends and suggest improvements.',
      placement: 'top',
      chatMessage: 'Marketing Analytics shows you how your campaigns are performing. Track engagement rates, ROI, open rates, click-through rates, and more. I analyze the data and suggest improvements.'
    },
    {
      id: 'content',
      target: '[data-tour="marketing-content"]',
      title: 'Content Creation',
      description: 'I can help you create compelling marketing content, from social media posts to email campaigns.',
      placement: 'right',
      chatMessage: 'I can help you create compelling marketing content! Just tell me what you want to communicate, and I\'ll draft emails, social media posts, or other marketing materials in your brand voice.'
    },
    {
      id: 'automation',
      target: '[data-tour="marketing-automation"]',
      title: 'Marketing Automation',
      description: 'Set up automated workflows to nurture leads and engage customers at the right time.',
      placement: 'left',
      chatMessage: 'Marketing Automation lets you set up workflows that run automatically. For example, send a welcome email when someone signs up, or follow up with leads after they download content.'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_marketing_tour_completed', 'true')
  }
}

// Detailed marketing tour
export const marketingDetailedTour: TourConfig = {
  id: 'marketing-detailed-tour',
  type: 'section',
  title: 'Marketing & Email - Detailed Tour',
  description: 'Complete walkthrough of all Marketing features',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'email-inbox',
      target: '[data-tour="email-inbox"]',
      title: 'Email Inbox',
      description: 'Your main email inbox. All emails are automatically categorized and prioritized.',
      placement: 'right',
      chatMessage: 'This is your email inbox. I automatically categorize emails (work, personal, marketing, etc.) and prioritize them so you see the most important ones first.'
    },
    {
      id: 'email-compose',
      target: '[data-tour="email-compose"]',
      title: 'Compose Email',
      description: 'Click here to compose a new email. I can help you write it!',
      placement: 'left',
      chatMessage: 'Click the Compose button to write a new email. You can type it yourself, or ask me to help draft it - just tell me what you want to say and I\'ll write it in your style!'
    },
    {
      id: 'email-filters',
      target: '[data-tour="email-filters"]',
      title: 'Email Filters',
      description: 'Filter emails by category, priority, or sender to find what you need quickly.',
      placement: 'bottom',
      chatMessage: 'Use these filters to quickly find specific emails. Filter by category (work, personal, marketing), priority level, or sender. I learn what\'s important to you over time.'
    },
    {
      id: 'email-autopilot',
      target: '[data-tour="email-autopilot"]',
      title: 'Autopilot Mode',
      description: 'Let me automatically handle routine emails for you.',
      placement: 'top',
      chatMessage: 'Autopilot mode lets me automatically respond to routine emails. I\'ll handle common inquiries, schedule meetings, and send standard responses - you just review and approve!'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_marketing_detailed_tour_completed', 'true')
  }
}

export const salesSectionTour: TourConfig = {
  id: 'sales-section-tour',
  type: 'section',
  title: 'Sales Dashboard',
  description: 'Master your sales process',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'pipeline',
      target: '[data-tour="sales-pipeline"]',
      title: 'Sales Pipeline',
      description: 'Visualize your sales process and track deals through each stage. I help identify bottlenecks and opportunities.',
      placement: 'bottom',
      chatMessage: 'This is your Sales Pipeline view. Here you can see all your deals organized by stage - from prospecting to closed won. I help identify which deals need attention and where bottlenecks might be forming.'
    },
    {
      id: 'leads',
      target: '[data-tour="sales-leads"]',
      title: 'Lead Management',
      description: 'Organize and prioritize your leads. I can help qualify leads and suggest the best follow-up actions.',
      placement: 'top',
      chatMessage: 'The Leads tab shows all your potential customers. I automatically score each lead based on their engagement and fit, helping you prioritize who to contact first. You can filter by status, source, or score.'
    },
    {
      id: 'forecasting',
      target: '[data-tour="sales-forecasting"]',
      title: 'Sales Forecasting',
      description: 'Get AI-powered predictions on your sales performance. I analyze patterns to help you plan ahead.',
      placement: 'right',
      chatMessage: 'Sales Forecasting uses AI to predict your future revenue based on historical data and current pipeline. I analyze patterns in your sales cycle, win rates, and deal sizes to give you accurate forecasts.'
    },
    {
      id: 'reports',
      target: '[data-tour="sales-reports"]',
      title: 'Sales Reports',
      description: 'Generate detailed reports on your sales activities, performance metrics, and team productivity.',
      placement: 'left',
      chatMessage: 'The Reports section gives you detailed insights into your sales performance. Generate reports on activities, conversion rates, team productivity, and more. Export them as PDF or CSV for presentations.'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_sales_tour_completed', 'true')
  }
}

// Detailed sales tour with all buttons and features
export const salesDetailedTour: TourConfig = {
  id: 'sales-detailed-tour',
  type: 'section',
  title: 'Sales Dashboard - Detailed Tour',
  description: 'Complete walkthrough of all Sales features',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'sales-overview-tab',
      target: '[data-tour="sales-overview-tab"]',
      title: 'Overview Tab',
      description: 'See your sales metrics at a glance - revenue, pipeline value, conversion rates, and key stats.',
      placement: 'bottom',
      chatMessage: 'The Overview tab shows your key sales metrics at a glance. You\'ll see total revenue, pipeline value, conversion rates, and other important stats.'
    },
    {
      id: 'sales-contacts-tab',
      target: '[data-tour="sales-contacts-tab"]',
      title: 'Contacts Tab',
      description: 'Manage all your contacts - add new ones, search, filter, and view contact details.',
      placement: 'bottom',
      chatMessage: 'The Contacts tab is where you manage all your customer and prospect information. Click the + button to add a new contact, or use search and filters to find specific ones.'
    },
    {
      id: 'sales-add-contact',
      target: '[data-tour="sales-add-contact"]',
      title: 'Add Contact Button',
      description: 'Click here to add a new contact to your database.',
      placement: 'left',
      chatMessage: 'This button lets you add a new contact. Fill in their name, email, company, and other details. I can help enrich the contact data automatically!'
    },
    {
      id: 'sales-search',
      target: '[data-tour="sales-search"]',
      title: 'Search Contacts',
      description: 'Search for contacts by name, email, company, or any other field.',
      placement: 'bottom',
      chatMessage: 'Use this search bar to quickly find any contact. I can search by name, email, company, or even notes you\'ve added.'
    },
    {
      id: 'sales-filter',
      target: '[data-tour="sales-filter"]',
      title: 'Filter Contacts',
      description: 'Filter contacts by status, source, score, or custom criteria.',
      placement: 'bottom',
      chatMessage: 'The filter button lets you narrow down your contacts by status (new, contacted, qualified, converted), source, lead score, or other criteria.'
    },
    {
      id: 'sales-deals-tab',
      target: '[data-tour="sales-deals-tab"]',
      title: 'Deals Tab',
      description: 'View and manage all your active deals, track their progress through the pipeline.',
      placement: 'bottom',
      chatMessage: 'The Deals tab shows all your active opportunities. You can see each deal\'s value, stage, probability, and expected close date. Drag and drop to move deals between stages.'
    },
    {
      id: 'sales-campaigns-tab',
      target: '[data-tour="sales-campaigns-tab"]',
      title: 'Campaigns Tab',
      description: 'Create and manage sales campaigns to nurture leads and close deals.',
      placement: 'bottom',
      chatMessage: 'The Campaigns tab lets you create targeted sales campaigns. Set up email sequences, track engagement, and automate follow-ups to move leads through your funnel.'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_sales_detailed_tour_completed', 'true')
  }
}

export const settingsSectionTour: TourConfig = {
  id: 'settings-section-tour',
  type: 'section',
  title: 'Settings & Preferences',
  description: 'Customize your DONNA experience',
  canSkip: true,
  canPause: true,
  steps: [
    {
      id: 'profile',
      target: '[data-tour="settings-profile"]',
      title: 'Profile Settings',
      description: 'Update your personal information, preferences, and account details.',
      placement: 'bottom'
    },
    {
      id: 'personality',
      target: '[data-tour="settings-personality"]',
      title: 'DONNA Personality',
      description: 'Customize how I communicate with you. Adjust my tone, formality, and communication style.',
      placement: 'top'
    },
    {
      id: 'integrations',
      target: '[data-tour="settings-integrations"]',
      title: 'Integrations',
      description: 'Connect your favorite tools and services. I can work with your existing workflow.',
      placement: 'right'
    },
    {
      id: 'notifications',
      target: '[data-tour="settings-notifications"]',
      title: 'Notifications',
      description: 'Control how and when you receive updates. Stay informed without being overwhelmed.',
      placement: 'left'
    },
    {
      id: 'security',
      target: '[data-tour="settings-security"]',
      title: 'Security & Privacy',
      description: 'Manage your security settings, two-factor authentication, and privacy preferences.',
      placement: 'bottom'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_settings_tour_completed', 'true')
  }
}

// Comprehensive main tour that spotlights chatbot first, then each grid section
export const comprehensiveDashboardTour: TourConfig = {
  id: 'comprehensive-dashboard-tour',
  type: 'full',
  title: 'Complete DONNA Dashboard Tour',
  description: 'A comprehensive walkthrough of all DONNA features',
  canSkip: true,
  canPause: true,
  autoStart: false,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome to DONNA! 🎉',
      description: 'I\'m excited to show you around! This tour will help you discover all the powerful features at your fingertips. You can pause or skip anytime.',
      placement: 'center',
      chatMessage: 'Welcome! I\'m DONNA, your AI assistant. Let me show you around your dashboard. You can type "stop the tour" anytime to return to normal mode.'
    },
    {
      id: 'chatbot-spotlight',
      target: '[aria-label="Open DONNA Chat"]',
      title: 'Your AI Assistant - DONNA Chat',
      description: 'This is me! Click here anytime to chat with me. I can help with tasks, answer questions, guide you through features, and even run tours like this one.',
      placement: 'left',
      highlightPadding: 12,
      chatMessage: 'This is the DONNA chat! From here, you can ask me anything, request tours of specific sections, get help with features, or just chat. I\'ll keep this chat open during the tour so you can see explanations for each section.'
    },
    {
      id: 'grid-overview',
      target: '.grid',
      title: 'Your Dashboard Grid',
      description: 'This is your command center. Each card represents a different area of your business. Hover over any card to see a preview, then click to dive in.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'This is your main dashboard grid. Each card is a different business function. We\'ll explore each one together!'
    },
    {
      id: 'data-room-nav-step',
      target: '[data-tour="data-room-nav"]',
      title: 'Data Room',
      description: 'Open diligence materials from the header anytime: pitch deck, investor memo, proposed SAFE tiers, and supporting PDFs.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'Use Data Room for investor documents—the deck, SAFE structure, memo, GTM, and product PDFs. Next, we\'ll open it in a new view.',
      beforeShow: async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        await new Promise((resolve) => setTimeout(resolve, 350))
      }
    },
    {
      id: 'data-room-page-step',
      target: '[data-tour="data-room-content"]',
      title: 'Data Room',
      description: 'Review the proposed SAFE economics and download PDFs. Materials are for diligence and demo purposes.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'Here\'s the Data Room: deck link, SAFE table, and document downloads. When you\'re done exploring, we\'ll return to the dashboard grid.',
      beforeShow: async () => {
        const link = document.querySelector('[data-tour="data-room-nav"]') as HTMLElement | null
        link?.click()
        await new Promise((resolve) => setTimeout(resolve, 900))
      }
    },
    {
      id: 'leave-data-room-step',
      target: 'body',
      title: 'Continuing the tour',
      description: 'Returning to your dashboard grid to explore Sales and the rest of DONNA.',
      placement: 'center',
      chatMessage: 'Heading back to the main grid—next up is the Sales dashboard.',
      beforeShow: async () => {
        if (window.location.pathname.startsWith('/data-room')) {
          const back = document.querySelector(
            '[data-tour="data-room-back-dashboard"]'
          ) as HTMLElement | null
          back?.click()
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    },
    {
      id: 'sales-card',
      target: '[data-tour="sales-interface"]',
      title: 'Sales Dashboard',
      description: 'Track leads, manage your pipeline, and forecast revenue. Click to explore.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'This is your Sales Dashboard. Here you can manage contacts, track leads, view your sales pipeline, and forecast revenue. Let me show you inside!',
      beforeShow: async () => {
        const gridItem = document.querySelector('[data-tour="sales-interface"]')
        if (gridItem) {
          (gridItem as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 600))
          const section = document.querySelector('[data-tour="sales-content"]')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    {
      id: 'sales-content',
      target: '[data-tour="sales-content"]',
      title: 'Sales Dashboard Features',
      description: 'Here you can manage contacts, view your pipeline, track deals, and analyze sales performance.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'Inside the Sales Dashboard, you can manage all your contacts, view your sales pipeline, track deals through each stage, and get insights on your sales performance. Key features include contact management, lead scoring, deal tracking, and sales forecasting.'
    },
    {
      id: 'back-to-grid-1',
      target: 'body',
      title: 'Return to Grid',
      description: 'Returning to the main grid to continue the tour.',
      placement: 'center',
      chatMessage: 'Let\'s go back to the grid to see the next section!',
      beforeShow: async () => {
        // Find back button by looking for button containing "back to grid" text
        const buttons = Array.from(document.querySelectorAll('button'))
        const backButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('back to grid'))
        if (backButton) {
          (backButton as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    },
    {
      id: 'marketing-card',
      target: '[data-tour="email-interface"]',
      title: 'Marketing & Email',
      description: 'Manage all your marketing emails, campaigns, and communications in one place.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'This is your Marketing section! Here you can manage all your emails, create campaigns, and handle all your marketing communications. Let\'s take a look inside!',
      beforeShow: async () => {
        const gridItem = document.querySelector('[data-tour="email-interface"]')
        if (gridItem) {
          (gridItem as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 600))
          const section = document.querySelector('[data-tour="marketing-content"]')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    {
      id: 'marketing-content',
      target: '[data-tour="marketing-content"]',
      title: 'Marketing Features',
      description: 'Manage your inbox, compose emails, use AI to draft responses, and organize your marketing communications.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'In the Marketing section, you can manage your entire email inbox, compose new emails, use AI to draft responses, organize emails by category and priority, and create email templates. I can help you write emails that match your style!'
    },
    {
      id: 'back-to-grid-2',
      target: 'body',
      title: 'Return to Grid',
      description: 'Returning to the main grid.',
      placement: 'center',
      chatMessage: 'Back to the grid we go!',
      beforeShow: async () => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const backButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('back to grid'))
        if (backButton) {
          (backButton as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    },
    {
      id: 'chatbot-control-card',
      target: '[data-tour="chatbot-interface"]',
      title: 'Chatbot Control',
      description: 'Configure and manage your DONNA chatbot settings, embed codes, and conversation history.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'This is the Chatbot Control section! Here you can configure how I appear on your website, customize my settings, view conversation history, and get embed codes to add me to your site. Let\'s explore!',
      beforeShow: async () => {
        const gridItem = document.querySelector('[data-tour="chatbot-interface"]')
        if (gridItem) {
          (gridItem as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 600))
          const section = document.querySelector('[data-tour="chatbot-content"]')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    {
      id: 'chatbot-content',
      target: '[data-tour="chatbot-content"]',
      title: 'Chatbot Control Features',
      description: 'Customize chatbot appearance, manage conversations, and get embed codes for your website.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'In Chatbot Control, you can customize my appearance (colors, position, greeting), manage conversation history, configure my behavior, and get embed codes to add me to your website. You can also test how I\'ll look and behave!'
    },
    {
      id: 'back-to-grid-3',
      target: 'body',
      title: 'Return to Grid',
      description: 'Returning to the main grid.',
      placement: 'center',
      chatMessage: 'Returning to the grid...',
      beforeShow: async () => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const backButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('back to grid'))
        if (backButton) {
          (backButton as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    },
    {
      id: 'lead-generator-card',
      target: '[data-tour="lead-generator-interface"]',
      title: 'Lead Generator',
      description: 'Generate, import, and manage leads from various sources with AI-powered scoring.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'This is the Lead Generator! Here you can generate new leads, import leads from various sources, score them with AI, and manage your lead pipeline. Let\'s check it out!',
      beforeShow: async () => {
        const gridItem = document.querySelector('[data-tour="lead-generator-interface"]')
        if (gridItem) {
          (gridItem as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 600))
          const section = document.querySelector('[data-tour="lead-generator-content"]')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    {
      id: 'lead-generator-content',
      target: '[data-tour="lead-generator-content"]',
      title: 'Lead Generator Features',
      description: 'Generate leads based on criteria, import from CSV, score leads with AI, and track lead sources.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'The Lead Generator helps you find new business opportunities. You can generate leads based on industry, location, company size, and other criteria. Import leads from CSV files, and I\'ll automatically score them to help you prioritize which ones to contact first!'
    },
    {
      id: 'back-to-grid-4',
      target: 'body',
      title: 'Return to Grid',
      description: 'Returning to the main grid.',
      placement: 'center',
      chatMessage: 'Back to the grid!',
      beforeShow: async () => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const backButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('back to grid'))
        if (backButton) {
          (backButton as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    },
    {
      id: 'secretary-card',
      target: '[data-tour="secretary-interface"]',
      title: 'Secretary',
      description: 'Your AI secretary for meeting preparation, task management, notes, and deadlines.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'This is your Secretary! I can help you prepare for meetings, manage tasks, take notes, and track deadlines. I\'ll even join your meetings and take notes for you! Let\'s see what\'s inside!',
      beforeShow: async () => {
        const gridItem = document.querySelector('[data-tour="secretary-interface"]')
        if (gridItem) {
          (gridItem as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 600))
          const section = document.querySelector('[data-tour="secretary-content"]')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    {
      id: 'secretary-content',
      target: '[data-tour="secretary-content"]',
      title: 'Secretary Features',
      description: 'Manage meetings, prepare with AI, track tasks, take notes, and never miss a deadline.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'The Secretary section is your personal assistant for staying organized. You can manage upcoming meetings, and I\'ll help you prepare by researching participants and topics. Track tasks, take notes, and set deadlines. You can even invite me to your meetings, and I\'ll join and take notes automatically!'
    },
    {
      id: 'back-to-grid-5',
      target: 'body',
      title: 'Return to Grid',
      description: 'Returning to the main grid.',
      placement: 'center',
      chatMessage: 'Almost done! Let\'s go back to the grid.',
      beforeShow: async () => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const backButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('back to grid'))
        if (backButton) {
          (backButton as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    },
    {
      id: 'analytics-card',
      target: '[data-tour="analytics-interface"]',
      title: 'Analytics',
      description: 'Track business metrics, get AI-powered insights, and visualize your data.',
      placement: 'bottom',
      highlightPadding: 8,
      chatMessage: 'This is Analytics! Here you can see all your business metrics, get AI-powered insights, and visualize your data with interactive charts. Let\'s take a look!',
      beforeShow: async () => {
        const gridItem = document.querySelector('[data-tour="analytics-interface"]')
        if (gridItem) {
          (gridItem as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 600))
          const section = document.querySelector('[data-tour="analytics-content"]')
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    },
    {
      id: 'analytics-content',
      target: '[data-tour="analytics-content"]',
      title: 'Analytics Features',
      description: 'View key metrics, interactive charts, AI insights, and performance trends.',
      placement: 'top',
      highlightPadding: 16,
      chatMessage: 'The Analytics dashboard shows you all your key business metrics at a glance - revenue, users, conversion rates, engagement, and more. I analyze your data and provide actionable insights to help you make better decisions. The charts are interactive, so you can dive deeper into any metric!'
    },
    {
      id: 'back-to-grid-6',
      target: 'body',
      title: 'Return to Grid',
      description: 'Returning to the main grid.',
      placement: 'center',
      chatMessage: 'Last section! Let\'s go back to the grid.',
      beforeShow: async () => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const backButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('back to grid'))
        if (backButton) {
          (backButton as HTMLElement).click()
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    },
    {
      id: 'settings',
      target: '[aria-label="Settings"], button[aria-label*="Settings"], [data-tour="settings-button"]',
      title: 'Settings & Preferences',
      description: 'Customize your DONNA experience, adjust personality, set up integrations, and configure preferences.',
      placement: 'left',
      highlightPadding: 8,
      chatMessage: 'Finally, Settings! Here you can customize your entire DONNA experience - adjust my personality, set up integrations with other tools, configure notifications, manage security, and much more. This is where you make DONNA truly yours!'
    },
    {
      id: 'complete',
      target: 'body',
      title: 'You\'re All Set! 🚀',
      description: 'That\'s the complete tour! Remember, you can always ask me for help or request a detailed tour of any specific section. Ready to get started?',
      placement: 'center',
      chatMessage: 'That\'s the complete tour! You now know your way around DONNA. If you want a more detailed tour of any specific section, just ask me! For example, say "show me the sales dashboard" or "tour the marketing section" and I\'ll give you an in-depth walkthrough. Happy exploring! 🎉'
    }
  ],
  onComplete: () => {
    localStorage.setItem('donna_comprehensive_tour_completed', 'true')
    window.dispatchEvent(new CustomEvent('donna:tour-complete', {
      detail: { tourId: 'comprehensive-dashboard-tour' }
    }))
  },
  onSkip: () => {
    localStorage.setItem('donna_comprehensive_tour_skipped', 'true')
  }
}

// Export all tours for easy importing
// IMPORTANT: Must be defined AFTER all individual tours to avoid circular dependency issues
export const allTours = {
  dashboardTour,
  comprehensiveDashboardTour,
  emailSectionTour,
  analyticsSectionTour,
  marketingSectionTour,
  marketingDetailedTour,
  salesSectionTour,
  salesDetailedTour,
  settingsSectionTour,
  quickTips
}

