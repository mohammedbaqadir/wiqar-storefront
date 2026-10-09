/**
 * Materials — the store's theme, kept as data so the whole shop repaints from
 * one source of truth.
 *
 * One world: the night gallery. A cool olive wall (chosen in the lighting
 * tests) makes the warm objects and champagne light read as lit; photographs
 * own the screen, each on its own pool of light, and the interface stays
 * quiet. There is no light mode.
 *
 * Roles:
 *   room*     — the ground: page, quiet strips, the service bar
 *   exhibit*  — surfaces that sit above the wall: cards, drawers, fields
 *   ink*      — ink on exhibits
 *   roomInk*  — ink on the wall
 *   deep*     — the footer band
 *   accent*   — the store's one colour, used sparingly (rules, active marks)
 *   signal    — the one red: a fact past its limit (last units)
 *   scrim     — the always-dark veil over photographs (hero, cart overlay)
 *   onPhoto   — light ink that sits on photographs
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

export const materials: Materials = {
  room: '#1a1e1b',
  room2: '#161a17',
  room3: '#3a403a',
  exhibit: '#20241f',
  exhibit2: '#1f231e',
  ink: '#f2efe6',
  ink2: '#c7c2b4',
  ink3: '#a6a194',
  roomInk: '#f2efe6',
  roomInk2: '#c7c2b4',
  roomInk3: '#a6a194',
  deep: '#121512',
  deepInk: '#f2efe6',
  deepInk2: '#c0bbae',
  accent: '#b08d57',
  accentD: '#c9a97a',
  accentL: '#dcc39a',
  signal: '#d0664d',
  hairline: 'rgba(242, 239, 230, 0.16)',
  hairlineInk: 'rgba(242, 239, 230, 0.2)',
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
