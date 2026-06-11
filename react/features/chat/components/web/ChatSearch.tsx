import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseCircle } from '../../../base/icons/svg';

interface IProps {

    /**
     * Callback invoked when the search input value changes.
     */
    onSearch: (value: string) => void;

    /**
     * The current search term value (controlled).
     */
    searchTerm: string;
}

const useStyles = makeStyles()(theme => {
    return {
        chatSearch: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2),
            padding: `0 ${theme.spacing(3)}`,
            height: '36px',
            backgroundColor: theme.palette.inputFieldBackground,
            borderRadius: theme.shape.borderRadius,
            flex: 1
        },

        input: {
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.palette.inputFieldText,
            ...theme.typography.bodyShortRegular,

            '&::placeholder': {
                color: theme.palette.inputFieldPlaceholder
            }
        },

        clearButton: {
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            color: theme.palette.icon02,

            '&:hover': {
                color: theme.palette.icon01
            }
        }
    };
});

/**
 * A search input bar for filtering chat messages.
 *
 * @returns {JSX.Element}
 */
function ChatSearch({ onSearch, searchTerm }: IProps) {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onSearch(e.target.value);
    }, [ onSearch ]);

    const onClear = useCallback(() => {
        onSearch('');
        inputRef.current?.focus();
    }, [ onSearch ]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onSearch('');
        }
    }, [ onSearch ]);

    const onClearKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onClear();
        }
    }, [ onClear ]);

    return (
        <div className = { classes.chatSearch }>
            <input
                autoComplete = 'off'
                className = { classes.input }
                onChange = { onChange }
                onKeyDown = { onKeyDown }
                placeholder = { t('chat.searchPlaceholder') }
                ref = { inputRef }
                type = 'text'
                value = { searchTerm } />
            {searchTerm.length > 0 && (
                <span
                    className = { classes.clearButton }
                    onClick = { onClear }
                    onKeyPress = { onClearKeyPress }
                    role = 'button'
                    tabIndex = { 0 }>
                    <Icon
                        size = { 16 }
                        src = { IconCloseCircle } />
                </span>
            )}
        </div>
    );
}

export default ChatSearch;