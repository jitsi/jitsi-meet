// @flow

import React from 'react';

import { BackHandler, SafeAreaView, StatusBar, View } from 'react-native';

import { appNavigate } from '../../../app';
import { connect, disconnect } from '../../../base/connection';
import { getParticipantCount } from '../../../base/participants';
import { Container, LoadingIndicator, TintedView } from '../../../base/react';
import { connect as reactReduxConnect } from '../../../base/redux';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../../base/responsive-ui';
import { TestConnectionInfo } from '../../../base/testing';
import { createDesiredLocalTracks } from '../../../base/tracks';
import { ConferenceNotification } from '../../../calendar-sync';
import { Chat } from '../../../chat';
import { DisplayNameLabel } from '../../../display-name';
import {
    FILMSTRIP_SIZE,
    Filmstrip,
    isFilmstripVisible,
    TileView
} from '../../../filmstrip';
import { LargeVideo } from '../../../large-video';
import { AddPeopleDialog, CalleeInfoContainer } from '../../../invite';
import { Captions } from '../../../subtitles';
import { setToolboxVisible, Toolbox } from '../../../toolbox';

import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import Labels from './Labels';
import NavigationBar from './NavigationBar';
import styles from './styles';

import type { AbstractProps } from '../AbstractConference';

/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

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
     * Current conference's full URL.
     *
     * @private
     */
    _locationURL: URL,

    /**
     * The handler which dispatches the (redux) action connect.
     *
     * @private
     * @returns {void}
     */
    _onConnect: Function,

    /**
     * The handler which dispatches the (redux) action disconnect.
     *
     * @private
     * @returns {void}
     */
    _onDisconnect: Function,

    /**
     * Handles a hardware button press for back navigation. Leaves the
     * associated {@code Conference}.
     *
     * @private
     * @returns {boolean} As the associated conference is unconditionally left
     * and exiting the app while it renders a {@code Conference} is undesired,
     * {@code true} is always returned.
     */
    _onHardwareBackPress: Function,

    /**
     * The number of participants in the conference.
     *
     * @private
     */
    _participantCount: number,

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
     * The indicator which determines whether the Toolbox is always visible.
     *
     * @private
     */
    _toolboxAlwaysVisible: boolean
};

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends AbstractConference<Props, *> {
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
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this.props._onConnect();

        BackHandler.addEventListener(
            'hardwareBackPress',
            this.props._onHardwareBackPress);

        // Show the toolbox if we are the only participant; otherwise, the whole
        // UI looks too unpopulated the LargeVideo visible.
        const { _participantCount, _setToolboxVisible } = this.props;

        _participantCount === 1 && _setToolboxVisible(true);
    }

    /**
     * Implements React's {@link Component#componentDidUpdate()}.
     *
     * @inheritdoc
     */
    componentDidUpdate(pevProps: Props) {
        const {
            _locationURL: oldLocationURL,
            _participantCount: oldParticipantCount,
            _room: oldRoom
        } = pevProps;
        const {
            _locationURL: newLocationURL,
            _participantCount: newParticipantCount,
            _room: newRoom,
            _setToolboxVisible,
            _toolboxVisible
        } = this.props;

        // If the location URL changes we need to reconnect.
        oldLocationURL !== newLocationURL && this.props._onDisconnect();

        // Start the connection process when there is a (valid) room.
        oldRoom !== newRoom && newRoom && this.props._onConnect();

        if (oldParticipantCount === 1
                && newParticipantCount > 1
                && _toolboxVisible) {
            _setToolboxVisible(false);
        } else if (oldParticipantCount > 1
                && newParticipantCount === 1
                && !_toolboxVisible) {
            _setToolboxVisible(true);
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
    componentWillUnmount() {
        // Tear handling any hardware button presses for back navigation down.
        BackHandler.removeEventListener(
            'hardwareBackPress',
            this.props._onHardwareBackPress);

        this.props._onDisconnect();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _connecting,
            _largeVideoParticipantId,
            _reducedUI,
            _shouldDisplayTileView
        } = this.props;

        return (
            <Container style = { styles.conference }>
                <StatusBar
                    barStyle = 'light-content'
                    hidden = { true }
                    translucent = { true } />

                <Chat />
                <AddPeopleDialog />

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
                    _reducedUI || <CalleeInfoContainer />
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
                    style = { styles.toolboxAndFilmstripContainer }>

                    <Labels />

                    <Captions onPress = { this._onClick } />

                    { _shouldDisplayTileView || <DisplayNameLabel participantId = { _largeVideoParticipantId } /> }

                    {/*
                      * The Toolbox is in a stacking layer bellow the Filmstrip.
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
                </View>

                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = { styles.navBarSafeView }>
                    <NavigationBar />
                    { this.renderNotificationsContainer() }
                </SafeAreaView>

                <TestConnectionInfo />

                {
                    this._renderConferenceNotification()
                }

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
        if (this.props._toolboxAlwaysVisible) {
            return;
        }

        const toolboxVisible = !this.props._toolboxVisible;

        this.props._setToolboxVisible(toolboxVisible);
    }

    /**
     * Renders the conference notification badge if the feature is enabled.
     *
     * @private
     * @returns {React$Node}
     */
    _renderConferenceNotification() {
        // XXX If the calendar feature is disabled on a platform, then we don't
        // have its components exported so an undefined check is necessary.
        return (
            !this.props._reducedUI && ConferenceNotification
                ? <ConferenceNotification />
                : undefined);
    }

    /**
     * Renders a container for notifications to be displayed by the
     * base/notifications feature.
     *
     * @private
     * @returns {React$Element}
     */
    renderNotificationsContainer() {
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
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @private
 * @returns {{
 *     _onConnect: Function,
 *     _onDisconnect: Function,
 *     _onHardwareBackPress: Function,
 *     _setToolboxVisible: Function
 * }}
 */
function _mapDispatchToProps(dispatch) {
    return {
        /**
         * Dispatches actions to create the desired local tracks and for
         * connecting to the conference.
         *
         * @private
         * @returns {void}
         */
        _onConnect() {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        },

        /**
         * Dispatches an action disconnecting from the conference.
         *
         * @private
         * @returns {void}
         */
        _onDisconnect() {
            dispatch(disconnect());
        },

        /**
         * Handles a hardware button press for back navigation. Leaves the
         * associated {@code Conference}.
         *
         * @returns {boolean} As the associated conference is unconditionally
         * left and exiting the app while it renders a {@code Conference} is
         * undesired, {@code true} is always returned.
         */
        _onHardwareBackPress() {
            dispatch(appNavigate(undefined));

            return true;
        },

        /**
         * Dispatches an action changing the visibility of the {@link Toolbox}.
         *
         * @private
         * @param {boolean} visible - Pass {@code true} to show the
         * {@code Toolbox} or {@code false} to hide it.
         * @returns {void}
         */
        _setToolboxVisible(visible) {
            dispatch(setToolboxVisible(visible));
        }
    };
}

/**
 * Maps (parts of) the redux state to the associated {@code Conference}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { connecting, connection, locationURL }
        = state['features/base/connection'];
    const {
        conference,
        joining,
        leaving
    } = state['features/base/conference'];
    const { reducedUI } = state['features/base/responsive-ui'];
    const { alwaysVisible, visible } = state['features/toolbox'];

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

    return {
        ...abstractMapStateToProps(state),

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
         * Current conference's full URL.
         *
         * @private
         * @type {URL}
         */
        _locationURL: locationURL,

        /**
         * The number of participants in the conference.
         *
         * @private
         * @type {number}
         */
        _participantCount: getParticipantCount(state),

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
        _toolboxVisible: visible,

        /**
         * The indicator which determines whether the Toolbox is always visible.
         *
         * @private
         * @type {boolean}
         */
        _toolboxAlwaysVisible: alwaysVisible
    };
}

export default reactReduxConnect(_mapStateToProps, _mapDispatchToProps)(
    makeAspectRatioAware(Conference));
