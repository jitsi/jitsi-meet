// @flow
/* eslint-disable react/no-multi-comp */
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import {
    Image,
    SafeAreaView,
    View
} from 'react-native';
import Video from 'react-native-video';
import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { Platform } from '../../../base/react';
import { JaneButton, WelcomeScreenText } from '../../../base/react/components/native';
import { connect } from '../../../base/redux';
import {
    ColorPalette,
    sizeHelper
} from '../../../base/styles';
import { setScreen } from '../../actions';
import { Indicator } from '../Indicator';
import VideoChatUrlDetector from '../VideoChatUrlDetector';

import tutorialStyles from './styles';

const WHITE_COLOR = ColorPalette.white;
const JANE_COLOR = ColorPalette.jane;

// $FlowFixMe[object literal]
const isPad = Platform.isPad;

const ENVELOPE_ICON_SIZE = sizeHelper.getDpByWidth(isPad ? 161 : 130);

const VIDEO_PLAYER_DIMESIONS = {
    width: sizeHelper.getDpByWidth(isPad ? 511 : 291),
    height: sizeHelper.getDpByWidth(isPad ? 288 : 164)
};

// eslint-disable-next-line max-len
const videoUrl = 'https://player.vimeo.com/external/509989030.hd.mp4?s=f61e57ff1ff82f97a395a511bd1b04dcfc8d80a0&profile_id=174';

type Props = {
    dispatch: Dispatch<any>,
    t: Function
};

type TutorialLayoutProps = {
    screenName: string
}

const setUpRedirectTo = dispatch => screenName => () => dispatch(setScreen(screenName));

const StepOne = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.stepOne.mainContainer }>
            <View style = { tutorialStyles.stepOne.innerUpperContainer }>
                <Image
                    source = { require('../../../../../images/jane-video-logo-blue.png') }
                    style = { tutorialStyles.stepOne.logo } />
                <WelcomeScreenText
                    style = { tutorialStyles.stepOne.header }>
                    {
                        t('welcomepage.gotAppInstalled')
                    }
                </WelcomeScreenText>
                <WelcomeScreenText
                    style = { tutorialStyles.stepOne.messageText } >
                    {
                        t('welcomepage.howToJoin')
                    }
                </WelcomeScreenText>
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.confirmNext') }
                    onPress = { redirectTo('stepTwo') }
                    textColor = { JANE_COLOR } />
            </View>
            <View style = { tutorialStyles.stepOne.innerLowerContainer }>
                <Indicator
                    count = { 5 }
                    currentIndex = { 0 } />
            </View>
        </View>
        <View
            style = { tutorialStyles.buttonContainer } >
            <JaneButton
                borderColor = { WHITE_COLOR }
                content = { t('welcomepage.joinAsStaff') }
                onPress = { redirectTo('staff') }
                textColor = { WHITE_COLOR } />

        </View>
    </View>);
};

// use connect HOC wrapper here to pass the redux dispatch function to the component.
const StepOneScreen = connect()(translate(StepOne));

const StepTwo = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.stepTwo.mainContainer }>
            <View style = { tutorialStyles.stepTwo.innerUpperContainer }>
                <Image
                    source = { require('../../../../../images/jane-video-logo-blue.png') }
                    style = { tutorialStyles.stepTwo.logo } />
                <WelcomeScreenText
                    style = { tutorialStyles.stepTwo.header }>
                    {
                        t('welcomepage.watchGuidedTour')
                    }
                </WelcomeScreenText>
                <Video
                    controls = { true }
                    ignoreSilentSwitch = 'ignore'
                    paused = { true }
                    source = {{ uri: videoUrl }}
                    style = {{
                        width: VIDEO_PLAYER_DIMESIONS.width,
                        height: VIDEO_PLAYER_DIMESIONS.height
                    }} />
            </View>
            <View style = { tutorialStyles.stepTwo.innerLowerContainer }>
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.confirmNext') }
                    onPress = { redirectTo('stepThree') }
                    textColor = { JANE_COLOR } />
                <Indicator
                    count = { 5 }
                    currentIndex = { 1 } />
            </View>
        </View>
        {
            isPad && <View
                style = { tutorialStyles.buttonContainer } >
                <JaneButton
                    borderColor = { WHITE_COLOR }
                    content = { t('welcomepage.joinAsStaff') }
                    onPress = { redirectTo('staff') }
                    textColor = { WHITE_COLOR } />

            </View>
        }
    </View>);
};

const StepTwoScreen = connect()(translate(StepTwo));

