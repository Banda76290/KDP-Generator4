# KDP Generator - Author Publishing Management Platform

## Overview

KDP Generator is a comprehensive web application designed to help authors manage their publishing projects, particularly for Amazon KDP (Kindle Direct Publishing). The platform combines project management, sales analytics, AI-powered content generation, and data import capabilities to provide a complete publishing workflow solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (OIDC) with Replit integration
- **Styling**: Tailwind CSS with shadcn/ui component library

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared types and schemas
├── migrations/      # Database migrations
└── attached_assets/ # Static assets and documentation
```

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with OpenID Connect strategy
- **Session Management**: Express sessions with PostgreSQL store
- **File Handling**: Multer for file uploads
- **Validation**: Zod schemas shared between client and server

### Database Schema
The application uses a relational database structure with these main entities:
- **Users**: User profiles with subscription tiers and Stripe integration
- **Projects**: Book projects with metadata, status tracking, and format support
- **Contributors**: Project collaborators with defined roles
- **Sales Data**: KDP sales records with revenue and performance metrics
- **AI Generations**: Tracking of AI-powered content generation
- **Sessions**: User session storage

## Data Flow

### Authentication Flow
1. Users authenticate via Replit's OIDC provider
2. Session data is stored in PostgreSQL
3. Protected routes verify authentication status
4. User information is synchronized with local database

### Project Management Flow
1. Users create projects with comprehensive metadata (title, description, categories, etc.)
2. Dynamic forms adapt based on user selections (e.g., AI usage toggles additional fields)
3. Projects support multiple formats (eBook, paperback, hardcover)
4. Contributors can be added with specific roles

### Sales Data Import Flow
1. Users upload KDP reports (Excel/CSV files)
2. Server parses files using XLSX library
3. Sales data is extracted and normalized
4. Data is stored and associated with user projects
5. Analytics are calculated and cached

### AI Content Generation Flow
1. Users request AI assistance for various content types (structure, descriptions, marketing)
2. Requests are sent to OpenAI's GPT-4o model
3. Generated content is returned and optionally stored
4. Token usage is tracked for billing/limits

## External Dependencies

### Third-Party Services
- **OpenAI API**: For AI-powered content generation
- **Replit Authentication**: OIDC provider for user authentication
- **Neon Database**: PostgreSQL hosting (via @neondatabase/serverless)
- **Stripe**: Payment processing and subscription management

### Key Libraries
- **Frontend**: React, TanStack Query, React Hook Form, Recharts, Radix UI
- **Backend**: Express, Drizzle ORM, Passport.js, Multer, OpenAI SDK
- **Shared**: Zod for schema validation
- **Development**: Vite, TypeScript, Tailwind CSS

### File Processing
- **XLSX**: Excel file parsing for KDP reports
- **Multer**: File upload handling with memory storage
- **WebSocket**: Real-time connection support via ws library

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles TypeScript server to `dist/index.js`
- **Database**: Drizzle Kit manages schema migrations

### Environment Configuration
- **Development**: Uses Vite dev server with HMR and error overlay
- **Production**: Serves static files from Express with API routes
- **Database**: Requires `DATABASE_URL` environment variable
- **External APIs**: Requires `OPENAI_API_KEY` and OIDC configuration

### Session Management
- PostgreSQL-backed sessions for scalability
- Secure cookie configuration with HttpOnly and Secure flags
- 7-day session lifetime with automatic cleanup

### Error Handling
- Global error middleware on backend
- Client-side error boundaries and toast notifications
- Unauthorized request handling with automatic re-authentication
- File upload validation and size limits

The application is designed to be deployed on Replit with integrated authentication, but can be adapted for other hosting platforms with appropriate environment variable configuration.

## Recent Changes (29 Juillet 2025)

### Issues Fixed
- **Authentication Setup**: Corrected authentication middleware that was preventing server startup
- **TypeScript Errors**: Fixed null value handling in ProjectsTable component 
- **DOM Validation**: Resolved nested anchor tag warning by updating Link component usage
- **Modal Integration**: Connected KDPProjectModal to dashboard for consistent project creation
- **Navigation**: Fixed "Create your first project" button to properly redirect to projects page
- **Duplicate Variable Error**: Fixed duplicate `isPremiumUser` declaration in ai-assistant.tsx
- **Modal Simplification**: Removed multi-tab structure from KDP project modal, consolidated into single form as requested
- **Project Management Overhaul**: Replaced modal-based project creation/editing with dedicated pages for better UX
- **Page Structure**: Created project-create.tsx and project-edit.tsx pages with proper layouts and form handling
- **Navigation Update**: Updated all project-related navigation to use dedicated pages instead of modals
- **Book Edit Interface**: Complete reconstruction of book editing page to match KDP interface exactly
- **Header Spacing**: Fixed header overlap issue in book edit page with proper top padding
- **Save Buttons Implementation**: Added fully functional "Save as Draft" and "Save and Continue" buttons with tab navigation
- **Form Validation**: Resolved TypeScript validation issues that were preventing button functionality

### New AI Configuration System (Latest Update)
- **Complete Admin Interface**: Built comprehensive AI configuration management system
- **Database Schema Enhancement**: Added tables for AI prompt templates, models, and usage limits
- **Backend API**: Created admin-only routes for managing AI configuration settings
- **Frontend Interface**: Developed multi-tab admin page with stats overview and management forms
- **Navigation Integration**: Added AI Configuration link to admin sidebar section
- **Routing**: Integrated AI config page into main application routing system
- **Mock Data**: Implemented initial data structure for immediate testing and development

### Advanced AI Functions System (29 Juillet 2025 - Final Update)
- **Configurable AI Functions**: Complete system allowing configuration of each AI feature individually
- **Database Variable System**: Variables automatically extracted from database fields (books, projects, users)
- **Dynamic Field Injection**: Real-time replacement of {field_name} with actual database values
- **Model Selection**: Each function can use different AI models (GPT-4o, GPT-4o-mini, etc.)
- **Custom Prompts**: System and user prompts are fully configurable per function
- **Context-Aware Generation**: Select specific books/projects to populate variables automatically
- **AI Functions Page**: New user interface with context selection and variable preview
- **Backend Services**: AIConfigService + DatabaseFieldsService for field extraction and replacement
- **Real Field Mapping**: Title, language, genre, author, price, etc. automatically injected
- **Preview System**: Shows available variables and their current values before generation
- **Cost Tracking**: Automatic calculation of generation costs based on token usage

### Book Creation and Project Integration Fixes (29 Juillet 2025)
- **Book-Project Linking**: Fixed critical issue where books were created without proper project association
- **URL Parameter Extraction**: Corrected projectId extraction from URL parameters using window.location.search
- **Form Pre-selection**: Books created via "Add Book" button now properly pre-select the parent project
- **Project Selection Field**: Added mandatory project selection dropdown in book creation form
- **Validation Enhancement**: Added projectId validation to prevent books from being orphaned
- **Alphabetical Sorting**: Added A-Z and Z-A sorting options to Projects page with null-safe comparison
- **Data Integrity**: Books now properly appear in their associated project cards on Projects page

### Complete Project Duplication System (29 Juillet 2025 - Latest)
- **Full Project Duplication**: Complete system for duplicating projects with all associated books and contributors
- **Intelligent Naming**: Smart suffix system (" (copy)", " (copy 2)", " (copy 3)", etc.) with conflict detection
- **Book Duplication**: All books are duplicated with appropriate naming and linked to the new project
- **Individual Book Duplication**: Added book-level duplication from project cards with dropdown menus
- **Contributors Duplication**: Contributors are copied for each duplicated book maintaining roles
- **Delete Functionality**: Implemented project deletion with confirmation dialog and proper cleanup
- **Book Delete Functionality**: Added complete book deletion system with confirmation dialog on Books page
- **Enhanced getProject Function**: Fixed function to load all books and calculate revenue statistics
- **Real-time Updates**: Proper cache invalidation ensures UI updates immediately after operations
- **Error Handling**: Comprehensive error handling with user-friendly toast notifications
- **Future-Proof Design**: Duplication system automatically handles new database fields and UI elements

### Custom Dialog System Implementation (29 Juillet 2025)
- **Native Popup Replacement**: Replaced all native browser confirm() popups with custom AlertDialog components
- **Consistent UI Experience**: All confirmation dialogs now use shadcn/ui AlertDialog for consistency
- **Projects Page**: Replaced native confirm for project deletion with custom dialog
- **Book Edit Page**: Replaced native confirm for book deletion with custom dialog
- **User Preference Compliance**: Implemented user's preferred dialog style across entire application
- **Maintained Original Text**: Preserved all existing confirmation messages while upgrading UI components

### Enhanced Books Page Data Display (29 Juillet 2025)
- **Language Display**: Added language information with Globe icon to match Projects page format
- **Comprehensive Revenue Statistics**: Added detailed revenue breakdown similar to Projects page
- **Monthly Revenue Section**: Shows current month revenue and sales count with TrendingUp icon
- **Total Revenue Section**: Shows total revenue and sales count with DollarSign icon
- **Visual Consistency**: Matched the exact styling and layout from Projects page book cards
- **Data Parity**: Books page now displays all the same information as Projects page book cards

### Complete Sort Options Synchronization (29 Juillet 2025)
- **Books Page Enhanced**: Added missing sort options (Last Modified, Most Profitable This Month, Highest Total Revenue)
- **Projects Page Enhanced**: Added missing sort options (Oldest First, Status A-Z, Status Z-A)
- **Unified Sort Logic**: Both pages now support identical sorting by title, date, status, modification time, and revenue
- **Consistent Terminology**: Standardized option labels across both pages for better user experience
- **Full Feature Parity**: Projects and Books pages now have complete consistency in both data display and sorting capabilities

### Mobile Navigation Implementation (29 Juillet 2025)
- **Mobile-First Design**: Implemented responsive navigation following modern mobile UX patterns
- **Burger Menu**: Added hamburger menu button in header visible only on mobile devices
- **Slide-out Drawer**: Created MobileSidebar component using Sheet/Drawer pattern for smooth mobile navigation 
- **Touch-Friendly Interface**: All navigation items optimized for touch interaction on mobile screens
- **Automatic Close**: Navigation drawer closes automatically when user selects a menu item
- **Complete Feature Parity**: Mobile navigation includes all desktop features (main nav, admin section, account section)
- **Modern UI Standards**: Follows mobile navigation best practices with overlay, animations, and accessibility
- **Layout Architecture Fix**: Converted all pages from direct Header/Sidebar imports to unified Layout component
- **Scrollable Menu**: Added overflow-y-auto to mobile navigation for long menu lists
- **Consistent Experience**: Mobile navigation now works consistently across all authenticated pages
- **Systematic Page Conversion**: Converted dashboard, projects, analytics, ai-assistant, settings, subscription, admin pages to use Layout component
- **Mobile Navigation Status**: Fully functional on main application pages with hamburger menu and slide-out drawer
- **Responsive Design**: Mobile-first approach with touch-friendly interface and automatic menu closure

### Bug Fixes - Navigation and Admin Menu (29 Juillet 2025)
- **Admin Menu Consistency**: Fixed inconsistencies between desktop and mobile admin navigation menus
- **Route Correction**: Corrected mobile sidebar admin dashboard route from `/admin/dashboard` to `/admin` 
- **Menu Synchronization**: Added missing "User Management" link to desktop sidebar to match mobile version
- **Icon Consistency**: Standardized admin menu icons between desktop and mobile sidebars
- **Navigation Parity**: Both desktop and mobile admin menus now have identical functionality and routing

### Current Features Available
- **Complete Dashboard**: KPI cards, sales charts, format distribution, recent projects table
- **Project Management**: Complete KDP project creation and editing system with dedicated pages
- **Projects Page**: Grid view of all projects with search, filtering, and management actions
  - Complete project duplication with all books and contributors
  - Project deletion with confirmation dialog
  - Intelligent naming with conflict resolution
- **Book Editing Interface**: Complete 3-tab KDP-style interface (Paperback Details, Content, Rights & Pricing)
  - Save as Draft functionality for all tabs
  - Save and Continue with automatic tab progression
  - Complete form pre-population from database
  - Edit buttons integrated in project cards
- **AI Assistant**: Content generation with various types (structure, descriptions, marketing)
- **AI Configuration System**: Complete admin interface for managing AI prompts, models, and usage limits
  - Prompt template management with system prompts and user prompt templates
  - AI model configuration with pricing and availability controls
  - Usage limits by subscription tier (tokens, requests, model access)
  - Real-time AI usage statistics and cost tracking
  - Enhanced AI generation API with configurable models and parameters
- **AI Functions Interface**: User-facing interface for configured AI functions
  - Dynamic form generation based on function variables
  - Real-time variable injection into prompts
  - Custom model and prompt override capabilities
  - Multi-tab interface (Configuration, Advanced Settings, Results)
  - Copy to clipboard and content management features
- **Analytics**: Sales analytics page (basic structure in place)
- **KDP Reports**: File upload and parsing functionality
- **Authentication**: Replit OIDC integration with session management
- **Database**: PostgreSQL with Drizzle ORM for all project and user data
- **SEO Implementation**: Complete SEO setup for public pages with meta tags, Open Graph, and Twitter Cards

### Technical Architecture Status
- **Frontend**: React/TypeScript with shadcn/ui components fully functional
- **Backend**: Express.js API with authentication middleware working correctly  
- **Database Schema**: Complete with users, projects, contributors, sales data, AI generations
- **File Processing**: KDP report parsing with XLSX support
- **Real-time Updates**: Hot module replacement and live data updates working
- **SEO**: Dynamic meta tag management for public pages, optimized landing page and 404 page

### SEO Implementation Details
- **SEOHead Component**: Dynamic meta tag management with support for title, description, keywords, Open Graph, and Twitter Cards
- **Public Pages Optimized**: Landing page with comprehensive SEO meta tags and structured content
- **404 Page**: SEO-optimized with noIndex directive and proper user experience
- **Meta Tag Strategy**: Public pages have full SEO optimization, private/authenticated pages excluded as requested
- **Structured Content**: Landing page features proper heading hierarchy and semantic HTML for better search visibility