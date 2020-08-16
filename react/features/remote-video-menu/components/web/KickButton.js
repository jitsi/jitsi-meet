/* @flow */

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconKick } from '../../../base/icons';
import { connect } from '../../../base/redux';
import AbstractKickButton, {
    type Props
} from '../AbstractKickButton';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

declare var interfaceConfig: Object;

/**
 * Implements a React {@link Component} which displays a button for kicking out
 * a participant from the conference.
 *
 * NOTE: At the time of writing this is a button that doesn't use the
 * {@code AbstractButton} base component, but is inherited from the same
 * super class ({@code AbstractKickButton} that extends {@code AbstractButton})
 * for the sake of code sharing between web and mobile. Once web uses the
 * {@code AbstractButton} base component, this can be fully removed.
 */
class KickButton extends AbstractKickButton {
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
        const { participantID, t, visible } = this.props;

        if (!visible) {
            return null;
        }

        return (
            <RemoteVideoMenuButton
                buttonText = { t('videothumbnail.kick') }
                displayClass = 'kicklink'
                icon = { IconKick }
                id = { `ejectlink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }

    _handleClick: () => void
}

/**
 * Maps (parts of) the redux state to {@link KickButton}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {
    const shouldHide = interfaceConfig.HIDE_KICK_BUTTON_FOR_GUESTS && state['features/base/jwt'].isGuest;

    return {
        visible: !shouldHide
    };
}

export default translate(connect(_mapStateToProps)(KickButton));

