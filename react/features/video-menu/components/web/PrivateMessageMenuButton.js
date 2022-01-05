// @flow

import React, { Component } from 'react';

import ContextMenuItem from '../../../base/components/context-menu/ContextMenuItem';
import { translate } from '../../../base/i18n';
import { IconMessage } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { openChat } from '../../../chat/';
import {
    _mapStateToProps as _abstractMapStateToProps,
    type Props as AbstractProps
} from '../../../chat/components/web/PrivateMessageButton';
import { isButtonEnabled } from '../../../toolbox/functions.web';

declare var interfaceConfig: Object;

type Props = AbstractProps & {

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

    _onClick: () => void;

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
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
function _mapStateToProps(state: Object, ownProps: Props): $Shape<Props> {
    return {
        ..._abstractMapStateToProps(state, ownProps),
        _hidden: typeof interfaceConfig !== 'undefined'
            && (interfaceConfig.DISABLE_PRIVATE_MESSAGES || !isButtonEnabled('chat', state))
    };
}

export default translate(connect(_mapStateToProps)(PrivateMessageMenuButton));
