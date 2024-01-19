import React from 'react';
import { View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import ParticipantsCounter from './ParticipantsConter';
import styles from './styles';


/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPaneButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconUsers;
    label = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the participants panel.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        return navigate(screen.conference.participants);
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
            <View style = { styles.participantsButtonBadge as ViewStyle }>
                {super.render()}
                <ParticipantsCounter />
            </View>
        );
    }
}

export default translate(connect()(ParticipantsPaneButton));
