# Triv

A modern crypto trading interface built with React 19, Vite, and Supabase. Features real-time market data, advanced charting, and a premium UI/UX.

## Tech Stack

- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Vanilla CSS
- **Animations:** Motion (Framer Motion)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Backend:** Supabase
- **Charts:** Lightweight Charts (TradingView)

## Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials.
4. Start development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `/src/components`: Reusable UI elements
- `/src/views`: Main page layouts and logic
- `/src/stores`: Zustand state definitions
- `/src/hooks`: Custom React hooks
- `/src/utils`: Helper functions and formatters
- `/supabase`: Database migrations and configuration

## Scripts

- `npm run dev`: Start dev server at port 3000
- `npm run build`: Build for production
- `npm run lint`: Typecheck the project
- `npm run clean`: Remove build artifacts
