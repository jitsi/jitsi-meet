# Breakout Rooms Participants Migration Notes

## Overview

This document describes the migration of `room.participants` from plain objects to `Map<string, IParticipant>` objects in the breakout rooms feature.

## Changes Made

### 1. Type Definitions

**File:** `react/features/breakout-rooms/types.ts`

- Added `IParticipant` interface
- Updated `IRoom` interface to use `Map<string, IParticipant>` instead of plain object

### 2. Utility Functions

**File:** `react/features/breakout-rooms/utils.ts`

Created a comprehensive utility module with helper functions:

- `Participants.keys(room)` - Get all participant keys
- `Participants.values(room)` - Get all participant values  
- `Participants.entries(room)` - Get all participant entries
- `Participants.count(room)` - Get participant count
- `Participants.isEmpty(room)` - Check if room has participants
- `Participants.findByJid(room, jid)` - Find participant by exact JID
- `Participants.findByPartialJid(room, partialJid)` - Find participant by partial JID
- `Participants.findById(room, id)` - Find participant by ID
- `Participants.toJSON(room)` - Convert Map to JSON object
- `Participants.fromJSON(obj)` - Convert JSON object to Map

### 3. Code Changes

#### Functions (`functions.ts`)
- Replaced `Object.keys(breakoutRoomItem.participants).length` with `Participants.count(breakoutRoomItem)`
- Replaced `Object.keys(breakoutRoomItem.participants).map()` with `Participants.values(breakoutRoomItem).map()`

#### Middleware (`middleware.ts`)
- Replaced `Object.keys(participants).find()` with `Participants.findById()`
- Replaced `Object.keys(participants).find()` with `Participants.findByPartialJid()`
- Updated participant updates to use `Map.set()` instead of object spread

#### Actions (`actions.ts`)
- Replaced `Object.values(room.participants).forEach()` with `Participants.values(room).forEach()`
- Replaced `Object.keys(room.participants).length > 0` with `!Participants.isEmpty(room)`
- Replaced `participants[_participantId]` with `room.participants?.get(_participantId)`

#### UI Components
- **Web CollapsibleRoom:** Replaced `Object.keys(room?.participants || {}).length` with `Participants.count(room)`
- **Native CollapsibleRoom:** Replaced `Object.values(room.participants || {}).length` with `Participants.count(room)`
- **Context Menus:** Replaced `Object.keys(room.participants).length > 0` with `!Participants.isEmpty(room)`

#### External API (`external_api.js`)
- Replaced `Object.keys(rooms[roomItemKey].participants).length` with `rooms[roomItemKey].participants.size`
- Replaced `Object.keys(this._participants)` with `[...this._participants.keys()]`
- Replaced `Object.values(this._participants)` with `[...this._participants.values()]`
- Replaced `delete this._participants[userID]` with `this._participants.delete(userID)`
- Replaced `this._participants[userID] = value` with `this._participants.set(userID, value)`
- Replaced `this._participants[userID]` with `this._participants.get(userID)`

## Migration Patterns

### Before (Plain Object)
```typescript
// Access
const participant = room.participants[jid];

// Assignment
room.participants[jid] = participant;

// Deletion
delete room.participants[jid];

// Length
const count = Object.keys(room.participants).length;

// Iteration
Object.values(room.participants).forEach(p => {});
Object.keys(room.participants).forEach(jid => {});
```

### After (Map)
```typescript
// Access
const participant = room.participants.get(jid);

// Assignment
room.participants.set(jid, participant);

// Deletion
room.participants.delete(jid);

// Length
const count = room.participants.size;

// Iteration
Participants.values(room).forEach(p => {});
Participants.keys(room).forEach(jid => {});
```

## Benefits

1. **Type Safety:** Map provides better TypeScript support and prevents accidental property access
2. **Performance:** Map operations are generally faster for frequent additions/deletions
3. **API Consistency:** Map provides a more consistent API for key-value operations
4. **Memory Efficiency:** Map can be more memory efficient for large datasets
5. **Iteration Order:** Map preserves insertion order, which is important for UI rendering

## Testing

Added comprehensive tests in `utils.test.ts` to verify all utility functions work correctly with Map objects.

## Backward Compatibility

The migration maintains backward compatibility by:
- Providing utility functions that abstract the Map operations
- Ensuring the same data structure is returned in public APIs
- Maintaining the same interface for external consumers

## Future Considerations

1. Consider migrating other participant collections to use Map for consistency
2. Add runtime validation to ensure participants are always Map objects
3. Consider adding TypeScript strict mode checks to prevent object access patterns
