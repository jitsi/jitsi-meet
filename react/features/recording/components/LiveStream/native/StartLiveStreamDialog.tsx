import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../../base/styles/functions.any';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import googleApi from '../../../../google-api/googleApi.native';
import HeaderNavigationButton
    from '../../../../mobile/navigation/components/HeaderNavigationButton';
import { goBack }
    from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { setLiveStreamKey } from '../../../actions';
import AbstractStartLiveStreamDialog, { IProps, _mapStateToProps } from '../AbstractStartLiveStreamDialog';

import GoogleSigninForm from './GoogleSigninForm';
import StreamKeyForm from './StreamKeyForm';
import StreamKeyPicker from './StreamKeyPicker';
import styles from './styles';

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 */
class StartLiveStreamDialog extends AbstractStartLiveStreamDialog<IProps> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onStartPress = this._onStartPress.bind(this);
        this._onStreamKeyChangeNative
            = this._onStreamKeyChangeNative.bind(this);
        this._onStreamKeyPick = this._onStreamKeyPick.bind(this);
        this._onUserChanged = this._onUserChanged.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        const { navigation, t } = this.props;

        navigation.setOptions({
            headerRight: () => (
                <HeaderNavigationButton
                    label = { t('dialog.start') }
                    onPress = { this._onStartPress }
                    twoActions = { true } />
            )
        });
    }

    /**
     * Starts live stream session and goes back to the previous screen.
     *
     * @returns {void}
     */
    _onStartPress() {
        this._onSubmit() && goBack();
    }

    /**
     * Implements {@code Component}'s render.
     *
     * @inheritdoc
     */
    override render() {
        return (
            <JitsiScreen style = { styles.startLiveStreamContainer as StyleType }>
                <GoogleSigninForm
                    onUserChanged = { this._onUserChanged } />
                <StreamKeyPicker
                    broadcasts = { this.state.broadcasts }
                    onChange = { this._onStreamKeyPick } />
                <StreamKeyForm
                    onChange = { this._onStreamKeyChangeNative }
                    value = {
                        this.state.streamKey || this.props._streamKey || ''
                    } />
            </JitsiScreen>
        );
    }

    /**
     * Callback to handle stream key changes.
     *
     * FIXME: This is a temporary method to store the streaming key on mobile
     * for easier use, until the Google sign-in is implemented. We don't store
     * the key on web for security reasons (e.g. We don't want to have the key
     * stored if the used signed out).
     *
     * @private
     * @param {string} streamKey - The new key value.
     * @returns {void}
     */
    _onStreamKeyChangeNative(streamKey: string) {
        this.props.dispatch(setLiveStreamKey(streamKey));
        this._onStreamKeyChange(streamKey);
    }

    /**
     * Callback to be invoked when the user selects a stream from the picker.
     *
     * @private
     * @param {string} streamKey - The key of the selected stream.
     * @returns {void}
     */
    _onStreamKeyPick(streamKey: string) {
        this.setState({
            streamKey
        });
    }

    /**
     * A callback to be invoked when an authenticated user changes, so
     * then we can get (or clear) the YouTube stream key.
     *
     * TODO: Handle errors by showing some indication to the user.
     *
     * @private
     * @param {Object} response - The retrieved signin response.
     * @returns {void}
     */
    _onUserChanged(response: Object) {
        if (response) {
            googleApi.getTokens()
                .then((tokens: any) => {
                    googleApi.getYouTubeLiveStreams(tokens.accessToken)
                        .then((broadcasts: any) => {
                            this.setState({
                                broadcasts
                            });
                        });
                })
                .catch(() => {
                    this.setState({
                        broadcasts: undefined,
                        streamKey: undefined
                    });
                });
        } else {
            this.setState({
                broadcasts: undefined,
                streamKey: undefined
            });
        }
    }
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
