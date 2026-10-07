# AITS REACT NATIVE MOBILE APP — BEST PRACTICES

Follow these React Native and Expo best practices for all AITS mobile application development.

1. Keep files manageable.
   - Do not create huge screen files with hundreds or thousands of lines.
   - Split large screens into smaller focused components.
   - Keep each file responsible for one clear purpose.
   - Extract reusable UI, forms, hooks, services, utilities, and types.

2. Keep screens lightweight.
   - Screens should mainly compose components and manage screen-level behavior.
   - Do not place all UI, API calls, business logic, validation, and state management inside one screen.
   - Extract complex sections into separate components.

3. Use a feature-based structure.
   - Organize code by feature where appropriate.
   - Keep feature-specific components, hooks, services, and types close to the feature.
   - Avoid putting all components into one large generic folder.

4. Reuse existing components.
   - Search the project before creating new components.
   - Reuse existing buttons, inputs, cards, modals, bottom sheets, loaders, empty states, error states, and navigation patterns.
   - Do not create duplicate UI systems.

5. Use strong TypeScript.
   - Never use `any`.
   - Never use `as any`.
   - Do not suppress TypeScript or ESLint errors.
   - Properly type API responses, navigation parameters, component props, form data, state, and callbacks.

6. Keep API logic separate from screens.
   - Do not put large Axios/API implementations directly inside screen components.
   - Use the existing AITS API/service layer.
   - Reuse API functions instead of duplicating requests.

7. Keep backend contracts aligned.
   - Verify API endpoints, request payloads, response structures, enums, and IDs against the actual backend.
   - Do not guess API fields or create incompatible mobile-only models.

8. Use TanStack Query correctly.
   - Use it for server state where it is already part of the AITS architecture.
   - Reuse consistent query keys.
   - Invalidate or update the correct queries after mutations.
   - Avoid unnecessary refetching.
   - Do not maintain unnecessary duplicate server state.

9. Use Zustand appropriately.
   - Use Zustand for appropriate client/application state.
   - Do not store every piece of screen state globally.
   - Keep temporary form/UI state local when possible.

10. Keep authentication centralized.
    - Use the existing authentication store/service.
    - Keep token handling, session restoration, logout, and user state consistent.
    - Do not manually manage authentication tokens separately in individual screens.

11. Handle secure storage correctly.
    - Store sensitive authentication information using the project's secure storage mechanism.
    - Do not store sensitive tokens in plain AsyncStorage or hardcoded constants unless explicitly required by the architecture.

12. Centralize API configuration.
    - Keep the API base URL and Axios configuration in one place.
    - Use environment/configuration values instead of hardcoding URLs throughout the application.
    - Do not create different API clients for individual screens without a clear architectural reason.

13. Handle network failures properly.
    - Show user-friendly network error messages.
    - Handle timeouts and unavailable backend services.
    - Avoid exposing raw Axios, NestJS, Prisma, or database errors.
    - Do not silently ignore failed requests.

14. Handle loading, empty, and error states.
    - Every API-driven screen should properly handle:
      - Loading
      - Empty
      - Error
      - Success
    - Never leave the user with a blank screen when data is unavailable.

15. Prevent duplicate submissions.
    - Disable submit actions while a mutation is processing.
    - Prevent double taps from creating duplicate records.
    - Restore the button state correctly after success or failure.

16. Keep forms reusable.
    - Reuse the same form for create/edit workflows where appropriate.
    - Keep validation consistent between different entry points.
    - Do not create separate forms that implement the same business process differently.

17. Use consistent validation.
    - Reuse existing validation schemas where possible.
    - Validate required fields and formats before submission.
    - Frontend validation must complement backend validation.
    - Never rely on mobile validation as a security mechanism.

18. Respect AITS RBAC.
    - Use the existing AITS permission/RBAC system.
    - Show or hide actions based on permissions where appropriate.
    - Backend authorization remains authoritative.
    - Never assume that hiding a mobile button provides security.

19. Preserve farm-level isolation.
    - Only show data the authenticated user is authorized to access.
    - Do not accidentally display another farm's animals, records, staff, or operational data.

20. Respect animal status and ownership.
    - Do not allow operational records to be created for animals that are no longer available at the user's farm.
    - Respect sold, transferred, inactive, or otherwise restricted animals.
    - Preserve historical records for traceability.

