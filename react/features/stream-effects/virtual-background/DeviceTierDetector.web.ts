import { IConfig } from '../../base/config/configType';
import logger from '../../virtual-background/logger';

export enum BackendType {
    WASM = 'wasm',
    WEBGL = 'webgl',
    WEBGPU = 'webgpu'
}

export enum DeviceTier {
    HIGH = 'high',
    LOW = 'low',
    MEDIUM = 'medium',
    UNSUPPORTED = 'unsupported'
}

export enum ModelType {
    GENERAL = 'general',
    LANDSCAPE = 'landscape'
}

export interface IDeviceCapabilities {
    backend: BackendType;
    modelType: ModelType;
    overridesApplied: boolean;
    reason: string;
    segHeight: number;
    segWidth: number;
    targetFps: number;
    tier: DeviceTier;
}

interface ITierProfile {
    backend: BackendType;
    modelType: ModelType;
    segHeight: number;
    segWidth: number;
    targetFps: number;
}

/**
 * Shape persisted to localStorage. Only the hardware-detected tier and its reason are stored;
 * config overrides are never cached so they can be changed without clearing storage.
 */
interface ITierCacheEntry {
    reason: string;
    tier: Exclude<DeviceTier, DeviceTier.UNSUPPORTED>;
    version: number;
}

const TIER_PROFILES: Record<Exclude<DeviceTier, DeviceTier.UNSUPPORTED>, ITierProfile> = {
    [DeviceTier.HIGH]: {
        backend: BackendType.WEBGPU,
        modelType: ModelType.LANDSCAPE,
        segHeight: 288,
        segWidth: 512,
        targetFps: 30
    },
    [DeviceTier.LOW]: {
        backend: BackendType.WASM,
        modelType: ModelType.LANDSCAPE,
        segHeight: 192,
        segWidth: 192,
        targetFps: 30
    },
    [DeviceTier.MEDIUM]: {
        backend: BackendType.WEBGL,
        modelType: ModelType.LANDSCAPE,
        segHeight: 216,
        segWidth: 384,
        targetFps: 30
    }
};

const TIER_CACHE_KEY = 'jitsi_vb_device_tier';

/**
 * Bump this when the probing logic changes in a way that may yield a different result on the same hardware. Stale
 * entries with an older version are discarded and a fresh probe is run.
 */
const TIER_CACHE_VERSION = 1;

/**
 * Returns the cached hardware tier, or null if the cache is absent or stale.
 *
 * @returns {ITierCacheEntry | null}
 */
function readTierCache(): ITierCacheEntry | null {
    try {
        const raw = localStorage.getItem(TIER_CACHE_KEY);

        if (!raw) {
            return null;
        }

        const entry: ITierCacheEntry = JSON.parse(raw);

        if (entry?.version !== TIER_CACHE_VERSION) {
            return null;
        }

        const validTiers: string[] = [ DeviceTier.HIGH, DeviceTier.MEDIUM, DeviceTier.LOW ];

        if (!validTiers.includes(entry.tier)) {
            return null;
        }

        return entry;
    } catch {
        return null;
    }
}

/**
 * Persists the hardware-detected tier to localStorage.
 *
 * @param {Exclude<DeviceTier, DeviceTier.UNSUPPORTED>} tier - Detected tier.
 * @param {string} reason - Human-readable detection reason.
 * @returns {void}
 */
function writeTierCache(tier: Exclude<DeviceTier, DeviceTier.UNSUPPORTED>, reason: string): void {
    try {
        const entry: ITierCacheEntry = { reason, tier, version: TIER_CACHE_VERSION };

        localStorage.setItem(TIER_CACHE_KEY, JSON.stringify(entry));
    } catch {
        // localStorage may be unavailable (private browsing, storage quota exceeded). Non-fatal.
    }
}

/**
 * Runs the hardware capability probes (WebGPU → WebGL → WASM) and returns the detected tier and a human-readable
 * reason string. This is the expensive part that we want to run only once.
 *
 * Returns null when no usable backend is found on this device (no WebGPU, WebGL, or WebAssembly).
 *
 * @returns {Promise<Object|null>} Resolves with a tier/reason pair, or null if no backend is available.
 */
