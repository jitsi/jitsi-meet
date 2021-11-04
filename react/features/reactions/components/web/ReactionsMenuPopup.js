// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { toggleReactionsMenuVisibility } from '../../actions.web';
import { getReactionsMenuVisibility } from '../../functions.web';

import ReactionsMenu from './ReactionsMenu';


type Props = {

    /**
    * Component's children (the reactions menu button).
    */
    children: React$Node
}

/**
 * Popup with reactions menu.
 *
 * @returns {ReactElement}
 */
function ReactionsMenuPopup({
    children
}: Props) {
    /**
    * Flag controlling the visibility of the popup.
    */
    const isOpen = useSelector(state => getReactionsMenuVisibility(state));

    const dispatch = useDispatch();
    const onClose = useCallback(() => {
        dispatch(toggleReactionsMenuVisibility());
    });

    return (
        <div className = 'reactions-menu-popup'>
            <InlineDialog
                content = { <ReactionsMenu /> }
                isOpen = { isOpen }
                onClose = { onClose }
                placement = 'top'>
                {children}
            </InlineDialog>
        </div>
    );
}

export default ReactionsMenuPopup;
