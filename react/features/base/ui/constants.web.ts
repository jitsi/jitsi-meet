import { Theme } from '@mui/material';

export * from './constants.any';

/**
 * Returns an object containing the declaration of the common, reusable CSS classes.
 *
 * @param {Object} theme -The theme.
 *
 * @returns {Object} - The common styles.
 */
export const commonStyles = (theme: Theme) => {
    return {
        ':root': {
            // Inject semantic tokens as CSS custom properties for use in SCSS
            '--toolbox-background-color': theme.palette.toolboxBackground,
            '--drawer-background-color': theme.palette.drawerBackground,
            '--toolbar-button-color': theme.palette.toolbarButton,
            '--toolbar-button-hover-color': theme.palette.toolbarButtonHover,
            '--toolbar-button-active-color': theme.palette.toolbarButtonActive,
            '--toolbar-icon-color': theme.palette.toolbarIcon,
            '--toolbar-icon-hover-color': theme.palette.toolbarIconHover,
            '--toolbar-icon-active-color': theme.palette.toolbarIconActive,
            '--overflow-menu-background-color': theme.palette.overflowMenuBackground,
            '--overflow-menu-item-text-color': theme.palette.overflowMenuItemText,
            '--overflow-menu-item-icon-color': theme.palette.overflowMenuItemIcon,
            '--overflow-menu-item-hover-color': theme.palette.overflowMenuItemHover,
            '--overflow-menu-item-disabled-color': theme.palette.overflowMenuItemDisabled
        },

        '.empty-list': {
            listStyleType: 'none',
            margin: 0,
            padding: 0
        },

        '.mute-dialog': {
            '& .separator-line': {
                margin: `${theme.spacing(4)} 0 ${theme.spacing(4)} -20px`,
                padding: '0 20px',
                width: '100%',
                height: '1px',
                background: '#5E6D7A'
            },

            '& .control-row': {
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: theme.spacing(3),

                '& label': {
                    fontSize: '0.875rem'
                }
            }
        },

        '.overflow-menu-item': {
            alignItems: 'center',
            color: theme.palette.overflowMenuItemText,
            cursor: 'pointer',
            display: 'flex',
            fontSize: '0.875rem',
            fontWeight: 400,
            height: 40,
            lineHeight: '1.5rem',
            padding: '8px 16px',
            boxSizing: 'border-box' as const,
            '& > div': {
                display: 'flex',
                alignItems: 'center'
            },

            '&.unclickable': {
                cursor: 'default'
            },

            '&.disabled': {
                cursor: 'initial',
                color: theme.palette.overflowMenuItemDisabled,

                '&:hover': {
                    background: 'none'
                },

                '& svg': {
                    fill: theme.palette.overflowMenuItemDisabled
                }
            },

            '@media (hover: hover) and (pointer: fine)': {
                '&:hover': {
                    background: theme.palette.overflowMenuItemHover
                },
                '&.unclickable:hover': {
                    background: 'inherit'
                }
            }
        },

        '.overflow-menu-item-icon': {
            marginRight: '16px',

            '& i': {
                display: 'inline',
                fontSize: '1.5rem'
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
                fill: theme.palette.overflowMenuItemIcon,
                height: 20,
                width: 20
            }
        },

        '.prejoin-dialog': {
            backgroundColor: theme.palette.prejoinDialogBackground,
            boxShadow: '0px 2px 20px rgba(0, 0, 0, 0.5)',
            borderRadius: theme.shape.borderRadius,
            color: '#fff',
            height: '400px',
            width: '375px',

            '.prejoin-dialog--small': {
                height: 300,
                width: 400
            },

            '.prejoin-dialog-label': {
                fontSize: '1rem',
                lineHeight: '1.5rem'
            },

            '.prejoin-dialog-label-num': {
                background: '#2b3b4b',
                border: '1px solid #A4B8D1',
                borderRadius: '50%',
                color: '#fff',
                display: 'inline-block',
                height: '24px',
                marginRight: theme.spacing(2),
                width: '24px'
            },

            '.prejoin-dialog-container': {
                alignItems: 'center',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                height: '100dvh',
                justifyContent: 'center',
                left: 0,
                position: 'absolute' as const,
                top: 0,
                width: '100vw',
                zIndex: 3
            },

            '.prejoin-dialog-flag': {
                display: 'inline-block',
                marginRight: theme.spacing(2),
                transform: 'scale(1.2)'
            },

            '.prejoin-dialog-title': {
                display: 'inline-block',
                fontSize: '1.5rem',
                lineHeight: '2rem'
            },

            '.prejoin-dialog-icon': {
                cursor: 'pointer'
            },

            '.prejoin-dialog-btn': {
                marginBottom: '8px'
            },

            '.prejoin-dialog-dialin-container': {
                textAlign: 'center' as const
            },

            '.prejoin-dialog-delimiter': {
                background: theme.palette.prejoinDialogDelimiter,
                border: '0',
                height: '1px',
                margin: '0',
                padding: '0',
                width: '100%'
            },

            '.prejoin-dialog-delimiter-container': {
                margin: `${theme.spacing(4)} 0`,
                position: 'relative' as const
            },

            '.prejoin-dialog-delimiter-txt-container': {
                position: 'absolute' as const,
                textAlign: 'center' as const,
                top: '-8px',
                width: '100%'
            },

            '.prejoin-dialog-delimiter-txt': {
                background: theme.palette.prejoinDialogBackground,
                color: theme.palette.prejoinDialogDelimiterText,
                fontSize: '0.75rem',
                textTransform: 'uppercase' as const,
                padding: `0 ${theme.spacing(2)}`
            }
        },

        '.prejoin-dialog-btn': {
            '&.primary, &.prejoin-dialog-btn.text': {
                width: '310px'
            }
        },

        '.toolbox-icon': {
            display: 'flex',
            borderRadius: 3,
            flexDirection: 'column' as const,
            fontSize: '1.5rem',
            height: 48,
            justifyContent: 'center',
            width: 48,

            '@media (hover: hover) and (pointer: fine)': {
                '&:hover': {
                    backgroundColor: theme.palette.toolboxIconHover
                },

                '&:active': {
                    backgroundColor: theme.palette.toolboxIconActive
                }
            },
            [theme.breakpoints.down(320)]: {
                height: 36,
                width: 36
            },

            '&.toggled': {
                backgroundColor: theme.palette.toolboxIconToggled
            },

            '&.disabled': {
                cursor: 'initial !important',
                backgroundColor: `${theme.palette.disabled01} !important`,

                '& svg': {
                    fill: `${theme.palette.icon03} !important`
                }
            }
        },

        '.toolbox-button': {
            color: theme.palette.toolbarIcon,
            cursor: 'pointer',
            display: 'inline-block',
            lineHeight: '3rem',
            textAlign: 'center' as const
        },

        '.toolbox-content-items': {
            background: theme.palette.toolboxBackground,
            borderRadius: 6,
            margin: '0 auto',
            padding: 6,
            textAlign: 'center' as const,
            pointerEvents: 'all' as const,
            display: 'flex',
            boxShadow: '0px 2px 8px 4px rgba(0, 0, 0, 0.25), 0px 0px 0px 1px rgba(0, 0, 0, 0.15)',

            '& > div': {
                marginRight: theme.spacing(2),

                '&:last-of-type': {
                    marginRight: 0
                }
            }
        }
    };
};
