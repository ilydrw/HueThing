# HueThing redesign plan

## Goal

Make HueThing feel like a native Philips Hue mobile experience adapted to the Spotify Car Thing: calm, glanceable, tactile, and focused on rooms, scenes, and fast whole-room control. Preserve the real DeskThing/Hue behavior already implemented; this is a client information-architecture and interaction redesign, not a backend rewrite.

## Current scope audit

### Already working seams to preserve

- DeskThing client/server messaging and lifecycle in `src/lib/deskthingClient.ts` and `server/`.
- Hue state hydration, optimistic light/room/all-lights updates, pairing, scene activation, and sync actions in `src/state/`.
- Existing pages for pairing, home/dashboard, room detail, color picking, and entertainment sync.
- Preview mode through `src/dev/previewState.ts`, which should remain the visual-development harness.
- Car Thing layout constants in `src/theme/carThing.ts`.

### Current UX constraints

- The app is a fixed-size, touch/rotary-oriented surface; it cannot assume a phone viewport or hover.
- The current top navigation gives Sync equal prominence with Home and hides on scroll. This makes the primary Hue mental model less stable.
- Dashboard cards combine navigation, brightness gestures, and power toggles. That is efficient when understood, but discoverability and focus states need improvement.
- Room detail already contains the strongest foundation for a Hue-style flow: master brightness, scenes, and individual lights.
- Color controls are modal and should remain reachable without making color the default path for every light.
- `typecheck` currently passes; existing worktree changes are extensive and must not be overwritten during the redesign.

## Target information architecture

```text
App shell
├── Home (default)
│   ├── All lights quick control
│   ├── Rooms / zones
│   └── Favorites / recent scenes
├── Room detail
│   ├── Room power + brightness
│   ├── Scene rail
│   └── Light list → light detail / color
├── Scene focus (optional second slice)
│   └── Apply scene, show room context, undo affordance
└── More / Sync
    ├── Entertainment areas
    ├── Connection status
    └── Pairing / refresh / diagnostics
```

The first implementation slice should keep Sync behind a secondary action or More surface. Pairing remains a full-screen flow. The user should always have an obvious Back affordance when entering a room or light detail surface.

## Visual direction

- Use Hue-like calm surfaces: warm white text, graphite backgrounds, restrained borders, and color coming primarily from actual room/light state.
- Replace decorative gradients with meaningful light-state gradients. Off state must remain legible and low contrast.
- Establish a compact 8px spacing rhythm and a small, named token set for surface, text, accent, danger, radius, and control heights.
- Use one persistent shell/header treatment instead of multiple competing brand and navigation treatments.
- Keep sections horizontally browsable where useful, but make the focused item and current value obvious without requiring a gesture.
- Treat motion as feedback: short press state, power transition, scene application, and panel navigation. Avoid continuous ambient animation on the main screen.

## Interaction model for Car Thing

### Touch

- Tap a room to open it.
- Tap the power affordance to toggle without opening the room.
- Drag a brightness control; show the value while dragging and commit once at the end.
- Tap a light to open its detail/color surface.
- Use explicit Back and Close controls; do not make edge swipes the only exit.

### Rotary knob / physical controls

- Knob on Home: move focus through rooms and primary controls; press to open or activate.
- Knob in a room: adjust the focused brightness control; press to toggle/open depending on focus type.
- Back button: return to the previous surface and restore focus.
- Map actions through the existing DeskThing action path where available; do not invent a second hardware protocol.

### Feedback and failure states

- Optimistic updates remain, but show a subtle pending state for controls awaiting bridge confirmation.
- Offline state must be persistent in the shell and disable or explain unavailable actions.
- If a scene or color command fails, retain the last confirmed value and expose a concise retry action.
- Empty rooms, no scenes, no lights, pairing, and bridge discovery each need designed states rather than generic blank space.

## Implementation slices

### Slice 0 — foundation and instrumentation

- Add the redesigned shell/navigation state without changing Hue message contracts.
- Centralize Car Thing design tokens and control sizing under `src/theme/`.
- Add a small interaction-state vocabulary: `idle`, `focused`, `pressed`, `pending`, `disabled`, `offline`.
- Make preview fixtures cover: many rooms, no rooms, mixed color/white lights, all-off, offline, pending action, and empty scenes.
- Capture a baseline screenshot/manual checklist for the current preview before visual changes.

### Slice 1 — Home

- Replace the current dashboard header/top tabs with a stable Hue-style Home shell.
- Make All lights a compact hero control with explicit brightness affordance, not only a toggle.
- Introduce room rows/cards with separate open, power, and brightness hit targets.
- Add a compact scenes rail below rooms; keep scene activation wired to `actions.activateScene`.
- Verify keyboard/touch focus order and no clipped content at the actual Car Thing viewport.

### Slice 2 — Room detail

- Retain `RoomPageView` as the behavior base and restyle it into a native-feeling room surface.
- Promote master brightness and room power to the first interaction zone.
- Make scenes horizontally scannable with selected/pressed feedback.
- Replace ambiguous vertical-light gestures with a clearly labeled light list/control row while retaining direct brightness adjustment.
- Keep color picker entry explicit and preserve `hasColor` / `hasColorTemp` capability checks.

### Slice 3 — Light detail and color

- Give a selected light a focused detail surface with power, brightness, color temperature, and color controls appropriate to its capabilities.
- Preserve the existing `setLightState` and `setLightColor` paths; add pending/error presentation at the store boundary if needed.
- Ensure modal close/back restores the previous room focus and scroll position.

### Slice 4 — Secondary features and hardening

- Move Sync into a secondary surface while retaining its current start/stop behavior.
- Add a connection/settings surface for refresh, bridge identity, and pairing recovery.
- Exercise reconnect, stale state, malformed/empty backend payloads, and repeated activation.
- Perform a physical Car Thing pass for knob focus, button mapping, viewport fit, and wake/resume behavior.

## Suggested component scaffold

The existing components can migrate incrementally into this shape:

```text
src/
├── app/
│   ├── AppShell.tsx          # stable shell, route stack, global status
│   └── navigation.ts         # typed surface/focus transitions
├── features/
│   ├── home/                 # HomeSurface, AllLightsControl, RoomList
│   ├── room/                 # RoomSurface, RoomMasterControl, SceneRail
│   ├── light/                # LightSurface, LightControls, ColorSurface
│   └── sync/                 # secondary Sync surface
├── components/               # shared visual controls during migration
├── state/                    # existing Hue store and DeskThing actions
└── theme/                    # Car Thing geometry + Hue visual tokens
```

Do not move every existing file in one change. Start by introducing `AppShell` and typed navigation, then migrate one surface at a time. Keep current component paths as compatibility boundaries until each slice is verified.

## Acceptance criteria

- A first-time user can pair, see rooms, open a room, toggle it, change brightness, activate a scene, and return home without guessing gestures.
- A returning user can turn all lights on/off and reach a favorite room within two interactions.
- Every control has visible focused, pressed, disabled, pending, and offline behavior where applicable.
- No control overlaps the Car Thing viewport, and text remains readable at native scale.
- Existing pairing, Hue state updates, optimistic controls, scenes, color capabilities, and Sync continue to work.
- `npm run typecheck`, `npm run build`, and the preview/manual interaction checklist pass for each slice.

## Immediate next implementation task

Implement Slice 0 and the first half of Slice 1: add the shell/navigation scaffold and token layer, then switch Home to the new stable shell while leaving RoomPageView, PairingFlow, ColorPicker, and SyncDashboard behaviorally intact. This creates a reviewable visual checkpoint before deeper component migration.
