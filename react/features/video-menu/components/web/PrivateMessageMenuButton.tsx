import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { CHAT_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconMessage } from '../../../base/icons/svg';
import { getParticipantById } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import { openChat } from '../../../chat/actions.web';
import { IProps as AbstractProps } from '../../../chat/components/web/PrivateMessageButton';
import { isButtonEnabled } from '../../../toolbox/functions.web';

interface IProps extends AbstractProps, WithTranslation {

    /**
     * True if the private chat functionality is disabled, hence the button is not visible.
     */
    _hidden: boolean;

    /**
     * The participant to send the message to.
     */
    _participant?: IParticipant;

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * A custom implementation of the PrivateMessageButton specialized for
 * the web version of the remote video menu. When the web platform starts to use
 * the {@code AbstractButton} component for the remote video menu, we can get rid
 * of this component and use the generic button in the chat feature.
 */
class PrivateMessageMenuButton extends Component<IProps> {
    /**
     * Instantiates a new Component instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
        const { t, _hidden } = this.props;

        if (_hidden) {
            return null;
        }

        return (
            <ContextMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.privateMessage') }
                icon = { IconMessage }
                onClick = { this._onClick }
                text = { t('toolbar.privateMessage') } />
        );
    }

    /**
     * Callback to be invoked on pressing the button.
     *
     * @returns {void}
     */
    _onClick() {
        const { dispatch, _participant } = this.props;

        dispatch(openChat(_participant));
    }
}

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const enabled = getFeatureFlag(state, CHAT_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _participant: getParticipantById(state, ownProps.participantID),
        visible,
        _hidden: typeof interfaceConfig !== 'undefined'
            && (interfaceConfig.DISABLE_PRIVATE_MESSAGES || !isButtonEnabled('chat', state))
    };
}

export default translate(connect(_mapStateToProps)(PrivateMessageMenuButton));
