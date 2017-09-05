import React from 'react';
import { TextInput, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { MEDIA_TYPE } from '../../base/media';
import { Link, Text } from '../../base/react';
import { ColorPalette } from '../../base/styles';
import { createDesiredLocalTracks } from '../../base/tracks';

import { AbstractWelcomePage, _mapStateToProps } from './AbstractWelcomePage';
import LocalVideoTrackUnderlay from './LocalVideoTrackUnderlay';
import styles from './styles';

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
     * Creates a video track if not already available.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillMount() {
        this.props.dispatch(createDesiredLocalTracks(MEDIA_TYPE.VIDEO));
    }

    /**
     * Renders a prompt for entering a room name.
     *
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <LocalVideoTrackUnderlay style = { styles.welcomePage }>
                <View style = { styles.roomContainer }>
                    <Text style = { styles.title }>
                        { t('welcomepage.roomname') }
                    </Text>
                    <TextInput
                        accessibilityLabel = { 'Input room name.' }
                        autoCapitalize = 'none'
                        autoComplete = { false }
                        autoCorrect = { false }
                        autoFocus = { false }
                        onChangeText = { this._onRoomChange }
                        placeholder = { t('welcomepage.roomnamePlaceHolder') }
                        style = { styles.textInput }
                        underlineColorAndroid = 'transparent'
                        value = { this.state.room } />
                    <TouchableHighlight
                        accessibilityLabel = { 'Tap to Join.' }
                        disabled = { this._isJoinDisabled() }
                        onPress = { this._onJoin }
                        style = { styles.button }
                        underlayColor = { ColorPalette.white }>
                        <Text style = { styles.buttonText }>
                            { t('welcomepage.join') }
                        </Text>
                    </TouchableHighlight>
                </View>
                {
                    this._renderLegalese()
                }
            </LocalVideoTrackUnderlay>
        );
    }

    /**
     * Renders legal-related content such as Terms of service/use, Privacy
     * policy, etc.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLegalese() {
        const { t } = this.props;

        return (
            <View style = { styles.legaleseContainer }>
                <Link
                    style = { styles.legaleseItem }
                    url = { TERMS_URL }>
                    { t('welcomepage.terms') }
                </Link>
                <Link
                    style = { styles.legaleseItem }
                    url = { PRIVACY_URL }>
                    { t('welcomepage.privacy') }
                </Link>
                <Link
                    style = { styles.legaleseItem }
                    url = { SEND_FEEDBACK_URL }>
                    { t('welcomepage.sendFeedback') }
                </Link>
            </View>
        );
    }
}

export default translate(connect(_mapStateToProps)(WelcomePage));