const StepThree = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.stepThree.mainContainer }>
            <View style = { tutorialStyles.stepThree.innerUpperContainer }>
                <FontAwesomeIcon
                    color = { JANE_COLOR }
                    icon = { faEnvelope }
                    size = { ENVELOPE_ICON_SIZE } />
                <WelcomeScreenText
                    style = { tutorialStyles.stepThree.header }>
                    {
                        t('welcomepage.doYouHaveAccess')
                    }
                </WelcomeScreenText>
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.confirmYes') }
                    marginBottom = { 17 }
                    onPress = { redirectTo('stepFour') }
                    textColor = { JANE_COLOR } />
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.confirmNo') }
                    onPress = { redirectTo('noEmail') }
                    textColor = { JANE_COLOR } />
            </View>
            <View style = { tutorialStyles.stepThree.innerLowerContainer }>
                <Indicator
                    count = { 5 }
                    currentIndex = { 2 } />
            </View>

        </View>
        {
            isPad && <View
                style = { tutorialStyles.buttonContainer } >
                <JaneButton
                    borderColor = { WHITE_COLOR }
                    content = { t('welcomepage.joinAsStaff') }
                    onPress = { redirectTo('staff') }
                    textColor = { WHITE_COLOR } />

            </View>
        }
    </View>);
};

const StepThreeScreen = connect()(translate(StepThree));

const StepFour = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.stepFour.mainContainer }>
            <View style = { tutorialStyles.stepFour.innerUpperContainer }>
                <WelcomeScreenText
                    style = { tutorialStyles.stepFour.header }>
                    {
                        t('welcomepage.youWillBeEmailed')
                    }
                </WelcomeScreenText>
                <Image
                    source = { require('../../../../../images/patient-email-mobile-screen.png') }
                    style = { tutorialStyles.stepFour.mobileScreen } />
                <WelcomeScreenText
                    style = { tutorialStyles.stepFour.message }>
                    {
                        t('welcomepage.youWillBeEmailedBefore')
                    }
                    {'\n'} {'\n'}
                    {
                        t('welcomepage.checkYourEmail')
                    }
                </WelcomeScreenText>
            </View>
            <View style = { tutorialStyles.stepFour.innerLowerContainer }>
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.confirmNext') }
                    marginBottom = { sizeHelper.getDpByHeight(36) }
                    onPress = { redirectTo('done') }
                    textColor = { JANE_COLOR } />
                <Indicator
                    count = { 5 }
                    currentIndex = { 3 } />
            </View>
        </View>
        {
            isPad && <View
                style = { tutorialStyles.buttonContainer } >
                <JaneButton
                    borderColor = { WHITE_COLOR }
                    content = { t('welcomepage.joinAsStaff') }
                    onPress = { redirectTo('staff') }
                    textColor = { WHITE_COLOR } />

            </View>
        }
    </View>);
};

const StepFourScreen = connect()(translate(StepFour));


const Done = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.done.mainContainer }>
            <Image
                source = { require('../../../../../images/jane-video-logo.png') }
                style = { tutorialStyles.logo } />
            <WelcomeScreenText
                style = { tutorialStyles.done.header }>
                {
                    t('welcomepage.allSet')
                }
            </WelcomeScreenText>
            <JaneButton
                borderColor = { WHITE_COLOR }
                content = { t('welcomepage.remindMe') }
                onPress = { redirectTo('stepOne') }
                textColor = { WHITE_COLOR } />
        </View>
        <View
            style = { tutorialStyles.buttonContainer } >
            <JaneButton
                borderColor = { WHITE_COLOR }
                content = { t('welcomepage.joinAsStaff') }
                onPress = { redirectTo('staff') }
                textColor = { WHITE_COLOR } />

        </View>
    </View>);
};

const DoneScreen = connect()(translate(Done));

