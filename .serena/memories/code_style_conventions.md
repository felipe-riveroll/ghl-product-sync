# Code Style and Conventions

## TypeScript Configuration
- Strict TypeScript enabled
- ESNext target
- React JSX support

## Naming Conventions
- **Components**: PascalCase (e.g., `ProductTable`, `Index`)
- **Files**: PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

## Code Organization
- Components in `src/components/`
- Pages in `src/pages/`
- Types in `src/types/`
- Services in `src/services/`
- UI components in `src/components/ui/`

## React Patterns
- Functional components with hooks
- TypeScript interfaces for props and data
- React.FC type annotation for components
- useRef for DOM manipulation
- Custom hooks pattern followed

## Styling
- Tailwind CSS for styling
- shadcn/ui component library
- CSS classes follow Tailwind conventions
- Responsive design patterns (md:, lg: breakpoints)

## Error Handling
- Try-catch blocks for async operations
- Toast notifications for user feedback
- Graceful error states with appropriate messaging
- API response validation

## State Management
- Local state with useState
- No external state management library
- Props passed down component tree
- Effect hooks for side effects