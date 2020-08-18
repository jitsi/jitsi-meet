// @flow

import React from 'react';

import CopyButton from '../../../../base/buttons/CopyButton';
import { translate } from '../../../../base/i18n';
import { getDecodedURI } from '../../../../base/util';


type Props = {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The URL of the conference.
     */
    url: string
};

/**
 * Component meant to enable users to copy the conference URL.
 *
 * @returns {React$Element<any>}
 */
function CopyMeetingLinkSection({ t, url }: Props) {
    return (
        <>
            <span>{t('addPeople.shareLink')}</span>
            <CopyButton
                className = 'invite-more-dialog-conference-url'
                displayedText = { getDecodedURI(url) }
                textOnCopySuccess = { t('addPeople.linkCopied') }
                textOnHover = { t('addPeople.copyLink') }
                textToCopy = { url } />
        </>
    );
}

export default translate(CopyMeetingLinkSection);
