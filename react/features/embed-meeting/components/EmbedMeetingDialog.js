// @flow

import React from 'react';
import { connect } from 'react-redux';

import CopyButton from '../../base/buttons/CopyButton';
import { getInviteURL } from '../../base/connection';
import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import Header from './Header';

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
 * Allow users to embed a jitsi meeting in an iframe.
 *
 * @returns {React$Element<any>}
 */
function EmbedMeeting({ t, url }: Props) {
    /**
     * Get the embed code for a jitsi meeting.
     *
     * @returns {string} The iframe embed code.
     */
    const getEmbedCode = () =>
        `<iframe allow="camera; microphone; fullscreen; display-capture" src="${url}"`
        + ' style="height: 100%; width: 100%; border: 0px;"></iframe>';

    return (
        <Dialog
            customHeader = { Header }
            hideCancelButton = { true }
            submitDisabled = { true }
            width = 'small'>
            <div className = 'embed-meeting-dialog'>
                <textarea
                    className = 'embed-meeting-code'
                    readOnly = { true }
                    value = { getEmbedCode() } />
                <CopyButton
                    className = 'embed-meeting-copy'
                    displayedText = { t('dialog.copy') }
                    textOnCopySuccess = { t('dialog.copied') }
                    textOnHover = { t('dialog.copy') }
                    textToCopy = { getEmbedCode() } />
            </div>
        </Dialog>
    );
}

const mapStateToProps = state => {
    return {
        url: getInviteURL(state)
    };
};

export default translate(connect(mapStateToProps)(EmbedMeeting));
