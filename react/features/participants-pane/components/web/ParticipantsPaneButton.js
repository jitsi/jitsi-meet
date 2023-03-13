// @flow
import React from 'react';

import { translate } from '../../../base/i18n';
import { IconUsers } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

import ParticipantsCounter from './ParticipantsCounter';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPaneButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not the participants pane is open.
     */
    _isOpen: boolean,
};

/**
 * Implementation of a button for accessing participants pane.
 */
class ParticipantsPaneButton extends AbstractButton<Props, *> {
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
     * Overrides AbstractButton's {@link Component#render()}.
     *
     * @override
     * @protected
     * @returns {React$Node}
     */
    render(): React$Node {
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
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { isOpen } = state['features/participants-pane'];

    return {
        _isOpen: isOpen
    };
}

export default translate(connect(mapStateToProps)(ParticipantsPaneButton));
