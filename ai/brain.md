# Project Brain: ShipKit

## Environment Setup

- Next.js App Router project with TypeScript
- Using PNPM as package manager
  - `pnpm db:generate`
  - `pnpm db:push`
- Multiple authentication providers (Discord, GitHub, Google)
- Integration with various services (OpenAI, Anthropic, Google AI, LemonSqueezy, Builder.io)
- PostgreSQL database with Neon.tech hosting
- Resend for email services
- Payload CMS integration
- Vitest for testing

## Project Structure

- Modern Next.js 15 App Router architecture
- Well-organized src directory:
  - app/ - Next.js App Router pages and routes
  - components/ - Reusable UI components
  - lib/ - Utility functions and shared code
  - server/ - Server-side code and API routes
  - config/ - Configuration files
  - hooks/ - Custom React hooks
  - types/ - TypeScript type definitions
  - collections/ - Payload CMS collections
  - workers/ - Background workers
  - trpc/ - tRPC API setup

## Key Routes

- (app)/ - Main application routes
- (integrations)/ - Third-party integrations
- (lemon-squeezy)/ - Payment integration
- (payload)/ - CMS routes
- (google-docs)/ - Google Docs integration
- docs/ - Documentation pages

## Authentication

- Using NextAuth/AuthJS v5
- Multiple OAuth providers configured
- Custom authentication secret and URL configuration

## Key Services

1. AI Integration
   - Multiple AI providers (OpenAI, Anthropic, Google)
   - API keys configured for each service

2. Payment Processing
   - LemonSqueezy integration
   - Test and production API keys available

3. CMS
   - Payload CMS integration
   - Can be disabled via DISABLE_PAYLOAD flag

4. Email
   - Resend integration for email services
   - Configured with API key and audience ID

## Development Guidelines

- Server components should not be nested in client components
- Environment variables should be preserved
- Comments explain "why" behind code decisions
- TypeScript strict mode enforced
- Use hyphen-case for file names
- Server actions in @/server/actions
- Server services in @/server/services

## Security

- Sensitive keys and tokens properly configured in environment
- Database credentials properly secured
- OAuth secrets appropriately managed

## Testing

- Vitest configured for both browser and node environments
- Test directory structure in place
- Example tests provided in vitest-example/