async function probeHardwareTier(): Promise<{
    reason: string;
    tier: Exclude<DeviceTier, DeviceTier.UNSUPPORTED>;
} | null> {
    let tier: Exclude<DeviceTier, DeviceTier.UNSUPPORTED> | DeviceTier.UNSUPPORTED = DeviceTier.UNSUPPORTED;
    let reason = '';

    // --- High tier: WebGPU ---
    try {
        if ((navigator as any).gpu) {
            const adapter = await (navigator as any).gpu.requestAdapter();

            if (adapter) {
                const adapterName = (adapter as any).name ?? 'unknown GPU';

                logger.debug(`[VirtualBackground] WebGPU: available (adapter: "${adapterName}")`);
                tier = DeviceTier.HIGH;
                reason = 'WebGPU adapter found; high-end GPU path selected';
            } else {
                logger.debug('[VirtualBackground] WebGPU: unavailable (adapter request returned null)');
            }
        }
    } catch {
        logger.debug('[VirtualBackground] WebGPU: unavailable (requestAdapter threw)');
    }

    // --- Medium tier: WebGL 2 / WebGL 1 ---
    // Only probed when WebGPU was not found. Each context is released immediately via WEBGL_lose_context
    // so it does not count against the browser's concurrent WebGL context limit (~16 in Chrome).
    if (tier === DeviceTier.UNSUPPORTED) {
        const testCanvas = document.createElement('canvas');
        const gl2 = testCanvas.getContext('webgl2');

        if (gl2) {
            gl2.getExtension('WEBGL_lose_context')?.loseContext();
            logger.debug('[VirtualBackground] WebGL2: available');
            tier = DeviceTier.MEDIUM;
            reason = 'WebGL2 available; standard path selected';
        } else {
            logger.debug('[VirtualBackground] WebGL2: unavailable (context creation failed)');

            // webgl2 returned null — the canvas is still context-free; try webgl1.
            const gl1 = testCanvas.getContext('webgl');

            if (gl1) {
                gl1.getExtension('WEBGL_lose_context')?.loseContext();
                logger.debug('[VirtualBackground] WebGL1: available');
                tier = DeviceTier.MEDIUM;
                reason = 'WebGL1 available; standard path selected (WebGL2 unavailable)';
            } else {
                logger.debug('[VirtualBackground] WebGL1: unavailable (context creation failed)');
            }
        }
    }

    // --- Low tier: WASM ---
    if (tier === DeviceTier.UNSUPPORTED) {
        if (typeof WebAssembly !== 'undefined') {
            logger.debug('[VirtualBackground] WASM: available');
            tier = DeviceTier.LOW;
            reason = 'No GPU context available; WASM CPU fallback';
        } else {
            logger.debug('[VirtualBackground] WASM: unavailable');

            return null;
        }
    }

    return { reason, tier: tier as Exclude<DeviceTier, DeviceTier.UNSUPPORTED> };
}

/**
 * Returns the device capabilities for virtual background V2 processing.
 *
 * Hardware detection (WebGPU → WebGL → WASM probe) runs once and the result is written to localStorage.
 * Every subsequent call reads the cached tier and skips re-probing — this avoids an async WebGPU adapter request and
 * redundant WebGL context creation on every effect start. Config overrides (tierOverride, segmentationWidth, etc.) are
 * applied on top of the cached tier on every call and are never persisted.
 *
 * @param {IConfig} config - The app config object.
 * @returns {Promise<IDeviceCapabilities>}
 */
export async function detectDeviceTier(config: IConfig): Promise<IDeviceCapabilities> {
    let hardwareTier: Exclude<DeviceTier, DeviceTier.UNSUPPORTED>;
    let reason: string;

    const cached = readTierCache();

    if (cached) {
        hardwareTier = cached.tier;
        reason = cached.reason;
        logger.debug(`[VirtualBackground] Hardware tier (cached): ${hardwareTier} — ${reason}`);
    } else {
        logger.debug('[VirtualBackground] No cached tier — probing hardware capabilities');

        const probeResult = await probeHardwareTier();

        if (!probeResult) {
            return {
                backend: BackendType.WASM,
                modelType: ModelType.LANDSCAPE,
                overridesApplied: false,
                reason: 'No WebGPU, WebGL, or WASM available — virtual background disabled',
                segHeight: 0,
                segWidth: 0,
                targetFps: 0,
                tier: DeviceTier.UNSUPPORTED
            };
        }

        hardwareTier = probeResult.tier as Exclude<DeviceTier, DeviceTier.UNSUPPORTED>;
        reason = probeResult.reason;

        writeTierCache(hardwareTier, reason);
        logger.info(
            `[VirtualBackground] Hardware tier: ${hardwareTier} — ${reason} (written to cache)`);
    }

    // Build capabilities from the hardware tier profile.
    const profile = TIER_PROFILES[hardwareTier];
    const caps: IDeviceCapabilities = {
        ...profile,
        overridesApplied: false,
        reason,
        tier: hardwareTier
    };

    logger.debug(
        `[VirtualBackground] → Tier: ${caps.tier} | Backend: ${caps.backend} | `
        + `Seg: ${caps.segWidth}×${caps.segHeight} | FPS: ${caps.targetFps} | Model: ${caps.modelType}`);

    // Apply config overrides on every call — never cached.
    const vbConfig = config.virtualBackground;
    let anyOverride = false;

    if (vbConfig) {
        if (vbConfig.tierOverride && vbConfig.tierOverride !== caps.tier) {
            const overrideTier = vbConfig.tierOverride as Exclude<DeviceTier, DeviceTier.UNSUPPORTED>;
            const overrideProfile = TIER_PROFILES[overrideTier];

            if (overrideProfile) {
                caps.tier = overrideTier;
                caps.backend = overrideProfile.backend;
                caps.segHeight = overrideProfile.segHeight;
                caps.segWidth = overrideProfile.segWidth;
                caps.targetFps = overrideProfile.targetFps;
                caps.modelType = overrideProfile.modelType;
                logger.debug(`[VirtualBackground] Config override: tier forced to ${overrideTier}`);
                anyOverride = true;
            }
        }

        if (typeof vbConfig.segmentationWidth === 'number') {
            caps.segWidth = vbConfig.segmentationWidth;
            logger.debug(`[VirtualBackground] Config override: segmentationWidth = ${caps.segWidth}`);
            anyOverride = true;
        }

        if (typeof vbConfig.segmentationHeight === 'number') {
            caps.segHeight = vbConfig.segmentationHeight;
            logger.debug(`[VirtualBackground] Config override: segmentationHeight = ${caps.segHeight}`);
            anyOverride = true;
        }

        if (typeof vbConfig.targetFps === 'number') {
            caps.targetFps = vbConfig.targetFps;
            logger.debug(`[VirtualBackground] Config override: targetFps = ${caps.targetFps}`);
            anyOverride = true;
        }
    }

    caps.overridesApplied = anyOverride;

    return caps;
}
