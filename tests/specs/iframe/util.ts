import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { expectations } from '../../helpers/expectations';

export async function checkIframeApi(p: Participant) {
    const iframeEnabled = !await p.execute(() => config.disableIframeAPI);

    expect(iframeEnabled).toBe(expectations.iframe.enabled);
    if (!iframeEnabled) {
        ctx.skipSuiteTests = 'The iFrame API is disabled';
    }

    return iframeEnabled;
}
