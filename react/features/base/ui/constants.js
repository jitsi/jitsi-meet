// @flow

/**
 * An object containing all the class names for common CSS.
 * Add a new name here and the styles to {@code commonStyles} object.
 *
 */
export const commonClassName = {
    emptyList: 'empty-list',
    overflowMenuItem: 'overflow-menu-item',
    overflowMenuItemIcon: 'overflow-menu-item-icon',
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
                    background: theme.palette.action02Hover
                }
            },
            [theme.breakpoints.down('320')]: {
                height: 36,
                width: 36
            },

            '&.toggled': {
                background: theme.palette.ui02
            },

            '&.disabled': {
                cursor: 'initial !important',
                backgroundColor: `${theme.palette.action02Disabled} !important`,

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
