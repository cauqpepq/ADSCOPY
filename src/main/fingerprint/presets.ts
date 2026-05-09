/**
 * Presets of realistic device + browser combinations.
 * Used to bootstrap new fingerprints; the generator can also be used freeform.
 */
import type { OS } from '@shared/types'

export interface UAPreset {
  label: string
  os: OS
  osVersionLabel: string
  browserMajor: number
  uaTemplate: (browserMajor: number) => string
}

export const CHROME_VERSIONS = [128, 129, 130, 131, 132]

export const UA_PRESETS: UAPreset[] = [
  {
    label: 'Windows 11 / Chrome',
    os: 'windows',
    osVersionLabel: 'Windows 11',
    browserMajor: 131,
    uaTemplate: (v) =>
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`
  },
  {
    label: 'Windows 10 / Chrome',
    os: 'windows',
    osVersionLabel: 'Windows 10',
    browserMajor: 130,
    uaTemplate: (v) =>
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`
  },
  {
    label: 'macOS 14 / Chrome',
    os: 'macos',
    osVersionLabel: 'macOS 14',
    browserMajor: 131,
    uaTemplate: (v) =>
      `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`
  },
  {
    label: 'Linux / Chrome',
    os: 'linux',
    osVersionLabel: 'Linux x86_64',
    browserMajor: 130,
    uaTemplate: (v) =>
      `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`
  }
]

export interface ScreenPreset {
  width: number
  height: number
  ratio: number
}

export const SCREEN_PRESETS: ScreenPreset[] = [
  { width: 1920, height: 1080, ratio: 1 },
  { width: 1600, height: 900, ratio: 1 },
  { width: 1536, height: 864, ratio: 1.25 },
  { width: 1440, height: 900, ratio: 1 },
  { width: 1366, height: 768, ratio: 1 },
  { width: 2560, height: 1440, ratio: 1 },
  { width: 1280, height: 720, ratio: 1 }
]

export const TIMEZONE_BY_LOCALE: Record<string, string> = {
  'en-US': 'America/New_York',
  'en-GB': 'Europe/London',
  'de-DE': 'Europe/Berlin',
  'fr-FR': 'Europe/Paris',
  'ru-RU': 'Europe/Moscow',
  'es-ES': 'Europe/Madrid',
  'pt-BR': 'America/Sao_Paulo',
  'ja-JP': 'Asia/Tokyo',
  'zh-CN': 'Asia/Shanghai',
  'tr-TR': 'Europe/Istanbul'
}

export const COMMON_LOCALES = Object.keys(TIMEZONE_BY_LOCALE)

export const WEBGL_VENDOR_RENDERER: Array<{ vendor: string; renderer: string }> = [
  {
    vendor: 'Google Inc. (Intel)',
    renderer:
      'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    vendor: 'Google Inc. (NVIDIA)',
    renderer:
      'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    vendor: 'Google Inc. (NVIDIA)',
    renderer:
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    vendor: 'Google Inc. (AMD)',
    renderer:
      'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    vendor: 'Apple',
    renderer: 'Apple M1'
  },
  {
    vendor: 'Apple',
    renderer: 'Apple M2 Pro'
  }
]

export const COMMON_FONTS = [
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Consolas',
  'Courier',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Microsoft Sans Serif',
  'Palatino Linotype',
  'Segoe UI',
  'Tahoma',
  'Times',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana'
]
