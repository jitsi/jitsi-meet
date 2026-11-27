import { describe, expect, it } from 'vitest';

import { buildDynamicBrandingUrl } from './buildDynamicBrandingUrl';

describe('buildDynamicBrandingUrl', () => {
    it.each([
        [ 'https://example.com/branding', 'https://example.com/branding?conferenceFqn=tenant%2Froom' ],
        [ '/branding?key=a%20b', '/branding?key=a%20b&conferenceFqn=tenant%2Froom' ],
        [ '/branding?theme=dark#preview', '/branding?theme=dark&conferenceFqn=tenant%2Froom#preview' ],
        [ '/branding?#preview', '/branding?conferenceFqn=tenant%2Froom#preview' ],
        [ '/branding#preview?mode=dark', '/branding?conferenceFqn=tenant%2Froom#preview?mode=dark' ]
    ])('adds the conference FQN to %s', (brandingDataUrl, expected) => {
        expect(buildDynamicBrandingUrl({ brandingDataUrl }, 'tenant/room')).toBe(expected);
    });

    it('returns an explicitly configured dynamic branding URL unchanged', () => {
        const dynamicBrandingUrl = '/override?theme=dark#preview';

        expect(buildDynamicBrandingUrl({
            brandingDataUrl: '/branding',
            dynamicBrandingUrl
        }, 'tenant/room')).toBe(dynamicBrandingUrl);
    });
});
