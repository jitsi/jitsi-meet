// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { IconRaisedHand } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { toggleReactionsMenu } from '../../actions.web';
import { getReactionsMenuVisibility, getReactionsQueue } from '../../functions.web';

import ReactionEmoji from './ReactionEmoji';
import ReactionsMenuPopup from './ReactionsMenuPopup';
import ToolbarButton from './ToolbarButton';

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
     * Click handler for the reaction button. Opens reactions menu.
     */
    onReactionsClick: Function,

    /**
     * Whether or not the reactions menu is open.
     */
    isOpen: boolean,

    /**
     * The array of reactions to be displayed.
     */
    reactionsQueue: Array
};

/**
 * Button used for reaction menu.
 *
 * @returns {ReactElement}
 */
class ReactionsMenuButton extends Component<Props> {

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { raisedHand, t, onReactionsClick, isOpen, reactionsQueue } = this.props;

        return (
            <div className = 'react-menu-popup-container'>
                <ReactionsMenuPopup>
                    <ToolbarButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                        icon = { IconRaisedHand }
                        key = 'reactions'
                        onClick = { onReactionsClick }
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
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        isOpen: getReactionsMenuVisibility(state),
        reactionsQueue: getReactionsQueue(state)
    };
}

const mapDispatchToProps = {
    onReactionsClick: toggleReactionsMenu
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ReactionsMenuButton));
