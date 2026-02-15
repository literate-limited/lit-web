# UI Architecture: Student & Teacher Interfaces

## Overview

The LIT MVP frontend has three main user interfaces:

1. **StudentDashboard** - Primary student learning interface (Chat + Units)
2. **TeacherDashboard** - Teacher monitoring and class management
3. **ChatUI** - AI-led conversation with flip-able language segments
4. **UnitPlayer** - Lesson and question progression system

## Architecture Diagram

```
App.jsx (Routing)
├─ /login → Login (all users)
├─ /signup → Signup (all users)
├─ /teacher-dashboard → TeacherDashboard (teacher only)
│   ├─ Sidebar: Class list
│   ├─ Main: Selected class with student roster
│   └─ Modal: Student chat viewer (with MessageSegment)
├─ /room/:roomId → StudentDashboard (student only)
│   ├─ Header: User info + unit status
│   ├─ Main content (toggles between):
│   │   ├─ ChatUI (default)
│   │   │   ├─ MessageSegment (flip-able content)
│   │   │   ├─ Error annotations
│   │   │   └─ Assessment metrics display
│   │   └─ UnitPlayer (when unit assigned)
│   │       ├─ LessonLevel (instructional)
│   │       └─ QuestionLevel (MCQ or fill-in-blank)
│   └─ Footer: Tips and guidance
└─ /join/:code → JoinClass (student enrollment)
```

## Student Flow

```
Login
  ↓
Join Class (via code)
  ↓
StudentDashboard
  ├─ Default: ChatUI
  │   ├─ Student types message in French
  │   ├─ AI analyzes & responds
  │   ├─ Segments display with flip-able annotations
  │   └─ Assessment updated in real-time
  │
  └─ When gap detected: UnitPlayer
      ├─ Lesson level (read + click OK)
      ├─ Question levels (MCQ or fill-in-blank)
      └─ Return to ChatUI with new skills
```

## Teacher Flow

```
Login
  ↓
TeacherDashboard
  ├─ Sidebar: My Classes
  ├─ Select Class
  │   ├─ View all students
  │   ├─ Copy join link
  │   └─ Select student → View Chat Modal
  │       ├─ Full conversation history
  │       ├─ Segments with error annotations
  │       └─ Assessment metrics
  └─ Create new class
```

---

## Component Structure

### StudentDashboard (`/src/pages/StudentDashboard.jsx`)

**Purpose**: Main container for student learning. Manages switching between chat and unit views.

**State**:
```javascript
{
  room: {},                    // Room details
  activeView: 'chat' | 'unit', // Current view
  assignedUnit: {},            // Current unit (if assigned)
  loading: boolean
}
```

**Props**:
- `user` - Current user object
- `onLogout` - Logout handler

**Child Components**:
- `ChatUI` - Default chat interface
- `UnitPlayer` - Unit lesson/questions

**Events**:
- Listens for `unit_assignment` from Socket.io
- Switches view when unit is assigned by AI

**Features**:
- Gradient header with user info
- Real-time assessment display
- Tips footer for guidance
- Seamless switching between chat and lessons

---

### ChatUI (`/src/components/ChatUI/ChatUI.jsx`)

**Purpose**: AI-led conversation interface with real-time message processing.

**State**:
```javascript
{
  messages: [],          // Conversation history
  inputMessage: '',      // User input buffer
  socket: {},            // Socket.io connection
  typing: null,          // Typing indicator
  loading: boolean,
  assessment: {}         // Latest message analysis
}
```

**Props**:
- `roomId` - Chat room ID
- `user` - Current user object
- `onUnitAssigned` - Callback when unit is assigned

**Socket Events**:
- **Listen**:
  - `student_message` - When student message processed with segments
  - `ai_message` - When AI responds
  - `unit_assignment` - When gap triggers unit assignment
  - `user_typing` - Show typing indicator

- **Emit**:
  - `send_message` - Send student message with targetLanguage
  - `typing` - Indicate user is typing
  - `join_room` - Join chat room on connect

**Features**:
- Real-time message streaming
- Flip-able segment rendering (with errors highlighted)
- Live assessment metrics (error rate, language distribution)
- Typing indicators
- Auto-scroll to latest message
- Error badges and gap display

**Message Flow**:
```
User types message
  ↓
send_message event (with targetLanguage)
  ↓
Server: processStudentMessage()
  ├─ Analyze with Claude
  ├─ Store segments
  ├─ Update assessment
  ├─ Generate AI response
  └─ Check unit trigger
  ↓
Socket: student_message event (with segments)
  ↓
ChatUI renders:
  ├─ Segments with MessageSegment components
  ├─ Analysis badges
  ↓
Socket: ai_message event
  ↓
ChatUI renders AI response
  ↓
Socket: unit_assignment event (if triggered)
  ↓
StudentDashboard: Switch to UnitPlayer
```

---

