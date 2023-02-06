import React, { ReactNode } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconMessage } from '../../../base/icons/svg';
import AbstractButton, { Props as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

import ChatCounter from './ChatCounter';

/**
 * The type of the React {@code Component} props of {@link ChatButton}.
 */
interface IProps extends AbstractButtonProps, WithTranslation {

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean;
}

/**
 * Implementation of a button for accessing chat pane.
 */
class ChatButton extends AbstractButton<IProps, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.chat';
    icon = IconMessage;
    label = 'toolbar.openChat';
    toggledLabel = 'toolbar.closeChat';

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        if (this._isToggled()) {
            return 'toolbar.closeChat';
        }

        return 'toolbar.openChat';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._chatOpen;
    }

    /**
     * Overrides AbstractButton's {@link Component#render()}.
     *
     * @override
     * @protected
     * @returns {boReact$Nodeolean}
     */
    render(): ReactNode {
        return (
            <div
                className = 'toolbar-button-with-badge'
                key = 'chatcontainer'>
                {super.render()}
                <ChatCounter />
            </div>
        );
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    return {
        _chatOpen: state['features/chat'].isOpen
    };
};

export default translate(connect(mapStateToProps)(ChatButton));
