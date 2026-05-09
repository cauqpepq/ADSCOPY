import type { FingerprintConfig } from '@shared/types'

/**
 * Builds the JS string that is injected into every page via
 * Page.addScriptToEvaluateOnNewDocument before any page script runs.
 *
 * This is the core "antidetect" surface — every property a fingerprinting
 * library reads is intercepted here.
 */
export function buildPreloadScript(fp: FingerprintConfig): string {
  return `
(() => {
  if (window.__ADSPOWER_CLONE_INJECTED__) return;
  window.__ADSPOWER_CLONE_INJECTED__ = true;

  const FP = ${JSON.stringify(fp)};

  /* ----------------- deterministic PRNG seeded with profile id ----------------- */
  function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t = (t + 0x6d2b79f5) >>> 0;
      let r = t;
      r = Math.imul(r ^ (r >>> 15), r | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(FP.noiseSeed);

  const safeDefine = (obj, prop, getter) => {
    try {
      Object.defineProperty(obj, prop, { get: getter, configurable: true });
    } catch (_) {}
  };
  const safeDefineValue = (obj, prop, value) => {
    try {
      Object.defineProperty(obj, prop, { value, configurable: true, writable: false });
    } catch (_) {}
  };

  /* ----------------- navigator ----------------- */
  try {
    const platformByOs = { windows: 'Win32', macos: 'MacIntel', linux: 'Linux x86_64' };
    const platform = platformByOs[FP.os] || 'Win32';

    safeDefine(navigator, 'userAgent', () => FP.userAgent);
    safeDefine(navigator, 'appVersion', () => FP.userAgent.replace(/^Mozilla\\//, ''));
    safeDefine(navigator, 'platform', () => platform);
    safeDefine(navigator, 'vendor', () => 'Google Inc.');
    safeDefine(navigator, 'language', () => FP.languages[0] || 'en-US');
    safeDefine(navigator, 'languages', () => Object.freeze([...FP.languages]));
    safeDefine(navigator, 'hardwareConcurrency', () => FP.hardwareConcurrency);
    safeDefine(navigator, 'deviceMemory', () => FP.deviceMemory);
    safeDefine(navigator, 'maxTouchPoints', () => 0);
    safeDefine(navigator, 'webdriver', () => false);
    safeDefine(navigator, 'doNotTrack', () => null);
    safeDefine(navigator, 'pdfViewerEnabled', () => true);
  } catch (_) {}

  /* ----------------- navigator.userAgentData (UA-CH) ----------------- */
  try {
    const brands = [
      { brand: 'Chromium', version: String(FP.browserVersion) },
      { brand: 'Google Chrome', version: String(FP.browserVersion) },
      { brand: 'Not_A Brand', version: '24' }
    ];
    const platformLabel = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }[FP.os] || 'Windows';
    const uaData = {
      brands,
      mobile: false,
      platform: platformLabel,
      getHighEntropyValues: (hints) => {
        const result = { brands, mobile: false, platform: platformLabel };
        if (hints.includes('platformVersion')) result.platformVersion = FP.os === 'macos' ? '14.0.0' : '15.0.0';
        if (hints.includes('architecture')) result.architecture = 'x86';
        if (hints.includes('bitness')) result.bitness = '64';
        if (hints.includes('model')) result.model = '';
        if (hints.includes('uaFullVersion')) result.uaFullVersion = FP.browserVersion + '.0.0.0';
        if (hints.includes('fullVersionList')) {
          result.fullVersionList = brands.map((b) => ({ brand: b.brand, version: b.version + '.0.0.0' }));
        }
        return Promise.resolve(result);
      },
      toJSON: () => ({ brands, mobile: false, platform: platformLabel })
    };
    safeDefine(navigator, 'userAgentData', () => uaData);
  } catch (_) {}

  /* ----------------- screen ----------------- */
  try {
    safeDefine(screen, 'width', () => FP.screen.width);
    safeDefine(screen, 'height', () => FP.screen.height);
    safeDefine(screen, 'availWidth', () => FP.screen.availWidth);
    safeDefine(screen, 'availHeight', () => FP.screen.availHeight);
    safeDefine(screen, 'colorDepth', () => FP.screen.colorDepth);
    safeDefine(screen, 'pixelDepth', () => FP.screen.pixelDepth);
    safeDefine(window, 'devicePixelRatio', () => FP.screen.devicePixelRatio);
  } catch (_) {}

  /* ----------------- timezone / Intl ----------------- */
  try {
    const _DTF = Intl.DateTimeFormat;
    const wrappedDTF = function (...args) {
      const inst = new _DTF(...args);
      const _resolved = inst.resolvedOptions.bind(inst);
      inst.resolvedOptions = function () {
        const r = _resolved();
        r.timeZone = FP.timezone;
        if (FP.locale) r.locale = FP.locale;
        return r;
      };
      return inst;
    };
    wrappedDTF.prototype = _DTF.prototype;
    wrappedDTF.supportedLocalesOf = _DTF.supportedLocalesOf.bind(_DTF);
    Intl.DateTimeFormat = wrappedDTF;

    // Date.prototype.getTimezoneOffset based on FP.timezone
    const tzOffset = (() => {
      try {
        const now = Date.now();
        const local = new Date(now);
        const tzStr = new Intl.DateTimeFormat('en-US', {
          timeZone: FP.timezone,
          timeZoneName: 'shortOffset'
        }).format(local);
        const m = /GMT([+-]?)(\\d{1,2})(?::?(\\d{2}))?/.exec(tzStr);
        if (!m) return new Date().getTimezoneOffset();
        const sign = m[1] === '-' ? 1 : -1;
        const hours = parseInt(m[2], 10) || 0;
        const minutes = parseInt(m[3] || '0', 10);
        return sign * (hours * 60 + minutes);
      } catch (_) {
        return new Date().getTimezoneOffset();
      }
    })();
    const _origGetTzOffset = Date.prototype.getTimezoneOffset;
    Date.prototype.getTimezoneOffset = function () {
      try { return tzOffset; } catch (_) { return _origGetTzOffset.call(this); }
    };
  } catch (_) {}

  /* ----------------- Canvas noise ----------------- */
  if (FP.canvas !== 'off') {
    try {
      const noisify = (data) => {
        for (let i = 0; i < data.length; i += 4) {
          const noise = (rnd() * 8 | 0) - 4;
          data[i]     = Math.max(0, Math.min(255, data[i]     + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
      };

      const _toDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        if (FP.canvas === 'block') return 'data:,';
        try {
          const ctx = this.getContext('2d');
          if (ctx && this.width > 0 && this.height > 0) {
            const imgData = ctx.getImageData(0, 0, this.width, this.height);
            noisify(imgData.data);
            ctx.putImageData(imgData, 0, 0);
          }
        } catch (_) {}
        return _toDataURL.apply(this, args);
      };

      const _toBlob = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (cb, ...args) {
        if (FP.canvas === 'block') return cb(null);
        try {
          const ctx = this.getContext('2d');
          if (ctx && this.width > 0 && this.height > 0) {
            const imgData = ctx.getImageData(0, 0, this.width, this.height);
            noisify(imgData.data);
            ctx.putImageData(imgData, 0, 0);
          }
        } catch (_) {}
        return _toBlob.call(this, cb, ...args);
      };

      const _getImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function (...args) {
        const data = _getImageData.apply(this, args);
        if (FP.canvas === 'block') {
          for (let i = 0; i < data.data.length; i++) data.data[i] = 0;
        } else {
          noisify(data.data);
        }
        return data;
      };
    } catch (_) {}
  }

  /* ----------------- WebGL spoof ----------------- */
  if (FP.webgl.mode !== 'off') {
    try {
      const installWebGLProxy = (proto) => {
        const _getParameter = proto.getParameter;
        proto.getParameter = function (parameter) {
          // UNMASKED_VENDOR_WEBGL, UNMASKED_RENDERER_WEBGL
          if (parameter === 0x9245 && FP.webgl.vendor) return FP.webgl.vendor;
          if (parameter === 0x9246 && FP.webgl.renderer) return FP.webgl.renderer;
          // VENDOR / RENDERER
          if (parameter === 0x1F00 && FP.webgl.vendor) return 'WebKit';
          if (parameter === 0x1F01 && FP.webgl.renderer) return 'WebKit WebGL';
          return _getParameter.call(this, parameter);
        };

        if (FP.webgl.mode === 'noise') {
          const _readPixels = proto.readPixels;
          proto.readPixels = function (x, y, w, h, fmt, type, pixels) {
            const r = _readPixels.call(this, x, y, w, h, fmt, type, pixels);
            if (pixels && pixels.length) {
              for (let i = 0; i < pixels.length; i++) {
                const n = (rnd() * 4 | 0) - 2;
                pixels[i] = Math.max(0, Math.min(255, pixels[i] + n));
              }
            }
            return r;
          };
        } else if (FP.webgl.mode === 'block') {
          proto.readPixels = function () {};
        }
      };
      if (window.WebGLRenderingContext) installWebGLProxy(WebGLRenderingContext.prototype);
      if (window.WebGL2RenderingContext) installWebGLProxy(WebGL2RenderingContext.prototype);
    } catch (_) {}
  }

  /* ----------------- AudioContext noise ----------------- */
  if (FP.audio !== 'off' && window.AudioBuffer) {
    try {
      const _getChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function (...args) {
        const data = _getChannelData.apply(this, args);
        if (FP.audio === 'block') {
          for (let i = 0; i < data.length; i++) data[i] = 0;
        } else {
          for (let i = 0; i < data.length; i += 100) {
            data[i] = data[i] + (rnd() * 0.0001 - 0.00005);
          }
        }
        return data;
      };

      if (window.AnalyserNode) {
        const _getFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
        AnalyserNode.prototype.getFloatFrequencyData = function (array) {
          const r = _getFloatFrequencyData.call(this, array);
          if (FP.audio === 'noise') {
            for (let i = 0; i < array.length; i++) {
              array[i] = array[i] + (rnd() * 0.1 - 0.05);
            }
          }
          return r;
        };
      }
    } catch (_) {}
  }

  /* ----------------- WebRTC ----------------- */
  if (FP.webrtc === 'disabled') {
    try {
      window.RTCPeerConnection = undefined;
      window.webkitRTCPeerConnection = undefined;
      window.RTCDataChannel = undefined;
    } catch (_) {}
  } else if (FP.webrtc === 'altered') {
    try {
      const wrapPC = (PC) => {
        if (!PC) return PC;
        const Wrapped = function (...args) {
          const pc = new PC(...args);
          const _create = pc.createOffer.bind(pc);
          pc.createOffer = function (opts) {
            return _create(opts).then((offer) => {
              if (offer && offer.sdp) {
                offer.sdp = offer.sdp.replace(/\\d+\\.\\d+\\.\\d+\\.\\d+/g, '0.0.0.0');
              }
              return offer;
            });
          };
          return pc;
        };
        Wrapped.prototype = PC.prototype;
        return Wrapped;
      };
      window.RTCPeerConnection = wrapPC(window.RTCPeerConnection);
      window.webkitRTCPeerConnection = wrapPC(window.webkitRTCPeerConnection);
    } catch (_) {}
  }

  /* ----------------- mediaDevices ----------------- */
  try {
    if (navigator.mediaDevices) {
      const _enumerate = navigator.mediaDevices.enumerateDevices &&
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
      navigator.mediaDevices.enumerateDevices = async function () {
        const fake = [];
        for (let i = 0; i < FP.mediaDevices.audioinputs; i++)
          fake.push({ deviceId: 'fp-aud-in-' + i, kind: 'audioinput', label: '', groupId: 'fp-grp-' + i });
        for (let i = 0; i < FP.mediaDevices.videoinputs; i++)
          fake.push({ deviceId: 'fp-vid-in-' + i, kind: 'videoinput', label: '', groupId: 'fp-grp-' + i });
        for (let i = 0; i < FP.mediaDevices.audiooutputs; i++)
          fake.push({ deviceId: 'fp-aud-out-' + i, kind: 'audiooutput', label: '', groupId: 'fp-grp-' + i });
        return fake;
      };
      void _enumerate;
    }
  } catch (_) {}

  /* ----------------- chrome runtime presence ----------------- */
  try {
    if (!window.chrome) {
      window.chrome = {};
    }
    if (!window.chrome.runtime) {
      window.chrome.runtime = { id: undefined };
    }
    if (!window.chrome.app) {
      window.chrome.app = { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } };
    }
  } catch (_) {}

  /* ----------------- Notification permission consistency ----------------- */
  try {
    if (window.Notification && navigator.permissions) {
      const _query = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (params) => {
        if (params && params.name === 'notifications') {
          return Promise.resolve({ state: Notification.permission, onchange: null });
        }
        return _query(params);
      };
    }
  } catch (_) {}

  /* ----------------- Plugins / mimeTypes (Chrome-like) ----------------- */
  try {
    const fakePlugins = [
      { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
    ];
    const arr = fakePlugins.map((p, i) => Object.assign(Object.create(Plugin.prototype || {}), {
      name: p.name, filename: p.filename, description: p.description, length: 1, item: () => null, namedItem: () => null
    }));
    Object.defineProperty(arr, 'length', { value: arr.length });
    Object.defineProperty(arr, 'item', { value: (i) => arr[i] || null });
    Object.defineProperty(arr, 'namedItem', { value: (n) => arr.find((p) => p.name === n) || null });
    Object.defineProperty(arr, 'refresh', { value: () => undefined });
    safeDefine(navigator, 'plugins', () => arr);
  } catch (_) {}

  /* ----------------- Geolocation override ----------------- */
  try {
    if (FP.geolocation && navigator.geolocation) {
      const fake = FP.geolocation;
      const fakePos = {
        coords: {
          latitude: fake.latitude,
          longitude: fake.longitude,
          accuracy: fake.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };
      navigator.geolocation.getCurrentPosition = (success) => success(fakePos);
      navigator.geolocation.watchPosition = (success) => {
        success(fakePos);
        return 0;
      };
    }
  } catch (_) {}

  /* ----------------- Connection (NetworkInformation) ----------------- */
  try {
    if (navigator.connection) {
      safeDefine(navigator.connection, 'effectiveType', () => '4g');
      safeDefine(navigator.connection, 'rtt', () => 50);
      safeDefine(navigator.connection, 'downlink', () => 10);
      safeDefine(navigator.connection, 'saveData', () => false);
    }
  } catch (_) {}

  /* ----------------- Battery API neutralisation ----------------- */
  try {
    if (navigator.getBattery) {
      navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1,
        addEventListener: () => {},
        removeEventListener: () => {},
        onchargingchange: null,
        onchargingtimechange: null,
        ondischargingtimechange: null,
        onlevelchange: null
      });
    }
  } catch (_) {}

  void safeDefineValue;
})();
`
}
