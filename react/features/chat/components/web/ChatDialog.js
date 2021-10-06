// @flow

import React from 'react';

import { Dialog } from '../../../base/dialog';

import Header from './ChatDialogHeader';

type Props = {

    /**
     * Children of the component.
     */
    children: React$Node,

    /**
     * Whether the polls feature is enabled or not.
     */
    isPollsEnabled: boolean
}

/**
 * Component that renders the content of the chat in a modal.
 *
 * @returns {React$Element<any>}
 */
function ChatDialog({ children, isPollsEnabled }: Props) {
    return (
        <Dialog
            customHeader = { Header }
            disableEnter = { true }
            disableFooter = { true }
            hideCancelButton = { true }
            submitDisabled = { true }
            titleKey = { isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title' } >
            <div className = 'chat-dialog'>
                {children}
            </div>
        </Dialog>
    );
}

export default ChatDialog;
