// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React from 'react';

import { connect } from '../../../base/redux';
import { toggleReactionsMenu } from '../../actions.web';
import { getReactionsMenuVisibility } from '../../functions.web';

import ReactionsMenu from './ReactionsMenu';


// type Props = AudioSettingsContentProps & {
type Props = {

    /**
    * Component's children (the audio button).
    */
    children: React$Node,

    /**
    * Flag controlling the visibility of the popup.
    */
    isOpen: boolean,

    /**
    * Callback executed when the popup closes.
    */
    onClose: Function
}

/**
 * Popup with audio settings.
 *
 * @returns {ReactElement}
 */
function ReactionsMenuPopup({
    children,
    isOpen,
    onClose
}: Props) {
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

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        isOpen: getReactionsMenuVisibility(state)
    };
}

const mapDispatchToProps = {
    onClose: toggleReactionsMenu
};

export default connect(mapStateToProps, mapDispatchToProps)(ReactionsMenuPopup);