21. Use React Navigation consistently.
    - Follow the existing navigation architecture.
    - Keep route names and navigation parameters strongly typed.
    - Do not pass large objects unnecessarily through navigation.
    - Prefer passing stable IDs and loading the required data when appropriate.

22. Avoid unnecessary navigation state duplication.
    - Do not store the same navigation information in multiple places.
    - Keep route parameters, global state, and local state clearly separated.

23. Handle mobile lifecycle correctly.
    - Consider app foreground/background transitions.
    - Refresh stale data appropriately when returning to a screen.
    - Clean up listeners, subscriptions, timers, and event handlers.

24. Clean up effects.
    - Every `useEffect` should have a clear purpose.
    - Properly clean up subscriptions, listeners, timers, and asynchronous operations where necessary.
    - Avoid unnecessary effects that can be replaced with derived values or event handlers.

25. Avoid excessive re-renders.
    - Keep state localized.
    - Avoid unnecessary object/function recreation when it materially affects performance.
    - Use `useMemo`, `useCallback`, or `memo` only when they provide a real benefit.
    - Do not blindly memoize everything.

26. Optimize lists.
    - Use `FlatList` or `SectionList` for large/dynamic lists.
    - Do not render large datasets using `.map()` inside a `ScrollView`.
    - Provide stable keys.
    - Avoid unnecessary work inside `renderItem`.
    - Use pagination or incremental loading for large datasets.

27. Keep list items lightweight.
    - Extract complex list items into reusable components.
    - Avoid expensive calculations during every list render.
    - Do not make unnecessary API requests from individual list items.

28. Handle images efficiently.
    - Resize/compress images appropriately.
    - Avoid loading unnecessarily large images.
    - Use caching where appropriate.
    - Provide placeholders and error states.
    - Do not load every image at full resolution.

29. Handle forms and keyboards properly.
    - Ensure inputs remain visible when the keyboard opens.
    - Use appropriate keyboard behavior for forms.
    - Use correct keyboard types.
    - Dismiss the keyboard appropriately.
    - Avoid layouts being hidden behind the keyboard.

30. Make the UI responsive.
    - Support different screen sizes and orientations where required.
    - Do not rely on fixed dimensions unnecessarily.
    - Use responsive layouts instead of hardcoded positioning.

31. Follow NativeWind conventions.
    - Reuse the existing AITS NativeWind styling approach.
    - Keep styling consistent.
    - Avoid excessive inline styles when NativeWind can handle the requirement.
    - Do not mix multiple styling systems unnecessarily.

32. Keep design consistent.
    - Reuse AITS spacing, typography, colors, icons, buttons, cards, and interaction patterns.
    - Do not introduce unrelated visual styles for individual screens.

33. Maintain accessibility.
    - Use accessible labels and roles.
    - Ensure buttons and controls are usable with assistive technologies.
    - Maintain sufficient touch target sizes.
    - Do not rely only on color to communicate status.

34. Handle permissions correctly.
    - Request device permissions only when needed.
    - Explain why a permission is required before requesting it where appropriate.
    - Handle denied and permanently denied permissions gracefully.
    - Do not repeatedly request denied permissions without user action.

35. Handle offline/network scenarios.
    - Consider network availability for important workflows.
    - Use the existing AITS offline/synchronization architecture where implemented.
    - Clearly distinguish locally stored data from server-confirmed data.
    - Do not falsely show an operation as successfully synchronized when it has not reached the backend.

36. Avoid unnecessary dependencies.
    - Check existing packages before installing new libraries.
    - Prefer the existing Expo/React Native ecosystem already used by AITS.
    - Do not add a dependency for simple functionality that can be implemented cleanly with existing tools.

37. Keep business logic separate.
    - Do not place complex business rules inside JSX.
    - Extract domain logic into services, hooks, or utilities.
    - Keep business rules consistent with the backend.

38. Keep date/time handling consistent.
    - Use the existing AITS date/time utilities.
    - Handle timezone correctly.
    - Do not create different date formats for different mobile screens.

39. Use stable IDs.
    - Use actual backend IDs for updates, deletes, and navigation.
    - Never identify records only by title, animal name, or display text.

40. Keep notifications consistent.
    - Reuse the existing AITS notification architecture.
    - Do not create duplicate notification systems.
    - Handle notification permissions and navigation correctly.

