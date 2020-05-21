// @flow

import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../../base/responsive-ui';
import {
    RecordingExpandedLabel
} from '../../../recording';
import { TranscribingExpandedLabel } from '../../../transcribing';
import { VideoQualityExpandedLabel } from '../../../video-quality';
import { shouldDisplayNotifications } from '../../functions';
import AbstractLabels, {
    _abstractMapStateToProps,
    type Props as AbstractLabelsProps
} from '../AbstractLabels';

import InsecureRoomNameExpandedLabel from './InsecureRoomNameExpandedLabel';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link Labels}.
 */
type Props = AbstractLabelsProps & {

    /**
     * Function to translate i18n labels.
     */
    t: Function,

    /**
     * True if the labels should be visible, false otherwise.
     */
    _visible: boolean
};

type State = {

    /**
     * Layout object of the outermost container. For stucture please see:
     * https://facebook.github.io/react-native/docs/view#onlayout
     */
    containerLayout: ?Object,

    /**
     * Layout objects of the individual labels. This data type contains the same
     * structure as the layout is defined here:
     * https://facebook.github.io/react-native/docs/view#onlayout
     * but keyed with the ID of the label its layout it contains. E.g.
     *
     * {
     *   transcribing: {
     *     { layout: { x, y, width, height } }
     *   },
     *   ...
     * }
     */
    labelLayouts: Object,

    /**
     * Position of the label to render the {@code ExpandedLabel} to.
     */
    parentPosition: ?number,

    /**
     * String to show which {@code ExpandedLabel} to be shown. (Equals to the
     * label IDs below.)
     */
    visibleExpandedLabel: ?string
}

const LABEL_ID_QUALITY = 'quality';
const LABEL_ID_RECORDING = 'recording';
const LABEL_ID_STREAMING = 'streaming';
const LABEL_ID_TRANSCRIBING = 'transcribing';
const LABEL_ID_INSECURE_ROOM_NAME = 'insecure-room-name';

/**
 * The {@code ExpandedLabel} components to be rendered for the individual
 * {@code Label}s.
 */
const EXPANDED_LABELS = {
    quality: VideoQualityExpandedLabel,
    recording: {
        component: RecordingExpandedLabel,
        props: {
            mode: JitsiRecordingConstants.mode.FILE
        }
    },
    streaming: {
        component: RecordingExpandedLabel,
        props: {
            mode: JitsiRecordingConstants.mode.STREAM
        }
    },
    transcribing: TranscribingExpandedLabel,
    'insecure-room-name': InsecureRoomNameExpandedLabel
};

/**
 * Timeout to hide the {@ExpandedLabel}.
 */
const EXPANDED_LABEL_TIMEOUT = 5000;

/**
 * A container that renders the conference indicators, if any.
 */
class Labels extends AbstractLabels<Props, State> {
    /**
     * Timeout for the expanded labels to disappear.
     */
    expandedLabelTimeout: TimeoutID;

