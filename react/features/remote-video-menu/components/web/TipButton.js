/* @flow */

import React from 'react';

import { isAccountOrChainName } from '../../../aeternity';
import { translate } from '../../../base/i18n';
import { IconTip } from '../../../base/icons/svg';
import { getParticipantDisplayName } from '../../../base/participants';
import { connect } from '../../../base/redux';
import AbstractTipButton, {
    type Props
} from '../AbstractTipButton';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

declare var interfaceConfig: Object;
declare var APP: Object;

/**
 * Implements a React {@link Component} which displays a button for tiping
 * a participant in the conference.
 *
 * NOTE: At the time of writing this is a button that doesn't use the
 * {@code AbstractButton} base component, but is inherited from the same
 * super class ({@code AbstractTipButton} that extends {@code AbstractButton})
 * for the sake of code sharing between web and mobile. Once web uses the
 * {@code AbstractButton} base component, this can be fully removed.
 */
class TipButton extends AbstractTipButton {
    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { participantID, t } = this.props;

        const displayName = getParticipantDisplayName(APP.store.getState(), participantID);

        if (!isAccountOrChainName(displayName)) {
            return null;
        }

        return (
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.tip') }
                displayClass = 'tiplink'
                icon = { IconTip }
                id = { `tiplink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void
}

/**
 * Maps (parts of) the redux state to {@link TipButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {

    return {
        hasWallet: state['features/aeternity'].hasWallet
    };
}

export default translate(connect(_mapStateToProps)(TipButton));

