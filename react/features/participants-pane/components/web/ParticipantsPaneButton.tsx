import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../../participants-pane/actions.web';

import ParticipantsCounter from './ParticipantsCounter';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPaneButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the participants pane is open.
     */
    _isOpen: boolean;
}

/**
 * Implementation of a button for accessing participants pane.
 */
class ParticipantsPaneButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeParticipantsPane';
    icon = IconUsers;
    label = 'toolbar.participants';
    tooltip = 'toolbar.participants';
    toggledTooltip = 'toolbar.closeParticipantsPane';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._isOpen;
    }

    /**
    * Handles clicking the button, and toggles the participants pane.
    *
    * @private
    * @returns {void}
    */
    _handleClick() {
        const { dispatch, _isOpen } = this.props;

        if (_isOpen) {
            dispatch(closeParticipantsPane());
        } else {
            dispatch(openParticipantsPane());
        }
    }

    /**
     * Overrides AbstractButton's {@link Component#render()}.
     *
     * @override
     * @protected
     * @returns {React$Node}
     */
    render() {
        return (
            <div
                className = 'toolbar-button-with-badge'>
                {super.render()}
                <ParticipantsCounter />
            </div>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const { isOpen } = state['features/participants-pane'];

    return {
        _isOpen: isOpen
    };
}

export default translate(connect(mapStateToProps)(ParticipantsPaneButton));
