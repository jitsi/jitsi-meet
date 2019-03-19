// @flow

import React, { Component } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';
import { connect } from 'react-redux';

import {
    Avatar,
    getAvatarURL,
    getLocalParticipant,
    getParticipantDisplayName
} from '../../base/participants';
import {
    Header,
    SideBar
} from '../../base/react';
import { setSettingsViewVisible } from '../../settings';

import { setSideBarVisible } from '../actions';
import SideBarItem from './SideBarItem';
import styles, { SIDEBAR_AVATAR_SIZE } from './styles';

/**
 * The URL at which the privacy policy is available to the user.
 */
const PRIVACY_URL = 'https://jitsi.org/meet/privacy';

/**
 * The URL at which the user may send feedback.
 */
const SEND_FEEDBACK_URL = 'mailto:support@jitsi.org';

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
const TERMS_URL = 'https://jitsi.org/meet/terms';

type Props = {

    /**
     * Redux dispatch action
     */
    dispatch: Function,

    /**
     * The avatar URL to be rendered.
     */
    _avatarURL: string,

    /**
     * Display name of the local participant.
     */
    _displayName: string,

    /**
     * Sets the side bar visible or hidden.
     */
    _visible: boolean
};

/**
 * A component rendering a welcome page sidebar.
 */
class WelcomePageSideBar extends Component<Props> {
    /**
     * Constructs a new SideBar instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onHideSideBar = this._onHideSideBar.bind(this);
        this._onOpenSettings = this._onOpenSettings.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}, renders the sidebar.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <SideBar
                onHide = { this._onHideSideBar }
                show = { this.props._visible }>
                <Header style = { styles.sideBarHeader }>
                    <Avatar
                        size = { SIDEBAR_AVATAR_SIZE }
                        style = { styles.avatar }
                        uri = { this.props._avatarURL } />
                    <Text style = { styles.displayName }>
                        { this.props._displayName }
                    </Text>
                </Header>
                <SafeAreaView style = { styles.sideBarBody }>
                    <ScrollView
                        style = { styles.itemContainer }>
                        <SideBarItem
                            icon = 'settings'
                            label = 'settings.title'
                            onPress = { this._onOpenSettings } />
                        <SideBarItem
                            icon = 'info'
                            label = 'welcomepage.terms'
                            url = { TERMS_URL } />
                        <SideBarItem
                            icon = 'info'
                            label = 'welcomepage.privacy'
                            url = { PRIVACY_URL } />
                        <SideBarItem
                            icon = 'info'
                            label = 'welcomepage.sendFeedback'
                            url = { SEND_FEEDBACK_URL } />
                    </ScrollView>
                </SafeAreaView>
            </SideBar>
        );
    }

    _onHideSideBar: () => void;

    /**
     * Invoked when the sidebar has closed itself (e.g. Overlay pressed).
     *
     * @private
     * @returns {void}
     */
    _onHideSideBar() {
        this.props.dispatch(setSideBarVisible(false));
    }

    _onOpenSettings: () => void;

    /**
     * Shows the {@link SettingsView}.
     *
     * @private
     * @returns {void}
     */
    _onOpenSettings() {
        const { dispatch } = this.props;

        dispatch(setSideBarVisible(false));
        dispatch(setSettingsViewVisible(true));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {{
 *     _avatarURL: string,
 *     _displayName: string,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state: Object) {
    const localParticipant = getLocalParticipant(state);

    return {
        _avatarURL: getAvatarURL(localParticipant),
        _displayName: getParticipantDisplayName(state, localParticipant.id),
        _visible: state['features/welcome'].sideBarVisible
    };
}

// $FlowExpectedError
export default connect(_mapStateToProps)(WelcomePageSideBar);
