import React from 'react';
import {
    ScrollView,
    Text,
    TextStyle,
    TouchableHighlight,
    View,
    ViewStyle
} from 'react-native';
import { Divider } from 'react-native-paper';
import { Edge } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowRight } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants/functions';
import { navigate } from '../../../mobile/navigation/components/settings/SettingsNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { shouldShowModeratorSettings } from '../../functions.native';

import AdvancedSection from './AdvancedSection';
import ConferenceSection from './ConferenceSection';
import GeneralSection from './GeneralSection';
import LinksSection from './LinksSection';
import ModeratorSection from './ModeratorSection';
import NotificationsSection from './NotificationsSection';
import { AVATAR_SIZE } from './constants';
import styles from './styles';


interface IProps {

    isInWelcomePage?: boolean | undefined;
}

const SettingsView = ({ isInWelcomePage }: IProps) => {
    const { displayName } = useSelector((state: IReduxState) => state['features/base/settings']);
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const showModeratorSettings = useSelector((state: IReduxState) => shouldShowModeratorSettings(state));
    const { visible } = useSelector((state: IReduxState) => state['features/settings']);

    const addBottomInset = !isInWelcomePage;
    const localParticipantId = localParticipant?.id;
    const scrollBounces = Boolean(isInWelcomePage);

    if (visible !== undefined && !visible) {
        return null;
    }

    return (
        <JitsiScreen
            disableForcedKeyboardDismiss = { true }
            safeAreaInsets = { [ addBottomInset && 'bottom', 'left', 'right' ].filter(Boolean) as Edge[] }
            style = { styles.settingsViewContainer }>
            <ScrollView bounces = { scrollBounces }>
                <View style = { styles.profileContainerWrapper as ViewStyle }>
                    <TouchableHighlight

                        /* eslint-disable react/jsx-no-bind */
                        onPress = { () => navigate(screen.settings.profile) }>
                        <View
                            style = { styles.profileContainer as ViewStyle }>
                            <Avatar
                                participantId = { localParticipantId }
                                size = { AVATAR_SIZE } />
                            <Text style = { styles.displayName as TextStyle }>
                                { displayName }
                            </Text>
                            <Icon
                                size = { 24 }
                                src = { IconArrowRight }
                                style = { styles.profileViewArrow } />
                        </View>
                    </TouchableHighlight>
                </View>
                <GeneralSection />
                { isInWelcomePage && <>
                    <Divider style = { styles.fieldSeparator as ViewStyle } />
                    <ConferenceSection />
                </> }
                <Divider style = { styles.fieldSeparator as ViewStyle } />
                <NotificationsSection />

                { showModeratorSettings
                    && <>
                        <Divider style = { styles.fieldSeparator as ViewStyle } />
                        <ModeratorSection />
                    </> }
                <Divider style = { styles.fieldSeparator as ViewStyle } />
                <AdvancedSection />
                <Divider style = { styles.fieldSeparator as ViewStyle } />
                <LinksSection />
            </ScrollView>
        </JitsiScreen>
    );
};

export default SettingsView;
