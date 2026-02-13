# Future Features Roadmap

This document outlines the planned features for Skorat v2+, including feasibility analysis, implementation steps, and priority ordering.

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Priority Order & Rationale](#priority-order--rationale)
3. [Feature 1: Friends Leaderboard & Stats](#feature-1-friends-leaderboard--stats)
4. [Feature 2: User Authentication & Account Sync](#feature-2-user-authentication--account-sync)
5. [Feature 3: Social Network & Discovery](#feature-3-social-network--discovery)
6. [Technical Dependencies Map](#technical-dependencies-map)

---

## Feature Overview

| Feature | Complexity | Dependencies | Estimated Effort |
|---------|------------|--------------|------------------|
| Friends Leaderboard & Stats | Medium | None (can start local-only) | Phase 1-2 |
| User Authentication & Sync | High | Backend infrastructure | Phase 2-3 |
| Social Network & Discovery | Very High | Auth + Backend + Location services | Phase 3-4 |

---

## Priority Order & Rationale

### Recommended Order: Leaderboard → Auth → Social

**1. Friends Leaderboard & Stats (FIRST)**
- Can be built incrementally on top of existing infrastructure
- Provides immediate value to current users
- Does not require backend initially (local stats already exist)
- Validates user interest before investing in backend

**2. User Authentication & Account Sync (SECOND)**
- Required foundation for cross-device features
- Enables the "connect to friend's device" requirement
- Natural extension after leaderboard proves valuable
- Unlocks cloud-synced leaderboards

**3. Social Network & Discovery (THIRD)**
- Requires both auth and robust backend
- Highest risk/reward feature
- Location services add compliance complexity (GDPR, etc.)
- Should only be built after user base is established

---

## Feature 1: Friends Leaderboard & Stats

### Description
Create a competitive leaderboard between friends showing detailed statistics: win percentage, game-specific achievements (leekha collections, bid accuracy, etc.), and historical performance trends.

### Feasibility Assessment

**Strengths:**
- Stats engine already exists (`services/stats_engine.ts`)
- Player profiles already track `profileId` across games
- Game history stores all data needed for stats computation
- Can be 100% local-first initially

**Challenges:**
- Current stats are computed on-demand (may need caching for large datasets)
- No "friends" concept exists yet (just players who've played together)
- UI/UX for leaderboard needs design consideration

**Setbacks:**
- Without auth/sync, leaderboards are device-local only
- Different devices = different leaderboards (until sync is added)

### Implementation Steps

#### Phase 1A: Extend Stats Engine (Local)

**Step 1.1: Define comprehensive stats types**
```typescript
// Add to constants/types.ts
type PlayerLifetimeStats = {
  profileId: string;
  totalGames: number;
  totalWins: number;
  winPercentage: number;
  gameStats: {
    "400": FourHundredLifetimeStats;
    tarneeb: TarneebLifetimeStats;
    leekha: LeekhaLifetimeStats;
  };
  lastPlayed: string;
  streaks: {
    currentWin: number;
    longestWin: number;
  };
};
```

**Step 1.2: Implement per-game lifetime stats**

For 400:
- Total hands played
- Bid success rate (%)
- Average bid value
- Times "broke" (failed bid)
- Highest single-round score

For Tarneeb:
- Games as caller vs. non-caller
- Caller success rate
- Average bid when calling
- Team win rate
- Total "breaks" caused

For Leekha:
- Total leekhas collected (Queen of Spades taken)
- Hearts collected (total)
- Times took 10 of Diamonds
- "Shot the moon" count (if applicable)
- Average points per round

**Step 1.3: Add stats caching layer**
- Compute stats on app launch or game completion
- Store in AsyncStorage: `@skorat_stats_cache_v1`
- Invalidate cache when games are added/modified
- Include cache timestamp for staleness checks

#### Phase 1B: Friends System (Local)

**Step 1.4: Define friends relationship**
```typescript
// Add to constants/types.ts
type FriendRelationship = {
  id: string;
  profileId: string;        // The friend's profile
  addedAt: string;          // ISO date
  nickname?: string;        // Optional custom name
  isFavorite: boolean;
};
```

**Step 1.5: Create friends storage service**
- New file: `services/friends_storage.ts`
- Methods: `addFriend()`, `removeFriend()`, `getFriends()`, `isFriend()`
- Storage key: `@skorat_friends_v1`

**Step 1.6: Auto-suggest friends from game history**
- Query all games for unique `profileId` values
- Exclude current user's profile
- Sort by frequency of play together
- Present as "People you've played with"

#### Phase 1C: Leaderboard UI

**Step 1.7: Create leaderboard screen**
- New file: `app/leaderboard.tsx`
- Tab-based navigation: Overall | 400 | Tarneeb | Leekha
- Sortable columns: Wins, Win%, Games Played
- Filter toggle: All Players | Friends Only

**Step 1.8: Player stats detail screen**
- New file: `app/player/[id].tsx`
- Show all lifetime stats for a single player
- Game history with that player
- Head-to-head record (if applicable)

**Step 1.9: Integrate with home screen**
- Add leaderboard icon/button to header
- Show mini-leaderboard widget on home (top 3)

#### Phase 1D: Achievements System (Optional)

**Step 1.10: Define achievements**
```typescript
type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;             // Emoji
  condition: (stats: PlayerLifetimeStats) => boolean;
  unlockedAt?: string;      // ISO date when earned
};
```

Example achievements:
- "First Blood" - Win your first game
- "Leekha Collector" - Collect 10 Queen of Spades
- "Bid Master" - 80%+ bid success rate over 50+ hands
- "Streak King" - Win 5 games in a row

---

## Feature 2: User Authentication & Account Sync

### Description
Allow users to create accounts, login across devices, and sync their game data. Enable connecting to local accounts on friends' devices for shared scoreboards.

### Feasibility Assessment

**Strengths:**
- Clean separation between `UserProfile` (local) and game data
- `profileId` system allows easy mapping to cloud accounts
- Expo supports multiple auth providers (Firebase, Supabase, Auth0)

**Challenges:**
- Requires backend infrastructure (database, auth service, API)
- Data sync conflict resolution is complex
- Privacy concerns with game data in the cloud
- Offline-first must be preserved (sync when online)

**Setbacks:**
- Significant infrastructure cost (hosting, database, auth service)
- Ongoing maintenance burden
- Security liability (storing user data)
- App store compliance requirements

**Improvements over current state:**
- Data backup (no more losing history)
- Cross-device continuity
- Shared games with friends on different devices

### Implementation Steps

#### Phase 2A: Backend Infrastructure

**Step 2.1: Choose backend stack**

Recommended: **Supabase** (PostgreSQL + Auth + Realtime)
- Free tier sufficient for MVP
- Built-in auth (email, Google, Apple)
- Row-level security for data isolation
- Realtime subscriptions for live sync
- Expo SDK available

Alternatives:
- Firebase (more complex, vendor lock-in)
- Custom backend (highest effort, most control)

**Step 2.2: Design database schema**
```sql
-- Users (extends local UserProfile)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ
);

-- Games (synced from device)
CREATE TABLE games (
  instance_id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  game_type TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT,
  data JSONB NOT NULL,        -- Full GameState
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player-Game relationships
CREATE TABLE game_players (
  game_instance_id TEXT REFERENCES games(instance_id),
  user_id UUID REFERENCES users(id),
  position INTEGER,
  PRIMARY KEY (game_instance_id, user_id)
);

-- Friends
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',  -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

**Step 2.3: Implement row-level security (RLS)**
- Users can only read/write their own data
- Games visible to all participants
- Friends list private to user

#### Phase 2B: Auth Implementation

**Step 2.4: Add Supabase client**
```bash
npm install @supabase/supabase-js
```

**Step 2.5: Create auth service**
- New file: `services/auth_service.ts`
- Methods: `signUp()`, `signIn()`, `signOut()`, `getSession()`, `onAuthStateChange()`
- Store session in SecureStore (not AsyncStorage)

**Step 2.6: Create auth UI**
- New file: `app/auth/login.tsx`
- New file: `app/auth/register.tsx`
- Social login buttons (Google, Apple)
- Email/password option
- "Continue as Guest" for offline-only users

**Step 2.7: Link local profile to cloud account**
```typescript
type UserProfile = {
  id: string;               // Local ID
  cloudId?: string;         // Supabase user ID (null if guest)
  name: string;
  avatar: string;
  email?: string;
  syncEnabled: boolean;
};
```

#### Phase 2C: Data Sync

**Step 2.8: Implement sync service**
- New file: `services/sync_service.ts`
- Bidirectional sync: local ↔ cloud
- Conflict resolution strategy: "last write wins" with timestamp
- Queue changes when offline, sync when online

**Step 2.9: Handle merge conflicts**
```typescript
type SyncConflict = {
  instanceId: string;
  localVersion: GameState;
  cloudVersion: GameState;
  resolvedBy: 'local' | 'cloud' | 'manual';
};
```

**Step 2.10: Add sync status UI**
- Sync indicator in header (cloud icon)
- Last synced timestamp in settings
- Manual "Sync Now" button
- Conflict resolution screen (if needed)

#### Phase 2D: Friend Device Linking

**Step 2.11: Generate shareable link/QR code**
- Friend shares their profile via QR or deep link
- Receiving device scans and sends friend request
- Both users see each other in friends list

**Step 2.12: Shared game creation**
- When creating game with synced friend, game syncs to both accounts
- Real-time updates via Supabase subscriptions
- Either player can add scores (with attribution)

---

## Feature 3: Social Network & Discovery

### Description
Transform Skorat into a social platform for card game enthusiasts. Features include a map to find nearby players, cafe/lounge event hosting, and community features.

### Feasibility Assessment

**Strengths:**
- Expo supports location services (`expo-location`)
- Map libraries available (react-native-maps)
- Could leverage existing leaderboard/friends infrastructure

**Challenges:**
- Location permissions are sensitive (user trust)
- Real-time location tracking = battery drain
- Venue partnerships require business development
- Moderation/safety concerns with meeting strangers
- Significant privacy/legal implications

**Setbacks:**
- Highest infrastructure cost (maps API, real-time location)
- GDPR/CCPA compliance for location data
- App store scrutiny for location-based social features
- Risk of misuse (harassment, stalking)
- Requires critical mass of users to be useful

**Improvements:**
- Viral growth potential (network effects)
- Differentiator from other scoreboard apps
- Potential B2B revenue (venue partnerships)

### Implementation Steps

#### Phase 3A: Location Infrastructure

**Step 3.1: Add location permissions**
```bash
npx expo install expo-location
```

**Step 3.2: Create location service**
- New file: `services/location_service.ts`
- Request permissions with clear explanation
- Get current location (one-time, not tracking)
- Geocoding for city/region display

**Step 3.3: Extend user profile with location**
```typescript
type UserProfile = {
  // ... existing fields
  location?: {
    lat: number;
    lng: number;
    city?: string;
    region?: string;
    updatedAt: string;
  };
  isDiscoverable: boolean;   // Opt-in to appear on map
};
```

**Step 3.4: Update database schema**
```sql
-- Add location to users
ALTER TABLE users ADD COLUMN location GEOGRAPHY(POINT);
ALTER TABLE users ADD COLUMN is_discoverable BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMPTZ;

-- Spatial index for nearby queries
CREATE INDEX users_location_idx ON users USING GIST(location);
```

#### Phase 3B: Nearby Players Map

**Step 3.5: Add map library**
```bash
npx expo install react-native-maps
```

**Step 3.6: Create discovery screen**
- New file: `app/discover/index.tsx`
- Map view with player markers
- List view alternative
- Filter by: distance, games played, availability

**Step 3.7: Implement nearby query**
```sql
-- Find players within X km
SELECT * FROM users
WHERE is_discoverable = TRUE
  AND ST_DWithin(
    location,
    ST_MakePoint($lng, $lat)::geography,
    $radius_meters
  )
ORDER BY location <-> ST_MakePoint($lng, $lat)::geography
LIMIT 50;
```

**Step 3.8: Privacy controls**
- Fuzzy location (city-level, not exact)
- Visibility settings (friends only, everyone, nobody)
- "Ghost mode" to hide temporarily
- Block/report functionality

#### Phase 3C: Venue System

**Step 3.9: Define venue types**
```typescript
type Venue = {
  id: string;
  name: string;
  type: 'cafe' | 'lounge' | 'club' | 'home';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  ownerId: string;          // User who registered venue
  isVerified: boolean;      // Staff-verified
  amenities: string[];      // 'wifi', 'food', 'drinks', etc.
  photos: string[];
  rating: number;
  reviewCount: number;
};
```

**Step 3.10: Create venue database tables**
```sql
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  address TEXT,
  owner_id UUID REFERENCES users(id),
  is_verified BOOLEAN DEFAULT FALSE,
  amenities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 3.11: Venue registration flow**
- New file: `app/venues/register.tsx`
- Owner claims venue
- Staff verification process (manual)
- Venue profile page

#### Phase 3D: Events System

**Step 3.12: Define event structure**
```typescript
type Event = {
  id: string;
  venueId?: string;         // Optional (can be private)
  hostId: string;
  title: string;
  description: string;
  gameType: '400' | 'tarneeb' | 'leekha' | 'mixed';
  startTime: string;
  endTime?: string;
  maxParticipants?: number;
  currentParticipants: string[];  // User IDs
  isPublic: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
};
```

**Step 3.13: Events database tables**
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  host_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  game_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'registered',  -- registered, attended, no-show
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);
```

**Step 3.14: Event UI screens**
- `app/events/index.tsx` - Browse events
- `app/events/[id].tsx` - Event detail
- `app/events/create.tsx` - Create event
- Integration with venue pages

**Step 3.15: Event notifications**
- Push notifications for event reminders
- New event alerts for followed venues/users
- Event chat/discussion (optional)

#### Phase 3E: Moderation & Safety

**Step 3.16: Report system**
```typescript
type Report = {
  id: string;
  reporterId: string;
  targetType: 'user' | 'venue' | 'event' | 'review';
  targetId: string;
  reason: 'harassment' | 'spam' | 'inappropriate' | 'safety' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
};
```

**Step 3.17: Moderation tools**
- Admin dashboard (web)
- Report queue processing
- User banning/suspension
- Content removal
- Appeal process

**Step 3.18: Safety features**
- In-app messaging (no phone number sharing)
- Meeting safety tips
- Check-in feature for events
- Emergency contact option

---

## Technical Dependencies Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE DEPENDENCIES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │   LEADERBOARD    │  ← Can start immediately (local-first)    │
│  │   (Phase 1)      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           │ Enables cloud leaderboards                          │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  AUTHENTICATION  │  ← Requires backend infrastructure        │
│  │    (Phase 2)     │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           │ Required for all social features                    │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ SOCIAL NETWORK   │  ← Requires auth + location + venues      │
│  │    (Phase 3)     │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Shared Infrastructure Needed

| Component | Phase 1 | Phase 2 | Phase 3 |
|-----------|---------|---------|---------|
| Stats caching | Required | Enhanced | Enhanced |
| Friends list | Local | Synced | Social graph |
| Backend database | - | Required | Extended |
| Auth service | - | Required | Required |
| Push notifications | - | Optional | Required |
| Location services | - | - | Required |
| Maps integration | - | - | Required |
| Moderation system | - | - | Required |

---

## Risk Assessment

### Low Risk (Phase 1 - Leaderboard)
- No backend required initially
- Builds on existing code
- Reversible if users don't engage

### Medium Risk (Phase 2 - Auth)
- Infrastructure costs
- Security responsibility
- Sync bugs can cause data loss
- Mitigation: Use proven provider (Supabase)

### High Risk (Phase 3 - Social)
- Privacy/legal liability
- Moderation burden
- Safety concerns
- Network effect dependency (needs users to be useful)
- Mitigation: Launch as invite-only beta first

---

## Success Metrics

### Phase 1: Leaderboard
- % of users who view leaderboard weekly
- % of users who add friends
- Engagement time increase

### Phase 2: Authentication
- % of users who create accounts
- Cross-device usage rate
- Sync success rate
- Data loss incidents (target: 0)

### Phase 3: Social
- New user acquisition via social features
- Event attendance rate
- Venue partnership sign-ups
- Report/incident rate (lower = better)

---

## Estimated Timeline

> Note: Actual timelines depend on team size and resources.

| Phase | Features | Prerequisites |
|-------|----------|---------------|
| 1A | Extended stats | None |
| 1B | Local friends | 1A |
| 1C | Leaderboard UI | 1A, 1B |
| 1D | Achievements | 1A |
| 2A | Backend setup | External (Supabase) |
| 2B | Auth UI | 2A |
| 2C | Data sync | 2A, 2B |
| 2D | Friend linking | 2C, 1B |
| 3A | Location service | 2B |
| 3B | Discovery map | 3A, 2A |
| 3C | Venues | 3B |
| 3D | Events | 3C |
| 3E | Moderation | 3D |

---

## Open Questions

1. **Monetization**: Will any features be premium/paid?
2. **Privacy stance**: How much location data to collect?
3. **Target markets**: Global launch or regional first?
4. **Venue partnerships**: Revenue share model?
5. **Moderation**: In-house vs. outsourced?
6. **Offline priority**: How to handle sync conflicts?

---

*Last updated: January 2026*
*Author: Generated for Skorat development roadmap*
