// @flow

import React from 'react';
import { NativeModules, SafeAreaView, StatusBar, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { appNavigate } from '../../../app';
import { PIP_ENABLED, getFeatureFlag } from '../../../base/flags';
import { Container, LoadingIndicator, TintedView } from '../../../base/react';
import { connect } from '../../../base/redux';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../../base/responsive-ui';
import { TestConnectionInfo } from '../../../base/testing';
import { ConferenceNotification, isCalendarEnabled } from '../../../calendar-sync';
import { Chat } from '../../../chat';
import { DisplayNameLabel } from '../../../display-name';
import { SharedDocument } from '../../../etherpad';
import {
    FILMSTRIP_SIZE,
    Filmstrip,
    isFilmstripVisible,
    TileView
} from '../../../filmstrip';
import { LargeVideo } from '../../../large-video';
import { BackButtonRegistry } from '../../../mobile/back-button';
import { AddPeopleDialog, CalleeInfoContainer } from '../../../invite';
import { Captions } from '../../../subtitles';
import { isToolboxVisible, setToolboxVisible, Toolbox } from '../../../toolbox';
import MuteAllButton from './MuteAllButton';

import { getParticipantCount } from '../../../base/participants';
import { Icon, IconUserGroups } from '../../../base/icons';

import { getLocalParticipant, PARTICIPANT_ROLE } from '../../../base/participants';

import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import Labels from './Labels';

// import LonelyMeetingExperience from './LonelyMeetingExperience';

import NavigationBar from './NavigationBar';
import styles, { NAVBAR_GRADIENT_COLORS } from './styles';

import type { AbstractProps } from '../AbstractConference';

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * Wherther the calendar feature is enabled or not.
     *
     * @private
     */
    _calendarEnabled: boolean,

    /**
     * The indicator which determines that we are still connecting to the
     * conference which includes establishing the XMPP connection and then
     * joining the room. If truthy, then an activity/loading indicator will be
     * rendered.
     *
     * @private
     */
    _connecting: boolean,

    /**
     * Set to {@code true} when the filmstrip is currently visible.
     *
     * @private
     */
    _filmstripVisible: boolean,

    /**
     * The ID of the participant currently on stage (if any)
     */
    _largeVideoParticipantId: string,

    /**
     * Whether Picture-in-Picture is enabled.
     *
     * @private
     */
    _pictureInPictureEnabled: boolean,

    /**
     * The indicator which determines whether the UI is reduced (to accommodate
     * smaller display areas).
     *
     * @private
     */
    _reducedUI: boolean,

    /**
     * The handler which dispatches the (redux) action {@link setToolboxVisible}
     * to show/hide the {@link Toolbox}.
     *
     * @param {boolean} visible - {@code true} to show the {@code Toolbox} or
     * {@code false} to hide it.
     * @private
     * @returns {void}
     */
    _setToolboxVisible: Function,

    /**
     * The indicator which determines whether the Toolbox is visible.
     *
     * @private
     */
    _toolboxVisible: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Number of the conference participants.
     */
    count: string,

    /*
     ** Whether the local participant is a moderator or not.
     */
    isModerator: Boolean,
};

