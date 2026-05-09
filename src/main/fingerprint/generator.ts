import type { FingerprintConfig, OS } from '@shared/types'
import {
  CHROME_VERSIONS,
  COMMON_FONTS,
  SCREEN_PRESETS,
  TIMEZONE_BY_LOCALE,
  UA_PRESETS,
  WEBGL_VENDOR_RENDERER
} from './presets'

/**
 * Deterministic mulberry32 PRNG so a fixed seed reproduces a fingerprint.
 */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

export interface GenerateOptions {
  os?: OS
  locale?: string
  /** seed used for deterministic generation */
  seed?: number
  /** override timezone */
  timezone?: string
}

export function generateFingerprint(opts: GenerateOptions = {}): FingerprintConfig {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31)
  const rnd = mulberry32(seed)

  const presets = opts.os ? UA_PRESETS.filter((p) => p.os === opts.os) : UA_PRESETS
  const preset = pick(presets, rnd)
  const browserVersion = pick(CHROME_VERSIONS, rnd)
  const userAgent = preset.uaTemplate(browserVersion)
  const screen = pick(SCREEN_PRESETS, rnd)
  const locale = opts.locale ?? pick(Object.keys(TIMEZONE_BY_LOCALE), rnd)
  const timezone = opts.timezone ?? TIMEZONE_BY_LOCALE[locale] ?? 'UTC'
  const webgl = pick(WEBGL_VENDOR_RENDERER, rnd)

  // Choose a realistic subset of common fonts
  const fontCount = 12 + Math.floor(rnd() * 6)
  const fonts: string[] = []
  const pool = [...COMMON_FONTS]
  for (let i = 0; i < fontCount && pool.length; i++) {
    const idx = Math.floor(rnd() * pool.length)
    fonts.push(pool.splice(idx, 1)[0])
  }
  fonts.sort()

  const taskbar = preset.os === 'macos' ? 25 : preset.os === 'windows' ? 40 : 27
  const cores = pick([4, 6, 8, 8, 12, 16], rnd)
  const memory = pick([4, 8, 8, 16, 16, 32], rnd)

  return {
    userAgent,
    os: preset.os,
    browser: 'chrome',
    browserVersion,
    locale,
    languages: locale === 'en-US' ? ['en-US', 'en'] : [locale, locale.split('-')[0], 'en'],
    timezone,
    geolocation: null,
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.width,
      availHeight: screen.height - taskbar,
      colorDepth: 24,
      pixelDepth: 24,
      devicePixelRatio: screen.ratio
    },
    hardwareConcurrency: cores,
    deviceMemory: memory,
    canvas: 'noise',
    webgl: { mode: 'noise', vendor: webgl.vendor, renderer: webgl.renderer },
    audio: 'noise',
    webrtc: 'altered',
    fonts,
    mediaDevices: {
      videoinputs: 1,
      audioinputs: 1,
      audiooutputs: 1
    },
    noiseSeed: seed
  }
}
