// @ts-expect-error
import { generateRoomWithoutSeparator } from '@jitsi/js-utils/random';
import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createWelcomePageEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { appNavigate } from '../../app/actions';
import { IReduxState, IStore } from '../../app/types';
import { IDeeplinkingConfig } from '../../base/config/configType';
import isInsecureRoomName from '../../base/util/isInsecureRoomName';
import { isCalendarEnabled } from '../../calendar-sync/functions';
import { isUnsafeRoomWarningEnabled } from '../../prejoin/functions';
import { isRecentListEnabled } from '../../recent-list/functions';

/**
 * {@code AbstractWelcomePage}'s React {@code Component} prop types.
 */
export interface IProps extends WithTranslation {

    /**
     * Whether the calendar functionality is enabled or not.
     */
    _calendarEnabled: boolean;

    /**
     * The deeplinking config.
     */
    _deeplinkingCfg: IDeeplinkingConfig;

    /**
     * Whether the insecure room name functionality is enabled or not.
     */
    _enableInsecureRoomNameWarning: boolean;

    /**
     * URL for the moderated rooms microservice, if available.
     */
    _moderatedRoomServiceUrl?: string;

    /**
     * Whether the recent list is enabled.
     */
    _recentListEnabled: Boolean;

    /**
     * Room name to join to.
     */
    _room: string;

    /**
     * The current settings.
     */
    _settings: Object;

    /**
     * The Redux dispatch Function.
     */
    dispatch: IStore['dispatch'];
}

interface IState {
    _fieldFocused?: boolean;
    animateTimeoutId?: number;
    generateRoomNames?: string;
    generatedRoomName: string;
    hintBoxAnimation?: any;
    insecureRoomName: boolean;
    isSettingsScreenFocused?: boolean;
    joining: boolean;
    room: string;
    roomNameInputAnimation?: any;
    roomPlaceholder: string;
    updateTimeoutId?: number;
}

/**
 * Base (abstract) class for container component rendering the welcome page.
 *
 * @abstract
 */
export class AbstractWelcomePage<P extends IProps> extends Component<P, IState> {
    _mounted: boolean | undefined;

    /**
     * Save room name into component's local state.
     *
     * @type {Object}
     * @property {number|null} animateTimeoutId - Identifier of the letter
     * animation timeout.
     * @property {string} generatedRoomName - Automatically generated room name.
     * @property {string} room - Room name.
     * @property {string} roomPlaceholder - Room placeholder that's used as a
     * placeholder for input.
     * @property {number|null} updateTimeoutId - Identifier of the timeout
     * updating the generated room name.
     */
    override state: IState = {
        animateTimeoutId: undefined,
        generatedRoomName: '',
        generateRoomNames: undefined,
        insecureRoomName: false,
        joining: false,
        room: '',
        roomPlaceholder: '',
        updateTimeoutId: undefined,
        _fieldFocused: false,
        isSettingsScreenFocused: false,
        roomNameInputAnimation: 0,
        hintBoxAnimation: 0
    };

    /**
     * Initializes a new {@code AbstractWelcomePage} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code AbstractWelcomePage} instance with.
     */
    constructor(props: P) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._animateRoomNameChanging
            = this._animateRoomNameChanging.bind(this);
        this._onJoin = this._onJoin.bind(this);
        this._onRoomChange = this._onRoomChange.bind(this);
        this._renderInsecureRoomNameWarning = this._renderInsecureRoomNameWarning.bind(this);
        this._updateRoomName = this._updateRoomName.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        this._mounted = true;
        sendAnalytics(createWelcomePageEvent('viewed', undefined, { value: 1 }));
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        this._clearTimeouts();
        this._mounted = false;
    }

    /**
     * Animates the changing of the room name.
     *
     * @param {string} word - The part of room name that should be added to
     * placeholder.
     * @private
     * @returns {void}
     */
    _animateRoomNameChanging(word: string) {
        let animateTimeoutId;
        const roomPlaceholder = this.state.roomPlaceholder + word.substr(0, 1);

        if (word.length > 1) {
            animateTimeoutId
                = window.setTimeout(
                    () => {
                        this._animateRoomNameChanging(
                            word.substring(1, word.length));
                    },
                    70);
        }
        this.setState({
            animateTimeoutId,
            roomPlaceholder
        });
    }

    /**
     * Method that clears timeouts for animations and updates of room name.
     *
     * @private
     * @returns {void}
     */
    _clearTimeouts() {
        this.state.animateTimeoutId && clearTimeout(this.state.animateTimeoutId);
        this.state.updateTimeoutId && clearTimeout(this.state.updateTimeoutId);
    }

    /**
     * Renders the insecure room name warning.
     *
     * @returns {ReactElement}
     */
    _doRenderInsecureRoomNameWarning(): JSX.Element | null {
        return null;
    }

    /**
     * Handles joining. Either by clicking on 'Join' button
     * or by pressing 'Enter' in room name input field.
     *
     * @protected
     * @returns {void}
     */
    _onJoin() {
        const room = this.state.room || this.state.generatedRoomName;

        sendAnalytics(
            createWelcomePageEvent('clicked', 'joinButton', {
                isGenerated: !this.state.room,
                room
            }));

        if (room) {
            this.setState({ joining: true });

            // By the time the Promise of appNavigate settles, this component
            // may have already been unmounted.
            const onAppNavigateSettled
                = () => this._mounted && this.setState({ joining: false });

            this.props.dispatch(appNavigate(room))
                .then(onAppNavigateSettled, onAppNavigateSettled);
        }
    }

    /**
     * Handles 'change' event for the room name text input field.
     *
     * @param {string} value - The text typed into the respective text input
     * field.
     * @protected
     * @returns {void}
     */
    _onRoomChange(value: string) {
        this.setState({
            room: value,
            insecureRoomName: Boolean(this.props._enableInsecureRoomNameWarning && value && isInsecureRoomName(value))
        });
    }

    /**
     * Renders the insecure room name warning if needed.
     *
     * @returns {ReactElement}
     */
    _renderInsecureRoomNameWarning() {
        if (this.props._enableInsecureRoomNameWarning && this.state.insecureRoomName) {
            return this._doRenderInsecureRoomNameWarning();
        }

        return null;
    }

    /**
     * Triggers the generation of a new room name and initiates an animation of
     * its changing.
     *
     * @protected
     * @returns {void}
     */
    _updateRoomName() {
        const generatedRoomName = generateRoomWithoutSeparator();
        const roomPlaceholder = '';
        const updateTimeoutId = window.setTimeout(this._updateRoomName, 10000);

        this._clearTimeouts();
        this.setState(
            {
                generatedRoomName,
                roomPlaceholder,
                updateTimeoutId
            },
            () => this._animateRoomNameChanging(generatedRoomName));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code AbstractWelcomePage}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    return {
        _calendarEnabled: isCalendarEnabled(state),
        _deeplinkingCfg: state['features/base/config'].deeplinking || {},
        _enableInsecureRoomNameWarning: isUnsafeRoomWarningEnabled(state),
        _moderatedRoomServiceUrl: state['features/base/config'].moderatedRoomServiceUrl,
        _recentListEnabled: isRecentListEnabled(),
        _room: state['features/base/conference'].room ?? '',
        _settings: state['features/base/settings']
    };
}
