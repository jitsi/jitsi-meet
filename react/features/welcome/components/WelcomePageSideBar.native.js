// @flow

import React, { Component } from 'react';
import { SafeAreaView, ScrollView, Text } from 'react-native';

import { Avatar } from '../../base/avatar';
import { IconInfo, IconSettings, IconHelp } from '../../base/icons';
import { setActiveModalId } from '../../base/modal';
import {
    getLocalParticipant,
    getParticipantDisplayName
} from '../../base/participants';
import {
    Header,
    SlidingView
} from '../../base/react';
import { connect } from '../../base/redux';
import { HELP_VIEW_MODAL_ID } from '../../help';
import { SETTINGS_VIEW_ID } from '../../settings/constants';
import { setSideBarVisible } from '../actions';

import SideBarItem from './SideBarItem';
import styles, { SIDEBAR_AVATAR_SIZE } from './styles';

/**
 * The URL at which the privacy policy is available to the user.
 */
const PRIVACY_URL = 'https://jitsi.org/meet/privacy';

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
const TERMS_URL = 'https://jitsi.org/meet/terms';

type Props = {

    /**
     * Redux dispatch action.
     */
    dispatch: Function,

    /**
     * Display name of the local participant.
     */
    _displayName: ?string,

    /**
     * ID of the local participant.
     */
    _localParticipantId: ?string,

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
        this._onOpenHelpPage = this._onOpenHelpPage.bind(this);
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
            <SlidingView
                onHide = { this._onHideSideBar }
                show = { this.props._visible }
                style = { styles.sideBar } >
                <Header style = { styles.sideBarHeader }>
                    <Avatar
                        participantId = { this.props._localParticipantId }
                        size = { SIDEBAR_AVATAR_SIZE } />
                    <Text style = { styles.displayName }>
                        { this.props._displayName }
                    </Text>
                </Header>
                <SafeAreaView style = { styles.sideBarBody }>
                    <ScrollView
                        style = { styles.itemContainer }>
                        <SideBarItem
                            icon = { IconSettings }
                            label = 'settings.title'
                            onPress = { this._onOpenSettings } />
                        <SideBarItem
                            icon = { IconInfo }
                            label = 'welcomepage.terms'
                            url = { TERMS_URL } />
                        <SideBarItem
                            icon = { IconInfo }
                            label = 'welcomepage.privacy'
                            url = { PRIVACY_URL } />
                        <SideBarItem
                            icon = { IconHelp }
                            label = 'welcomepage.getHelp'
                            onPress = { this._onOpenHelpPage } />
                    </ScrollView>
                </SafeAreaView>
            </SlidingView>
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

    _onOpenHelpPage: () => void;

    /**
     * Shows the {@link HelpView}.
     *
     * @returns {void}
     */
    _onOpenHelpPage() {
        const { dispatch } = this.props;

        dispatch(setSideBarVisible(false));
        dispatch(setActiveModalId(HELP_VIEW_MODAL_ID));
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
        dispatch(setActiveModalId(SETTINGS_VIEW_ID));
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Props}
 */
function _mapStateToProps(state: Object) {
    const _localParticipant = getLocalParticipant(state);
    const _localParticipantId = _localParticipant?.id;
    const _displayName = _localParticipant && getParticipantDisplayName(state, _localParticipantId);

    return {
        _displayName,
        _localParticipantId,
        _visible: state['features/welcome'].sideBarVisible
    };
}

export default connect(_mapStateToProps)(WelcomePageSideBar);
