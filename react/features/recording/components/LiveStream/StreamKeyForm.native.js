// @flow

import React from 'react';
import { Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { translate } from '../../../base/i18n';

import AbstractStreamKeyForm, {
    type Props
} from './AbstractStreamKeyForm';
import styles from './styles';

/**
 * A React Component for entering a key for starting a YouTube live stream.
 *
 * @extends Component
 */
class StreamKeyForm extends AbstractStreamKeyForm {
    /**
     * Initializes a new {@code StreamKeyForm} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StreamKeyForm} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onOpenHelp = this._onOpenHelp.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <View style = { styles.streamKeyFormWrapper }>
                <Text style = { styles.streamKeyInputLabel }>
                    {
                        t('dialog.streamKey')
                    }
                </Text>
                <TextInput
                    onChangeText = { this._onInputChange }
                    placeholder = { t('liveStreaming.enterStreamKey') }
                    style = { styles.streamKeyInput }
                    value = { this.state.value } />
                <TouchableOpacity
                    onPress = { this._onOpenHelp }
                    style = { styles.streamKeyHelp } >
                    <Text>
                        {
                            t('liveStreaming.streamIdHelp')
                        }
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    _onInputChange: Object => void

    _onOpenHelp: () => void

    /**
     * Opens the information link on how to manually locate a YouTube broadcast
     * stream key.
     *
     * @private
     * @returns {void}
     */
    _onOpenHelp() {
        const { helpURL } = this;

        if (typeof helpURL === 'string') {
            Linking.openURL(helpURL);
        }
    }
}

export default translate(StreamKeyForm);
