// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { IconMessage } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { _mapDispatchToProps, _mapStateToProps, type Props } from '../../../chat/components/PrivateMessageButton';

import RemoteVideoMenuButton from './RemoteVideoMenuButton';

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
        const { participantID, t } = this.props;

        return (
            <RemoteVideoMenuButton
                buttonText = { t('toolbar.privateMessage') }
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

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(PrivateMessageMenuButton));
