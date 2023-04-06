import React, { useCallback, useMemo, useRef } from 'react';
import { makeStyles } from 'tss-react/mui';

import { IconCloseLarge } from '../../../icons/svg';
import Popover from '../../../popover/components/Popover.web';
import { MultiSelectItem } from '../types';

import ClickableIcon from './ClickableIcon';
import ContextMenu from './ContextMenu';
import ContextMenuItem from './ContextMenuItem';
import ContextMenuItemGroup from './ContextMenuItemGroup';
import Input from './Input';

type Props = {
    autoFocus?: boolean;
    disabled?: boolean;
    filterValue?: string;
    hideList: Function;
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
        contextMenu: {
            position: 'relative' as const,
            marginTop: 0,
            right: 'auto',
            padding: '0',
            boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.75)'
        },
        selectedList: {
            position: 'static' as const,
            padding: 0,
            maxHeight: '200px',
            marginTop: '8px',
            boxSizing: 'border-box'
        },
        selectedItem: {
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            '&:hover': {
                backgroundColor: theme.palette.ui01
            },
            cursor: 'auto',
            paddingTop: '0px',
            paddingBottom: '0px',
            paddingLeft: '16px',
            paddingRight: '6px'
        },
        contentListItem: {
            inlineSize: 'calc(100% - 38px)',
            overflowWrap: 'break-word'
        },
        contentSelectedItem: {
            inlineSize: 'calc(100% - 82px)',
            overflowWrap: 'break-word'
        }
    };
});

const MultiSelect = ({
    autoFocus,
    disabled,
    placeholder,
    items,
    filterValue,
    onFilterChange,
    isOpen,
    noMatchesText,
    onSelected,
    selectedItems,
    onRemoved,
    hideList
}: Props) => {
    const { classes } = useStyles();
    const inputRef = useRef();
    const selectItem = useCallback(item => () => onSelected(item), [ onSelected ]);
    const removeItem = useCallback(item => () => onRemoved(item), [ onRemoved ]);
    const content = useMemo(() => (
        <ContextMenu
            className = { classes.contextMenu }
            entity = { inputRef.current }
            hidden = { false }
            offsetTarget = { inputRef.current }
            useEntityWidth = { true }>
            <ContextMenuItemGroup>
                {
                    items.length > 0
                        ? items.map(item => (
                            <ContextMenuItem
                                accessibilityLabel = { `multi-select-${item.value}` }
                                disabled = { item.isDisabled }
                                key = { item.value }
                                onClick = { selectItem(item) }>
                                {item.elemBefore}
                                <div className = { classes.contentListItem }>
                                    {item.content}
                                    { item.description && <p>{item.description}</p> }
                                </div>
                            </ContextMenuItem>))
                        : (
                            <ContextMenuItem accessibilityLabel = 'multi-select-no-matches' >
                                <div className = { classes.contentListItem }>
                                    {noMatchesText}
                                </div>
                            </ContextMenuItem>
                        )
                }
            </ContextMenuItemGroup>
        </ContextMenu>
    )
    , [ items ]);

    return (
        <div>
            <Popover
                content = { content }
                onPopoverClose = { hideList }
                position = 'bottom'
                trigger = 'click'
                visible = { isOpen ?? false }>
                <Input
                    autoFocus = { autoFocus }
                    disabled = { disabled }
                    onChange = { onFilterChange }
                    placeholder = { placeholder }
                    ref = { inputRef }
                    value = { filterValue ?? '' } />
            </Popover>
            { selectedItems && selectedItems?.length > 0
            && <ContextMenu
                className = { classes.selectedList }
                entity = { inputRef.current }
                hidden = { false }
                offsetTarget = { inputRef.current }
                useEntityWidth = { true }>

                <ContextMenuItemGroup>
                    {
                        selectedItems.map(item => (
                            <ContextMenuItem
                                accessibilityLabel = { `multi-select-${item.value}` }
                                className = { classes.selectedItem }
                                key = { item.value }>
                                {item.elemBefore}
                                <div className = { classes.contentSelectedItem }>
                                    {item.content}
                                </div>
                                <ClickableIcon
                                    accessibilityLabel = { 'multi-select-unselect' }
                                    icon = { IconCloseLarge }
                                    id = 'modal-header-close-button'
                                    onClick = { removeItem(item) } />

                            </ContextMenuItem>))
                    }
                </ContextMenuItemGroup>


            </ContextMenu>
            }
        </div>
    );
};

export default MultiSelect;
