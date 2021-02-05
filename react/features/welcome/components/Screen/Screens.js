// @flow
/* eslint-disable react/jsx-no-bind,react/no-multi-comp */
import React from 'react';
import {
    Image,
    Text,
    SafeAreaView,
    View
} from 'react-native';
import { WelcomeScreenButton } from '../WelcomeScreenButton';
import tutorialStyles from './styles';
import {
    ColorPalette,
    sizeHelper
} from '../../../base/styles';
import { Indicator } from '../Indicator';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Video from 'react-native-video';
import { connect } from '../../../base/redux';
import { setScreen } from '../../actions';
import { Platform } from '../../../base/react';
import type { Dispatch } from 'redux';

const WHITE_COLOR = ColorPalette.white;
const JANE_COLOR = ColorPalette.jane;

const isPad = Platform.isPad;

const ENVELOPE_ICON_SIZE = sizeHelper.getActualSizeW(isPad ? 161 : 130);

const VIDEO_PLAYER_DIMESIONS = {
    width: sizeHelper.getActualSizeW(isPad ? 511 : 291),
    height: sizeHelper.getActualSizeH(isPad ? 288 : 210)
};

const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

type Props = {
    dispatch: Dispatch<any>,
};

type TutorialLayoutProps = {
    screenName: string
}

const StepOne = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.stepOne.mainContainer }>
        <View style = { tutorialStyles.stepOne.innerUpperContainer }>
            <Image
                source = { require('../../../../../images/jane-video-logo-blue.png') }
                style = { tutorialStyles.stepOne.logo } />
            <Text style = { tutorialStyles.stepOne.header }>
                Nice! You've got the app installed.
            </Text>
            <Text
                style = { tutorialStyles.stepOne.messageText } >
                We’ll give you a quick tour of how to join your online appointment.
            </Text>
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'Next'
                onPress = { () => {
                    props.dispatch(setScreen('stepTwo'));
                } }
                textColor = { JANE_COLOR } />
        </View>
        <View style = { tutorialStyles.stepOne.insideLowerContainer }>
            <Indicator
                count = { 5 }
                currentIndex = { 0 } />
        </View>
    </View>
    <View
        style = { tutorialStyles.buttonContainer } >
        <WelcomeScreenButton
            borderColor = { WHITE_COLOR }
            content = 'Join as a staff member...'
            onPress = { () => {
                props.dispatch(setScreen('staff'));
            } }
            textColor = { WHITE_COLOR } />

    </View>
</View>);

// use connect HOC wrapper here to pass the redux dispatch function to the component.
const StepOneScreen = connect()(StepOne);

const StepTwo = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.stepTwo.mainContainer }>
        <View style = { tutorialStyles.stepTwo.innerUpperContainer }>
            <Image
                source = { require('../../../../../images/jane-video-logo-blue.png') }
                style = { tutorialStyles.stepTwo.logo } />
            <Text style = { tutorialStyles.stepTwo.header }>
                Watch a guided tour of how to join your call.
            </Text>
            <Video
                controls = { true }
                paused = { true }
                source = {{ uri: videoUrl }}
                style = {{
                    width: VIDEO_PLAYER_DIMESIONS.width,
                    height: VIDEO_PLAYER_DIMESIONS.height
                }} />
        </View>
        <View style = { tutorialStyles.stepTwo.innerLowerContainer }>
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'Next'
                onPress = { () => {
                    props.dispatch(setScreen('stepThree'));
                } }
                textColor = { JANE_COLOR } />
            <Indicator
                count = { 5 }
                currentIndex = { 1 } />
        </View>
    </View>
    {
        isPad && <View
            style = { tutorialStyles.buttonContainer } >
            <WelcomeScreenButton
                borderColor = { WHITE_COLOR }
                content = 'Join as a staff member...'
                onPress = { () => {
                    props.dispatch(setScreen('staff'));
                } }
                textColor = { WHITE_COLOR } />

        </View>
    }
</View>);

const StepTwoScreen = connect()(StepTwo);

const StepThree = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.stepThree.mainContainer }>
        <View style = { tutorialStyles.stepThree.innerUpperContainer }>
            <FontAwesomeIcon
                color = { JANE_COLOR }
                icon = { faEnvelope }
                size = { ENVELOPE_ICON_SIZE } />
            <Text style = { tutorialStyles.stepThree.header }>
                Do you have access to your email on this device?
            </Text>
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'Yes'
                marginBottom = { 17 }
                onPress = { () => {
                    props.dispatch(setScreen('stepFour'));
                } }
                textColor = { JANE_COLOR } />
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'No'
                onPress = { () => {
                    props.dispatch(setScreen('noEmail'));
                } }
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
            <WelcomeScreenButton
                borderColor = { WHITE_COLOR }
                content = 'Join as a staff member...'
                onPress = { () => {
                    props.dispatch(setScreen('staff'));
                } }
                textColor = { WHITE_COLOR } />

        </View>
    }
</View>);

const StepThreeScreen = connect()(StepThree);

