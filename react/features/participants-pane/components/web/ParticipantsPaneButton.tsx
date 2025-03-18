import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import { getParticipantCount } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import {
    close as closeParticipantsPane,
    open as openParticipantsPane
} from '../../../participants-pane/actions.web';
import { closeOverflowMenuIfOpen } from '../../../toolbox/actions.web';
import { isParticipantsPaneEnabled } from '../../functions';

import ParticipantsCounter from './ParticipantsCounter';


/**
 * The type of the React {@code Component} props of {@link ParticipantsPaneButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the participants pane is open.
     */
    _isOpen: boolean;

    /**
     * Whether participants feature is enabled or not.
     */
    _isParticipantsPaneEnabled: boolean;

    /**
     * Participants count.
     */
    _participantsCount: number;
}

/**
 * Implementation of a button for accessing participants pane.
 */
class ParticipantsPaneButton extends AbstractButton<IProps> {
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.closeParticipantsPane';
    override icon = IconUsers;
    override label = 'toolbar.participants';
    override tooltip = 'toolbar.participants';
    override toggledTooltip = 'toolbar.closeParticipantsPane';

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._isOpen;
    }

    /**
    * Handles clicking the button, and toggles the participants pane.
    *
    * @private
    * @returns {void}
    */
    override _handleClick() {
        const { dispatch, _isOpen } = this.props;

        dispatch(closeOverflowMenuIfOpen());
        if (_isOpen) {
            dispatch(closeParticipantsPane());
        } else {
            dispatch(openParticipantsPane());
        }
    }


    /**
     * Override the _getAccessibilityLabel method to incorporate the dynamic participant count.
     *
     * @override
     * @returns {string}
     */
    override _getAccessibilityLabel() {
        const { t, _participantsCount, _isOpen } = this.props;

        if (_isOpen) {
            return t('toolbar.accessibilityLabel.closeParticipantsPane');
        }

        return t('toolbar.accessibilityLabel.participants', {
            participantsCount: _participantsCount
        });

    }

    /**
     * Overrides AbstractButton's {@link Component#render()}.
     *
     * @override
     * @protected
     * @returns {React$Node}
     */
    override render() {
        const { _isParticipantsPaneEnabled } = this.props;

        if (!_isParticipantsPaneEnabled) {
            return null;
        }

        return (
            <div
                className = 'toolbar-button-with-badge'>
                { super.render() }
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
        _isOpen: isOpen,
        _isParticipantsPaneEnabled: isParticipantsPaneEnabled(state),
        _participantsCount: getParticipantCount(state)
    };
}

export default translate(connect(mapStateToProps)(ParticipantsPaneButton));