type State = {
    muteTooltipVisible: boolean
};

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends AbstractConference<Props, State, *> {
    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._onHardwareBackPress = this._onHardwareBackPress.bind(this);
        this._setToolboxVisible = this._setToolboxVisible.bind(this);
        this.onMuteAllClick = this.onMuteAllClick.bind(this);
    }


    state = {
        muteTooltipVisible: true
    };

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        BackButtonRegistry.addListener(this._onHardwareBackPress);

        setTimeout(() => {
            this.setState({
                muteTooltipVisible: false
            });
        }, 10000);
    }

    /**
     * Implements {@link Component#componentWillUnmount()}. Invoked immediately
     * before this component is unmounted and destroyed. Disconnects the
     * conference described by the redux store/state.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // Tear handling any hardware button presses for back navigation down.
        BackButtonRegistry.removeListener(this._onHardwareBackPress);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Container style = { styles.conference }>
                <StatusBar
                    barStyle = 'light-content'
                    hidden = { true }
                    translucent = { true } />
                { this._renderContent() }
            </Container>
        );
    }

    _onClick: () => void;

    /**
     * Changes the value of the toolboxVisible state, thus allowing us to switch
     * between Toolbox and Filmstrip and change their visibility.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this._setToolboxVisible(!this.props._toolboxVisible);
    }

    _onHardwareBackPress: () => boolean;

    /**
     * Handles a hardware button press for back navigation. Enters Picture-in-Picture mode
     * (if supported) or leaves the associated {@code Conference} otherwise.
     *
     * @returns {boolean} Exiting the app is undesired, so {@code true} is always returned.
     */
    _onHardwareBackPress() {
        let p;

        if (this.props._pictureInPictureEnabled) {
            const { PictureInPicture } = NativeModules;

            p = PictureInPicture.enterPictureInPicture();
        } else {
            p = Promise.reject(new Error('PiP not enabled'));
        }

        p.catch(() => {
            this.props.dispatch(appNavigate(undefined));
        });

        return true;
    }

    /**
     * Renders JitsiModals that are supposed to be on the conference screen.
     *
     * @returns {Array<ReactElement>}
     */
    _renderConferenceModals() {
        return [
            <AddPeopleDialog key = 'addPeopleDialog' />,
            <Chat key = 'chat' />,
            <SharedDocument key = 'sharedDocument' />
        ];
    }

    /**
     * Renders the conference notification badge if the feature is enabled.
     *
     * @private
     * @returns {React$Node}
     */
    _renderConferenceNotification() {
        const { _calendarEnabled, _reducedUI } = this.props;

        return (
            _calendarEnabled && !_reducedUI
                ? <ConferenceNotification />
                : undefined);
    }

    /**
     * Renders the content for the Conference container.
     *
     * @private
     * @returns {React$Element}
     */
    _renderContent() {
        const {
            _connecting,
            _filmstripVisible,
            _largeVideoParticipantId,
            _reducedUI,
            _shouldDisplayTileView,
            _toolboxVisible
        } = this.props;
        const showGradient = _toolboxVisible;
        const applyGradientStretching = _filmstripVisible && isNarrowAspectRatio(this) && !_shouldDisplayTileView;

        if (_reducedUI) {
            return this._renderContentForReducedUi();
        }

        const topActionsBtnStyles = {
            style: styles.topActionsBtn,
            iconStyle: styles.topActionsBtnIcon
        };

        const muteTooltipWrapper = {
            position: 'relative'
        };

        const muteTooltip = {
            position: 'absolute',
            top: 0,
            right: 60,
            backgroundColor: '#ffffff',
            borderRadius: 10,
            width: 150,
            padding: 15
        };

        const muteTooltipTitle = {
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#000000',
            marginBottom: 5,
            fontSize: 16
        };

        const muteTooltipText = {
            textAlign: 'center',
            color: '#000000',
            lineHeight: 20
        };

        const muteTooltipArrow = {
            position: 'absolute',
            right: -6,
            top: 22,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 6,
            borderTopWidth: 5,
            borderBottomWidth: 5,
            borderLeftColor: '#ffffff',
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent'
        };

        return (
            <>
                {/*
                  * The LargeVideo is the lowermost stacking layer.
                  */
                    _shouldDisplayTileView
                        ? <TileView onClick = { this._onClick } />
                        : <LargeVideo onClick = { this._onClick } />
                }

                {/*
                  * If there is a ringing call, show the callee's info.
                  */
                    <CalleeInfoContainer />
                }

                {/*
                  * The activity/loading indicator goes above everything, except
                  * the toolbox/toolbars and the dialogs.
                  */
                    _connecting
                        && <TintedView>
                            <LoadingIndicator />
                        </TintedView>
                }

                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = { styles.toolboxAndFilmstripContainer }>

                    { showGradient && <LinearGradient
                        colors = { NAVBAR_GRADIENT_COLORS }
                        end = {{
                            x: 0.0,
                            y: 0.0
                        }}
                        pointerEvents = 'none'
                        start = {{
                            x: 0.0,
                            y: 1.0
                        }}
                        style = { [
                            styles.bottomGradient,
                            applyGradientStretching ? styles.gradientStretchBottom : undefined
                        ] } />}

                    <Labels />

                    <Captions onPress = { this._onClick } />

                    { _shouldDisplayTileView || <DisplayNameLabel
                        largeVideo = { true }
                        participantId = { _largeVideoParticipantId } /> }

                    { /* <LonelyMeetingExperience /> */ }

                    {/*
                      * The Toolbox is in a stacking layer below the Filmstrip.
                      */}
                    <Toolbox />

                    {/*
                      * The Filmstrip is in a stacking layer above the
                      * LargeVideo. The LargeVideo and the Filmstrip form what
                      * the Web/React app calls "videospace". Presumably, the
                      * name and grouping stem from the fact that these two
                      * React Components depict the videos of the conference's
                      * participants.
                      */
                        _shouldDisplayTileView ? undefined : <Filmstrip />
                    }
                </SafeAreaView>

                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = { styles.navBarSafeView }>
                    <NavigationBar />
                    { this._renderNotificationsContainer() }
                </SafeAreaView>

                {
                    (this.props.isModerator && this.props._toolboxVisible)
                    && <SafeAreaView style = { styles.topActions }>
                        <View style = { styles.topActionsInner }>
                            <View style = { muteTooltipWrapper }>
                                {
                                    this.state.muteTooltipVisible && <View style = { muteTooltip }>
                                        <Text style = { muteTooltipTitle }>Tap this button to mute all.</Text>
                                        <Text style = { muteTooltipText }>Try it now!</Text>
                                        <View style = { muteTooltipArrow } />
                                    </View>
                                }

                                <MuteAllButton
                                    afterClick = { this.onMuteAllClick }
                                    styles = { topActionsBtnStyles } />
                            </View>
                        </View>

                    </SafeAreaView>
                }

                <SafeAreaView style = { styles.participantsCountSafeView }>
                    <View style = { styles.participantsCount }>
                        <Text style = { styles.participantsCountText }>{this.props.count}</Text>
                        <Icon
                            src = { IconUserGroups }
                            style = { styles.participantsCountIcon } />
                    </View>
                </SafeAreaView>

                <TestConnectionInfo />

                { this._renderConferenceNotification() }

                { this._renderConferenceModals() }
            </>
        );
    }

    /**
     * Renders the content for the Conference container when in "reduced UI" mode.
     *
     * @private
     * @returns {React$Element}
     */
    _renderContentForReducedUi() {
        const { _connecting } = this.props;

        return (
            <>
                <LargeVideo onClick = { this._onClick } />

                {
                    _connecting
                        && <TintedView>
                            <LoadingIndicator />
                        </TintedView>
                }
            </>
        );
    }

    /**
     * Renders a container for notifications to be displayed by the
     * base/notifications feature.
     *
     * @private
     * @returns {React$Element}
     */
    _renderNotificationsContainer() {
        const notificationsStyle = {};

        // In the landscape mode (wide) there's problem with notifications being
        // shadowed by the filmstrip rendered on the right. This makes the "x"
        // button not clickable. In order to avoid that a margin of the
        // filmstrip's size is added to the right.
        //
        // Pawel: after many attempts I failed to make notifications adjust to
        // their contents width because of column and rows being used in the
        // flex layout. The only option that seemed to limit the notification's
        // size was explicit 'width' value which is not better than the margin
        // added here.
        if (this.props._filmstripVisible && !isNarrowAspectRatio(this)) {
            notificationsStyle.marginRight = FILMSTRIP_SIZE;
        }

        return super.renderNotificationsContainer(
            {
                style: notificationsStyle
            }
        );
    }

    _setToolboxVisible: (boolean) => void;

    /**
     * Dispatches an action changing the visibility of the {@link Toolbox}.
     *
     * @private
     * @param {boolean} visible - Pass {@code true} to show the
     * {@code Toolbox} or {@code false} to hide it.
     * @returns {void}
     */
    _setToolboxVisible(visible) {
        this.props.dispatch(setToolboxVisible(visible));
    }

    // eslint-disable-next-line require-jsdoc
    onMuteAllClick: () => void;

    // eslint-disable-next-line require-jsdoc
    onMuteAllClick() {
        this.setState({ muteTooltipVisible: false });
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Conference}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { connecting, connection } = state['features/base/connection'];
    const {
        conference,
        joining,
        leaving
    } = state['features/base/conference'];
    const { reducedUI } = state['features/base/responsive-ui'];

    // XXX There is a window of time between the successful establishment of the
    // XMPP connection and the subsequent commencement of joining the MUC during
    // which the app does not appear to be doing anything according to the redux
    // state. In order to not toggle the _connecting props during the window of
    // time in question, define _connecting as follows:
    // - the XMPP connection is connecting, or
    // - the XMPP connection is connected and the conference is joining, or
    // - the XMPP connection is connected and we have no conference yet, nor we
    //   are leaving one.
    const connecting_
        = connecting || (connection && (joining || (!conference && !leaving)));

    const localParticipant = getLocalParticipant(state);
    const isModerator = localParticipant.role === PARTICIPANT_ROLE.MODERATOR;

    return {
        ...abstractMapStateToProps(state),

        /**
         * Wherther the calendar feature is enabled or not.
         *
         * @private
         * @type {boolean}
         */
        _calendarEnabled: isCalendarEnabled(state),

        /**
         * The indicator which determines that we are still connecting to the
         * conference which includes establishing the XMPP connection and then
         * joining the room. If truthy, then an activity/loading indicator will
         * be rendered.
         *
         * @private
         * @type {boolean}
         */
        _connecting: Boolean(connecting_),

        /**
         * Is {@code true} when the filmstrip is currently visible.
         */
        _filmstripVisible: isFilmstripVisible(state),

        /**
         * The ID of the participant currently on stage.
         */
        _largeVideoParticipantId: state['features/large-video'].participantId,

        /**
         * Whether Picture-in-Picture is enabled.
         *
         * @private
         * @type {boolean}
         */
        _pictureInPictureEnabled: getFeatureFlag(state, PIP_ENABLED),

        /**
         * The indicator which determines whether the UI is reduced (to
         * accommodate smaller display areas).
         *
         * @private
         * @type {boolean}
         */
        _reducedUI: reducedUI,

        /**
         * The indicator which determines whether the Toolbox is visible.
         *
         * @private
         * @type {boolean}
         */
        _toolboxVisible: isToolboxVisible(state),
        count: getParticipantCount(state),
        isModerator
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Conference));