// @flow

import React from 'react';
import { connect } from 'react-redux';

import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';

import ListParticipantsDialog from './ListParticipantsDialog';

type Props = {

    /**
     * Open the list participants dialog.
     */
    openListDialog: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
};

/**
 * Component meant to trigger showing the ListParticipantsDialog.
 *
 * @returns {React$Element<any>}
 */
function ListParticipantsTrigger({ t, openListDialog }: Props) {
    /**
     * Handles opeming the embed dialog.
     *
     * @returns {void}
     */
    function onClick() {
        openListDialog(ListParticipantsDialog);
    }

    return (
        <div
            className = 'list-participants-trigger'
            onClick = { onClick }>
            {t('listParticipants.title')}
        </div>
    );
}

const mapDispatchToProps = { openEmbedDialog: openDialog };

export default translate(connect(null, mapDispatchToProps)(ListParticipantsTrigger));
