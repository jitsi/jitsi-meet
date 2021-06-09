// @flow

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { IconRaisedHand } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { toggleReactionsMenu } from '../../actions.web';
import { getReactionsMenuVisibility } from '../../functions.web';

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
    _raisedHand: boolean,

    /**
     * Click handler for the reaction button. Opens reactions menu.
     */
    onReactionsClick: Function,

    /**
     * Whether or not the reactions menu is open.
     */
    isOpen: boolean
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
        const { _raisedHand, t, onReactionsClick, isOpen } = this.props;

        return (
            <ReactionsMenuPopup>
                <ToolbarButton
                    accessibilityLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                    icon = { IconRaisedHand }
                    key = 'reactions'
                    onClick = { onReactionsClick }
                    toggled = { _raisedHand }
                    tooltip = { t(`toolbar.${isOpen ? 'closeReactionsMenu' : 'openReactionsMenu'}`) } />
            </ReactionsMenuPopup>
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
        isOpen: getReactionsMenuVisibility(state)
    };
}

const mapDispatchToProps = {
    onReactionsClick: toggleReactionsMenu
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps,
)(ReactionsMenuButton));
