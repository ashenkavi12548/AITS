# AITS FRONTEND DEVELOPMENT BEST PRACTICES

Follow these frontend development practices for all AITS frontend work:

1. Keep files manageable.
   - Do not create huge files with hundreds or thousands of lines.
   - Split large components into smaller, focused components.
   - Keep each file responsible for one clear purpose.
   - Extract reusable UI, forms, tables, dialogs, hooks, utilities, and API logic into separate files when appropriate.

2. Avoid unnecessary duplication.
   - Reuse existing components, hooks, types, utilities, API services, validation schemas, and shared logic.
   - Do not create multiple implementations of the same functionality.

3. Keep components focused.
   - A component should have a clear responsibility.
   - Avoid putting UI rendering, API calls, business logic, validation, state management, and complex data transformation into one massive component.
   - Extract complex logic into custom hooks or service functions when appropriate.

4. Keep API logic separate from UI.
   - Do not place large API request implementations directly inside page components.
   - Use the existing AITS API/service layer.
   - Reuse existing API functions instead of creating duplicate endpoints or request logic.

5. Use strong TypeScript.
   - Do not use `any`.
   - Do not use `as any`.
   - Do not suppress TypeScript or ESLint errors.
   - Define proper interfaces/types for API responses, form data, component props, and application state.
   - Reuse existing types where possible.

6. Keep validation consistent.
   - Reuse existing validation schemas and rules.
   - Do not implement different validation rules for the same data in different pages.
   - Frontend validation must complement, not replace, backend validation.

7. Keep state management clean.
   - Do not create unnecessary global state.
   - Keep local state local when possible.
   - Reuse the existing Zustand/TanStack Query architecture.
   - Avoid duplicated copies of the same server state.

8. Use TanStack Query correctly.
   - Reuse existing query keys.
   - Invalidate or update the correct queries after mutations.
   - Avoid unnecessary refetching.
   - Do not create duplicate queries for the same data.

9. Reuse existing UI components.
   - Search the project before creating a new component.
   - Reuse existing dialogs, modals, buttons, inputs, tables, cards, dropdowns, toasts, loading states, and error states.
   - Do not create duplicate UI systems.

10. Keep pages lightweight.
    - Page components should primarily compose sections/components.
    - Move complex sections into separate components.
    - Move reusable logic into hooks/services/utilities.

11. Use clear folder structure.
    - Group related components, hooks, services, types, and utilities logically.
    - Keep feature-specific code close to the feature.
    - Avoid dumping unrelated components into generic folders.

12. Use reusable components only when appropriate.
    - Do not over-engineer simple one-use components.
    - Extract components when they improve readability, reuse, maintainability, or testing.

13. Avoid deeply nested components.
    - Keep component structure understandable.
    - Extract repeated or complex sections instead of creating extremely large JSX trees.

14. Avoid unnecessary prop drilling.
    - Use appropriate composition, context, Zustand, or existing state-management patterns when necessary.
    - Do not introduce global state just to avoid a small amount of prop passing.

15. Keep business logic out of presentation where possible.
    - UI components should not contain large amounts of domain/business logic.
    - Move complex business rules into appropriate hooks/services/domain utilities.
    - Keep business rules consistent across the application.

16. Handle loading, empty, and error states.
    - Every API-driven UI should properly handle:
      - Loading
      - Empty data
      - Error
      - Success
    - Do not leave blank screens or broken UI states.

17. Use user-friendly errors.
    - Do not expose raw backend, Prisma, Axios, or database errors to users.
    - Convert technical errors into meaningful UI messages.
    - Keep detailed technical errors in appropriate developer logs when necessary.

18. Keep permissions consistent.
    - Use the existing AITS RBAC/permission system.
    - Do not create separate frontend permission systems.
    - Frontend permission checks are for UI visibility only; backend authorization remains authoritative.

19. Keep forms reusable and consistent.
    - Reuse the same form for create/edit workflows where appropriate.
    - Do not duplicate the same form with slightly different implementations.
    - Keep form validation and submission logic consistent.

20. Avoid hardcoded application data.
    - Do not hardcode API data, animal records, farm records, user information, permissions, or status values when they should come from the backend.
    - Use existing enums/types/configuration where appropriate.

21. Use constants for repeated values.
    - Avoid repeating the same strings, configuration values, routes, or magic numbers throughout the code.
    - Use existing constants or create focused constants when necessary.

