import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../../base/icons/components/Icon';
import { IconArrowDown } from '../../../../base/icons/svg';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';

interface IOption {
    label: string;
    value: string;
}

interface IProps {

    /**
     * Whether or not the dropdown is disabled.
     */
    disabled?: boolean;

    /**
     * Id of the trigger element.
     */
    id: string;

    /**
     * Label to be displayed above the dropdown.
     */
    label?: string;

    /**
     * Change handler, invoked with the value of the picked option.
     */
    onChange: (value: string) => void;

    /**
     * The options of the dropdown.
     */
    options: Array<IOption>;

    /**
     * The value of the selected option.
     */
    value: string | null;
}

interface IItemProps {
    label: string;
    onSelect: (value: string) => void;
    selected: boolean;
    value: string;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            display: 'flex',
            flexDirection: 'column'
        },

        label: {
            color: theme.palette.selectLabel,
            ...theme.typography.bodyShortRegular,
            marginBottom: theme.spacing(2)
        },

        dropdownContainer: {
            position: 'relative'
        },

        trigger: {
            alignItems: 'center',
            backgroundColor: theme.palette.selectBackground,
            border: 0,
            borderRadius: `${theme.shape.borderRadius}px`,
            color: theme.palette.selectText,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            ...theme.typography.bodyShortRegular,
            padding: '10px 16px',
            textAlign: 'left',
            width: '100%',

            '&:focus': {
                outline: 0,
                boxShadow: `0px 0px 0px 2px ${theme.palette.selectFocus}`
            },

            '&:disabled': {
                color: theme.palette.selectDisabled,
                cursor: 'default'
            }
        },

        triggerText: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        chevron: {
            marginLeft: theme.spacing(2),
            transition: 'transform .16s'
        },

        chevronOpen: {
            transform: 'rotate(180deg)'
        },

        // The z-index must beat the Switch knob (zIndex 10) of the option rows
        // rendered under the dropdown.
        menuWrapper: {
            left: 0,
            position: 'absolute',
            right: 0,
            top: `calc(100% + ${theme.spacing(1)})`,
            zIndex: 50
        },

        menuWrapperUp: {
            bottom: `calc(100% + ${theme.spacing(1)})`,
            top: 'auto'
        },

        // Neutralizes the ContextMenu default positioning (marginTop/right/top
        // target the participants pane) so the menu sits in the wrapper. The
        // :focus highlight makes the arrow key navigation visible — the items
        // only style the .focus-visible polyfill class, which programmatic
        // focus() calls never set.
        menu: {
            boxSizing: 'border-box',
            margin: 0,
            maxHeight: '250px',
            overflowY: 'auto',
            position: 'static',
            right: 'auto',
            width: '100%',

            '& [role="menuitem"]:focus': {
                backgroundColor: theme.palette.overflowMenuItemHover,
                outline: 0
            }
        }
    };
});

/**
 * An entry of the dropdown options list.
 *
 * @returns {JSX.Element}
 */
const DropdownSelectItem = ({ label, onSelect, selected, value }: IItemProps) => {
    const onClick = useCallback(() => onSelect(value), [ onSelect, value ]);

    return (
        <ContextMenuItem
            accessibilityLabel = { label }
            onClick = { onClick }
            role = 'menuitem'
            selected = { selected }
            text = { label } />
    );
};

/**
 * A themed single choice dropdown: a select look-alike built out of
 * ContextMenu so the options list matches the app theme (the native <select>
 * popup cannot be styled). The menu is rendered right under the trigger,
 * matching its width.
 *
 * @returns {JSX.Element}
 */
