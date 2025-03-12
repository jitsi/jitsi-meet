import React from 'react';
import { View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import { getParticipantCount } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import ParticipantsCounter from './ParticipantsConter';
import styles from './styles';


/**
 * The type of the React {@code Component} props of {@link ParticipantsPaneButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Participants count.
     */
    _participantsCount: number;
}

/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPaneButton extends AbstractButton<IProps> {
    override icon = IconUsers;
    override label = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the participants panel.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        return navigate(screen.conference.participants);
    }

    /**
     * Override the _getAccessibilityLabel method to incorporate the dynamic participant count.
     *
     * @override
     * @returns {string}
     */
    _getAccessibilityLabel() {
        const { t, _participantsCount } = this.props;

        return t('toolbar.accessibilityLabel.participants', {
            participantsCount: _participantsCount
        });

    }

    /**
     * Overrides AbstractButton's {@link Component#render()}.
     *
     * @override
     * @protected
     * @returns {React.ReactElement}
     */
    override render() {
        return (
            <View style = { styles.participantsButtonBadge as ViewStyle }>
                { super.render() }
                <ParticipantsCounter />
            </View>
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
    return {
        _participantsCount: getParticipantCount(state)
    };
}

export default translate(connect(mapStateToProps)(ParticipantsPaneButton));
