/**
 * Materials — the store's theme, kept as data so the whole shop repaints from
 * one source of truth.
 *
 * Two worlds, one shop. The day is a warm greige room (never pure white), the
 * night a cool olive wall — a green-leaning dark that makes the warm objects
 * and champagne light read as lit. In both, photography owns the screen and
 * the interface stays quiet; a shop has one setting per visitor, chosen by
 * their system and overridable in the footer.
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

/** Day — the greige room. */
export const materials: Materials = {
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

/** Night — the olive wall, chosen in the lighting tests (#1a1e1b). */
export const nightMaterials: Materials = {
  room: '#1a1e1b',
  room2: '#161a17',
  room3: '#3a403a',
  exhibit: '#20241f',
  exhibit2: '#1f231e',
  ink: '#f2efe6',
  ink2: '#b5b0a4',
  ink3: '#8f8a7e',
  roomInk: '#f2efe6',
  roomInk2: '#b5b0a4',
  roomInk3: '#8f8a7e',
  deep: '#121512',
  deepInk: '#f2efe6',
  deepInk2: '#b5b0a4',
  accent: '#b08d57',
  accentD: '#c9a97a',
  accentL: '#dcc39a',
  signal: '#d0664d',
  hairline: 'rgba(242, 239, 230, 0.14)',
  hairlineInk: 'rgba(242, 239, 230, 0.18)',
  scrim: '#0c0e0c',
  onPhoto: '#f7f5ef',
};

/** Serialises the materials into the CSS custom properties the app reads. */
export const themeVars = (m: Materials): string =>
  [
    `--wq-room:${m.room}`,
    `--wq-room-2:${m.room2}`,
    `--wq-room-3:${m.room3}`,
    `--wq-exhibit:${m.exhibit}`,
    `--wq-exhibit-2:${m.exhibit2}`,
    `--wq-ink:${m.ink}`,
    `--wq-ink-2:${m.ink2}`,
    `--wq-ink-3:${m.ink3}`,
    `--wq-room-ink:${m.roomInk}`,
    `--wq-room-ink-2:${m.roomInk2}`,
    `--wq-room-ink-3:${m.roomInk3}`,
    `--wq-deep:${m.deep}`,
    `--wq-deep-ink:${m.deepInk}`,
    `--wq-deep-ink-2:${m.deepInk2}`,
    `--wq-accent:${m.accent}`,
    `--wq-accent-d:${m.accentD}`,
    `--wq-accent-l:${m.accentL}`,
    `--wq-signal:${m.signal}`,
    `--wq-hairline:${m.hairline}`,
    `--wq-hairline-ink:${m.hairlineInk}`,
    `--wq-scrim:${m.scrim}`,
    `--wq-on-photo:${m.onPhoto}`,
  ].join(';');
