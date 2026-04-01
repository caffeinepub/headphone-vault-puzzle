# Headphone Vault Puzzle

## Current State
New project with empty backend and no frontend implemented.

## Requested Changes (Diff)

### Add
- Realistic animated vault UI (combination dial + locked door) centered on screen
- Headphone/audio output device detection using `navigator.mediaDevices.enumerateDevices` and `devicechange` events
- Vault open/close animations triggered by headphone connect/disconnect
- Glowing "You beat the puzzle!" reveal text inside open vault
- Atmospheric ambient sound (Web Audio API generated drone/tone) that plays when vault is open
- Spinning combination dial idle animation
- Dark, mysterious atmospheric background with subtle particle effects or fog
- Hint text prompting user to plug in headphones

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Minimal backend (no persistent state needed -- pure frontend puzzle)
2. Frontend: CSS-heavy vault component with SVG or div-based vault door + dial
3. Headphone detection: poll `navigator.mediaDevices.enumerateDevices()` and listen to `devicechange` event, filter for `audiooutput` devices labeled as headphones or detect device count changes
4. Vault animation: CSS keyframe transitions for door swing open, dial spin, lock click
5. Web Audio API: generate ambient drone/tone using OscillatorNode for atmosphere
6. Reveal text: glowing CSS animation inside open vault interior
7. Background: dark gradient with CSS animated particles or radial glow pulses
