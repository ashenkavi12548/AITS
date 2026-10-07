# Frontend Code Size Rules

1. Do not create huge files. Keep each file focused and manageable.
2. If a file becomes too large, split it into smaller components, hooks, utilities, or services.
3. Keep page/screen files mainly for layout and component composition.
4. Move API calls into separate service/API files.
5. Move complex state and business logic into custom hooks.
6. Move reusable UI sections into separate components.
7. Move repeated constants, types, and validation into separate files.
8. Do not duplicate code. Reuse existing components, functions, hooks, and utilities.
9. Avoid very large functions and JSX blocks. Break complex sections into smaller parts.
10. Before adding code, check whether an existing component or function can be reused.
11. Do not create unnecessary abstractions just to reduce line count. Keep the code simple and readable.
12. If a file becomes difficult to understand or maintain, split it instead of continuing to add code.

Goal: Keep frontend files small, readable, modular, reusable, and easy to maintain.
