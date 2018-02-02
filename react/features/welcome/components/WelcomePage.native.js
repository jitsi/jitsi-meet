import React from 'react';
import {
    SafeAreaView,
    Switch,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native';
import { connect } from 'react-redux';

import { AppSettings } from '../../app-settings';
import { translate } from '../../base/i18n';
import { Icon } from '../../base/font-icons';
import { MEDIA_TYPE } from '../../base/media';
import { updateProfile } from '../../base/profile';
import {
    LoadingIndicator,
    Header,
    Text
} from '../../base/react';
import { ColorPalette, PlatformElements } from '../../base/styles';
import {
    createDesiredLocalTracks,
    destroyLocalTracks
} from '../../base/tracks';
import { RecentList } from '../../recent-list';

import { setSideBarVisibility } from '../actions';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import LocalVideoTrackUnderlay from './LocalVideoTrackUnderlay';
import styles, {
    PLACEHOLDER_TEXT_COLOR,
    SWITCH_THUMB_COLOR,
    SWITCH_UNDER_COLOR
} from './styles';
import WelcomePageSideBar from './WelcomePageSideBar';

/**
 * The native container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * WelcomePage component's property types.
     *
     * @static
     */
    static propTypes = AbstractWelcomePage.propTypes;

    /**
     * Constructor of the Component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onShowSideBar = this._onShowSideBar.bind(this);
        this._onStartAudioOnlyChange = this._onStartAudioOnlyChange.bind(this);
    }

    /**
     * Implements React's {@link Component#componentWillMount()}. Invoked
     * immediately before mounting occurs. Creates a local video track if none
     * is available.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        super.componentWillMount();

        const { dispatch } = this.props;

        if (this.props._profile.startAudioOnly) {
            dispatch(destroyLocalTracks());
        } else {
            dispatch(createDesiredLocalTracks(MEDIA_TYPE.VIDEO));
        }
    }

    /**
     * Implements React's {@link Component#render()}. Renders a prompt for
     * entering a room name.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t, _profile } = this.props;

        return (
            <LocalVideoTrackUnderlay style = { styles.welcomePage }>
                <View style = { PlatformElements.page }>
                    <Header style = { styles.header }>
                        <TouchableOpacity onPress = { this._onShowSideBar } >
                            <Icon
                                name = 'menu'
                                style = { PlatformElements.headerButton } />
                        </TouchableOpacity>
                        <View style = { styles.audioVideoSwitchContainer }>
                            <Text style = { PlatformElements.headerText } >
                                { t('welcomepage.videoEnabledLabel') }
                            </Text>
                            <Switch
                                onTintColor = { SWITCH_UNDER_COLOR }
                                onValueChange = { this._onStartAudioOnlyChange }
                                style = { styles.audioVideoSwitch }
                                thumbTintColor = { SWITCH_THUMB_COLOR }
                                value = { _profile.startAudioOnly } />
                            <Text style = { PlatformElements.headerText } >
                                { t('welcomepage.audioOnlyLabel') }
                            </Text>
                        </View>
                    </Header>
                    <SafeAreaView style = { styles.roomContainer } >
                        <TextInput
                            accessibilityLabel = { 'Input room name.' }
                            autoCapitalize = 'none'
                            autoComplete = { false }
                            autoCorrect = { false }
                            autoFocus = { false }
                            onChangeText = { this._onRoomChange }
                            onSubmitEditing = { this._onJoin }
                            placeholder = { t('welcomepage.roomname') }
                            placeholderTextColor = { PLACEHOLDER_TEXT_COLOR }
                            returnKeyType = { 'go' }
                            style = { styles.textInput }
                            underlineColorAndroid = 'transparent'
                            value = { this.state.room } />
                        {
                            this._renderJoinButton()
                        }
                        <RecentList />
                    </SafeAreaView>
                    <AppSettings />
                </View>
                <WelcomePageSideBar />
            </LocalVideoTrackUnderlay>
        );
    }

    /**
     * Toggles the side bar.
     *
     * @private
     * @returns {void}
     */
    _onShowSideBar() {
        this.props.dispatch(setSideBarVisibility(true));
    }

    /**
     * Handles the audio-video switch changes.
     *
     * @private
     * @param {boolean} startAudioOnly - The new startAudioOnly value.
     * @returns {void}
     */
    _onStartAudioOnlyChange(startAudioOnly) {
        const { dispatch } = this.props;

        dispatch(updateProfile({
            ...this.props._profile,
            startAudioOnly
        }));
    }

    /**
     * Renders the join button.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderJoinButton() {
        let children;

        /* eslint-disable no-extra-parens */

        if (this.state.joining) {
            // TouchableHighlight is picky about what its children can be, so
            // wrap it in a native component, i.e. View to avoid having to
            // modify non-native children.
            children = (
                <View>
                    <LoadingIndicator color = { styles.buttonText.color } />
                </View>
            );
        } else {
            children = (
                <Text style = { styles.buttonText }>
                    { this.props.t('welcomepage.join') }
                </Text>
            );
        }

        /* eslint-enable no-extra-parens */

        return (
            <TouchableHighlight
                accessibilityLabel = { 'Tap to Join.' }
                disabled = { this._isJoinDisabled() }
                onPress = { this._onJoin }
                style = { styles.button }
                underlayColor = { ColorPalette.white }>
                {
                    children
                }
            </TouchableHighlight>
        );
    }
}

export default translate(connect(_mapStateToProps)(WelcomePage));
