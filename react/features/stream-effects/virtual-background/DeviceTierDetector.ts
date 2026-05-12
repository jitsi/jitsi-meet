import { IVirtualBackgroundAdvancedConfig } from '../../base/config/configType';
import logger from '../../virtual-background/logger';

export enum BackendType {
    TFLITE = 'tflite',
    WEBGL = 'webgl',
    WEBGPU = 'webgpu'
}

export enum DeviceTier {
    HIGH = 'high',
    LOW = 'low',
    MEDIUM = 'medium'
}

export interface IDeviceCapabilities {
    backend: BackendType;
    segHeight: number;
    segWidth: number;
    targetFps: number;
    tier: DeviceTier;
}

interface ITierProfile {
    backend: BackendType;
    segHeight: number;
    segWidth: number;
    targetFps: number;
}

const TIER_PROFILES: Record<DeviceTier, ITierProfile> = {
    [DeviceTier.HIGH]: {
        backend: BackendType.WEBGPU,
        segHeight: 288,
        segWidth: 512,
        targetFps: 30
    },
    [DeviceTier.LOW]: {
        backend: BackendType.TFLITE,
        segHeight: 144,
        segWidth: 256,
        targetFps: 30
    },
    [DeviceTier.MEDIUM]: {
        backend: BackendType.WEBGL,
        segHeight: 216,
        segWidth: 384,
        targetFps: 30
    }
};

/**
 * Probes hardware capabilities (WebGPU, WebGL) and returns the detected tier.
 * Falls back to LOW when no GPU is available — TFLite WASM always works as the floor.
 *
 * @returns {Promise<DeviceTier>} Detected device tier.
 */
async function probeHardwareTier(): Promise<DeviceTier> {
    try {
        if (navigator.gpu) {
            const adapter = await navigator.gpu.requestAdapter();

            if (adapter) {
                logger.debug('[VirtualBackground] WebGPU available');

                return DeviceTier.HIGH;
            }
        }
    } catch {
        // WebGPU unavailable.
    }

    const testCanvas = document.createElement('canvas');
    const gl2 = testCanvas.getContext('webgl2');

    if (gl2) {
        gl2.getExtension('WEBGL_lose_context')?.loseContext();
        logger.debug('[VirtualBackground] WebGL2 available');

        return DeviceTier.MEDIUM;
    }

    const gl1 = testCanvas.getContext('webgl');

    if (gl1) {
        gl1.getExtension('WEBGL_lose_context')?.loseContext();
        logger.debug('[VirtualBackground] WebGL1 available');

        return DeviceTier.MEDIUM;
    }

    logger.debug('[VirtualBackground] No GPU — using TFLite WASM');

    return DeviceTier.LOW;
}

/**
 * Returns the device capabilities for virtual background processing.
 *
 * Delegates hardware detection to {@link probeHardwareTier} (which tests WebGPU, then
 * WebGL2/WebGL1, and falls back to LOW/TFLite), then applies config overrides on top of
 * the detected tier: {@code tierOverride} swaps the entire tier profile, and
 * {@code segmentationWidth}, {@code segmentationHeight}, and {@code targetFps} override
 * individual fields.
 *
 * @param {IVirtualBackgroundAdvancedConfig} vbConfig - Virtual background advanced configuration.
 * @returns {Promise<IDeviceCapabilities>}
 */
export async function detectDeviceTier(
        vbConfig?: IVirtualBackgroundAdvancedConfig): Promise<IDeviceCapabilities> {
    const hardwareTier = await probeHardwareTier();

    logger.info(`[VirtualBackground] Hardware tier: ${hardwareTier}`);

    const profile = TIER_PROFILES[hardwareTier];
    const caps: IDeviceCapabilities = {
        ...profile,
        tier: hardwareTier
    };

    // Apply config overrides.
    if (vbConfig) {
        if (vbConfig.tierOverride && vbConfig.tierOverride !== caps.tier) {
            const overrideTier = vbConfig.tierOverride as DeviceTier;
            const overrideProfile = TIER_PROFILES[overrideTier];

            if (overrideProfile) {
                caps.tier = overrideTier;
                caps.backend = overrideProfile.backend;
                caps.segHeight = overrideProfile.segHeight;
                caps.segWidth = overrideProfile.segWidth;
                caps.targetFps = overrideProfile.targetFps;
                logger.debug(`[VirtualBackground] Config override: tier forced to ${overrideTier}`);
            }
        }

        if (typeof vbConfig.segmentationWidth === 'number') {
            caps.segWidth = vbConfig.segmentationWidth;
            logger.debug(`[VirtualBackground] Config override: segmentationWidth = ${caps.segWidth}`);
        }

        if (typeof vbConfig.segmentationHeight === 'number') {
            caps.segHeight = vbConfig.segmentationHeight;
            logger.debug(`[VirtualBackground] Config override: segmentationHeight = ${caps.segHeight}`);
        }

        if (typeof vbConfig.targetFps === 'number') {
            caps.targetFps = vbConfig.targetFps;
            logger.debug(`[VirtualBackground] Config override: targetFps = ${caps.targetFps}`);
        }
    }

    return caps;
}
