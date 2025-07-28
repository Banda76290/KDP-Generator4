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

## Recent Changes (28 Juillet 2025)

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

### Current Features Available
- **Complete Dashboard**: KPI cards, sales charts, format distribution, recent projects table
- **Project Management**: Complete KDP project creation and editing system with dedicated pages
- **Projects Page**: Grid view of all projects with search, filtering, and management actions
- **AI Assistant**: Content generation with various types (structure, descriptions, marketing)
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