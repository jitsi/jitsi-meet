// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { IconMessage } from '../../../base/icons';
import { getParticipants } from '../../../base/participants';
import { connect } from '../../../base/redux';
import {
    _mapDispatchToProps,
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps } from '../../../chat/components/PrivateMessageButton';
import { isButtonEnabled } from '../../../toolbox/functions.web';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

declare var interfaceConfig: Object;

type Props = AbstractProps & {

    /**
     * True if the private send message button is disabled, hence the button is not enable.
     */
    _disabled: boolean,

     /**
     * True if the private chat functionality is disabled, hence the button is not visible.
     */
    _hidden: boolean
};

/**
 * A custom implementation of the PrivateMessageButton specialized for
 * the web version of the remote video menu. When the web platform starts to use
 * the {@code AbstractButton} component for the remote video menu, we can get rid
 * of this component and use the generic button in the chat feature.
 */
class PrivateMessageMenuButton extends Component<Props> {
    /**
     * Instantiates a new Component instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { participantID, t, _disabled, _hidden } = this.props;

        if (_hidden) {
            return null;
        }

        return (
            <RemoteVideoMenuButton
                buttonText = { t('toolbar.privateMessage') }
                displayClass = { _disabled && 'disabled' }
                icon = { IconMessage }
                id = { `privmsglink_${participantID}` }
                onClick = { this._onClick } />
        );
    }

    _onClick: () => void;

    /**
     * Callback to be invoked on pressing the button.
     *
     * @returns {void}
     */
    _onClick() {
        const { _participant, _setPrivateMessageRecipient } = this.props;

        _setPrivateMessageRecipient(_participant);
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
*/
function _mapStateToProps(state: Object, ownProps: Props): $Shape<Props> {
    const { enableFeaturesBasedOnToken } = state['features/base/config'];

    let privateMessageDisabled;

    if (enableFeaturesBasedOnToken) {
        // we enable private message if any participant already have this
        // feature enabled
        privateMessageDisabled = getParticipants(state)
            .find(({ features = {} }) =>
                String(features['private-message']) === 'false') !== undefined;
    }

    return {
        ..._abstractMapStateToProps(state, ownProps),
        _disabled: privateMessageDisabled,
        _hidden: typeof interfaceConfig !== 'undefined'
            && (interfaceConfig.DISABLE_PRIVATE_MESSAGES || !isButtonEnabled('chat'))
    };
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(PrivateMessageMenuButton));
