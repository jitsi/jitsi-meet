// @flow

import { createStyles, makeStyles } from '@material-ui/core';

import { commonStyles, getGlobalStyles } from '../constants';
import { formatCommonClasses } from '../functions';

/**
 * Creates all the global styles.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const useStyles = makeStyles(theme =>
    createStyles({
        '@global': {
            ':root': {

                /**
                 * Color variables.
                 */
                '--default-color': '#F1F1F1',
                '--default-dark-color': '#2b3d5c',
                '--default-warning-color': 'rgb(215, 121, 118)',
                '--participants-pane-bg-color': '#141414',

                /**
                 * Toolbar.
                 */
                '--new-toolbar-background-color': '#131519',
                '--new-toolbar-button-hover-color': 'rgba(255, 255, 255, 0.2)',
                '--new-toolbar-button-toggle-color': 'rgba(255, 255, 255, 0.15)',
                '--menu-bg': '#242528',
                '--new-toolbar-size': '48px',
                '--new-toolbar-size-mobile': '60px',
                '--new-toolbar-size-wth-padding': 'calc(var(--new-toolbar-size) + 24px)',
                '--overflow-menu-item-color': '#fff',

                /**
                 * Video layout.
                 */
                '--participant-name-color': '#fff',
                '--audio-level-bg': '#44A5FF',
                '--audio-level-shadow': 'rgba(9, 36, 77, 0.9)',

                /**
                 * Chat.
                 */
                '--chat-actions-separator-color': 'rgb(173, 105, 112)',
                '--chat-background-color': '#131519',
                '--chat-input-separator-color': '#A4B8D1',
                '--chat-lobby-message-background-color': '#6A50D3',
                '--chat-lobby-actions-separator-color': '#6A50D3',
                '--chat-local-message-background-color': '#484A4F',
                '--chat-private-message-background-color': 'rgb(153, 69, 77)',
                '--chat-remote-message-background-color': ' #242528',
                '--sidebar-width': '315px',

                /**
                 * Media type thresholds.
                 */
                '--small-screen': '700px',
                '--very-small-screen': '500px',

                /**
                 * Welcome page variables.
                 */
                '--welcome-page-description-color': '#fff',
                '--welcome-page-font-family': 'inherit',
                '--welcome-page-background': 'none',
                '--welcome-page-title-color': '#fff',

                /**
                 * Prejoin / premeeting screen.
                 */
                '--prejoin-default-content-width': '336px'
            },
            ...formatCommonClasses(commonStyles(theme)),
            ...getGlobalStyles(theme)
        }
    })
);

/**
 * A component generating all the global styles.
 *
 * @returns {void}
 */
function GlobalStyles() {
    useStyles();

    return null;
}

export default GlobalStyles;