// eslint-disable-next-line react/no-multi-comp
const DropdownSelect = ({ disabled, id, label, onChange, options, value }: IProps) => {
    const { classes, cx } = useStyles();
    const [ isOpen, setIsOpen ] = useState(false);
    const [ openUp, setOpenUp ] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const onToggle = useCallback(() => {
        if (disabled) {
            return;
        }

        // When opening, check whether the menu fits below the trigger within
        // the closest scroll container (the dialog content) and open upwards
        // otherwise — the menu would be clipped/scrolled out of view below.
        if (!isOpen && containerRef.current) {
            let clipBottom = window.innerHeight;
            let parent = containerRef.current.parentElement;

            while (parent) {
                const { overflowY } = window.getComputedStyle(parent);

                if (overflowY === 'auto' || overflowY === 'scroll') {
                    clipBottom = parent.getBoundingClientRect().bottom;
                    break;
                }
                parent = parent.parentElement;
            }

            const { bottom } = containerRef.current.getBoundingClientRect();
            const menuHeight = Math.min(250, (options.length * 40) + 16) + 8;

            setOpenUp(clipBottom - bottom < menuHeight);
        }

        setIsOpen(!isOpen);
    }, [ disabled, isOpen, options.length ]);
    const onSelect = useCallback((selectedValue: string) => {
        onChange(selectedValue);
        setIsOpen(false);
        triggerRef.current?.focus();
    }, [ onChange ]);

    const getMenuItems = useCallback(
        () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []), []);

    // Opens the menu with the arrow keys per the menu button pattern; when it
    // is already open, moves the focus into the item list.
    const onTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
            return;
        }

        e.preventDefault();

        if (isOpen) {
            const items = getMenuItems();

            (e.key === 'ArrowDown' ? items[0] : items[items.length - 1])?.focus();
        } else {
            onToggle();
        }
    }, [ getMenuItems, isOpen, onToggle ]);

    // Arrow key navigation between the menu items, wrapping around the ends.
    const onMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
        const items = getMenuItems();
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);

        switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            items[(currentIndex + 1) % items.length]?.focus();
            break;
        case 'ArrowUp':
            e.preventDefault();
            items[currentIndex <= 0 ? items.length - 1 : currentIndex - 1]?.focus();
            break;
        case 'Home':
            e.preventDefault();
            items[0]?.focus();
            break;
        case 'End':
            e.preventDefault();
            items[items.length - 1]?.focus();
            break;
        case 'Tab':
            setIsOpen(false);
            break;
        }
    }, [ getMenuItems ]);

    // Move focus to the selected item when the menu opens.
    useEffect(() => {
        if (isOpen) {
            const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));
            const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');

            items?.[Math.min(selectedIndex, items.length - 1)]?.focus();
        }
    }, [ isOpen ]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onOutsideClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        // Capture phase so closing the menu does not also close the dialog.
        const onEscKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        window.addEventListener('click', onOutsideClick);
        window.addEventListener('keydown', onEscKey, true);

        return () => {
            window.removeEventListener('click', onOutsideClick);
            window.removeEventListener('keydown', onEscKey, true);
        };
    }, [ isOpen ]);

    // Fall back to the first option's label when the current value isn't among the options
    // (e.g. it just became unavailable while the dialog stayed open) — otherwise the trigger
    // would render blank instead of a usable service name.
    const selectedLabel = options.find(option => option.value === value)?.label ?? options[0]?.label ?? '';

    return (
        <div className = { classes.container }>
            { label && (
                <label
                    className = { classes.label }
                    htmlFor = { id }>
                    { label }
                </label>
            ) }
            <div
                className = { classes.dropdownContainer }
                ref = { containerRef }>
                <button
                    aria-controls = { `${id}-menu` }
                    aria-expanded = { isOpen }
                    aria-haspopup = 'menu'
                    className = { classes.trigger }
                    disabled = { disabled }
                    id = { id }
                    onClick = { onToggle }
                    onKeyDown = { onTriggerKeyDown }
                    ref = { triggerRef }
                    type = 'button'>
                    <span className = { classes.triggerText }>
                        { selectedLabel }
                    </span>
                    <Icon
                        className = { cx(classes.chevron, isOpen && classes.chevronOpen) }
                        size = { 18 }
                        src = { IconArrowDown } />
                </button>
                { isOpen && (
                    // The arrow key interactions of the menu are handled on the
                    // wrapper; the items themselves take care of Enter/Space.
                    <div
                        className = { cx(classes.menuWrapper, openUp && classes.menuWrapperUp) }
                        onKeyDown = { onMenuKeyDown }
                        ref = { menuRef }>
                        <ContextMenu
                            accessibilityLabel = { label }
                            className = { classes.menu }
                            hidden = { false }
                            id = { `${id}-menu` }
                            role = 'menu'>
                            <ContextMenuItemGroup>
                                { options.map(option => (
                                    <DropdownSelectItem
                                        key = { option.value }
                                        label = { option.label }
                                        onSelect = { onSelect }
                                        selected = { option.value === value }
                                        value = { option.value } />
                                )) }
                            </ContextMenuItemGroup>
                        </ContextMenu>
                    </div>
                ) }
            </div>
        </div>
    );
};

export default DropdownSelect;
