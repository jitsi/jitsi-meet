import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconArrowDown, IconCheck, IconUsers } from '../../../base/icons/svg';

interface IOption {
    label: string;
    value: string;
}

interface IProps {

    /**
     * Callback when the selected value changes.
     */
    onChange: (value: string) => void;

    /**
     * The list of options to display.
     */
    options: IOption[];

    /**
     * The currently selected value.
     */
    value: string;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'relative',
            padding: '0 16px 8px',
            paddingRight: '64px',
            boxSizing: 'border-box'
        },

        trigger: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 12px',
            boxSizing: 'border-box',
            backgroundColor: theme.palette.ui02,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${Number(theme.shape.borderRadius) + 4}px`,
            color: theme.palette.text01,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            ...theme.typography.bodyShortRegular,

            '&:hover': {
                backgroundColor: theme.palette.action03Hover,
                borderColor: theme.palette.action01
            },

            '&:focus': {
                outline: 'none',
                borderColor: theme.palette.focus01,
                boxShadow: `0 0 0 2px ${theme.palette.focus01}40`
            },

            '&.open': {
                borderColor: theme.palette.action01,
                boxShadow: `0 0 0 2px ${theme.palette.action01}30`
            }
        },

        triggerContent: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden'
        },

        triggerIcon: {
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: theme.palette.action01,
            color: theme.palette.icon04
        },

        triggerLabel: {
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
        },

        arrowIcon: {
            flexShrink: 0,
            transition: 'transform 0.2s ease',

            '&.open': {
                transform: 'rotate(180deg)'
            }
        },

        dropdown: {
            position: 'absolute',
            bottom: '100%',
            left: '16px',
            right: '64px',
            marginBottom: '4px',
            backgroundColor: theme.palette.ui01,
            border: `1px solid ${theme.palette.ui04}`,
            borderRadius: `${Number(theme.shape.borderRadius) + 4}px`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
            zIndex: 10,
            overflow: 'hidden',
            animation: '$slideUp 0.15s ease-out'
        },

        '@keyframes slideUp': {
            from: {
                opacity: 0,
                transform: 'translateY(8px)'
            },
            to: {
                opacity: 1,
                transform: 'translateY(0)'
            }
        },

        dropdownHeader: {
            padding: '10px 14px 6px',
            ...theme.typography.labelBold,
            color: theme.palette.text03,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
        },

        optionsList: {
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px',

            '&::-webkit-scrollbar': {
                width: '4px'
            },

            '&::-webkit-scrollbar-track': {
                background: 'transparent'
            },

            '&::-webkit-scrollbar-thumb': {
                background: theme.palette.ui04,
                borderRadius: '4px'
            }
        },

        option: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: `${Number(theme.shape.borderRadius)}px`,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            color: theme.palette.text01,
            ...theme.typography.bodyShortRegular,

            '&:hover': {
                backgroundColor: theme.palette.action03Hover
            },

            '&.selected': {
                backgroundColor: `${theme.palette.action01}18`
            },

            '&:active': {
                backgroundColor: theme.palette.action03Active
            }
        },

        optionAvatar: {
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#fff'
        },

        everyoneIcon: {
            backgroundColor: theme.palette.action01
        },

        participantIcon: {
            backgroundColor: theme.palette.action02
        },

        optionLabel: {
            flex: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
        },

        checkIcon: {
            flexShrink: 0,
            opacity: 0,
            transition: 'opacity 0.15s ease',

            '&.visible': {
                opacity: 1
            }
        },

        triggerInitials: {
            fontSize: '0.65rem'
        }
    };
});

/**
 * Gets initials from a name for the avatar.
 *
 * @param {string} name - The display name.
 * @returns {string} - The initials (1-2 characters).
 */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
}

const ChatRecipientDropdown = ({ options, onChange, value }: IProps) => {
    const { classes, cx, theme } = useStyles();
    const { t } = useTranslation();
    const [ isOpen, setIsOpen ] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.value === value) || options[0];

    const toggleDropdown = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const handleSelect = useCallback((optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    }, [ onChange ]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
        }
    }, [ toggleDropdown ]);

    const handleOptionClick = useCallback((optionValue: string) => () => {
        handleSelect(optionValue);
    }, [ handleSelect ]);

    const handleOptionKeyDown = useCallback((optionValue: string) => (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(optionValue);
        }
    }, [ handleSelect ]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ isOpen ]);

    const isEveryone = selectedOption === options[0];

    return (
        <div
            className = { classes.container }
            ref = { containerRef }>
            {isOpen && (
                <div
                    className = { classes.dropdown }
                    role = 'listbox'>
                    <div className = { classes.dropdownHeader }>
                        {t('chat.sendTo')}
                    </div>
                    <div className = { classes.optionsList }>
                        {options.map((option, idx) => {
                            const isSelected = option.value === value;
                            const isEveryoneOption = idx === 0;

                            return (
                                <div
                                    aria-selected = { isSelected }
                                    className = { cx(classes.option, isSelected && 'selected') }
                                    key = { option.value }
                                    onClick = { handleOptionClick(option.value) }
                                    onKeyDown = { handleOptionKeyDown(option.value) }
                                    role = 'option'
                                    tabIndex = { 0 }>
                                    <div
                                        className = { cx(
                                            classes.optionAvatar,
                                            isEveryoneOption
                                                ? classes.everyoneIcon
                                                : classes.participantIcon
                                        ) }>
                                        {isEveryoneOption
                                            ? <Icon
                                                color = '#fff'
                                                size = { 16 }
                                                src = { IconUsers } />
                                            : getInitials(option.label)
                                        }
                                    </div>
                                    <span className = { classes.optionLabel }>
                                        {option.label}
                                    </span>
                                    <Icon
                                        className = { cx(classes.checkIcon, isSelected && 'visible') }
                                        color = { theme.palette.action01 }
                                        size = { 16 }
                                        src = { IconCheck } />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <div
                aria-expanded = { isOpen }
                aria-haspopup = 'listbox'
                className = { cx(classes.trigger, isOpen && 'open') }
                onClick = { toggleDropdown }
                onKeyDown = { handleKeyDown }
                role = 'button'
                tabIndex = { 0 }>
                <div className = { classes.triggerContent }>
                    <div className = { classes.triggerIcon }>
                        {isEveryone
                            ? <Icon
                                color = '#fff'
                                size = { 14 }
                                src = { IconUsers } />
                            : <span className = { classes.triggerInitials }>
                                {getInitials(selectedOption.label)}
                            </span>
                        }
                    </div>
                    <span className = { classes.triggerLabel }>
                        {selectedOption.label}
                    </span>
                </div>
                <Icon
                    className = { cx(classes.arrowIcon, isOpen && 'open') }
                    color = { theme.palette.icon01 }
                    size = { 18 }
                    src = { IconArrowDown } />
            </div>
        </div>
    );
};


export default ChatRecipientDropdown;
