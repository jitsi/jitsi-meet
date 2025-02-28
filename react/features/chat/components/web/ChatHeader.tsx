import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { toggleChat } from '../../actions.web';

interface IProps {

    /**
     * An optional class name.
     */
    className: string;

    /**
     * Whether CC tab is enabled or not.
     */
    isCCTabEnabled: boolean;

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean;

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function;
}

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function ChatHeader({ className, isPollsEnabled, isCCTabEnabled }: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    let title = 'chat.title';

    if (isCCTabEnabled && isPollsEnabled) {
        title = 'chat.titleWithPollsAndCC';
    } else if (isCCTabEnabled) {
        title = 'chat.titleWithCC';
    } else if (isPollsEnabled) {
        title = 'chat.titleWithPolls';
    }

    return (
        <div
            className = { className || 'chat-dialog-header' }>
            <span
                aria-level = { 1 }
                role = 'heading'>
                { t(title) }
            </span>
            <Icon
                ariaLabel = { t('toolbar.closeChat') }
                onClick = { onCancel }
                onKeyPress = { onKeyPressHandler }
                role = 'button'
                src = { IconCloseLarge }
                tabIndex = { 0 } />
        </div>
    );
}

export default ChatHeader;
