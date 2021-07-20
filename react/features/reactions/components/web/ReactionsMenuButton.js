// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconRaisedHand } from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import ToolbarButton from '../../../toolbox/components/web/ToolbarButton';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { type ReactionEmojiProps } from '../../constants';
import { getReactionsQueue } from '../../functions.any';
import { getReactionsMenuVisibility } from '../../functions.web';

import ReactionEmoji from './ReactionEmoji';
import ReactionsMenuPopup from './ReactionsMenuPopup';

type Props = {

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Whether or not the local participant's hand is raised.
     */
    raisedHand: boolean,

    /**
     * Click handler for the reaction button. Toggles the reactions menu.
     */
    onReactionsClick: Function,

    /**
     * Whether or not the reactions menu is open.
     */
    isOpen: boolean,

    /**
     * The array of reactions to be displayed.
     */
    reactionsQueue: Array<ReactionEmojiProps>,

    /**
     * Redux dispatch function.
     */
    dispatch: Function
};


declare var APP: Object;

/**
 * Button used for the reactions menu.
 *
 * @returns {ReactElement}
 */
function ReactionsMenuButton({
    t,
    raisedHand,
    isOpen,
    reactionsQueue,
    dispatch
}: Props) {

    /**
     * Toggles the reactions menu visibility.
     *
     * @returns {void}
     */
    function toggleReactionsMenu() {
        dispatch(toggleReactionsMenuVisibility());
    }

    return (
        <div className = 'reactions-menu-popup-container'>
            <ReactionsMenuPopup>
                <ToolbarButton
                    accessibilityLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                    icon = { IconRaisedHand }
                    key = 'reactions'
                    onClick = { toggleReactionsMenu }
                    toggled = { raisedHand }
                    tooltip = { t(`toolbar.${isOpen ? 'closeReactionsMenu' : 'openReactionsMenu'}`) } />
            </ReactionsMenuPopup>
            {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                index = { index }
                key = { uid }
                reaction = { reaction }
                uid = { uid } />))}
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
    const localParticipant = getLocalParticipant(state);

    return {
        isOpen: getReactionsMenuVisibility(state),
        reactionsQueue: getReactionsQueue(state),
        raisedHand: localParticipant?.raisedHand
    };
}

export default translate(connect(mapStateToProps)(ReactionsMenuButton));
