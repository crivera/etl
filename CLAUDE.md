# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Use PNPM as the package manager (avoid Bun due to compatibility issues):

- `pnpm run dev` - Start development server with Turbo
- `pnpm run build` - Build the application
- `pnpm run lint` - Run ESLint
- `pnpm run test` - Run tests with Vitest
- `pnpm run test:migrate` - Run database migrations for test environment

Database commands:
- `pnpm run db:generate` - Generate Drizzle migrations
- `pnpm run db:migrate` - Run Drizzle migrations
- `pnpm run db:push` - Push schema changes to database
- `pnpm run db:studio` - Open Drizzle Studio

## Architecture Overview

This is a document ETL (Extract, Transform, Load) application built with Next.js 15 and React 19. The system processes documents (PDF, DOCX, XLSX) using AI-powered extraction and template generation.

### Core Components

**Database Layer (Drizzle + PostgreSQL)**
- Schema: `src/server/db/schema.ts` - Defines all database tables with `etl_` prefix
- Stores: `src/server/db/*-store.ts` - Database operations for each entity
- Uses `@paralleldrive/cuid2` for ID generation

**Authentication & Authorization**
- Supabase Auth with custom user management
- Role-based access (USER, ADMIN, SYSTEM)
- System authentication via `SYSTEM_KEY` for internal operations
- Middleware at `src/middleware.ts` handles session updates

**Server Actions (ZSA)**
- `src/server/routes/safe-action.ts` - Custom action clients with error handling
- `authClient` - Requires authenticated user
- `systemClient` - Requires system key
- Actions in `src/server/routes/*-action.ts`

**AI Integration**
- `src/server/ai/extract.ts` - Gemini AI for data extraction
- `src/server/ai/ocr.ts` - OCR processing
- API routes: `/api/v1/extract` and `/api/v1/ocr`

**Data Models**
- Documents: File/folder hierarchy with extraction capabilities
- Collections: Grouped documents with shared extraction fields
- Templates: Reusable extraction configurations
- Field Groups: Predefined extraction field sets
- Extracted Data: AI-processed document data

### Key Features

1. **Document Processing**: Upload documents, extract text via OCR, apply AI extraction
2. **Template System**: Create reusable extraction templates for different document types
3. **Collections**: Organize documents with consistent extraction schemas
4. **Field Types**: Support for text, number, date, currency, email, phone, address, checkbox
5. **Real-time Updates**: Document processing status updates via Supabase realtime

### Testing

- Tests located in `src/server/db/__tests__/`
- Uses Vitest with Node environment
- Test environment requires `.env.test` file
- Database migrations run separately for tests

### Environment Variables

Required environment variables (see `src/env.ts`):
- `DATABASE_URL` - PostgreSQL connection string
- `SYSTEM_KEY` - Internal system authentication
- `GEMINI_API_KEY` - Google AI API key
- `MISTRAL_API_KEY` - Mistral AI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### Code Conventions

- Uses TypeScript with strict mode
- Prettier config: single quotes, no semicolons, trailing commas
- Import paths use `@/*` alias for `src/*`
- Database tables prefixed with `etl_`
- Component structure follows Next.js App Router patterns
- UI components use Shadcn/ui with Tailwind CSS