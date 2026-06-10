# Specification for Flying Kitty - Cloudy Search Game

## Overview
This document outlines the requirements for implementing the correct "Flying Kitty" game mechanics as originally planned, where players control Flying Kitty to find Cloudy hidden among 40 clouds.

## Game Requirements

### Core Gameplay Elements
1. **Player Character**: Flying Kitty sprite positioned at start of level
2. **Clouds**:
    - 40 clouds positioned in fixed locations across the screen
    - Each cloud is a clickable interactive element
3. **Cloudy Character**:
    - Hidden behind exactly one of the 40 clouds
    - Represented by a different sprite (cloudy.png)
4. **Objective**: Player must click on clouds to search for Cloudy
5. Kitty has 10 minutes to fine Cloudy, if not found in 10 minutes Cloudy gets lost in clouds forver
6. the counter should count remaning time
7. score starts from 9999 and goes down by 10 for each checked cloud, same cloud checked twice still decrements the score. the minimal possible score is 1, so last decrement will be 3

### Game Mechanics

#### Cloud Placement
- 40 clouds positioned at fixed coordinates across the game area
- Clouds should be distributed to provide good visual coverage
- Cloud positions should be calculated to avoid overlapping or too close together

#### Cloudy Placement
- Cloudy is randomly hidden behind one of the 40 clouds (at game start)
- Cloudy sprite replaces the regular cloud sprite at that position
- Cloudy should be visually distinct from regular clouds

#### Player Interaction
- Player controls Flying Kitty with arrow keys (as in current implementation) and WASD
- Clicking on a cloud triggers search logic:
    - If clicked cloud has Cloudy: Show success message, end game with win condition
    - If clicked cloud doesn't have Cloudy: Show failure message, continue gameplay, decrement score by 5

#### UI Elements
1. **Start Screen**:
    - "Press SPACE to Start" message
2. **Game Over Screen**:
    - Win/lose messages
    - Time spent
    - replay button
    - Score display
3. **Status Messages**:
    - "Cloudy found!" when successful
    - "No Cloudy here." when unsuccessful

### Technical Requirements

#### Assets Needed
1. `flying-kitty.png` - Player character sprite
2. `cloud.png` - Regular cloud sprite
3. `cloudy.png` - Cloudy character sprite (to be used for hiding)

#### Implementation Details
- Clouds should be created as Phaser.Sprite objects with interactive capabilities
- Each cloud needs to have a pointerdown event handler
- Cloudy position is determined at game start using random number between 0-39
- When Cloudy is found, the game should end with win state
- if not found in 10 minutes the should show the game over/ try again screen
- allow to run in debug mode with an env var allowing to highlight winning cloud with red border

#### Tech stack
- Babylon.js
- node, prefer 20 since pre-installed, can install newer if needed for better support
- Typescript, the latest supported by Babylon
- PWA support targeting native ipad resolutions and horizonal resolutions of Android phones

## Clarified Requirements (resolved 2026-06-09)

These decisions resolve contradictions and gaps found in the original spec:

1. **Score penalty is 5 per checked cloud** (not 10). This matches the original
   math: 9999 → 9994 → … → 4 → 1, where the final decrement is exactly 3.
   Score floor is 1. Re-checking the same cloud still decrements.
2. **Engine is Babylon.js in 3D.** The mention of `Phaser.Sprite` is obsolete.
   The bundled PNGs are inspiration/sprites: Kitty and Cloudy are textured
   billboards in a 3D sky; the 40 clouds are procedural 3D cloud blobs.
3. **Kitty's movement is the core mechanic.** Clicking a cloud only works when
   Kitty is close to it. When Kitty is near a cloud it highlights; press SPACE
   or click/tap the cloud to peek inside. On touch devices, press-and-drag
   steers Kitty toward the pointer.
4. **Checked clouds gray out** so the player remembers them, but remain
   clickable (and still cost points).
5. **"Hidden behind" interpretation:** Cloudy is revealed at the winning
   cloud's position when that cloud is checked (the cloud fades, Cloudy pops out).
6. **Score and remaining time are both visible during gameplay.**
7. **Debug mode:** build-time env var `VITE_DEBUG=1` or URL param `?debug=1`
   draws a red outline around the winning cloud.
8. **PWA:** full-screen responsive canvas, landscape orientation in the
   manifest, installable on iPad and Android.
9. **Scaled up (2026-06-09):** cloud count increased from 40 to 100
   (10×10 grid on an enlarged field). Cloudy is re-hidden behind a new
   random cloud at the start of every game, including replays.
10. **Time penalty (2026-06-09):** in addition to −5 per checked cloud, the
    score drops by 5 points per second of elapsed time (floor stays at 1).
    Score and timer are shown in a large bold yellow font; the timer turns
    red during the final minute. 