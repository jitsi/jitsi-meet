// @flow

import React from 'react';
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import NewModal from './modal';

type Props = {

    /**
     * Open the embed meeting dialog
     */
    openModalDialog: Function,

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
function NewModalTrigger({ t, openModalDialog }: Props) {
    /**
     * Handles opening the embed dialog.
     *
     * @returns {void}
     */
    function onClick() {
        openModalDialog(NewModal);
    }

    return (
        <div
            className = 'embed-meeting-trigger'
            onClick = { onClick }>
            {t('embedMeeting.title')}
        </div>
    );
}

const mapDispatchToProps = { openModalDialog: openDialog };

export default translate(connect(null, mapDispatchToProps)(NewModalTrigger));