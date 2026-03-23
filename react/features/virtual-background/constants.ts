/**
 * An enumeration of the different virtual background types.
 *
 * @enum {string}
 */
export const VIRTUAL_BACKGROUND_TYPE = {
    BLUR: 'blur',
    IMAGE: 'image',
    NONE: 'none',
    STUDIO_LIGHT: 'studio-light'
};

/**
 * Studio light preset identifiers.
 *
 * @enum {string}
 */
export enum StudioLightPreset {
    NATURAL = 'natural',
    SOFT_FOCUS = 'soft-focus',
    SPOTLIGHT = 'spotlight'
}

/**
 * Studio light shader parameter defaults (used when no preset is selected).
 */
export const STUDIO_LIGHT_DEFAULTS = {
    bgDimming: 0.0,
    brightness: 0.06,
    contrast: 1.08,
    glowIntensity: 0.03,
    preset: StudioLightPreset.NATURAL,
    saturation: 1.0,
    skinSmoothing: 0.1,
    toneB: 1.0,
    toneG: 1.0,
    toneR: 1.0
};

/**
 * Maps each preset name to its shader parameters.
 *
 * Natural: clean, minimal enhancement — barely noticeable, background untouched.
 * Spotlight: face pops against dimmed background, warm tone, pro studio lighting feel.
 * Soft Focus: beauty/glamour filter — skin smoothing, glow bloom, lower contrast.
 */
export const STUDIO_LIGHT_PRESETS: Record<string, typeof STUDIO_LIGHT_DEFAULTS> = {
    [StudioLightPreset.NATURAL]: { ...STUDIO_LIGHT_DEFAULTS },
    [StudioLightPreset.SOFT_FOCUS]: {
        bgDimming: 0.0,
        brightness: 0.04,
        contrast: 0.92,
        glowIntensity: 0.18,
        preset: StudioLightPreset.SOFT_FOCUS,
        saturation: 1.08,
        skinSmoothing: 0.55,
        toneB: 1.0,
        toneG: 1.0,
        toneR: 1.0
    },
    [StudioLightPreset.SPOTLIGHT]: {
        bgDimming: 0.4,
        brightness: 0.14,
        contrast: 1.12,
        glowIntensity: 0.04,
        preset: StudioLightPreset.SPOTLIGHT,
        saturation: 1.05,
        skinSmoothing: 0.15,
        toneB: 0.96,
        toneG: 1.0,
        toneR: 1.04
    }
};


export type Image = {
    id: string;
    src: string;
    tooltip?: string;
};

// The limit of virtual background uploads is 24. When the number
// of uploads is 25 we trigger the deleteStoredImage function to delete
// the first/oldest uploaded background.
export const BACKGROUNDS_LIMIT = 25;


export const IMAGES: Array<Image> = [
    {
        tooltip: 'image1',
        id: '1',
        src: 'images/virtual-background/background-1.jpg'
    },
    {
        tooltip: 'image2',
        id: '2',
        src: 'images/virtual-background/background-2.jpg'
    },
    {
        tooltip: 'image3',
        id: '3',
        src: 'images/virtual-background/background-3.jpg'
    },
    {
        tooltip: 'image4',
        id: '4',
        src: 'images/virtual-background/background-4.jpg'
    },
    {
        tooltip: 'image5',
        id: '5',
        src: 'images/virtual-background/background-5.jpg'
    },
    {
        tooltip: 'image6',
        id: '6',
        src: 'images/virtual-background/background-6.jpg'
    },
    {
        tooltip: 'image7',
        id: '7',
        src: 'images/virtual-background/background-7.jpg'
    }
];
