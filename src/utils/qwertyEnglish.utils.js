// Minimal QWERTY keyboard layout used by <Keyboard />.
// The original project had richer metadata (sounds, variants). This keeps the UI functional.

const row1 = {
  Q: { keyAssociated: 'q', shiftValue: 'Q' },
  W: { keyAssociated: 'w', shiftValue: 'W' },
  E: { keyAssociated: 'e', shiftValue: 'E' },
  R: { keyAssociated: 'r', shiftValue: 'R' },
  T: { keyAssociated: 't', shiftValue: 'T' },
  Y: { keyAssociated: 'y', shiftValue: 'Y' },
  U: { keyAssociated: 'u', shiftValue: 'U' },
  I: { keyAssociated: 'i', shiftValue: 'I' },
  O: { keyAssociated: 'o', shiftValue: 'O' },
  P: { keyAssociated: 'p', shiftValue: 'P' },
};

const row2 = {
  A: { keyAssociated: 'a', shiftValue: 'A' },
  S: { keyAssociated: 's', shiftValue: 'S' },
  D: { keyAssociated: 'd', shiftValue: 'D' },
  F: { keyAssociated: 'f', shiftValue: 'F' },
  G: { keyAssociated: 'g', shiftValue: 'G' },
  H: { keyAssociated: 'h', shiftValue: 'H' },
  J: { keyAssociated: 'j', shiftValue: 'J' },
  K: { keyAssociated: 'k', shiftValue: 'K' },
  L: { keyAssociated: 'l', shiftValue: 'L' },
};

const row3 = {
  Shift: { eyeDee: 'shift' },
  Z: { keyAssociated: 'z', shiftValue: 'Z' },
  X: { keyAssociated: 'x', shiftValue: 'X' },
  C: { keyAssociated: 'c', shiftValue: 'C' },
  V: { keyAssociated: 'v', shiftValue: 'V' },
  B: { keyAssociated: 'b', shiftValue: 'B' },
  N: { keyAssociated: 'n', shiftValue: 'N' },
  M: { keyAssociated: 'm', shiftValue: 'M' },
  Delete: { eyeDee: 'deleteDesktop', keyAssociated: '{delete}' },
};

const row4 = {
  Space: { eyeDee: 'space', keyAssociated: ' ' },
  Submit: { eyeDee: 'submitDesktop', keyAssociated: '{enter}' },
};

export default [row1, row2, row3, row4];

