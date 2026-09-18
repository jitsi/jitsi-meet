import { IConfig } from '../base/config/configType';

/**
 * Extracts the fqn part from a pathname, where fqn represents tenant/roomName.
 *
 * @param {string} pathname - The pathname of the conference URL.
 * @returns {string}
 */
export function extractFqnFromPathname(pathname: string): string {
    const parts = pathname.split('/');
    const len = parts.length;

    return parts.length > 2 ? `${parts[len - 2]}/${parts[len - 1]}` : parts[1];
}

/**
 * Builds the URL used for fetching dynamic branding. Kept free of redux so the preload bundle,
 * which runs before the app bundle, can compute exactly the same URL as the app.
 *
 * @param {Object} config - The config options that decide where the branding comes from.
 * @param {string} fqn - The conference fqn (tenant/roomName).
 * @returns {string | undefined} The branding URL, or undefined when no branding is configured.
 */
export function buildDynamicBrandingUrl(
        { brandingDataUrl, dynamicBrandingUrl }: Pick<IConfig, 'brandingDataUrl' | 'dynamicBrandingUrl'>,
        fqn: string): string | undefined {
    if (dynamicBrandingUrl) {
        return dynamicBrandingUrl;
    }

    if (brandingDataUrl && fqn) {
        return `${brandingDataUrl}?conferenceFqn=${encodeURIComponent(fqn)}`;
    }

    return undefined;
}
