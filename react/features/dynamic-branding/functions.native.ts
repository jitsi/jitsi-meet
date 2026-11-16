/**
 * Removes path fills so the icon color applies.
 *
 * @param {string} svg - The SVG string to clean.
 * @returns {string} The cleaned SVG string.
 */
export function cleanSvg(svg: string): string {
    return svg.replace(/(<path\b[^>]*?)\s+fill\s*=\s*(["'])[^"']*\2/gi, '$1');
}
