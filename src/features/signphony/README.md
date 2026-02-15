# Signphony Feature

Sign language learning platform integrated into lit-mvp.

## Structure

```
signphony/
├── index.js                   # Feature exports
├── api/
│   └── client.js             # API client
├── hooks/
│   ├── useSignphony.js       # Main hook
│   └── useWebSocket.js       # WebSocket connection
├── pages/
│   ├── SignphonyLanding.jsx  # Landing page
│   ├── SignLearningGame.jsx  # Game (TODO: add components)
│   ├── MagicTricks.jsx       # Magic tricks
│   ├── AuslanTranslator.jsx  # Translator
│   └── SignphonyDashboard.jsx # Dashboard
├── components/               # TODO: Copy from signphony/static/
└── styles/
    └── signphony.css        # Styles
```

## Setup

### 1. Environment Variables

Create `.env` in lit-mvp/web root:

```env
VITE_SIGNPHONY_API_URL=http://localhost:8000
```

### 2. Start Backend

```bash
cd /Volumes/ll-ssd/projects/mqss/signphony
python3 api.py
```

### 3. Start Frontend

```bash
cd /Volumes/ll-ssd/projects/lit/lit-mvp/web
npm run dev
```

## Add to Routes

In `src/App.jsx`:

```jsx
import {
  SignphonyLanding,
  SignLearningGame,
  MagicTricks,
  AuslanTranslator,
  SignphonyDashboard
} from './features/signphony';

// Add routes:
<Route path="/signphony" element={<SignphonyLanding />} />
<Route path="/signphony/learn" element={<SignLearningGame />} />
<Route path="/signphony/magic" element={<MagicTricks />} />
<Route path="/signphony/translator" element={<AuslanTranslator />} />
<Route path="/signphony/dashboard" element={<SignphonyDashboard />} />
```

## Usage

```jsx
import { useSignphony, useWebSocket } from './features/signphony';

function MyComponent() {
  const { api, status, loading } = useSignphony();
  const socket = useWebSocket();

  // Use API
  const signs = await api.getSigns();

  // Use WebSocket
  const score = await socket.processSign(frames, signId);

  return <div>...</div>;
}
```

## API Methods

See `api/client.js` for full API documentation.

## TODO

1. Copy React components from `/mqss/signphony/static/components/`
2. Update `SignLearningGame.jsx` to use copied components
3. Add signphony routes to `App.jsx`
4. Add navigation link to signphony
5. Test integration
