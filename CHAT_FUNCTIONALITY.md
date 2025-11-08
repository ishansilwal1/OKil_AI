# Chat Functionality Documentation

## Overview
The UserDashboard now has a complete chat management system with auto-save, recent chats, and persistent storage.

## Features Implemented

### 1. **New Chat Button**
- Click "New chat" in the sidebar to start a fresh conversation
- Automatically saves the current chat before starting a new one
- Clears the chat history and input field

### 2. **Auto-Save to Recent Chats**
- Chats are automatically saved when:
  - You send the first message (creates a new chat entry)
  - You start a new chat (saves the previous one)
  - You load a different chat (saves the current one)
  - You navigate away or close the browser (auto-save on unload)
- Chat titles are automatically generated from the first user message (max 50 characters)

### 3. **Recent Chats List**
- Shows up to 20 most recent chats
- Displays chat title and date
- Click on any chat to load it back
- Active chat is highlighted with a blue border
- Hover over a chat to see the delete button

### 4. **Delete Chat**
- Hover over any recent chat to reveal the delete button (trash icon)
- Click the delete button to remove the chat from recent chats
- If you delete the currently active chat, the dashboard resets to a new chat

### 5. **Save Status Indicator**
- Header shows the current chat title
- Green checkmark = Chat is saved
- Orange circle = Chat has unsaved changes
- "Save Chat" button to manually save (disabled when already saved)

### 6. **Persistent Storage**
- All chats are stored in localStorage under the key `okil_recent_chats`
- Chats persist across page refreshes and browser sessions
- Each chat includes:
  - Unique ID (timestamp-based)
  - Title (from first message)
  - Date created
  - Full message history
  - Timestamp for sorting

## How It Works

### Chat Lifecycle

```
1. User starts typing → First message sent
   ↓
2. Chat ID created (timestamp) + marked as unsaved
   ↓
3. Messages added to chat history
   ↓
4. User clicks "Save" OR starts new chat OR loads another chat
   ↓
5. Chat saved to localStorage + added to recent chats list
   ↓
6. Chat appears in sidebar with title and date
```

### Loading a Chat

```
1. User clicks a chat in the sidebar
   ↓
2. Current chat is saved (if unsaved)
   ↓
3. Selected chat's messages loaded into chat history
   ↓
4. Chat marked as active (highlighted in sidebar)
```

### Deleting a Chat

```
1. User hovers over a chat → Delete button appears
   ↓
2. User clicks delete button
   ↓
3. Chat removed from recent chats list and localStorage
   ↓
4. If it was the active chat → Dashboard resets to new chat
```

## State Management

### Key State Variables
- `chatHistory`: Array of current chat messages
- `recentChats`: Array of all saved chats
- `currentChatId`: ID of the currently active chat
- `isChatSaved`: Boolean flag for save status
- `message`: Current input text

### LocalStorage Keys
- `okil_recent_chats`: Array of saved chat objects

### Chat Object Structure
```javascript
{
  id: "1698480000000",              // Unique timestamp ID
  title: "What is contract law?",   // First message (max 50 chars)
  date: "10/28/2025",               // Creation date
  messages: [                        // Full chat history
    { type: 'user', text: '...' },
    { type: 'ai', text: '...' }
  ],
  timestamp: 1698480000000          // For sorting
}
```

## User Experience Flow

### Starting a New Chat
1. Click "New chat" in sidebar
2. Type your question in the input box
3. Press Enter or click the send button
4. AI responds (simulated - replace with actual API)
5. Continue the conversation
6. Chat is auto-saved when you start a new one or close the page

### Continuing a Previous Chat
1. Find the chat in "RECENT CHATS" section
2. Click on the chat title
3. Previous conversation loads
4. Continue asking questions
5. Changes are tracked (shows "Unsaved")
6. Click "Save Chat" or it auto-saves when switching chats

### Managing Chats
1. Hover over any recent chat
2. Delete button (trash icon) appears on the right
3. Click to remove the chat permanently
4. Chat is removed from sidebar and localStorage

## Integration with Backend

### Current State (Simulated)
```javascript
// Simulated AI response
setTimeout(() => {
  setChatHistory(prev => [...prev, { 
    type: 'ai', 
    text: "Thank you for your question. I'm analyzing your legal query..."
  }]);
}, 1000);
```

### TODO: Replace with Actual API
```javascript
const handleSendMessage = async () => {
  if (message.trim()) {
    const newChatHistory = [...chatHistory, { type: 'user', text: message }];
    setChatHistory(newChatHistory);
    setMessage('');
    
    try {
      // Replace with your actual API endpoint
      const response = await fetch('YOUR_BACKEND_API/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('okil_token')}`
        },
        body: JSON.stringify({
          message: message,
          chatId: currentChatId,
          history: chatHistory
        })
      });
      
      const data = await response.json();
      
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        text: data.response 
      }]);
      setIsChatSaved(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error appropriately
    }
  }
};
```

## Styling

### CSS Files
- `UserDashboard.css` - Main dashboard and chat styles (scoped with `.user-dashboard-wrapper`)
- `Sidebar.css` - Sidebar and recent chats styles (scoped with `.sidebar-` prefix)

### Key Style Features
- Active chat highlighted with blue left border
- Delete button appears on hover
- Save status indicator with color-coded icons
- Responsive design (adapts to mobile)

## Future Enhancements

1. **Backend Integration**
   - Connect to actual AI API
   - Store chats in database
   - Sync across devices

2. **Search Functionality**
   - Search through chat history
   - Filter chats by date or keywords

3. **Chat Organization**
   - Folders or categories
   - Pin important chats
   - Archive old chats

4. **Export/Share**
   - Export chat as PDF
   - Share chat link
   - Print conversation

5. **Advanced Features**
   - Voice input
   - File attachments
   - Code highlighting
   - Markdown support

## Testing Checklist

- [ ] Start a new chat and send messages
- [ ] Chat appears in recent chats after sending first message
- [ ] Click on a recent chat to load it
- [ ] Active chat is highlighted in sidebar
- [ ] Delete a chat from recent chats
- [ ] Save status updates correctly (saved/unsaved)
- [ ] Manual save button works
- [ ] Chat persists after page refresh
- [ ] Maximum 20 chats are stored
- [ ] Chat title is generated correctly from first message
- [ ] Auto-save on page close/navigate away
- [ ] Multiple chats can be created and switched between
- [ ] Empty chats are not saved to recent chats

## Troubleshooting

### Chat not saving
- Check browser console for errors
- Verify localStorage is enabled
- Check that `okil_recent_chats` key exists in localStorage

### Recent chats not appearing
- Ensure `recentChats` state is properly loaded from localStorage
- Check that chat has at least one message before saving

### Chat doesn't load when clicked
- Verify `onLoadChat` prop is passed to Sidebar
- Check that chat ID matches in recentChats array

### Delete button not working
- Ensure `onDeleteChat` prop is passed to Sidebar
- Check event.stopPropagation() prevents chat from loading when deleting
