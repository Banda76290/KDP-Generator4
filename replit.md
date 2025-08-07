# KDP Generator - Author Publishing Management Platform

## Overview
KDP Generator is a comprehensive web application designed to help authors manage their publishing projects, particularly for Amazon KDP (Kindle Direct Publishing). The platform combines project management, sales analytics, AI-powered content generation, and data import capabilities to provide a complete publishing workflow solution.

## User Preferences
- **Communication Style**: Simple, everyday language
- **Development Priority**: ALWAYS respect CSS standards and UI/UX guidelines before implementing any new feature
- **Quality Standard**: All UI components must follow the established design system without exception

## System Architecture

### Full-Stack Architecture
The application follows a modern full-stack architecture with clear separation between client and server:
- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (OIDC) with Replit integration
- **Styling**: Tailwind CSS with shadcn/ui component library

### Key Components
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, shadcn/ui for UI components, Tailwind CSS for styling, React Hook Form with Zod validation.
- **Backend**: Express.js with TypeScript, Drizzle ORM, Passport.js for authentication, Express sessions, Multer for file uploads, Zod for shared validation schemas.
- **Database Schema**: Main entities include Users, Projects, Contributors, Sales Data, AI Generations, and Sessions.

### UI/UX Standards & Guidelines

#### Brand Colors & Theme
- **Primary Blue**: `#38b6ff` (hsl(206, 100%, 61%)) - Main brand color for primary actions, links, accents
- **Secondary Orange**: `#ff9900` (hsl(36, 100%, 50%)) - Secondary actions, highlights, warnings
- **Accent Blue**: `#146eb4` (hsl(208, 77%, 39%)) - Darker blue for hover states and emphasis
- **Success Green**: `hsl(120, 100%, 27%)` - Success states, completed actions
- **Error Red**: `hsl(0, 84%, 60%)` - Error states, destructive actions
- **Warning Yellow**: `hsl(45, 100%, 51%)` - Warning states, caution indicators

#### Mandatory CSS Standards
1. **Toast Notifications**:
   - Success toasts: MUST use `variant: "success"` with green theme
   - Error toasts: MUST use `variant: "destructive"` with red theme
   - Info toasts: MUST use `variant: "default"` with blue theme
   - All toasts: Consistent positioning, auto-dismiss timing, and animation

2. **Interactive Elements**:
   - Buttons: Primary blue background, hover states with accent blue
   - Links: Blue text with `hover:!text-blue-600` for consistency
   - Form elements: Consistent border radius, focus states, validation styling

3. **Layout & Spacing**:
   - Universal CSS Grid layout for all pages
   - Consistent container widths: `max-w-6xl mx-auto`
   - Standard padding: `p-6` for containers, `p-4` for cards
   - Responsive breakpoints: Mobile-first approach

4. **Component Standards**:
   - Replace ALL native browser popups with custom `AlertDialog` components
   - Consistent card styling: `bg-white dark:bg-gray-800 border rounded-lg shadow-sm`
   - Status badges: Color-coded with consistent styling patterns
   - Loading states: Skeleton components or spinners with consistent theming

5. **Typography & Accessibility**:
   - Consistent heading hierarchy: `text-3xl font-bold` for h1, `text-xl font-semibold` for h2
   - Readable text colors: `text-gray-900 dark:text-white` for primary text
   - Sufficient contrast ratios for all text/background combinations
   - Proper focus indicators for keyboard navigation

6. **Dark Mode Compliance**:
   - ALL components MUST support dark mode with explicit variants
   - Use CSS variables for colors that change between themes
   - Test both light and dark modes for every new feature

#### Implementation Requirements
- Before creating ANY new component or page, reference these standards
- All UI elements must be responsive and work on mobile devices
- Consistent spacing, colors, and typography across the entire application
- No hardcoded colors - use CSS custom properties and Tailwind classes

