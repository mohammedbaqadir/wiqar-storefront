/**
 * Materials — the store's theme, kept as data so the whole shop repaints from
 * one source of truth.
 *
 * Two worlds, one shop. Day is the warm greige room — the original, kept as it
 * was. Night is the blue hour — the same room at dusk: a mid slate ground,
 * bone ink and brass lamplight, photographs still the brightest thing in the
 * shop. The light day is the default; the lamp in the footer opens the night
 * for the visitors who prefer it.
 *
 * Roles:
 *   room*     — the ground: page, quiet strips, the service bar
 *   exhibit*  — product surfaces: photo mounts and panels
 *   ink*      — ink on exhibits
 *   roomInk*  — ink on the room
 *   deep*     — the footer band
 *   accent*   — the store's one colour, used sparingly (rules, active marks)
 *   signal    — the one red: a fact past its limit (last units)
 *   scrim     — the always-dark veil over photographs (hero, cart overlay)
 *   onPhoto   — light ink that sits on photographs, whatever the world
 */

export interface Materials {
  room: string;
  room2: string;
  room3: string;
  exhibit: string;
  exhibit2: string;
  ink: string;
  ink2: string;
  ink3: string;
  roomInk: string;
  roomInk2: string;
  roomInk3: string;
  deep: string;
  deepInk: string;
  deepInk2: string;
  accent: string;
  accentD: string;
  accentL: string;
  signal: string;
  hairline: string;
  hairlineInk: string;
  scrim: string;
  onPhoto: string;
}

/** Day — the greige room, unchanged. */
export const dayMaterials: Materials = {
  room: '#edeae3',
  room2: '#e4e0d6',
  room3: '#cfcabd',
  exhibit: '#f7f5ef',
  exhibit2: '#ece8de',
  ink: '#111110',
  ink2: '#3f3f3c',
  ink3: '#60605b',
  roomInk: '#111110',
  roomInk2: '#3f3f3c',
  roomInk3: '#60605b',
  deep: '#1c1b19',
  deepInk: '#f2efe6',
  deepInk2: '#b5b0a4',
  accent: '#b08d57',
  accentD: '#7a5c30',
  accentL: '#c9a97a',
  signal: '#9c3221',
  hairline: 'rgba(17, 17, 16, 0.14)',
  hairlineInk: 'rgba(17, 17, 16, 0.14)',
  scrim: '#111110',
  onPhoto: '#f7f5ef',
};

/** Night — the blue hour: mid slate ground, bone ink, brass lamplight (#4c5668). */
export const nightMaterials: Materials = {
  room: '#4c5668',
  room2: '#454f61',
  room3: '#6b7586',
  exhibit: '#576173',
  exhibit2: '#505a6c',
  ink: '#f8f4ea',
  ink2: '#e8e0ce',
  ink3: '#e3dbc6',
  roomInk: '#f8f4ea',
  roomInk2: '#e8e0ce',
  roomInk3: '#e3dbc6',
  deep: '#3b4554',
  deepInk: '#f8f4ea',
  deepInk2: '#d9d2c0',
  accent: '#c9a670',
  accentD: '#e0bd84',
  accentL: '#ecd3a2',
  signal: '#f9bfa6',
  hairline: 'rgba(246, 242, 232, 0.2)',
  hairlineInk: 'rgba(246, 242, 232, 0.26)',
  scrim: '#333a45',
  onPhoto: '#f7f5ef',
};

/** Serialises the materials into the CSS custom properties the app reads. */
export const themeVars = (materials: Materials): string =>
  [
    `--wq-room:${materials.room}`,
    `--wq-room-2:${materials.room2}`,
    `--wq-room-3:${materials.room3}`,
    `--wq-exhibit:${materials.exhibit}`,
    `--wq-exhibit-2:${materials.exhibit2}`,
    `--wq-ink:${materials.ink}`,
    `--wq-ink-2:${materials.ink2}`,
    `--wq-ink-3:${materials.ink3}`,
    `--wq-room-ink:${materials.roomInk}`,
    `--wq-room-ink-2:${materials.roomInk2}`,
    `--wq-room-ink-3:${materials.roomInk3}`,
    `--wq-deep:${materials.deep}`,
    `--wq-deep-ink:${materials.deepInk}`,
    `--wq-deep-ink-2:${materials.deepInk2}`,
    `--wq-accent:${materials.accent}`,
    `--wq-accent-d:${materials.accentD}`,
    `--wq-accent-l:${materials.accentL}`,
    `--wq-signal:${materials.signal}`,
    `--wq-hairline:${materials.hairline}`,
    `--wq-hairline-ink:${materials.hairlineInk}`,
    `--wq-scrim:${materials.scrim}`,
    `--wq-on-photo:${materials.onPhoto}`,
  ].join(';');