    /**
     * Instantiates a new instance of {@code Labels}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            containerLayout: undefined,
            labelLayouts: {},
            parentPosition: undefined,
            visibleExpandedLabel: undefined
        };

        this._onTopViewLayout = this._onTopViewLayout.bind(this);
    }

    /**
     * Implements React {@code Component}'s componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        clearTimeout(this.expandedLabelTimeout);
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._visible) {
            return null;
        }

        const wide = !isNarrowAspectRatio(this);
        const { _filmstripVisible } = this.props;

        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.labelWrapper }>
                <View
                    onLayout = { this._onTopViewLayout }
                    pointerEvents = 'box-none'
                    style = { [
                        styles.indicatorContainer,
                        wide && _filmstripVisible
                            && styles.indicatorContainerWide
                    ] }>
                    <TouchableOpacity
                        onLayout = { this._createOnLayout(LABEL_ID_RECORDING) }
                        onPress = { this._createOnPress(LABEL_ID_RECORDING) } >
                        {
                            this._renderRecordingLabel(
                                JitsiRecordingConstants.mode.FILE)
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        onLayout = { this._createOnLayout(LABEL_ID_STREAMING) }
                        onPress = { this._createOnPress(LABEL_ID_STREAMING) } >
                        {
                            this._renderRecordingLabel(
                                JitsiRecordingConstants.mode.STREAM)
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        onLayout = {
                            this._createOnLayout(LABEL_ID_TRANSCRIBING)
                        }
                        onPress = {
                            this._createOnPress(LABEL_ID_TRANSCRIBING)
                        } >
                        {
                            this._renderTranscribingLabel()
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        onLayout = {
                            this._createOnLayout(LABEL_ID_INSECURE_ROOM_NAME)
                        }
                        onPress = {
                            this._createOnPress(LABEL_ID_INSECURE_ROOM_NAME)
                        } >
                        {
                            this._renderInsecureRoomNameLabel()
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        onLayout = {
                            this._createOnLayout(LABEL_ID_QUALITY) }
                        onPress = {
                            this._createOnPress(LABEL_ID_QUALITY) } >
                        { this._renderVideoQualityLabel() }
                    </TouchableOpacity>
                </View>
                <View
                    style = { [
                        styles.indicatorContainer,
                        wide && _filmstripVisible
                            && styles.indicatorContainerWide
                    ] }>
                    {
                        this._renderExpandedLabel()
                    }
                </View>
            </View>
        );
    }

    /**
     * Creates a function to be invoked when the onLayout of the touchables are
     * triggered.
     *
     * @param {string} label - The identifier of the label that's onLayout is
     * triggered.
     * @returns {Function}
     */
    _createOnLayout(label) {
        return ({ nativeEvent: { layout } }) => {
            const { labelLayouts } = this.state;
            const updatedLayout = {};

            updatedLayout[label] = layout;

            this.setState({
                labelLayouts: {
                    ...labelLayouts,
                    ...updatedLayout
                }
            });
        };
    }

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     *
     * @param {string} label - The identifier of the label that's onLayout is
     * triggered.
     * @returns {Function}
     */
    _createOnPress(label) {
        return () => {
            const {
                containerLayout,
                labelLayouts
            } = this.state;
            let { visibleExpandedLabel } = this.state;

            if (containerLayout) {
                const labelLayout = labelLayouts[label];

                // This calculation has to be changed if the labels are not
                // positioned right anymore.
                const right = containerLayout.width - labelLayout.x;

                visibleExpandedLabel
                    = visibleExpandedLabel === label ? undefined : label;

                clearTimeout(this.expandedLabelTimeout);
                this.setState({
                    parentPosition: right,
                    visibleExpandedLabel
                });

                if (visibleExpandedLabel) {
                    this.expandedLabelTimeout = setTimeout(() => {
                        this.setState({
                            visibleExpandedLabel: undefined
                        });
                    }, EXPANDED_LABEL_TIMEOUT);
                }
            }
        };
    }

    _onTopViewLayout: Object => void

    /**
     * Invoked when the View containing the {@code Label}s is laid out.
     *
     * @param {Object} layout - The native layout object.
     * @returns {void}
     */
    _onTopViewLayout({ nativeEvent: { layout } }) {
        this.setState({
            containerLayout: layout
        });
    }

    /**
     * Rendes the expanded (explaining) label for the label that was touched.
     *
     * @returns {React$Element}
     */
    _renderExpandedLabel() {
        const { parentPosition, visibleExpandedLabel } = this.state;

        if (visibleExpandedLabel) {
            const expandedLabel = EXPANDED_LABELS[visibleExpandedLabel];

            if (expandedLabel) {
                const component = expandedLabel.component || expandedLabel;
                const expandedLabelProps = expandedLabel.props || {};

                return React.createElement(component, {
                    ...expandedLabelProps,
                    parentPosition
                });
            }
        }

        return null;
    }

    _renderRecordingLabel: string => React$Element<any>;

    _renderTranscribingLabel: () => React$Element<any>;

    _renderInsecureRoomNameLabel: () => React$Element<any>;

    _renderVideoQualityLabel: () => React$Element<any>;
}

/**
 * Maps (parts of) the redux state to the associated
 * {@code Labels}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        ..._abstractMapStateToProps(state),
        _visible: !shouldDisplayNotifications(state)
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Labels));