const StepFour = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.stepFour.mainContainer }>
        <View style = { tutorialStyles.stepFour.innerUpperContainer }>
            <Text style = { tutorialStyles.stepFour.header }>
                You’ll be emailed a link to join your call.
            </Text>
            <Image
                source = { require('../../../../../images/patient-email-mobile-screen.png') }
                style = { tutorialStyles.stepFour.mobileScreen } />
            <Text style = { tutorialStyles.stepFour.message }>
                You’ll be emailed a link to join your call 30 minutes before your appointment.
                {'\n'} {'\n'}
                Check your email on this device and tap the link. That’s it.
            </Text>
        </View>
        <View style = { tutorialStyles.stepFour.innerLowerContainer }>
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'Next'
                marginBottom = { sizeHelper.getActualSizeH(36) }
                onPress = { () => {
                    props.dispatch(setScreen('done'));
                } }
                textColor = { JANE_COLOR } />
            <Indicator
                count = { 5 }
                currentIndex = { 3 } />
        </View>
    </View>
    {
        isPad && <View
            style = { tutorialStyles.buttonContainer } >
            <WelcomeScreenButton
                borderColor = { WHITE_COLOR }
                content = 'Join as a staff member...'
                onPress = { () => {
                    props.dispatch(setScreen('staff'));
                } }
                textColor = { WHITE_COLOR } />

        </View>
    }
</View>);

const StepFourScreen = connect()(StepFour);


const Done = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.done.mainContainer }>
        <Image
            source = { require('../../../../../images/jane-video-logo.png') }
            style = { [ tutorialStyles.logo, tutorialStyles.done.logo ] } />
        <Text style = { tutorialStyles.done.header }>
                Great. You’re all set.
        </Text>
        <WelcomeScreenButton
            borderColor = { WHITE_COLOR }
            content = 'Remind me how to join my call'
            onPress = { () => {
                props.dispatch(setScreen('stepOne'));
            } }
            textColor = { WHITE_COLOR } />
    </View>
    <View
        style = { tutorialStyles.buttonContainer } >
        <WelcomeScreenButton
            borderColor = { WHITE_COLOR }
            content = 'Join as a staff member...'
            onPress = { () => {
                props.dispatch(setScreen('staff'));
            } }
            textColor = { WHITE_COLOR } />

    </View>
</View>);

const DoneScreen = connect()(Done);

const NoEmail = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.noEmail.mainContainer }>
        <View style = { tutorialStyles.noEmail.innerUpperContainer }>
            <Text style = { [ tutorialStyles.bigText, tutorialStyles.noEmail.header ] }>
                No email?
                {'\n'}
                Sign in to join your call.
            </Text>
            <Image
                source = { require('../../../../../images/upcoming-appoiment-email.png') }
                style = { tutorialStyles.noEmail.mobileScreen } />
            <Text style = { tutorialStyles.noEmail.regularText }>
                You can join your call by logging into your account on your clinic’s Jane site,
                using the Sign In button at the top of the page.
                {'\n'} {'\n'}
                The URL to the clinic’s Jane site will look something like:{'\n'}
                <Text style = { [ tutorialStyles.noEmail.regularText, tutorialStyles.noEmail.boldText ] }>
                    clinicnamehere.janeapp.com
                </Text>
                {'\n'} {'\n'}
                Clinics will often include a direct link to their Jane online booking
                site on their website, but you can always ask if you are unsure!
            </Text>
        </View>
        <View style = { tutorialStyles.noEmail.innerLowerContainer }>
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'OK.Got it!'
                onPress = { () => {
                    props.dispatch(setScreen('done'));
                } }
                textColor = { JANE_COLOR } />
            <Indicator
                count = { 5 }
                currentIndex = { 4 } />
        </View>
    </View>
    {
        isPad && <View
            style = { tutorialStyles.buttonContainer } >
            <WelcomeScreenButton
                borderColor = { WHITE_COLOR }
                content = 'Join as a staff member...'
                onPress = { () => {
                    props.dispatch(setScreen('staff'));
                } }
                textColor = { WHITE_COLOR } />

        </View>
    }
</View>);

const NoEmailScreen = connect()(NoEmail);


const Staff = (props: Props) => (<View
    style = { tutorialStyles.wrapper }>
    <View
        style = { tutorialStyles.staff.mainContainer }>
        <View style = { tutorialStyles.staff.innerUpperContainer }>
            <Text style = { tutorialStyles.bigText }>
                Join as a Staff Member
            </Text>
            <Text style = { tutorialStyles.staff.lightText }>
                1. Sign in to your Jane Account on this device and view your scheduled appointments.
            </Text>
            <Text style = { tutorialStyles.staff.lightText }>
                2. Select the appointment and tap begin.
            </Text>
            <Image
                source = { require('../../../../../images/staff-mobile-screen.png') }
                style = { tutorialStyles.staff.mobileScreen } />
        </View>
        <View style = { tutorialStyles.staff.innerLowerContainer }>
            <WelcomeScreenButton
                borderColor = { JANE_COLOR }
                content = 'OK Got it!'
                onPress = { () => {
                    props.dispatch(setScreen('done'));
                } }
                textColor = { JANE_COLOR } />
        </View>
    </View>
</View>);

const StaffScreen = connect()(Staff);

const stepScreens = {
    'stepOne': <StepOneScreen />,
    'stepTwo': <StepTwoScreen />,
    'stepThree': <StepThreeScreen />,
    'stepFour': <StepFourScreen />,
    'done': <DoneScreen />,
    'noEmail': <NoEmailScreen />,
    'staff': <StaffScreen />
};

const TutorialLayout = (props: TutorialLayoutProps) => (<SafeAreaView style = { tutorialStyles.blankPageWrapper }>
    {
        stepScreens[props.screenName]
    }
</SafeAreaView>);

export default TutorialLayout;
