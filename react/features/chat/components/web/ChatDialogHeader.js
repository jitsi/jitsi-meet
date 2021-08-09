// @flow

import React, { useCallback } from 'react';

import { translate } from '../../../base/i18n';
import { Icon, IconClose, IconVirtualBackground } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { toggleChat, toggleChatBackground } from '../../actions.web';

import ChatBackgroundPanel from './ChatBackgroundPanel';

type Props = {

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function,

    /**
     * Function to be called when pressing the chat background button.
     */
    onChatBackground: Function,

    /**
     * An optional class name.
     */
    className: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function Header({ onCancel, onChatBackground, className, t }: Props) {

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, [ onCancel ]);

    const onChatBackgroundKeyPressHandler = useCallback(e => {
        if (onChatBackground && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onChatBackground();
        }
    }, [ onChatBackground ]);

    return (
        <div>
            <div
                className = { className || 'chat-dialog-header' }
                role = 'heading'>
                { t('chat.title') }
                <Icon
                    ariaLabel = { t('toolbar.closeChat') }
                    className = 'chat-background-button'
                    onClick = { onChatBackground }
                    onKeyPress = { onChatBackgroundKeyPressHandler }
                    role = 'button'
                    src = { IconVirtualBackground }
                    tabIndex = { 0 } />
                <Icon
                    ariaLabel = { t('toolbar.closeChat') }
                    onClick = { onCancel }
                    onKeyPress = { onKeyPressHandler }
                    role = 'button'
                    src = { IconClose }
                    tabIndex = { 1 } />
            </div>
            <ChatBackgroundPanel />
        </div>
    );
}

const mapDispatchToProps = { onCancel: toggleChat,
    onChatBackground: toggleChatBackground };

export default translate(connect(null, mapDispatchToProps)(Header));