41. Handle deep links and notification navigation safely.
    - Validate referenced IDs before loading data.
    - Handle deleted or unavailable records gracefully.
    - Do not assume notification payloads are always valid.

42. Avoid hardcoded data.
    - Do not hardcode animals, farms, users, permissions, API results, or production records.
    - Use backend data and existing configuration.

43. Avoid magic numbers and strings.
    - Use constants for repeated values.
    - Reuse existing enums and configuration.

44. Remove dead code.
    - Remove unused imports.
    - Remove unused variables.
    - Remove obsolete components.
    - Remove unused hooks and services.
    - Remove unused API methods.
    - Remove obsolete screens and files only after checking all references.

45. Do not leave temporary code.
    - Remove debug `console.log()` statements when no longer needed.
    - Remove mock data after real API integration.
    - Remove temporary buttons and placeholder screens.
    - Do not leave commented-out old implementations.

46. Keep functions manageable.
    - Avoid extremely large functions.
    - Break complex logic into smaller functions with clear responsibilities.
    - Avoid deeply nested conditional logic.

47. Keep JSX manageable.
    - Do not create extremely large JSX blocks.
    - Extract repeated or complex sections into components.
    - Keep screen files readable.

48. Keep files modular.
    - If a screen becomes too large, split it.
    - Separate:
      - Screen
      - Components
      - Hooks
      - API/services
      - Types
      - Validation
      - Utilities
    - Do not create one massive file containing the entire feature.

49. Avoid unnecessary abstraction.
    - Do not create complex generic components for simple one-off requirements.
    - Abstract repeated functionality when there is a real maintainability benefit.

50. Search before creating.
    - Before creating a new component, hook, service, API function, modal, form, type, utility, or screen, search the project for an existing implementation.

51. Preserve the existing architecture.
    - Before modifying a feature, inspect how the existing AITS mobile architecture works.
    - Follow existing patterns instead of introducing a completely different architecture without a clear reason.

52. Keep changes scoped.
    - Modify only the files required for the feature.
    - Do not unnecessarily rewrite unrelated screens or modules.
    - Avoid large refactors unless they are required to solve the problem.

53. Maintain data consistency.
    - After create/update/delete operations, ensure the affected screens and related data are updated.
    - Invalidate or update the correct queries.
    - Do not rely on stale local data.

54. Test both UI and API workflows.
    - Test successful operations.
    - Test validation failures.
    - Test permission failures.
    - Test network failures.
    - Test empty states.
    - Test loading states.
    - Test create/edit/delete workflows.
    - Test navigation between related screens.

55. Test real device behavior.
    - Verify important workflows on a real Android/iOS device where applicable.
    - Do not rely only on the simulator/emulator for camera, notifications, permissions, networking, storage, and device-specific behavior.

56. Verify API networking.
    - Ensure the mobile app uses the correct backend address for the current environment.
    - Do not hardcode emulator-specific addresses throughout the code.
    - Keep development/staging/production configuration separate.

57. Verify authentication after app restart.
    - Test login.
    - Test logout.
    - Test token/session restoration.
    - Test expired/invalid authentication.
    - Test unauthorized API responses.

58. Handle destructive actions carefully.
    - Use confirmation dialogs for destructive operations.
    - Do not delete records immediately without confirmation when confirmation is appropriate.
    - Use the real record ID.
    - Ensure backend authorization is enforced.

59. Keep performance in mind.
    - Avoid unnecessary API calls.
    - Avoid rendering huge datasets at once.
    - Optimize images.
    - Avoid expensive calculations during render.
    - Keep animations lightweight.
    - Avoid blocking the JS thread with expensive synchronous operations.

60. Validate before finishing.
    - Run TypeScript checks.
    - Run ESLint.
    - Run relevant tests.
    - Run Expo/project validation.
    - Build the application.
    - Test important flows on the target platform.

61. Final code review.
    Before considering a feature complete, verify:
    - No huge/unmanageable files.
    - No duplicated logic.
    - No unused code.
    - No `any`.
    - No `as any`.
    - No suppressed lint/type errors.
    - No hardcoded API data.
    - No unnecessary dependencies.
    - No broken navigation.
    - No stale query data.
    - No missing loading/error/empty states.
    - No unauthorized data access.
    - No broken existing functionality.

The goal is to keep the AITS React Native/Expo mobile application modular, strongly typed, performant, secure, responsive, maintainable, and consistent with the existing backend and web application architecture.
