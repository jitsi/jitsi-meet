import React from 'react';

import AlertDialog from '../../../base/dialog/components/native/AlertDialog';

/**
 * Dialog to inform the user that we couldn't load the whiteboard.
 *
 * @returns {JSX.Element}
 */
const WhiteboardErrorDialog = () => (
    <AlertDialog
        contentKey = 'info.whiteboardError' />
);

export default WhiteboardErrorDialog;
