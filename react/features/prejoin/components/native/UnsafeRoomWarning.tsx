import React, { useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Platform,
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { appNavigate } from '../../../app/actions.native';
import { IReduxState } from '../../../app/types';
import { getConferenceName } from '../../../base/conference/functions';
import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge, IconWarning } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import getUnsafeRoomText from '../../../base/util/getUnsafeRoomText.native';
import HeaderNavigationButton from '../../../mobile/navigation/components/HeaderNavigationButton';
import { navigateRoot } from '../../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { IPrejoinProps } from '../../types';

import { preJoinStyles as styles } from './styles';


const UnsafeRoomWarning: React.FC<IPrejoinProps> = ({ navigation }: IPrejoinProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const roomName = useSelector((state: IReduxState) => getConferenceName(state));
    const aspectRatio = useSelector(
        (state: IReduxState) => state['features/base/responsive-ui']?.aspectRatio
    );
    const unsafeRoomText = useSelector((state: IReduxState) => getUnsafeRoomText(state, t, 'prejoin'));

    const goBack = useCallback(() => {
        dispatch(appNavigate(undefined));

        return true;
    }, [ dispatch ]);

    const onProceed = useCallback(() => {
        navigateRoot(screen.preJoin);

        return true;
    }, [ dispatch ]);

    const headerLeft = () => {
        if (Platform.OS === 'ios') {
            return (
                <HeaderNavigationButton
                    label = { t('dialog.close') }
                    onPress = { goBack } />
            );
        }

        return (
            <HeaderNavigationButton
                onPress = { goBack }
                src = { IconCloseLarge } />
        );
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft,
            headerTitle: t('prejoin.joinMeeting')
        });
    }, [ navigation ]);

    let unsafeRoomContentContainer;

    if (aspectRatio === ASPECT_RATIO_NARROW) {
        unsafeRoomContentContainer = styles.unsafeRoomContentContainer;
    } else {
        unsafeRoomContentContainer = styles.unsafeRoomContentContainerWide;
    }


    return (
        <JitsiScreen
            addBottomPadding = { false }
            safeAreaInsets = { [ 'right' ] }
            style = { styles.unsafeRoomWarningContainer } >
            <View style = { styles.displayRoomNameBackdrop as StyleProp<TextStyle> }>
                <Text
                    numberOfLines = { 1 }
                    style = { styles.preJoinRoomName as StyleProp<TextStyle> }>
                    { roomName }
                </Text>
            </View>
            <View style = { unsafeRoomContentContainer as StyleProp<ViewStyle> }>
                <View style = { styles.warningIconWrapper as StyleProp<ViewStyle> }>
                    <Icon
                        src = { IconWarning }
                        style = { styles.warningIcon } />
                </View>

                <Text
                    dataDetectorType = 'link'
                    style = { styles.warningText as StyleProp<TextStyle> }>
                    { unsafeRoomText }
                </Text>
                <Button
                    accessibilityLabel = 'prejoin.proceedAnyway'
                    disabled = { false }
                    labelKey = 'prejoin.proceedAnyway'
                    onClick = { onProceed }
                    style = { styles.joinButton }
                    type = { BUTTON_TYPES.SECONDARY } />
            </View>
        </JitsiScreen>
    );
};

export default UnsafeRoomWarning;
