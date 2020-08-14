// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconPin } from '../../../base/icons/svg';
import { connect } from '../../../base/redux';
import { type AbstractButtonProps } from '../../../base/toolbox/components';
import AbstractPinButton from '../AbstractPinButton';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

export type Props = AbstractButtonProps & {

    /**
     * True if tile view is currently enabled.
     */
    _tileViewEnabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the participant that this button is supposed to pin.
     */
    participantID: string,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * A remote video menu button which pins a participant and exist the tile view.
 */
class PinButton extends AbstractPinButton {
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
                buttonText = { t('videothumbnail.pin') }
                displayClass = 'pin'
                icon = { IconPin }
                id = { `ejectlink_${participantID}` }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick } />
        );
    }
    _handleClick: () => void
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        visible: state['features/video-layout'].tileViewEnabled
    };
}

export default translate(connect(_mapStateToProps)(PinButton));