22. Keep date and time handling consistent.
    - Reuse the project's existing date/time utilities.
    - Do not implement different date formats or timezone handling in different features.

23. Keep responsive design in mind.
    - All new UI should work across desktop, tablet, and mobile layouts.
    - Follow the existing AITS responsive design system.

24. Maintain accessibility.
    - Use semantic HTML.
    - Provide labels for form controls.
    - Ensure keyboard accessibility.
    - Use accessible dialogs and buttons.
    - Do not rely only on color to communicate information.

25. Avoid unnecessary dependencies.
    - Check whether the project already provides a solution before installing a new package.
    - Do not introduce a library for functionality that can be handled cleanly with existing dependencies.

26. Remove dead code.
    - Remove unused imports.
    - Remove unused variables.
    - Remove unreachable code.
    - Remove obsolete components and hooks.
    - Remove unused API functions and types.
    - Remove unused files only after verifying they are not referenced anywhere.

27. Do not leave temporary code.
    - Remove debug `console.log()` statements when they are no longer needed.
    - Do not leave temporary mock data, test buttons, placeholder components, or commented-out implementations.

28. Keep code readable.
    - Prefer clear and descriptive names.
    - Avoid overly complex one-line expressions.
    - Avoid deeply nested conditional logic.
    - Break complex logic into understandable functions.

29. Keep functions manageable.
    - Do not create extremely large functions.
    - Split complex logic into smaller functions with clear responsibilities.

30. Avoid premature abstraction.
    - Do not create complicated generic systems when simple reusable code is sufficient.
    - Abstract repeated patterns when there is a real need.

31. Preserve existing architecture.
    - Before changing a feature, inspect how the existing AITS architecture works.
    - Follow existing patterns instead of introducing a completely different approach without a reason.

32. Search before creating.
    - Before creating a new component, hook, service, utility, type, API function, modal, or form, search the project to determine whether an existing implementation can be reused.

33. Keep frontend and backend contracts aligned.
    - Verify API request/response structures against the actual backend.
    - Do not guess API fields, enums, endpoints, or response structures.
    - Update frontend types when the backend contract changes.

34. Protect data integrity.
    - Do not allow frontend actions that contradict backend business rules.
    - Ensure UI state reflects the actual server state after mutations.
    - Do not fake successful operations locally when the API operation failed.

35. Prevent duplicate submissions.
    - Disable or protect submit actions while requests are processing.
    - Avoid sending the same mutation multiple times accidentally.

36. Handle async operations correctly.
    - Properly handle loading, success, failure, cancellation, and cleanup where required.
    - Avoid race conditions and stale state.

37. Keep routing consistent.
    - Reuse existing route patterns.
    - Do not create duplicate pages for the same feature.
    - Preserve existing navigation and deep-link behavior.

38. Keep UI feedback consistent.
    - Use the existing AITS toast/notification system.
    - Show appropriate success and error feedback after mutations.
    - Do not mix multiple notification libraries unnecessarily.

39. Optimize only where necessary.
    - Avoid unnecessary re-renders and expensive calculations.
    - Use memoization, lazy loading, pagination, virtualization, or other optimizations when there is an actual performance need.
    - Do not over-optimize simple components.

40. Test changes end-to-end.
    - Verify the UI.
    - Verify API requests.
    - Verify database changes where applicable.
    - Verify permissions.
    - Verify loading/error/empty states.
    - Verify create/edit/delete workflows.
    - Verify related pages are updated correctly.

41. Validate before finishing.
    - Run TypeScript checks.
    - Run ESLint.
    - Run relevant tests.
    - Run the production build.
    - Fix errors instead of suppressing them.

42. Do not stop at making the UI appear correct.
    - Verify that the complete workflow works from UI → API → backend → database → response → UI.
    - Ensure the implementation is actually functional, maintainable, and consistent with the existing AITS architecture.

43. Keep changes scoped.
    - Do not unnecessarily modify unrelated files or features.
    - Make the smallest clean change that correctly solves the requirement.

44. Before finishing, review the changed files.
    - Check for duplicated logic.
    - Check for unused code.
    - Check for oversized files.
    - Check for TypeScript/ESLint issues.
    - Check for inconsistent patterns.
    - Check that existing functionality was not broken.

The goal is to keep the AITS frontend modular, maintainable, strongly typed, reusable, responsive, accessible, and easy to extend without creating large or unmanageable files.
