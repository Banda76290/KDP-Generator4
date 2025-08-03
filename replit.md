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

### Key Components
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, shadcn/ui for UI components, Tailwind CSS for styling, React Hook Form with Zod validation.
- **Backend**: Express.js with TypeScript, Drizzle ORM, Passport.js for authentication, Express sessions, Multer for file uploads, Zod for shared validation schemas.
- **Database Schema**: Main entities include Users, Projects, Contributors, Sales Data, AI Generations, and Sessions.

### UI/UX Decisions
- **Brand Colors**: Uses Primary Blue (`#38b6ff`), Secondary Orange (`#ff9900`), and Accent Blue (`#146eb4`) consistently across UI elements. These are defined as CSS custom properties and utility classes.
- **Consistent UI**: Replaces native browser popups with custom `AlertDialog` components for a consistent look.
- **Layout System**: Implements a universal CSS Grid layout for consistent header positioning, responsiveness, and seamless integration of new pages.
- **Mobile Navigation**: Features a responsive design with a hamburger menu and slide-out drawer for mobile devices, ensuring full feature parity with desktop navigation.

### Feature Specifications
- **Project Management**: Comprehensive creation, editing, duplication, and deletion of KDP projects, including intelligent naming and association with books and contributors.
- **Book Editing Interface**: KDP-style 3-tab interface (Paperback Details, Content, Rights & Pricing) with save functionalities, form pre-population, and integration with project cards.
- **Series Management**: Complete setup and management with advanced WYSIWYG editor supporting rich text and multiple languages, including series creation, editing, and deletion.
- **AI Assistant**: AI-powered content generation with hybrid database-driven and static function system. Admin interface for managing prompts that automatically integrate with AI Functions page. Database templates take priority over static functions with automatic fallback.
- **Sales Data Import**: Functionality to upload and parse KDP reports (Excel/CSV) for data extraction, normalization, and analytics.
- **ISBN System**: Auto-generation of unique ISBN placeholders, real-time uniqueness validation, and integration with book and project duplication.
- **Dynamic Category Loading**: Database-driven, multi-marketplace category hierarchies with dynamic loading based on marketplace selection and hierarchical structure.
- **Form Data Persistence**: Automatic real-time form data persistence to `sessionStorage` for all form fields, ensuring data integrity across navigation changes.
- **Author Integration System**: Complete integration of authors into book creation/editing workflow with dropdown selection, auto-detection of existing author data, and "Create Author" button functionality. Clean interface without redundant options or detailed author display sections.
- **Book Title Navigation**: Clickable book titles in both Books page cards and Project page book cards that navigate directly to book editing interface with consistent blue hover effect (`hover:!text-blue-600`).
- **Database Seeding System**: Manual-only seeding system with 249 marketplace categories across 6 Amazon regions, controlled exclusively through Admin System page with API endpoints for secure admin management.
- **Admin System Management**: Comprehensive system administration interface with real-time monitoring, database health checks, memory usage tracking, cache management, and operational controls for database synchronization and system optimization.
- **Persistent Logging System**: Server-side log collection with real-time display, intelligent user interaction detection, pause/resume controls, scroll management, and permanent log clearing functionality with optimized performance.
- **Development-to-Production Sync**: Comprehensive synchronization system with multiple export options (direct sync, SQL copy-paste, SQL file download, JSON export) for transferring marketplace categories from development to production environments with detailed logging and error handling. Manual "Copier SQL" method confirmed working as reliable alternative when direct sync fails due to CORS/authentication issues.
- **AI Prompt Integration System**: Complete integration between AI prompt administration and execution systems. Database-configured prompts automatically appear in AI Functions interface and are used for content generation. Hybrid system combines database templates with static fallback functions, with database templates taking priority.
- **Security Enhancements**: XSS vulnerability patched in author biography editor (August 2025). Replaced unsafe innerHTML assignment with DOMParser for secure HTML sanitization without script execution risk.
- **Expert Analytics Method**: Implemented advanced KDP revenue analysis using detailed sheet extraction method (August 2025). New system extracts data from eBook Royalty + Paperback Royalty + Hardcover Royalty sheets only, excluding Combined Sales duplicates. Preserves original currency amounts and converts to EUR using official BCE exchange rates. Results validated against external expert analysis showing ~9,757 EUR total vs previous incorrect ~3,042 calculations.
- **Deployment Fix (August 2025)**: Resolved critical deployment issues including React Refresh preamble errors, port configuration conflicts, and static file serving. Created automated deployment preparation scripts and fixed server configuration to ensure successful Replit deployments on port 5000.

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