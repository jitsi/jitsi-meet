import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge } from '../../../base/icons/svg';
import { updateSettings } from '../../../base/settings/actions';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import { toggleChat } from '../../actions.web';
import { ChatTabs } from '../../constants';
import { getFocusedTab, isChatDisabled } from '../../functions';

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
function ChatHeader({ className, isCCTabEnabled, isPollsEnabled }: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const _isChatDisabled = useSelector(isChatDisabled);
    const focusedTab = useSelector(getFocusedTab);
    const fileSharingTabEnabled = useSelector(isFileSharingEnabled);
    const chatTheme = useSelector((state: IReduxState) => state['features/base/settings'].chatTheme ?? 'dark');

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onToggleTheme = useCallback(() => {
        dispatch(updateSettings({ chatTheme: chatTheme === 'dark' ? 'light' : 'dark' }));
    }, [ chatTheme ]);

    const onKeyPressHandler = useCallback(e => {
        if (onCancel && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onCancel();
        }
    }, []);

    let title = 'chat.title';

    if (!_isChatDisabled && focusedTab === ChatTabs.CHAT) {
        title = 'chat.tabs.chat';
    } else if (isPollsEnabled && focusedTab === ChatTabs.POLLS) {
        title = 'chat.tabs.polls';
    } else if (isCCTabEnabled && focusedTab === ChatTabs.CLOSED_CAPTIONS) {
        title = 'chat.tabs.closedCaptions';
    } else if (fileSharingTabEnabled && focusedTab === ChatTabs.FILE_SHARING) {
        title = 'chat.tabs.fileSharing';
    } else {
        // If the focused tab is not enabled, don't render the header.
        // This should not happen in normal circumstances since Chat.tsx already checks
        // if any tabs are available before rendering.
        return null;
    }

    const isLight = chatTheme === 'light';
    const iconColor = isLight ? '#1C2025' : undefined;

    return (
        <div
            className = { className || 'chat-dialog-header' }
            style = { isLight ? { backgroundColor: '#E8E8E8', color: '#1C2025' } : undefined }>
            <span
                aria-level = { 1 }
                role = 'heading'
                style = { isLight ? { color: '#1C2025' } : undefined }>
                { t(title) }
            </span>
            <div style = {{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    aria-label = { t('chat.toggleTheme') }
                    onClick = { onToggleTheme }
                    style = {{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title = { t('chat.toggleTheme') }>
                    { isLight ? '🌙' : '☀️' }
                </button>
                <Icon
                    ariaLabel = { t('toolbar.closeChat') }
                    color = { iconColor }
                    onClick = { onCancel }
                    onKeyPress = { onKeyPressHandler }
                    role = 'button'
                    src = { IconCloseLarge }
                    tabIndex = { 0 } />
            </div>
        </div>
    );
}

export default ChatHeader;
