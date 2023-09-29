import React from 'react';
import { GlobalStyles as MUIGlobalStyles } from 'tss-react';
import { useStyles } from 'tss-react/mui';

import { commonStyles } from '../constants';

/**
 * A component generating all the global styles.
 *
 * @returns {void}
 */
function GlobalStyles() {
    const { theme } = useStyles();

    return (
        <MUIGlobalStyles
            styles = {
                commonStyles(theme)
            } />
    );
}

export default GlobalStyles;
