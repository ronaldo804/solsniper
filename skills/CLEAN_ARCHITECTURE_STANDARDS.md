# Clean Architecture Standards Skill (v1.0)
## Objective: Maintain a scalable, bug-free, and high-performance codebase.

### 1. Modular Structure
- **Feature-Based Folders:** Organize by feature (Market, Farm, Wallet) rather than just type (components, utils).
- **Separation of Concerns:** Keep UI logic separate from business/game logic.
- **Reusable Core:** Extract common UI elements into a shared `components/ui` folder.

### 2. State Management (Zustand/Context)
- **Centralized Store:** Use a single source of truth for the player's balance and inventory.
- **Optimistic Updates:** Update the UI immediately while the background process completes to avoid lag.
- **Persistence:** Automatically save the state to LocalStorage or a Database.

### 3. Performance Optimization
- **Lazy Loading:** Load heavy assets or hidden components only when needed.
- **Asset Compression:** Ensure all images are optimized (WebP) and code is minified.
- **Memoization:** Use `useMemo` and `useCallback` to prevent unnecessary re-renders in complex game views.

### 4. Testing & Reliability
- **Edge Case Handling:** Account for network failures, empty inventories, and zero balances.
- **Logging:** Maintain a clean log of actions for easier debugging during development.
