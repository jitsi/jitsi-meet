// @flow

import React, { Component } from 'react';
import {
    Linking,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    View
} from 'react-native';

import { _abstractMapStateToProps } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { StyleType } from '../../../../base/styles';

import { YOUTUBE_LIVE_DASHBOARD_URL } from '../constants';

import styles, { ACTIVE_OPACITY, TOUCHABLE_UNDERLAY } from './styles';

type Props = {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: StyleType,

    /**
     * The list of broadcasts the user can pick from.
     */
    broadcasts: ?Array<Object>,

    /**
     * Callback to be invoked when the user picked a broadcast. To be invoked
     * with a single key (string).
     */
    onChange: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
}

type State = {

     /**
      * The key of the currently selected stream.
      */
     streamKey: ?string
}

/**
 * Class to implement a stream key picker (dropdown) component to allow the user
 * to choose from the available Google Broadcasts/Streams.
 *
 * NOTE: This component is currently only used on mobile, but it is advised at
 * a later point to unify mobile and web logic for this functionality. But it's
 * out of the scope for now of the mobile live streaming functionality.
 */
class StreamKeyPicker extends Component<Props, State> {

    /**
     * Instantiates a new instance of StreamKeyPicker.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
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
                <View style = { styles.formWrapper }>
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
            <View style = { styles.formWrapper }>
                <View style = { styles.streamKeyPickerCta }>
                    <Text
                        style = { [
                            _dialogStyles.text,
                            styles.text
                        ] }>
                        { this.props.t('liveStreaming.choose') }
                    </Text>
                </View>
                <View style = { styles.streamKeyPickerWrapper } >
                    { broadcasts.map((broadcast, index) =>
                        (<TouchableHighlight
                            activeOpacity = { ACTIVE_OPACITY }
                            key = { index }
                            onPress = { this._onStreamPick(broadcast.key) }
                            style = { [
                                styles.streamKeyPickerItem,
                                this.state.streamKey === broadcast.key
                                    ? styles.streamKeyPickerItemHighlight : null
                            ] }
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

    _onOpenYoutubeDashboard: () => void;

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

    _onStreamPick: string => Function

    /**
     * Callback to be invoked when the user picks a stream from the list.
     *
     * @private
     * @param {string} streamKey - The key of the stream selected.
     * @returns {Function}
     */
    _onStreamPick(streamKey) {
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