### MessageSegment (`/src/components/ChatUI/MessageSegment.jsx`)

**Purpose**: Individual word/phrase with flip-able language toggle and error annotations.

**Props**:
```javascript
{
  segment: {
    text: string,              // "want"
    language: 'fr'|'en'|'es',  // "en"
    is_error: boolean,         // true
    error_type: string,        // "vocabulary"
    correction: string,        // "veux"
    error_explanation: string, // "want is English..."
    char_start: number,
    char_end: number
  }
}
```

**Behavior**:
- **Default**: Show segment in original language/color
- **Hover**: Show tooltip (error or language info)
- **Click**: Toggle display between L1↔L2 (if has correction)
- **Error state**: Red background, wavy underline, error indicator

**Styling**:
- French text: Normal (or highlighted if error)
- English text: Blue background (L1 in target language context)
- Errors: Red background, wavy border
- Tooltip: Dark overlay with error type + correction + explanation

---

### UnitPlayer (`/src/components/UnitPlayer/UnitPlayer.jsx`)

**Purpose**: Container for unit progression. Manages level sequencing and completion.

**State**:
```javascript
{
  unit: {
    id: string,
    name: string,
    levels: [  // Array of lesson/question levels
      {
        id: string,
        type: 'lesson' | 'question',
        title: string,
        ...
      }
    ]
  },
  currentLevelIndex: number,  // Current level in unit
  levelProgress: {},          // { levelId: {completed, correct} }
  loading: boolean,
  error: string | null
}
```

**Props**:
- `unitId` - Unit to load
- `user` - Current user
- `onUnitComplete` - Callback when unit finished

**Features**:
- Linear progression through levels
- Progress bar (visual and percentage)
- Lesson levels (read + click OK)
- Question levels (MCQ or fill-in-blank)
- Skip button to move to next level
- Exit button to return to chat
- Tracks completion and correctness per level

---

### LessonLevel (`/src/components/UnitPlayer/LessonLevel.jsx`)

**Purpose**: Display instructional content.

**Props**:
```javascript
{
  level: {
    id: string,
    type: 'lesson',
    title: string,
    content: string  // HTML content (from DB)
  },
  onComplete: function  // Called when user clicks "Next"
}
```

**Behavior**:
1. Display title and HTML content
2. Show "Continue" button
3. On click, show confirmation: "Lesson completed! ✓"
4. Show "Next Level" button to progress

---

### QuestionLevel (`/src/components/UnitPlayer/QuestionLevel.jsx`)

**Purpose**: MCQ and fill-in-the-blank question handling.

**Props**:
```javascript
{
  level: {
    id: string,
    type: 'question',
    question_type: 'mcq' | 'fill',
    title: string,
    content: string,          // Question text
    options: string[],        // For MCQ
    correctAnswer: string|number  // String for fill, index for MCQ
  },
  onComplete: function  // Called with isCorrect boolean
}
```

**MCQ Behavior**:
1. Display 4 options as buttons
2. User clicks option (stores index)
3. User clicks "Check Answer"
4. Compare selected index with correctAnswer index
5. Show feedback:
   - ✓ Correct → Show "Continue" button
   - ✗ Wrong → Show "Try Again" or "Continue" buttons

**Fill-in-Blank Behavior**:
1. Display text input field
2. User types answer
3. User clicks "Check Answer"
4. Compare (normalized) user input with correctAnswer
5. Show feedback with correct answer if wrong

**Feedback**:
- Correct: Green text + Continue button
- Incorrect: Red text + Try Again button (reset) + Continue button
- Options/input disabled after submission

---

## Styling Architecture

All components use **inline styles** (no CSS files) for simplicity:

```javascript
const styles = {
  container: { ... },
  header: { ... },
  content: { ... },
  // etc.
};
```

**Color Scheme**:
- Primary: `#007bff` (blue) - actions, student messages
- Success: `#28a745` (green) - correct answers, progress
- Danger: `#dc3545` (red) - errors
- Warning: `#ffc107` (yellow) - gaps/improvements needed
- Neutral: `#6c757d` (gray) - secondary actions
- Background: `#f0f2f5` (light gray)
- Cards: `white` with subtle shadows

**Responsive Design**:
- Sidebar: Fixed `280px` on desktop
- Main content: Flex to fill available space
- Modals: `maxWidth: 800px`, 90% of viewport
- Grid layouts: `auto-fill, minmax(300px, 1fr)`

---

## Socket.io Integration

### ChatUI Socket Events

**Emit Events**:
```javascript
socket.emit('join_room', { roomId, userId, userName })
socket.emit('send_message', { roomId, content, targetLanguage })
socket.emit('typing', { roomId, userName })
```

