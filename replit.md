# Overview

This is an AI-powered shift planning system for production facilities. The application automatically generates daily shift schedules for production areas (preparation rooms and filling rooms) while managing employee assignments, production dependencies, working time models, and skill requirements. The system aims to maximize efficiency in completing daily production requirements while ensuring compliance with operational and legal constraints.

The application is built as a full-stack web application with a React frontend and Express backend, designed to handle real-world employee constraints and production scheduling complexities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: Component-based architecture with consistent design tokens

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handling
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod for runtime type checking and validation
- **Development**: Hot module replacement with Vite integration

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple

## Core Data Models
- **Employees**: Skills, working time models, availability windows
- **Production Areas**: Preparation rooms and filling rooms with time constraints
- **Process Steps**: Required skills, time calculations, employee requirements
- **Production Orders**: Product information, quantities, priorities, scheduling
- **Shift Assignments**: Employee-to-task mappings with time slots
- **Production Alerts**: System notifications and warnings

## Scheduling Engine
- **Algorithm**: Custom scheduling logic respecting production dependencies
- **Constraints**: Employee working hours, skill matching, legal requirements
- **Optimization**: Quantity-based sorting with dependency management
- **Time Management**: Backward scheduling from fixed end times (filling room)

## Authentication & Authorization
- **Session Management**: Express sessions with PostgreSQL storage
- **State Persistence**: Cookie-based session management
- **Security**: CSRF protection and secure session configuration

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pool**: @neondatabase/serverless for optimized connections

## UI & Design Libraries
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

## Development Tools
- **Vite**: Fast build tool with HMR support
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Integration**: Development environment optimizations

## Data Management
- **TanStack Query**: Server state management and caching
- **Date-fns**: Date manipulation and formatting
- **Zod**: Runtime schema validation
- **React Hook Form**: Form state management and validation

## Production Dependencies
- **Express Middleware**: CORS, body parsing, static file serving
- **Session Management**: Express sessions with PostgreSQL storage
- **Error Handling**: Structured error responses and logging