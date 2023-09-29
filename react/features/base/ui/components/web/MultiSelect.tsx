import React, { useCallback, useMemo, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';

import { IconCloseLarge } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { MultiSelectItem } from '../types';

import ClickableIcon from './ClickableIcon';
import Input from './Input';

interface IProps {
    autoFocus?: boolean;
    disabled?: boolean;
    error?: boolean;
    errorDialog?: JSX.Element | null;
    filterValue?: string;
    id: string;
    isOpen?: boolean;
    items: MultiSelectItem[];
    noMatchesText?: string;
    onFilterChange?: (value: string) => void;
    onRemoved: (item: any) => void;
    onSelected: (item: any) => void;
    placeholder?: string;
    selectedItems?: MultiSelectItem[];
}

const MULTI_SELECT_HEIGHT = 200;

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'relative'
        },
        items: {
            '&.found': {
                position: 'absolute',
                boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.75)'
            },
            marginTop: theme.spacing(2),
            width: '100%',
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${Number(theme.shape.borderRadius)}px`,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            zIndex: 2,
            maxHeight: `${MULTI_SELECT_HEIGHT}px`,
            overflowY: 'auto',
            padding: '0'
        },
        listItem: {
            boxSizing: 'border-box',
            display: 'flex',
            padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
            alignItems: 'center',
            '& .content': {
                // 38px because of the icon before the content
                inlineSize: 'calc(100% - 38px)',
                overflowWrap: 'break-word',
                marginLeft: theme.spacing(2),
                color: theme.palette.text01,
                '&.with-remove': {
                    // 60px because of the icon before the content and the remove button
                    inlineSize: 'calc(100% - 60px)',
                    marginRight: theme.spacing(2),
                    '&.without-before': {
                        marginLeft: 0,
                        inlineSize: 'calc(100% - 38px)'
                    }
                },
                '&.without-before': {
                    marginLeft: 0,
                    inlineSize: '100%'
                }
            },
            '&.found': {
                cursor: 'pointer',
                padding: `10px ${theme.spacing(3)}`,
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
            position: 'absolute',
            marginTop: theme.spacing(2),
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
    id,
    items,
    filterValue,
    onFilterChange,
    isOpen,
    noMatchesText,
    onSelected,
    selectedItems,
    onRemoved
}: IProps) => {
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
                            <div className = { `content ${item.elemBefore ? '' : 'without-before'}` }>
                                {item.content}
                                {item.description && <p>{item.description}</p>}
                            </div>
                        </div>
                    ))
                    : <div className = { classes.listItem }>{noMatchesText}</div>
            }
        </div>
    ), [ items ]);

    const errorMessageDialog = useMemo(() =>
        error && <div className = { classes.errorMessage }>
            { errorDialog }
        </div>, [ error ]);

    return (
        <div className = { classes.container }>
            <Input
                autoFocus = { autoFocus }
                disabled = { disabled }
                id = { id }
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
                            <div className = { `content with-remove ${item.elemBefore ? '' : 'without-before'}` }>
                                <p>{item.content}</p>
                            </div>
                            <ClickableIcon
                                accessibilityLabel = { 'multi-select-unselect' }
                                icon = { IconCloseLarge }
                                id = 'modal-header-close-button'
                                onClick = { removeItem(item) } />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