### Feature Specifications
- **Project Management**: Comprehensive creation, editing, duplication, and deletion of KDP projects, including intelligent naming and association with books and contributors.
- **Book Editing Interface**: KDP-style 3-tab interface (Paperback Details, Content, Rights & Pricing) with save functionalities, form pre-population, and integration with project cards.
- **Series Management**: Complete setup and management with advanced WYSIWYG editor supporting rich text and multiple languages, including series creation, editing, and deletion.
- **AI Assistant**: AI-powered content generation with hybrid database-driven and static function system. Admin interface for managing prompts that automatically integrate with AI Functions page. Database templates take priority over static functions with automatic fallback.
- **Sales Data Import**: Functionality to upload and parse KDP reports (Excel/CSV) for data extraction, normalization, and analytics.
- **ISBN System**: Auto-generation of unique ISBN placeholders, real-time uniqueness validation, and integration with book and project duplication.
- **Dynamic Category Loading**: Database-driven, multi-marketplace category hierarchies with dynamic loading based on marketplace selection and hierarchical structure. Categories require specific discriminants (kindle_ebook/print_kdp_paperback) for proper format filtering. Fixed API integration issues in August 2025.
- **Form Data Persistence**: Automatic real-time form data persistence to `sessionStorage` for all form fields, ensuring data integrity across navigation changes.
- **Author Integration System**: Complete integration of authors into book creation/editing workflow with dropdown selection, auto-detection of existing author data, and "Create Author" button functionality. Clean interface without redundant options or detailed author display sections.
- **Book Title Navigation**: Clickable book titles in both Books page cards and Project page book cards that navigate directly to book editing interface with consistent blue hover effect (`hover:!text-blue-600`).
- **Database Seeding System**: Manual-only seeding system with 249 marketplace categories across 6 Amazon regions, controlled exclusively through Admin System page with API endpoints for secure admin management.
- **Admin System Management**: Comprehensive system administration interface with real-time monitoring, database health checks, memory usage tracking, cache management, and operational controls for database synchronization and system optimization.
- **Persistent Logging System**: Server-side log collection with real-time display, intelligent user interaction detection, pause/resume controls, scroll management, and permanent log clearing functionality with optimized performance.
- **Advanced Cron Management System**: Complete French interface with granular time controls (months, days, hours, minutes, seconds), precise decimal interval calculations, real-time status monitoring, and controlled currency update triggers. Database schema supports decimal intervals for fractional hour scheduling. Updated August 2025.
- **Data Consolidation System**: Advanced sales data consolidation engine that eliminates duplication by aggregating KDP payments data by currency/marketplace. Features dedicated `consolidated_sales_data` table with automatic USD conversion using real-time exchange rates, comprehensive comparison interface showing before/after analytics, and intelligent deduplication logic. Processes payment files exclusively to ensure data integrity. Implemented August 2025.
- **Development-to-Production Sync**: Comprehensive synchronization system with multiple export options (direct sync, SQL copy-paste, SQL file download, JSON export) for transferring marketplace categories from development to production environments with detailed logging and error handling. Manual "Copier SQL" method confirmed working as reliable alternative when direct sync fails due to CORS/authentication issues.
- **AI Prompt Integration System**: Complete integration between AI prompt administration and execution systems. Database-configured prompts automatically appear in AI Functions interface and are used for content generation. Hybrid system combines database templates with static fallback functions, with database templates taking priority.
- **Security Enhancements**: XSS vulnerability patched in author biography editor (August 2025). Replaced unsafe innerHTML assignment with DOMParser for secure HTML sanitization without script execution risk.

## External Dependencies

### Third-Party Services
- **OpenAI API**: For AI-powered content generation.
- **Replit Authentication**: OIDC provider for user authentication.
- **Neon Database**: PostgreSQL hosting with automatic seeding system.
- **Stripe**: Payment processing and subscription management.

### Production Deployment
- **Database Seeding**: Automatic initialization with 249 marketplace categories from `complete-categories.sql` on first startup.
- **Replit Deployments**: Configured for autoscale deployment with build/run commands optimized for database seeding.

### Key Libraries
- **Frontend**: React, TanStack Query, React Hook Form, Recharts, Radix UI.
- **Backend**: Express, Drizzle ORM, Passport.js, Multer, OpenAI SDK.
- **Shared**: Zod for schema validation.
- **File Processing**: XLSX for Excel file parsing.