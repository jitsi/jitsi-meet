import { merge } from 'lodash-es';

import * as jitsiTokens from './jitsiTokens.json';
import * as tokens from './tokens.json';
import { IPalette } from './types';

/**
 * Creates the color tokens based on the color theme and the association map.
 *
 * @param {Object} colorMap - A map between the token name and the actual color value.
 * @param {Object} customTokens - Optional custom token overrides to merge before resolution.
 * This allows custom branding colors to propagate through semantic token references.
 * For example, if customTokens contains { action01: '#custom' }, then any semantic token
 * that references 'action01' (like 'prejoinActionButtonPrimary') will resolve to '#custom'.
 * @returns {Object}
 */
export function createColorTokens(colorMap: Object, customTokens?: Partial<IPalette>): any {
    const allTokens = merge({}, tokens, jitsiTokens, customTokens || {});
    const result: any = {};

    // First pass: resolve tokens that reference allTokens directly
    Object.entries(colorMap).forEach(([ token, value ]: [any, string]) => {
        const color = allTokens[value as keyof typeof allTokens] || value;

        result[token] = color;
    });

    // Second pass: resolve semantic tokens that reference other colorMap entries
    // Recursively resolve until we get actual color values
    const resolveToken = (value: string, depth = 0): string => {
        // Prevent infinite loops
        if (depth > 10) {
            return value;
        }

        // If it's already a color (starts with # or rgb/rgba), return it
        if (value.startsWith('#') || value.startsWith('rgb')) {
            return value;
        }

        // Look up in the result map first (for colorMap token references)
        if (result[value]) {
            return resolveToken(result[value], depth + 1);
        }

        // Then look up in allTokens
        const resolved = allTokens[value as keyof typeof allTokens];

        if (resolved && resolved !== value && typeof resolved === 'string') {
            return resolveToken(resolved, depth + 1);
        }

        return value;
    };

    // Third pass: recursively resolve all values
    Object.entries(result).forEach(([ token, value ]) => {
        result[token] = resolveToken(String(value));
    });

    return result;
}

/**
 * Create the typography tokens based on the typography theme and the association map.
 *
 * @param {Object} typography - A map between the token name and the actual typography value.
 * @returns {Object}
 */
export function createTypographyTokens(typography: Object): any {
    const allTokens = merge({}, tokens, jitsiTokens);

    return Object.entries(typography)
        .reduce((result, [ token, value ]: [any, any]) => {
            let typographyValue = value;

            if (typeof value === 'string') {
                typographyValue = allTokens[value as keyof typeof allTokens] || value;
            }

            return Object.assign(result, { [token]: typographyValue });
        }, {});
}
