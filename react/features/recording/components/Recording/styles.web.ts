import { Theme } from '@mui/material';

export const ICON_INFO = 'images/icon-info.png';

export const ICON_USERS = 'images/icon-users.png';

/**
 * Creates the theme based styles of the recording & transcription dialog
 * content.
 *
 * @param {Theme} theme - The current theme.
 * @returns {Object}
 */
export const startRecordingDialogStyles = (theme: Theme) => {
    return {
        container: {
            flex: 0,
            flexDirection: 'column' as const
        },

        section: {
            padding: `${theme.spacing(2)} 0`
        },

        // No overflow: hidden here — the dropdown menus must be able to
        // overflow the accordion; the header carries its own border radius.
        accordion: {
            background: theme.palette.ui02,
            border: `1px solid ${theme.palette.ui03}`,
            borderRadius: '4px',
            boxSizing: 'border-box' as const,
            marginTop: theme.spacing(2),
            width: '100%'
        },

        // Also resets the native button appearance — the header is a <button>
        // so it is keyboard operable out of the box.
        accordionHeader: {
            alignItems: 'center',
            appearance: 'none' as const,
            background: 'none',
            border: 0,
            borderRadius: '4px',
            boxSizing: 'border-box' as const,
            color: theme.palette.text01,
            cursor: 'pointer',
            display: 'flex',
            font: 'inherit',
            gap: theme.spacing(2),
            padding: '10px 12px',
            textAlign: 'left' as const,
            width: '100%',

            '&:hover': {
                background: theme.palette.ui03
            },

            '&:focus-visible': {
                boxShadow: `0px 0px 0px 2px ${theme.palette.selectFocus} inset`,
                outline: 0
            }
        },

        accordionText: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column' as const,
            gap: '2px',
            minWidth: 0
        },

        accordionTitle: {
            fontSize: '0.8125rem',
            fontWeight: 600,
            lineHeight: 1.2
        },

        accordionSummary: {
            color: theme.palette.text02,
            fontSize: '0.75rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const
        },

        accordionChevron: {
            color: theme.palette.text02,
            display: 'flex',
            marginLeft: 'auto',
            transition: 'transform .16s'
        },

        accordionChevronOpen: {
            transform: 'rotate(180deg)'
        },

        accordionBody: {
            padding: '12px'
        },

        authorizationPanel: {
            display: 'flex',
            flexDirection: 'column' as const,
            margin: `${theme.spacing(2)} 0 0`
        },

        loggedInPanel: {
            padding: `${theme.spacing(2)} 0`
        },

        footer: {
            display: 'flex',
            flexDirection: 'row' as const,
            justifyContent: 'flex-end',
            padding: '12px 0 4px',

            '& button:not(:first-child)': {
                marginLeft: theme.spacing(2)
            }
        },

        header: {
            alignItems: 'center',
            display: 'flex',
            flex: 0,
            flexDirection: 'row' as const,
            justifyContent: 'space-between'
        },

        headerSpaceTop: {
            marginTop: '10px'
        },

        title: {
            alignItems: 'center',
            display: 'inline-flex',
            fontSize: '0.875rem',
            marginLeft: theme.spacing(3),
            maxWidth: '70%'
        },

        titleNoMargin: {
            alignItems: 'center',
            display: 'inline-flex',
            fontSize: '0.875rem',
            fontWeight: 600,
            maxWidth: '70%'
        },

        optionLabel: {
            alignItems: 'center',
            display: 'inline-flex',
            fontSize: '0.875rem',
            maxWidth: '70%'
        },

        switch: {
            marginLeft: 'auto'
        },

        iconContainer: {
            alignItems: 'center',
            display: 'inline-flex'
        },

        fileSharingIconContainer: {
            backgroundColor: theme.palette.ui04,
            borderRadius: '4px',
            height: '40px',
            justifyContent: 'center',
            width: '42px'
        },

        fileSharingIcon: {
            height: '18px',
            objectFit: 'contain' as const,
            width: '18px'
        },

        info: {
            backgroundColor: theme.palette.warning02,
            color: theme.palette.uiBackground,
            display: 'inline-flex',
            margin: '16px 0 8px',
            width: '100%'
        },

        infoIcon: {
            alignSelf: 'center',
            height: '14px',
            margin: '0 24px 0 16px',
            objectFit: 'contain' as const,
            width: '14px'
        },

        infoTitle: {
            display: 'inline-flex',
            fontSize: '0.875rem',
            width: '290px'
        },

        localRecordingWarning: {
            display: 'block',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            marginTop: theme.spacing(2),
            padding: '8px 16px'
        },

        localRecordingWarningText: {
            backgroundColor: theme.palette.ui03,
            color: theme.palette.text01
        },

        localRecordingWarningNotification: {
            backgroundColor: theme.palette.warning02,
            color: theme.palette.uiBackground
        }
    };
};
