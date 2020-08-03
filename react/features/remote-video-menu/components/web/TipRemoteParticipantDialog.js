// @flow

import React from 'react';

import { aeternity, URLS } from '../../../aeternity/aeternity';
import TipForm from '../../../aeternity/components/TipForm';
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { getParticipantByAkAddress, getParticipantById } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractTipRemoteParticipantDialog
    from '../AbstractTipRemoteParticipantDialog';

declare var APP: Object;

/**
 * Dialog to confirm a remote participant tip action.
 */
class TipRemoteParticipantDialog extends AbstractTipRemoteParticipantDialog {
    /**
     * Initializes a new TipButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            data: {}
        };
        this._onDataChange = this._onDataChange.bind(this);
        this._onSendTip = this._onSendTip.bind(this);
    }

    /**
     * Change data.
     *
     * @param {Object} data - Callback data.
     * @returns {void}
     */
    _onDataChange(data) {
        this.setState({ data });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { account, participantID } = this.props;
        const state = APP.store.getState();
        const participant = participantID ? getParticipantById(state, participantID) : getParticipantByAkAddress(state, account);

        if (!participant) {
            return null;
        }

        return (
            <Dialog
                okKey = 'dialog.tipParticipantButton'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.tipParticipantTitle'
                width = 'small'>
                <TipForm
                    onDataChange = { this._onDataChange }
                    participant = { participant } />
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
    _onSendTip: () => void;
    _onDataChange: () => void;

    /**
     * Send the tip itself.
     *
     * @returns {void}
     */
    async _onSendTip() {
        const { account, participantID } = this.props;
        const state = APP.store.getState();
        const participant = participantID ? getParticipantById(state, participantID) : getParticipantByAkAddress(state, account);

        if (!participant) {
            return null;
        }
        const amount = aeternity.util.aeToAtoms(this.state.data.amount);
        const url = `${URLS.SUPER}/user-profile/${participant.akAddress}`;

        try {
            await aeternity.tip(url, this.state.data.message, amount);
        } catch (e) {
            console.log({ e });
        }
    }
}

export default translate(connect()(TipRemoteParticipantDialog));