const NoEmail = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.noEmail.mainContainer }>
            <View style = { tutorialStyles.noEmail.innerUpperContainer }>
                <WelcomeScreenText
                    style = { [ tutorialStyles.bigText, tutorialStyles.noEmail.header ] }>
                    {
                        t('welcomepage.noEmail')
                    }
                    {'\n'}
                    {
                        t('welcomepage.signInToJoin')
                    }
                </WelcomeScreenText>
                <Image
                    source = { require('../../../../../images/upcoming-appoiment-email.png') }
                    style = { tutorialStyles.noEmail.mobileScreen } />
                <WelcomeScreenText
                    style = { tutorialStyles.noEmail.regularText }>
                    {
                        t('welcomepage.loginToJoin')
                    }
                    {'\n'} {'\n'}
                    {
                        t('welcomepage.somethingLike')
                    }
                    {'\n'}
                    <WelcomeScreenText
                        style = { [ tutorialStyles.noEmail.regularText, tutorialStyles.noEmail.boldText ] }>
                        clinicnamehere.janeapp.com
                    </WelcomeScreenText>
                    {'\n'} {'\n'}
                    {
                        t('welcomepage.willIncludeDirectLink')
                    }
                </WelcomeScreenText>
            </View>
            <View style = { tutorialStyles.noEmail.innerLowerContainer }>
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.gotIt') }
                    onPress = { redirectTo('done') }
                    textColor = { JANE_COLOR } />
                <Indicator
                    count = { 5 }
                    currentIndex = { 4 } />
            </View>
        </View>
        {
            isPad && <View
                style = { tutorialStyles.buttonContainer } >
                <JaneButton
                    borderColor = { WHITE_COLOR }
                    content = { t('welcomepage.joinAsStaff') }
                    onPress = { redirectTo('staff') }
                    textColor = { WHITE_COLOR } />

            </View>
        }
    </View>);
};

const NoEmailScreen = connect()(translate(NoEmail));


const Staff = (props: Props) => {
    const redirectTo = setUpRedirectTo(props.dispatch);
    const { t } = props;

    return (<View
        style = { tutorialStyles.wrapper }>
        <View
            style = { tutorialStyles.staff.mainContainer }>
            <View style = { tutorialStyles.staff.innerUpperContainer }>
                <WelcomeScreenText
                    style = { tutorialStyles.staff.title }>
                    {
                        t('welcomepage.joinAsStaffMember')
                    }
                </WelcomeScreenText>
                <WelcomeScreenText
                    style = { tutorialStyles.staff.lightText } >
                    {

                        t('welcomepage.pleaseNote')
                    }
                </WelcomeScreenText>
                <WelcomeScreenText
                    style = { [ tutorialStyles.staff.lightText, tutorialStyles.staff.boldText ] } >
                    {

                        t('welcomepage.toOpenYourApp')
                    }
                </WelcomeScreenText>
                <View
                    style = { tutorialStyles.staff.steps.container }>
                    <WelcomeScreenText
                        style = { [ tutorialStyles.staff.lightText, tutorialStyles.staff.steps.number ] }>
                        1.
                    </WelcomeScreenText>
                    <WelcomeScreenText
                        style = { [ tutorialStyles.staff.lightText, tutorialStyles.staff.steps.text ] }>
                        {
                            t('welcomepage.firstStep')
                        }
                    </WelcomeScreenText>
                </View>
                <View
                    style = { tutorialStyles.staff.steps.container }>
                    <WelcomeScreenText
                        style = { [ tutorialStyles.staff.lightText, tutorialStyles.staff.steps.number ] }>
                        2.
                    </WelcomeScreenText>
                    <WelcomeScreenText
                        style = { [ tutorialStyles.staff.lightText, tutorialStyles.staff.steps.text ] }>
                        {
                            t('welcomepage.secondStep')
                        }
                    </WelcomeScreenText>
                </View>
                <Image
                    source = { require('../../../../../images/staff-mobile-screen.png') }
                    style = { tutorialStyles.staff.mobileScreen } />
            </View>
            <View style = { tutorialStyles.staff.innerLowerContainer }>
                <JaneButton
                    borderColor = { JANE_COLOR }
                    content = { t('welcomepage.gotIt') }
                    onPress = { redirectTo('done') }
                    textColor = { JANE_COLOR } />
            </View>
        </View>
    </View>);
};

const StaffScreen = connect()(translate(Staff));

const DefaultScreen = () => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.default.mainContainer }>
        <Image
            source = { require('../../../../../images/jane-video-logo.png') }
            style = { tutorialStyles.logo } />
    </View>
</View>);

const getStepScreen = screenName => {
    switch (screenName) {
    case 'stepOne':
        return <StepOneScreen />;
    case 'stepTwo':
        return <StepTwoScreen />;
    case 'stepThree':
        return <StepThreeScreen />;
    case 'stepFour':
        return <StepFourScreen />;
    case 'done':
        return <DoneScreen />;
    case 'noEmail':
        return <NoEmailScreen />;
    case 'staff':
        return <StaffScreen />;
    default:
        return <DefaultScreen />;
    }
};

const TutorialLayout = (props: TutorialLayoutProps) => (<SafeAreaView style = { tutorialStyles.blankPageWrapper }>
    {
        getStepScreen(props.screenName)
    }
    <VideoChatUrlDetector />
</SafeAreaView>);

export default TutorialLayout;
