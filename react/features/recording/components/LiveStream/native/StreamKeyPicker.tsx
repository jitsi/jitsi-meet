import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import {
    Linking,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { connect } from 'react-redux';

import { _abstractMapStateToProps } from '../../../../base/dialog/functions';
import { translate } from '../../../../base/i18n/functions';
import { YOUTUBE_LIVE_DASHBOARD_URL } from '../constants';

import styles, { ACTIVE_OPACITY, TOUCHABLE_UNDERLAY } from './styles';

interface IProps extends WithTranslation {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: any;

    /**
     * The list of broadcasts the user can pick from.
     */
    broadcasts?: Array<{ key: string; title: string; }>;

    /**
     * Callback to be invoked when the user picked a broadcast. To be invoked
     * with a single key (string).
     */
    onChange: Function;
}

interface IState {

    /**
    * The key of the currently selected stream.
    */
    streamKey?: string | null;
}

/**
 * Class to implement a stream key picker (dropdown) component to allow the user
 * to choose from the available Google Broadcasts/Streams.
 *
 * NOTE: This component is currently only used on mobile, but it is advised at
 * a later point to unify mobile and web logic for this functionality. But it's
 * out of the scope for now of the mobile live streaming functionality.
 */
class StreamKeyPicker extends Component<IProps, IState> {

    /**
     * Instantiates a new instance of StreamKeyPicker.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            streamKey: null
        };

        this._onOpenYoutubeDashboard = this._onOpenYoutubeDashboard.bind(this);
        this._onStreamPick = this._onStreamPick.bind(this);
    }

    /**
     * Renders the component.
     *
     * @inheritdoc
     */
    render() {
        const { _dialogStyles, broadcasts } = this.props;

        if (!broadcasts) {
            return null;
        }

        if (!broadcasts.length) {
            return (
                <View style = { styles.formWrapper as ViewStyle }>
                    <TouchableOpacity
                        onPress = { this._onOpenYoutubeDashboard }>
                        <Text
                            style = { [
                                _dialogStyles.text,
                                styles.warningText
                            ] }>
                            { this.props.t(
                                'liveStreaming.getStreamKeyManually') }
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style = { styles.formWrapper as ViewStyle }>
                <View style = { styles.streamKeyPickerCta as ViewStyle }>
                    <Text
                        style = { [
                            _dialogStyles.text,
                            styles.text
                        ] }>
                        { this.props.t('liveStreaming.choose') }
                    </Text>
                </View>
                <View style = { styles.streamKeyPickerWrapper as ViewStyle } >
                    { broadcasts.map((broadcast, index) =>
                        (<TouchableHighlight
                            activeOpacity = { ACTIVE_OPACITY }
                            key = { index }
                            onPress = { this._onStreamPick(broadcast.key) }
                            style = { [
                                styles.streamKeyPickerItem,
                                this.state.streamKey === broadcast.key
                                    ? styles.streamKeyPickerItemHighlight : null
                            ] as ViewStyle[] }
                            underlayColor = { TOUCHABLE_UNDERLAY }>
                            <Text
                                style = { [
                                    _dialogStyles.text,
                                    styles.text
                                ] }>
                                { broadcast.title }
                            </Text>
                        </TouchableHighlight>))
                    }
                </View>
            </View>
        );
    }

    /**
     * Opens the link which should display the YouTube broadcast live stream
     * key.
     *
     * @private
     * @returns {void}
     */
    _onOpenYoutubeDashboard() {
        Linking.openURL(YOUTUBE_LIVE_DASHBOARD_URL);
    }

    /**
     * Callback to be invoked when the user picks a stream from the list.
     *
     * @private
     * @param {string} streamKey - The key of the stream selected.
     * @returns {Function}
     */
    _onStreamPick(streamKey: string) {
        return () => {
            this.setState({
                streamKey
            });
            this.props.onChange(streamKey);
        };
    }
}

export default translate(
    connect(_abstractMapStateToProps)(StreamKeyPicker));
