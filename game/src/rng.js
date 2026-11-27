// rng.js — a tiny seeded random generator so screenshots and replays are
// deterministic: the same seed always builds the same farm, barn and kitchen.

export function makeRng(seed) {
  let state = seed >>> 0 || 1;
  return {
    // Next float in [0, 1).
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state / 4294967296;
    },
    // Integer in [min, max] inclusive.
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    // Pick one element of an array.
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    // True with the given probability.
    chance(p) {
      return this.next() < p;
    },
  };
}

// Read ?seed= from the page URL, defaulting to 1.
export function seedFromUrl() {
  const raw = new URLSearchParams(location.search).get('seed');
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
