# Frontend Conventions

## Next.js & React

- Use the Next.js App Router.
- Write components as functional components using TypeScript (`.tsx`).
- Utilize React Hooks for state and side effects.
- Define component props clearly using TypeScript interfaces or types.
- Prefer named exports for components unless there's a specific reason for default exports.

## TypeScript

- Enable strict mode in `tsconfig.json`.
- Use explicit types wherever possible; avoid `any`.
- Define shared types (e.g., API response structures) in a dedicated `types/` directory or within relevant modules.

## Tailwind CSS

- Strictly adhere to the utility-first approach.
- Define custom theme values (colors, spacing) in `tailwind.config.ts` if needed, rather than arbitrary values in class names.
- Use descriptive class names only when abstracting components with `@apply` (use sparingly).
- Ensure responsiveness using Tailwind's breakpoint prefixes (`sm:`, `md:`, `lg:`).

## Zustand

- Define stores in `src/lib/store/` (or similar location).
- Structure stores with clearly defined state slices and actions.
- Use Immer middleware for easier immutable updates if needed.
- Keep stores focused on specific domains of state (e.g., sources, task).

## Component Structure

- [Define project's preferred component structure, e.g., colocated files, atomic design principles if used]
- Name component files using PascalCase (`MyComponent.tsx`).

## API Interaction

- Centralize API calling logic in `src/lib/apiClient.ts` or similar.
- Handle loading states, success states, and error states explicitly in UI components that trigger API calls.
- Use hooks (e.g., in `src/hooks/`) for encapsulating data fetching and state management logic (like polling).
