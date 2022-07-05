// @flow

/**
 * An object containing all the class names for common CSS.
 * Add a new name here and the styles to {@code commonStyles} object.
 *
 */
export const commonClassName = {
    emptyList: 'empty-list',
    muteDialog: 'mute-dialog',
    overflowMenuItem: 'overflow-menu-item',
    overflowMenuItemIcon: 'overflow-menu-item-icon',
    participantAvatar: 'participant-avatar',
    prejoinDialog: 'prejoin-dialog',
    prejoinDialogButton: 'prejoin-dialog-btn',
    toolboxIcon: 'toolbox-icon',
    toolboxButton: 'toolbox-button',
    toolboxContentItems: 'toolbox-content-items'
};

/**
 * Returns an object containing the declaration of the common, reusable CSS classes.
 *
 * @param {Object} theme -The theme.
 *
 * @returns {Object} - The common styles.
 */
export const commonStyles = (theme: Object) => {
    return {
        // '.empty-list'
        [commonClassName.emptyList]: {
            listStyleType: 'none',
            margin: 0,
            padding: 0
        },
        [commonClassName.muteDialog]: {
            '& .separator-line': {
                margin: `${theme.spacing(4)}px 0 ${theme.spacing(4)}px -20px`,
                padding: '0 20px',
                width: '100%',
                height: '1px',
                background: '#5E6D7A'
            },

            '& .control-row': {
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: `${theme.spacing(3)}px`,

                '& label': {
                    fontSize: '14px'
                }
            }
        },
        [commonClassName.overflowMenuItem]: {
            alignItems: 'center',
            color: theme.palette.text01,
            cursor: 'pointer',
            display: 'flex',
            fontSize: 14,
            fontWeight: 400,
            height: 40,
            lineHeight: '24px',
            padding: '8px 16px',
            boxSizing: 'border-box',
            '& > div': {
                display: 'flex',
                alignItems: 'center'
            },

            '&.unclickable': {
                cursor: 'default'
            },

            '&.disabled': {
                cursor: 'initial',
                color: theme.palette.text03,

                '&:hover': {
                    background: 'none'
                },

                '& svg': {
                    fill: theme.palette.text03
                }
            },

            '@media (hover: hover) and (pointer: fine)': {
                '&:hover': {
                    background: theme.palette.action02Hover
                },
                '&.unclickable:hover': {
                    background: 'inherit'
                }
            }
        },
        [commonClassName.overflowMenuItemIcon]: {
            marginRight: '16px',

            '& i': {
                display: 'inline',
                fontSize: 24
            },

            '@media (hover: hover) and (pointer: fine)': {
                '&i:hover': {
                    backgroundColor: 'initial'
                }
            },

            '& img': {
                maxWidth: 24,
                maxHeight: 24
            },

            '& svg': {
                fill: theme.palette.text01,
                height: 20,
                width: 20
            }
        },
        [commonClassName.participantAvatar]: {
            margin: `${theme.spacing(2)}px ${theme.spacing(3)}px ${theme.spacing(2)}px 0`
        },
        [commonClassName.prejoinDialog]: {
            background: '#1C2025',
            boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.5)',
            borderRadius: '5px',
            color: '#fff',
            height: '400px',
            width: '375px',

            [`${commonClassName.prejoinDialog}--small`]: {
                height: 300,
                width: 400
            },

            [`${commonClassName.prejoinDialog}-label`]: {
                fontSize: '15px',
                lineHeight: '24px'
            },

            [`${commonClassName.prejoinDialog}-label-num`]: {
                background: '#2b3b4b',
                border: '1px solid #A4B8D1',
                borderRadius: '50%',
                color: '#fff',
                display: 'inline-block',
                height: '24px',
                marginRight: `${theme.spacing(2)}px`,
                width: '24px'
            },

            [`${commonClassName.prejoinDialog}-container`]: {
                alignItems: 'center',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                height: '100vh',
                justifyContent: 'center',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100vw',
                zIndex: 3
            },

            [`${commonClassName.prejoinDialog}-flag`]: {
                display: 'inline-block',
                marginRight: `${theme.spacing(2)}px}`,
                transform: 'scale(1.2)'
            },

            [`${commonClassName.prejoinDialog}-title`]: {
                display: 'inline-block',
                fontSize: '24px',
                lineHeight: '32px'
            },

            [`${commonClassName.prejoinDialog}-icon`]: {
                cursor: 'pointer',

                '& > svg': {
                    fill: '#A4B8D1'
                }
            },

            [commonClassName.prejoinDialogButton]: {
                width: '309px'
            },

            [`${commonClassName.prejoinDialog}-dialin-container`]: {
                textAlign: 'center'
            },

            [`${commonClassName.prejoinDialog}-delimiter`]: {
                background: '#5f6266',
                border: '0',
                height: '1px',
                margin: '0',
                padding: '0',
                width: '100%'
            },

            [`${commonClassName.prejoinDialog}-delimiter-container`]: {
                margin: `${theme.spacing(3)}px 0 ${theme.spacing(4)}px 0`,
                position: 'relative'
            },

            [`${commonClassName.prejoinDialog}-delimiter-txt-container`]: {
                position: 'absolute',
                textAlign: 'center',
                top: '-8px',
                width: '100%'
            },

            [`${commonClassName.prejoinDialog}-delimiter-txt`]: {
                background: '#1C2025',
                color: '#5f6266',
                fontSize: '11px',
                textTransform: 'uppercase',
                padding: `0 ${theme.spacing(2)}px`
            }
        },

        [commonClassName.prejoinDialogButton]: {
            [`&.primary, &${commonClassName.prejoinDialogButton}.text`]: {
                width: '310px'
            }
        },

        [commonClassName.toolboxIcon]: {
            display: 'flex',
            borderRadius: 3,
            flexDirection: 'column',
            fontSize: 24,
            height: 48,
            justifyContent: 'center',
            width: 48,

            '@media (hover: hover) and (pointer: fine)': {
                '&:hover': {
                    background: theme.palette.ui04
                }
            },
            [theme.breakpoints.down('320')]: {
                height: 36,
                width: 36
            },

            '&.toggled': {
                background: theme.palette.ui03
            },

            '&.disabled': {
                cursor: 'initial !important',
                backgroundColor: `${theme.palette.disabled01} !important`,

                '& svg': {
                    fill: `${theme.palette.text03} !important`
                }
            }
        },
        [commonClassName.toolboxButton]: {
            color: theme.palette.text01,
            cursor: 'pointer',
            display: 'inline-block',
            lineHeight: '48px',
            textAlign: 'center'
        },
        [commonClassName.toolboxContentItems]: {
            background: theme.palette.ui01,
            borderRadius: 6,
            margin: '0 auto',
            padding: 6,
            textAlign: 'center',
            pointerEvents: 'all',
            boxShadow: '0px 2px 8px 4px rgba(0, 0, 0, 0.25), 0px 0px 0px 1px rgba(0, 0, 0, 0.15)',

            '& > div': {
                marginLeft: 8,

                '&:first-child': {
                    marginLeft: 0
                }
            }
        }
    };
};

/**
 * Returns the global styles.
 *
 * @param {Object} theme - The Jitsi theme.
 * @returns {Object}
 */
export const getGlobalStyles = (theme: Object) => {
    return {
        // @atlaskit/modal-dialog OVERRIDES
        '.atlaskit-portal div[role=dialog]': {
            // override dialog background
            '& > div': {
                background: theme.palette.ui02,
                color: theme.palette.text01
            }
        }
    };
};
