import React, { useCallback, useMemo, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';

import { IconCloseLarge } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { MultiSelectItem } from '../types';

import ClickableIcon from './ClickableIcon';
import Input from './Input';

type Props = {
    autoFocus?: boolean;
    disabled?: boolean;
    error?: boolean;
    errorDialog?: JSX.Element | null;
    filterValue?: string;
    isOpen?: boolean;
    items: MultiSelectItem[];
    noMatchesText?: string;
    onFilterChange?: (value: string) => void;
    onRemoved: (item: any) => void;
    onSelected: (item: any) => void;
    placeholder?: string;
    selectedItems?: MultiSelectItem[];
};

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'relative' as const
        },
        items: {
            '&.found': {
                position: 'absolute' as const,
                boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.75)'
            },
            marginTop: '8px',
            width: '100%',
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${Number(theme.shape.borderRadius)}px`,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            zIndex: 2,
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0'
        },
        listItem: {
            boxSizing: 'border-box',
            display: 'flex',
            padding: '8px 16px',
            alignItems: 'center',
            '& .content': {
                inlineSize: 'calc(100% - 38px)',
                overflowWrap: 'break-word',
                marginLeft: '8px',
                color: theme.palette.text01,
                '&.with-remove': {
                    inlineSize: 'calc(100% - 60px)',
                    marginRight: '8px'
                }
            },
            '&.found': {
                cursor: 'pointer',
                padding: '10px 16px',
                '&:hover': {
                    backgroundColor: theme.palette.ui02
                }
            },
            '&.disabled': {
                cursor: 'not-allowed',
                '&:hover': {
                    backgroundColor: theme.palette.ui01
                },
                color: theme.palette.text03
            }
        },
        errorMessage: {
            position: 'absolute' as const,
            marginTop: '8px',
            width: '100%'
        }
    };
});

const MultiSelect = ({
    autoFocus,
    disabled,
    error,
    errorDialog,
    placeholder,
    items,
    filterValue,
    onFilterChange,
    isOpen,
    noMatchesText,
    onSelected,
    selectedItems,
    onRemoved
}: Props) => {
    const { classes } = useStyles();
    const inputRef = useRef();
    const selectItem = useCallback(item => () => onSelected(item), [ onSelected ]);
    const removeItem = useCallback(item => () => onRemoved(item), [ onRemoved ]);
    const foundItems = useMemo(() => (
        <div className = { `${classes.items} found` }>
            {
                items.length > 0
                    ? items.map(item => (
                        <div
                            className = { `${classes.listItem} ${item.isDisabled ? 'disabled' : ''} found` }
                            key = { item.value }
                            onClick = { item.isDisabled ? undefined : selectItem(item) }>
                            {item.elemBefore}
                            <div className = 'content'>
                                {item.content}
                                {item.description && <p>{item.description}</p>}
                            </div>
                        </div>
                    ))
                    : <div>{noMatchesText}</div>
            }
        </div>
    )
    , [ items ]);

    const errorMessageDialog = useMemo(() =>
        error && <div className = { classes.errorMessage }>
            { errorDialog }
        </div>
    , [ error ]);

    return (
        <div className = { classes.container }>
            <Input
                autoFocus = { autoFocus }
                disabled = { disabled }
                onChange = { onFilterChange }
                placeholder = { placeholder }
                ref = { inputRef }
                value = { filterValue ?? '' } />
            {isOpen && foundItems}
            { errorMessageDialog }
            { selectedItems && selectedItems?.length > 0 && (
                <div className = { classes.items }>
                    { selectedItems.map(item => (
                        <div
                            className = { `${classes.listItem} ${item.isDisabled ? 'disabled' : ''}` }
                            key = { item.value }>
                            {item.elemBefore}
                            <div className = 'content with-remove'>
                                <p>{item.content}</p>
                            </div>
                            <ClickableIcon
                                accessibilityLabel = { 'multi-select-unselect' }
                                icon = { IconCloseLarge }
                                id = 'modal-header-close-button'
                                onClick = { removeItem(item) } />


                        </div>
                    ))
                    }
                </div>
            )
            }
        </div>
    );
};

export default MultiSelect;
