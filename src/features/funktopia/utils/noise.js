/**
 * Perlin Noise Implementation
 * Based on Ken Perlin's improved noise algorithm
 */

class PerlinNoise {
  constructor(seed = Math.random()) {
    this.seed = seed;
    this.p = this.generatePermutation();
  }

  generatePermutation() {
    const p = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle using seed
    let n = 256;
    while (n > 1) {
      const k = Math.floor(this.random() * n);
      n--;
      const temp = p[n];
      p[n] = p[k];
      p[k] = temp;
    }

    // Duplicate for overflow
    for (let i = 0; i < 256; i++) {
      p[256 + i] = p[i];
    }

    return p;
  }

  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }
}

// Global instance
let perlinInstance = null;

export function getPerlin(seed) {
  if (!perlinInstance || perlinInstance.seed !== seed) {
    perlinInstance = new PerlinNoise(seed);
  }
  return perlinInstance;
}

export function perlin3(x, y, z, seed = 12345) {
  const perlin = getPerlin(seed);
  return perlin.noise(x, y, z);
}

export function fractalNoise(x, y, z, octaves = 4, persistence = 0.5, lacunarity = 2, seed = 12345) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += perlin3(x * frequency, y * frequency, z * frequency, seed) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}
