# State Management Architecture

**Last Updated:** 2026-02-11
**Status:** Production Ready ✅

---

## Overview

LIT MVP uses a **hybrid state management approach** optimized for different types of state:

- **Zustand** - Client state (UI preferences, game state, language)
- **React Query** - Server state (user data, API calls, caching)
- **React Context** - Cross-cutting concerns (brand detection, agents)
- **Local State** - Component-specific UI state

This architecture provides the best tool for each job while maintaining consistency and performance.

---

## 📚 Table of Contents

1. [When to Use What](#when-to-use-what)
2. [Zustand Stores](#zustand-stores)
3. [React Query](#react-query)
4. [React Context](#react-context)
5. [Migration Guide](#migration-guide)
6. [Best Practices](#best-practices)
7. [Debugging](#debugging)
8. [Type Definitions](#type-definitions)

---

## When to Use What

### ✅ Use Zustand When...

- Managing **client-side only** state
- Need **global state** across components
- Require **localStorage persistence**
- Want **TypeScript** type safety
- Need **devtools** debugging
- State changes frequently (game state, UI preferences)

**Examples:**
- Lesson progression and game state
- UI preferences (fullscreen, autoplay)
- Language selection
- Modal open/closed states

### ✅ Use React Query When...

- Fetching **data from APIs**
- Need **caching** and **revalidation**
- Require **loading/error states**
- Want **automatic refetching**
- Managing **server state**

**Examples:**
- User authentication data (`/me` endpoint)
- Lessons and curriculum data
- User progress and achievements
- API mutations (update avatar, submit answers)

### ✅ Use React Context When...

- Providing **cross-cutting infrastructure**
- Don't need frequent updates
- Need to **avoid prop drilling**
- State is set once at app root

**Examples:**
- Brand detection (multi-tenant)
- WebSocket connections (FlameAgent)
- Dev mode flags
- Page registry

### ✅ Use Local State When...

- State is **component-specific**
- Never shared with other components
- Simple UI interactions

**Examples:**
- Form input values (before submission)
- Dropdown open/closed
- Hover states
- Animation triggers

---

## Zustand Stores

### Architecture

```
src/stores/
├── useLessonStore.ts      # Game/lesson progression state
├── useUiStore.ts           # UI preferences and modals
├── useLanguageStore.ts     # Language selection
└── useDevModeStore.ts      # Development mode state
```

### useLessonStore

**Purpose:** Manages lesson game state, progression, and results.

```typescript
import { useLessonStore } from '@/stores/useLessonStore';

// In component
const {
  currentLesson,
  levelIndex,
  startLesson,
  handleCheckAnswer
} = useLessonStore();

// Selector for performance
const levelIndex = useLessonStore(state => state.levelIndex);
```

**Features:**
- Lesson metadata (currentLesson, levels, levelIndex)
- Game state (questions, answers, input)
- Results tracking (lit points, accuracy, bonus)
- Reading mode pagination
- Answer validation

**Persistence:** Memory only (reset on page refresh)

### useUiStore

**Purpose:** UI preferences and modal states.

```typescript
import { useUiStore } from '@/stores/useUiStore';

const {
  videoAutoPlay,
  setVideoAutoPlay,
  isLogoutModalOpen,
  openLogoutModal
} = useUiStore();
```

**Features:**
- Modal states (logout, progress, completion, delete account)
- UI flags (fullscreen, clueButton, answerIncorrect)
- User preferences (autoplay settings, keyboard config)

**Persistence:** localStorage for preferences (videoAutoPlay, audioAutoPlay, keyboardSettings)

### useLanguageStore

**Purpose:** Application language selection.

```typescript
import { useLanguage, useSetLanguage } from '@/stores/useLanguageStore';

const lang = useLanguage();
const setLang = useSetLanguage();

// Or full store
const { lang, setLang, reset } = useLanguageStore();
```

**Features:**
- Language selection (en, es, fr, de, it, pt, zh, ja, ko, ar)
- Automatic migration from old `localStorage.lang`
- Language metadata (names, flags)

**Persistence:** localStorage as `language-storage`

### Creating a New Store

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface MyStoreState {
  // State
  count: number;

  // Actions
  increment: () => void;
  reset: () => void;
}

export const useMyStore = create<MyStoreState>()(
  devtools(
    persist(
      immer((set) => ({
        count: 0,

        increment: () => {
          set((state) => {
            state.count += 1;
          });
        },

        reset: () => {
          set({ count: 0 });
        },
      })),
      {
        name: 'my-storage', // localStorage key
        // Optional: partialize to only persist certain keys
        partialize: (state) => ({ count: state.count }),
      }
    ),
    { name: 'MyStore' } // DevTools name
  )
);
```

**Middleware Stack:**
1. **devtools** - Browser extension debugging
2. **persist** - localStorage sync (optional)
3. **immer** - Immutable updates with mutable syntax

---

## React Query

### Configuration

React Query is already configured in the app. User state is managed via `UserContext` which wraps React Query.

### UserContext (React Query)

**Purpose:** Manages user authentication and profile data.

```typescript
import { useUser } from '@/context/UserContext';

const {
  user,              // User object from /me
  userRole,          // Primary role
  userRoles,         // All roles array
  userLoggedIn,      // Boolean
  authChecked,       // Boolean (loading complete)
  headers,           // Auth headers
  logout,            // Logout function
  refetchMe          // Refetch user data
} = useUser();
```

**Why React Query?**
- ✅ Automatic caching (5 min stale time)
- ✅ Refetch on window focus
- ✅ Loading and error states built-in
- ✅ Optimistic updates for mutations
- ✅ No stale data issues

**DO NOT** migrate this to Zustand - it's already optimal!

### Making API Calls with React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ['lessons', topicId],
  queryFn: () => fetchLessons(topicId),
  staleTime: 5 * 60 * 1000, // 5 min
});

// Mutation
const mutation = useMutation({
  mutationFn: (newLesson) => createLesson(newLesson),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
  },
});
```

---

## React Context

### Remaining Contexts

These contexts serve specialized purposes and should remain as Context:

#### BrandContext

**Purpose:** Multi-tenant brand detection and configuration.

```typescript
import { useBrand } from '@/contexts/BrandContext';

const { brand } = useBrand();
// brand.code: 'lit' | 'ttv' | 'deb'
```

**Why Context:** Set once at app root, never changes during session.

#### FlameAgentContext

**Purpose:** WebSocket connection for AI agent communication.

```typescript
import { useFlameAgent } from '@/contexts/FlameAgentContext';

const { messages, sendMessage, isConnected } = useFlameAgent();
```

**Why Context:** Manages WebSocket lifecycle, event listeners, real-time updates.

#### AdminContext

**Purpose:** Admin dashboard state.

**Why Context:** Feature-specific, isolated scope.

---

## Migration Guide

### From Context to Zustand

**Before (Context):**
```jsx
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
```

**After (Zustand):**
```typescript
export const useLanguageStore = create<LanguageStoreState>()(
  devtools(
    persist(
      immer((set) => ({
        lang: 'en',
        setLang: (lang) => set({ lang }),
      })),
      { name: 'language-storage' }
    ),
    { name: 'LanguageStore' }
  )
);

export const useLanguage = () => useLanguageStore(state => state.lang);
```

**Benefits:**
- ✅ No Provider wrapper needed
- ✅ TypeScript types
- ✅ DevTools debugging
- ✅ localStorage persistence
- ✅ Selector optimization

### From useState to Zustand

**When to migrate:**
- State is used in 3+ components
- Need to lift state multiple levels
- Want persistence

**How:**
1. Create store in `src/stores/`
2. Define TypeScript interface
3. Add devtools and persist middleware
4. Replace `useState` with store selectors
5. Update imports in components

---

## Best Practices

### ✅ DO

1. **Use TypeScript** for all stores
2. **Add devtools** to every Zustand store
3. **Use selectors** for performance
   ```typescript
   // Good: Only re-renders when lang changes
   const lang = useLanguageStore(state => state.lang);

   // Bad: Re-renders on any store change
   const { lang } = useLanguageStore();
   ```
4. **Use Immer** for nested state updates
5. **Persist only what's needed** (partialize)
6. **Name stores clearly** in devtools
7. **Keep actions with state** (co-located)
8. **Use React Query** for server state

### ❌ DON'T

1. **Don't mix concerns** - Keep UI state separate from game state
2. **Don't duplicate server state** - Use React Query instead
3. **Don't over-persist** - Only persist user preferences
4. **Don't use Context for frequently changing state**
5. **Don't forget type guards** for unions
6. **Don't nest stores** - Keep flat structure
7. **Don't use Redux** - Zustand is simpler and faster

### Performance Tips

```typescript
// ❌ Bad: Re-renders on any change
const store = useLessonStore();

// ✅ Good: Only re-renders when needed
const levelIndex = useLessonStore(state => state.levelIndex);
const handleCheck = useLessonStore(state => state.handleCheckAnswer);

// ✅ Better: Combine related selectors
const { levelIndex, currentLevel } = useLessonStore(
  state => ({
    levelIndex: state.levelIndex,
    currentLevel: state.currentLevel
  })
);
```

---

## Debugging

### Redux DevTools

Install: [Redux DevTools Extension](https://chrome.google.com/webstore/detail/redux-devtools)

**Features:**
- Time-travel debugging
- Action history
- State inspection
- Diff viewer

**Access:**
1. Open DevTools (F12)
2. Click "Redux" tab
3. Select store (LessonStore, UiStore, LanguageStore)
4. Inspect state and actions

### React Query DevTools

Already enabled in development. Shows:
- Active queries
- Query status (loading, success, error)
- Cache contents
- Refetch controls

**Access:**
Bottom-left floating icon in dev mode.

### Logging

```typescript
// Enable Zustand logging
import { devtools } from 'zustand/middleware';

export const useMyStore = create(
  devtools(
    (set) => ({ /* ... */ }),
    {
      name: 'MyStore',
      enabled: true, // Always enabled in dev
      trace: true,   // Show stack traces
    }
  )
);
```

---

## Type Definitions

### Level Types

All level types are defined in `src/types/levels.ts`:

```typescript
import { Level, MCQLevel, FillLevel, Lesson } from '@/types/levels';

// Type guards
import { isMCQLevel, isFillLevel } from '@/types/levels';

if (isMCQLevel(level)) {
  // TypeScript knows level is MCQLevel
  console.log(level.correctAnswer); // number
}
```

**See:** [src/types/levels.ts](./src/types/levels.ts) for complete schema.

---

## Architecture Decision Records

### Why Not Redux?

**Reasons:**
- ❌ Too much boilerplate
- ❌ Requires actions, reducers, selectors separately
- ❌ Provider wrapper needed
- ❌ Larger bundle size
- ✅ Zustand is 10x simpler
- ✅ Better TypeScript support
- ✅ Same DevTools support

### Why Not Context for Everything?

**Reasons:**
- ❌ Re-renders all consumers on any change
- ❌ No built-in DevTools
- ❌ No middleware (persist, devtools)
- ❌ Harder to optimize
- ✅ Context is great for stable values (brand, theme)
- ✅ Zustand is better for frequent updates

### Why React Query?

**Reasons:**
- ✅ Industry standard for server state
- ✅ Handles caching, revalidation, refetching
- ✅ Optimistic updates built-in
- ✅ Loading/error states automatic
- ✅ Don't reinvent the wheel

---

## File Structure

```
src/
├── stores/                      # Zustand stores
│   ├── useLessonStore.ts
│   ├── useUiStore.ts
│   ├── useLanguageStore.ts
│   └── useDevModeStore.ts
│
├── context/                     # React Context (infrastructure)
│   ├── UserContext.jsx          # (uses React Query internally)
│   ├── AdminContextProvider.jsx
│   └── DevModeContext.jsx
│
├── contexts/                    # React Context (legacy location)
│   ├── BrandContext.jsx
│   └── FlameAgentContext.jsx
│
├── types/                       # TypeScript definitions
│   └── levels.ts                # Level type schema
│
└── features/*/store/            # Feature-specific stores
    ├── auth/store/
    ├── ttv/store/
    └── messages/store/
```

---

## Roadmap

### Future Improvements

- [ ] Migrate AdminContext to Zustand
- [ ] Create useAuthStore for auth utilities
- [ ] Add store reset on logout
- [ ] Implement undo/redo for lesson progress
- [ ] Add state snapshots for crash recovery
- [ ] Create global error boundary with state reset

---

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Immer Documentation](https://immerjs.github.io/immer/)

---

## Support

Questions? Check:
1. This documentation
2. Code comments in store files
3. TypeScript types in `src/types/`
4. Example usage in components

---

**Last Reviewed:** 2026-02-11
**Next Review:** After major feature additions
