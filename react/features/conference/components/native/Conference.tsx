import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
    BackHandler,
    NativeModules,
    Platform,
    SafeAreaView,
    StatusBar,
    View,
    ViewStyle
} from 'react-native';
import { EdgeInsets, withSafeAreaInsets } from 'react-native-safe-area-context';
import { connect, useDispatch } from 'react-redux';

import { appNavigate } from '../../../app/actions.native';
import { IReduxState, IStore } from '../../../app/types';
import { CONFERENCE_BLURRED, CONFERENCE_FOCUSED } from '../../../base/conference/actionTypes';
import { isDisplayNameVisible } from '../../../base/config/functions.native';
import { FULLSCREEN_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import Container from '../../../base/react/components/native/Container';
import LoadingIndicator from '../../../base/react/components/native/LoadingIndicator';
import TintedView from '../../../base/react/components/native/TintedView';
import {
    ASPECT_RATIO_NARROW,
    ASPECT_RATIO_WIDE
} from '../../../base/responsive-ui/constants';
import { StyleType } from '../../../base/styles/functions.any';
import TestConnectionInfo from '../../../base/testing/components/TestConnectionInfo';
import { isCalendarEnabled } from '../../../calendar-sync/functions.native';
import DisplayNameLabel from '../../../display-name/components/native/DisplayNameLabel';
import BrandingImageBackground from '../../../dynamic-branding/components/native/BrandingImageBackground';
import Filmstrip from '../../../filmstrip/components/native/Filmstrip';
import TileView from '../../../filmstrip/components/native/TileView';
import { FILMSTRIP_SIZE } from '../../../filmstrip/constants';
import { isFilmstripVisible } from '../../../filmstrip/functions.native';
import CalleeInfoContainer from '../../../invite/components/callee-info/CalleeInfoContainer';
import LargeVideo from '../../../large-video/components/LargeVideo.native';
import { getIsLobbyVisible } from '../../../lobby/functions';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { isPipEnabled, setPictureInPictureEnabled } from '../../../mobile/picture-in-picture/functions';
import Captions from '../../../subtitles/components/native/Captions';
import { setToolboxVisible } from '../../../toolbox/actions.native';
import Toolbox from '../../../toolbox/components/native/Toolbox';
import { isToolboxVisible } from '../../../toolbox/functions.native';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';
import { isConnecting } from '../functions.native';

import AlwaysOnLabels from './AlwaysOnLabels';
import ExpandedLabelPopup from './ExpandedLabelPopup';
import LonelyMeetingExperience from './LonelyMeetingExperience';
import TitleBar from './TitleBar';
import { EXPANDED_LABEL_TIMEOUT } from './constants';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
interface IProps extends AbstractProps {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol;

    /**
     * Whether the audio only is enabled or not.
     */
    _audioOnlyEnabled: boolean;

    /**
     * Branding styles for conference.
     */
    _brandingStyles: StyleType;

    /**
     * Whether the calendar feature is enabled or not.
     */
    _calendarEnabled: boolean;

    /**
     * The indicator which determines that we are still connecting to the
     * conference which includes establishing the XMPP connection and then
     * joining the room. If truthy, then an activity/loading indicator will be
     * rendered.
     */
    _connecting: boolean;

    /**
     * Set to {@code true} when the filmstrip is currently visible.
     */
    _filmstripVisible: boolean;

    /**
     * The indicator which determines whether fullscreen (immersive) mode is enabled.
     */
    _fullscreenEnabled: boolean;

    /**
     * The indicator which determines if the display name is visible.
     */
    _isDisplayNameVisible: boolean;

    /**
     * The indicator which determines if the participants pane is open.
     */
    _isParticipantsPaneOpen: boolean;

    /**
     * The ID of the participant currently on stage (if any).
     */
    _largeVideoParticipantId: string;

    /**
     * Local participant's display name.
     */
    _localParticipantDisplayName: string;

    /**
     * Whether Picture-in-Picture is enabled.
     */
    _pictureInPictureEnabled: boolean;

    /**
     * The indicator which determines whether the UI is reduced (to accommodate
     * smaller display areas).
     */
    _reducedUI: boolean;

    /**
     * Indicates whether the lobby screen should be visible.
     */
    _showLobby: boolean;

    /**
     * Indicates whether the car mode is enabled.
     */
    _startCarMode: boolean;

    /**
     * The indicator which determines whether the Toolbox is visible.
     */
    _toolboxVisible: boolean;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
    * Object containing the safe area insets.
    */
    insets: EdgeInsets;

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: any;
}

type State = {

    /**
     * The label that is currently expanded.
     */
    visibleExpandedLabel?: string;
};

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends AbstractConference<IProps, State> {
    /**
     * Timeout ref.
     */
    _expandedLabelTimeout: any;

    /**
     * Initializes hardwareBackPress subscription.
     */
    _hardwareBackPressSubscription: any;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            visibleExpandedLabel: undefined
        };

        this._expandedLabelTimeout = React.createRef<number>();

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._onHardwareBackPress = this._onHardwareBackPress.bind(this);
        this._setToolboxVisible = this._setToolboxVisible.bind(this);
        this._createOnPress = this._createOnPress.bind(this);
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        const {
            _audioOnlyEnabled,
            _startCarMode,
            navigation
        } = this.props;

        this._hardwareBackPressSubscription = BackHandler.addEventListener('hardwareBackPress', this._onHardwareBackPress);

        if (_audioOnlyEnabled && _startCarMode) {
            navigation.navigate(screen.conference.carmode);
        }
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const {
            _audioOnlyEnabled,
            _showLobby,
            _startCarMode
        } = this.props;

        if (!prevProps._showLobby && _showLobby) {
            navigate(screen.lobby.root);
        }

        if (prevProps._showLobby && !_showLobby) {
            if (_audioOnlyEnabled && _startCarMode) {
                return;
            }

            navigate(screen.conference.main);
        }
    }

    /**
     * Implements {@link Component#componentWillUnmount()}. Invoked immediately
     * before this component is unmounted and destroyed. Disconnects the
     * conference described by the redux store/state.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        // Tear handling any hardware button presses for back navigation down.
        this._hardwareBackPressSubscription?.remove();

        clearTimeout(this._expandedLabelTimeout.current ?? 0);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            _brandingStyles,
            _fullscreenEnabled
        } = this.props;

        return (
            <Container
                style = { [
                    styles.conference,
                    _brandingStyles
                ] }>
                <BrandingImageBackground />
                {
                    Platform.OS === 'android'
                    && <StatusBar
                        barStyle = 'light-content'
                        hidden = { _fullscreenEnabled }
                        translucent = { _fullscreenEnabled } />
                }
                { this._renderContent() }
            </Container>
        );
    }

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
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     *
     * @param {string} label - The identifier of the label that's onLayout is
     * triggered.
     * @returns {Function}
     */
    _createOnPress(label: string) {
        return () => {
            const { visibleExpandedLabel } = this.state;

            const newVisibleExpandedLabel
                = visibleExpandedLabel === label ? undefined : label;

            clearTimeout(this._expandedLabelTimeout.current);
            this.setState({
                visibleExpandedLabel: newVisibleExpandedLabel
            });

            if (newVisibleExpandedLabel) {
                this._expandedLabelTimeout.current = setTimeout(() => {
                    this.setState({
                        visibleExpandedLabel: undefined
                    });
                }, EXPANDED_LABEL_TIMEOUT);
            }
        };
    }

    /**
     * Renders the content for the Conference container.
     *
     * @private
     * @returns {React$Element}
     */
    _renderContent() {
        const {
            _aspectRatio,
            _connecting,
            _filmstripVisible,
            _isDisplayNameVisible,
            _largeVideoParticipantId,
            _reducedUI,
            _shouldDisplayTileView,
            _toolboxVisible
        } = this.props;

        let alwaysOnTitleBarStyles;

        if (_reducedUI) {
            return this._renderContentForReducedUi();
        }

        if (_aspectRatio === ASPECT_RATIO_WIDE) {
            alwaysOnTitleBarStyles
                = !_shouldDisplayTileView && _filmstripVisible
                    ? styles.alwaysOnTitleBarWide
                    : styles.alwaysOnTitleBar;
        } else {
            alwaysOnTitleBarStyles = styles.alwaysOnTitleBar;

        }

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

                <View
                    pointerEvents = 'box-none'
                    style = { styles.toolboxAndFilmstripContainer as ViewStyle }>

                    <Captions onPress = { this._onClick } />

                    {
                        _shouldDisplayTileView
                        || (_isDisplayNameVisible && (
                            <Container style = { styles.displayNameContainer }>
                                <DisplayNameLabel
                                    participantId = { _largeVideoParticipantId } />
                            </Container>
                        ))
                    }

                    { !_shouldDisplayTileView && <LonelyMeetingExperience /> }

                    {
                        _shouldDisplayTileView
                        || <>
                            <Filmstrip />
                            { this._renderNotificationsContainer() }
                            <Toolbox />
                        </>
                    }
                </View>

                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = {
                        (_toolboxVisible
                            ? styles.titleBarSafeViewColor
                            : styles.titleBarSafeViewTransparent) as ViewStyle }>
                    <TitleBar _createOnPress = { this._createOnPress } />
                </SafeAreaView>
                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = {
                        (_toolboxVisible
                            ? [ styles.titleBarSafeViewTransparent, { top: this.props.insets.top + 50 } ]
                            : styles.titleBarSafeViewTransparent) as ViewStyle
                    }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.expandedLabelWrapper }>
                        <ExpandedLabelPopup visibleExpandedLabel = { this.state.visibleExpandedLabel } />
                    </View>
                    <View
                        pointerEvents = 'box-none'
                        style = { alwaysOnTitleBarStyles as ViewStyle }>
                        {/* eslint-disable-next-line react/jsx-no-bind */}
                        <AlwaysOnLabels createOnPress = { this._createOnPress } />
                    </View>
                </SafeAreaView>

                <TestConnectionInfo />

                {
                    _shouldDisplayTileView
                    && <>
                        { this._renderNotificationsContainer() }
                        <Toolbox />
                    </>
                }
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
        const notificationsStyle: ViewStyle = {};

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
        const { _aspectRatio, _filmstripVisible } = this.props;

        if (_filmstripVisible && _aspectRatio !== ASPECT_RATIO_NARROW) {
            notificationsStyle.marginRight = FILMSTRIP_SIZE;
        }

        return super.renderNotificationsContainer(
            {
                shouldDisplayTileView: this.props._shouldDisplayTileView,
                style: notificationsStyle,
                toolboxVisible: this.props._toolboxVisible
            }
        );
    }

    /**
     * Dispatches an action changing the visibility of the {@link Toolbox}.
     *
     * @private
     * @param {boolean} visible - Pass {@code true} to show the
     * {@code Toolbox} or {@code false} to hide it.
     * @returns {void}
     */
    _setToolboxVisible(visible: boolean) {
        this.props.dispatch(setToolboxVisible(visible));
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Conference}'s props.
 *
 * @param {Object} state - The redux state.
 * @param {any} _ownProps - Component's own props.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { isOpen } = state['features/participants-pane'];
    const { aspectRatio, reducedUI } = state['features/base/responsive-ui'];
    const { backgroundColor } = state['features/dynamic-branding'];
    const { startCarMode } = state['features/base/settings'];
    const { enabled: audioOnlyEnabled } = state['features/base/audio-only'];
    const brandingStyles = backgroundColor ? {
        backgroundColor
    } : undefined;

    return {
        ...abstractMapStateToProps(state),
        _aspectRatio: aspectRatio,
        _audioOnlyEnabled: Boolean(audioOnlyEnabled),
        _brandingStyles: brandingStyles,
        _calendarEnabled: isCalendarEnabled(state),
        _connecting: isConnecting(state),
        _filmstripVisible: isFilmstripVisible(state),
        _fullscreenEnabled: getFeatureFlag(state, FULLSCREEN_ENABLED, true),
        _isDisplayNameVisible: isDisplayNameVisible(state),
        _isParticipantsPaneOpen: isOpen,
        _largeVideoParticipantId: state['features/large-video'].participantId,
        _pictureInPictureEnabled: isPipEnabled(state),
        _reducedUI: reducedUI,
        _showLobby: getIsLobbyVisible(state),
        _startCarMode: startCarMode,
        _toolboxVisible: isToolboxVisible(state)
    };
}

export default withSafeAreaInsets(connect(_mapStateToProps)(props => {
    const dispatch = useDispatch();

    useFocusEffect(useCallback(() => {
        dispatch({ type: CONFERENCE_FOCUSED });
        setPictureInPictureEnabled(true);

        return () => {
            dispatch({ type: CONFERENCE_BLURRED });
            setPictureInPictureEnabled(false);
        };
    }, []));

    return ( // @ts-ignore
        <Conference { ...props } />
    );
}));
