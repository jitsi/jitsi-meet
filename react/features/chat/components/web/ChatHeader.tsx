import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge, IconSearch } from '../../../base/icons/svg';
import { isFileSharingEnabled } from '../../../file-sharing/functions.any';
import { toggleChat } from '../../actions.web';
import { ChatTabs } from '../../constants';
import { getFocusedTab, isChatDisabled } from '../../functions';

import ChatSearch from './ChatSearch';

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
     * Whether search mode is currently active.
     */
    isSearchOpen: boolean;

    /**
     * Function to be called when pressing the close button.
     */
    onCancel: Function;

    /**
     * Callback to update the search term from the parent.
     */
    onSearch: (value: string) => void;

    /**
     * Callback to toggle the search bar.
     */
    onSearchToggle: () => void;

    /**
     * The current search term.
     */
    searchTerm: string;
}

const useStyles = makeStyles()(theme => {
    return {
        headerActions: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2),
            flexShrink: 0
        },

        iconButton: {
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: theme.palette.icon01,

            '&:hover': {
                color: theme.palette.icon02
            }
        },

        headerRow: {
            display: 'flex',
            alignItems: 'center',
            width: '100%'
        },

        headerTitle: {
            flex: 1
        }
    };
});

/**
 * Custom header of the {@code ChatDialog}.
 *
 * @returns {React$Element<any>}
 */
function ChatHeader({
    className,
    isCCTabEnabled,
    isPollsEnabled,
    isSearchOpen,
    onSearch,
    onSearchToggle,
    searchTerm
}: IProps) {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { classes } = useStyles();
    const _isChatDisabled = useSelector(isChatDisabled);
    const focusedTab = useSelector(getFocusedTab);
    const fileSharingTabEnabled = useSelector(isFileSharingEnabled);

    const onCancel = useCallback(() => {
        dispatch(toggleChat());
    }, []);

    const onKeyPressHandler = useCallback((e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onCancel();
        }
    }, []);

    const onSearchToggleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onSearchToggle();
        }
    }, [ onSearchToggle ]);

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
        return null;
    }

    const isChatTab = !_isChatDisabled && focusedTab === ChatTabs.CHAT;
    const showSearchBar = isChatTab && isSearchOpen;

    return (
        <div className = { className || 'chat-dialog-header' }>
            <div className = { classes.headerRow }>
                {showSearchBar
                    ? (
                        <ChatSearch
                            onSearch = { onSearch }
                            searchTerm = { searchTerm } />
                    )
                    : (
                        <span
                            aria-level = { 1 }
                            className = { classes.headerTitle }
                            role = 'heading'>
                            {t(title)}
                        </span>
                    )
                }
                <div className = { classes.headerActions }>
                    {isChatTab && !isSearchOpen && (
                        <span
                            className = { classes.iconButton }
                            onClick = { onSearchToggle }
                            onKeyPress = { onSearchToggleKeyPress }
                            role = 'button'
                            tabIndex = { 0 }>
                            <Icon
                                size = { 20 }
                                src = { IconSearch } />
                        </span>
                    )}
                    <Icon
                        ariaLabel = { t('toolbar.closeChat') }
                        onClick = { onCancel }
                        onKeyPress = { onKeyPressHandler }
                        role = 'button'
                        src = { IconCloseLarge }
                        tabIndex = { 0 } />
                </div>
            </div>
        </div>
    );
}

export default ChatHeader;
