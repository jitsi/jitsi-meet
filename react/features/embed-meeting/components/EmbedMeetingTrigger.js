// @flow

import React from 'react';
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import EmbedMeetingDialog from './EmbedMeetingDialog';

type Props = {

    /**
     * Open the embed meeting dialog
     */
    openEmbedDialog: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
};

/**
 * Component meant to trigger showing the EmbedMeetingDialog.
 *
 * @returns {React$Element<any>}
 */
function EmbedMeetingTrigger({ t, openEmbedDialog }: Props) {
    /**
     * Handles opening the embed dialog.
     *
     * @returns {void}
     */
    function onClick() {
        openEmbedDialog(EmbedMeetingDialog);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {React.KeyboardEventHandler<HTMLDivElement>} e - The key event to handle.
     *
     * @returns {void}
     */
    function onKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onClick();
        }
    }

    return (
        <div
            aria-label = { t('embedMeeting.title') }
            className = 'embed-meeting-trigger'
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            role = 'button'
            tabIndex = { 0 }>
            {t('embedMeeting.title')}
        </div>
    );
}

const mapDispatchToProps = { openEmbedDialog: openDialog };

export default translate(connect(null, mapDispatchToProps)(EmbedMeetingTrigger));