**Listen Events**:
```javascript
socket.on('student_message', (message) => {
  // Message with segments, analysis, pedagogical metadata
})

socket.on('ai_message', (message) => {
  // AI response with pedagogical_intent
})

socket.on('unit_assignment', (data) => {
  // { unit_id, unit_name, reason }
  // Trigger StudentDashboard to switch views
})

socket.on('message_processed', (data) => {
  // { student_message_id, ai_response_id, unit_triggered }
})

socket.on('user_typing', (data) => {
  // { userName } - show typing indicator
})

socket.on('error', (error) => {
  // Error during message processing
})
```

---

## Data Structures

### Message Object (from ChatUI):
```javascript
{
  id: 'uuid',
  sender_role: 'student' | 'ai',
  raw_text: "Je want aller au cinema",
  created_at: '2024-01-15T10:30:00Z',
  segments: [
    {
      text: "Je",
      language: "fr",
      is_error: false,
      char_start: 0,
      char_end: 2
    },
    {
      text: "want",
      language: "en",
      is_error: true,
      error_type: "vocabulary",
      correction: "veux",
      error_explanation: "...",
      char_start: 3,
      char_end: 7
    },
    ...
  ],
  analysis: {
    error_count: 1,
    error_rate: 20.0,
    identified_gaps: ["present_tense_vouloir"],
    language_distribution: {
      target_language_pct: 0.83,
      l1_pct: 0.17
    },
    demonstrated_topics: ["cinema_vocabulary"],
    vocabulary_analysis: {
      unique_words: 7,
      new_words: 1
    }
  },
  pedagogical_intent: "correct_implicitly"  // For AI messages
}
```

### Unit Object (for UnitPlayer):
```javascript
{
  id: 'unit-uuid',
  name: 'Present Tense: Avoir & Aller',
  topic: 'verb_conjugation',
  difficulty: 'Y7',
  levels: [
    {
      id: 'level-1',
      type: 'lesson',
      title: 'Understanding Present Tense',
      content: '<h3>...</h3><p>...</p>'
    },
    {
      id: 'level-2',
      type: 'question',
      question_type: 'mcq',
      title: 'Question 1',
      content: 'How do you say "I have" in French?',
      options: ['J\'ai', 'Tu as', 'Il a', 'Nous avons'],
      correctAnswer: 0
    },
    ...
  ]
}
```

---

## API Integration Points

### ChatUI Calls:
```javascript
api.getRoomMessages(roomId)       // Load chat history
api.getRoomDetails(roomId)        // Load room metadata
```

### StudentDashboard Calls:
```javascript
api.getRoomDetails(roomId)        // Load room on mount
```

### TeacherDashboard Calls:
```javascript
api.getTeacherClasses(userId)     // Load teacher's classes
api.createClass({ teacherId, name })  // Create new class
api.getClassStudents(classId)     // Load students in class
api.getStudentChat(studentId)     // Load student's chat history
```

---

## Next Steps / Enhancements

1. **Real-time student assessment dashboard**
   - Graph: Error rate over time
   - Graph: Language distribution over time
   - List: Identified gaps with suggestions

2. **Teacher analytics**
   - Class-wide error patterns
   - Student progress comparison
   - Unit completion rates
   - Vocabulary growth tracking

3. **Unit library management**
   - Teacher can create/edit units
   - Unit templates (pre-made common topics)
   - Question difficulty rating

4. **Mobile responsive design**
   - Current: Desktop-optimized
   - Needed: Mobile breakpoints, collapsible sidebar

5. **Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation
   - High contrast mode option

6. **Internationalization**
   - i18n for UI text (currently hardcoded in English)
   - Language selection for interface

7. **Real-time collaboration**
   - Teachers can jump into student chats
   - Peer chat (student-to-student practice)
   - Group lessons

---

## Testing Strategy

### Unit Tests:
- `MessageSegment` - Flip toggle, tooltip display
- `QuestionLevel` - MCQ selection, fill validation
- `LessonLevel` - Completion flow

### Integration Tests:
- `ChatUI` - Socket events, message sending, segment rendering
- `UnitPlayer` - Level progression, completion detection
- `StudentDashboard` - Chat → Unit switching

### E2E Tests:
- Student login → Join class → Chat → Complete unit → Return to chat
- Teacher login → View class → View student chat → See analysis

---

## Performance Considerations

1. **Message Rendering**
   - Large conversations can get slow
   - Virtualization for long message lists (future enhancement)

2. **Socket.io Optimization**
   - Message batching to reduce event frequency
   - Debounce typing indicators

3. **Image/Media Loading**
   - Lazy load lesson content with images
   - Optimize for various connection speeds

4. **State Management**
   - Currently using local React state
   - Consider Context API or Redux for complex state

---

## Summary

The UI architecture provides:
- ✅ Intuitive student learning flow (chat → lessons → back to chat)
- ✅ Flip-able content for contextual language learning
- ✅ Real-time AI interaction with pedagogical annotations
- ✅ Teacher visibility into all student progress
- ✅ Modular component design for easy extension
- ✅ Responsive, clean visual design
- ✅ Smooth transitions and animations
