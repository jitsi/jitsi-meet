// @flow

import React from 'react';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';

import AbstractLabels, {
    _abstractMapStateToProps as _mapStateToProps,
    type Props
} from '../AbstractLabels';

/**
 * The type of the React {@code Component} state of {@link Labels}.
 */
type State = {

    /**
     * Whether or not the filmstrip was not visible but has transitioned in the
     * latest component update to visible. This boolean is used  to set a class
     * for position animations.
     *
     * @type {boolean}
     */
    filmstripBecomingVisible: boolean
};

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
class Labels extends AbstractLabels<Props, State> {
    /**
     * Updates the state for whether or not the filmstrip is transitioning to
     * a displayed state.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, prevState: State) {
        return {
            filmstripBecomingVisible: !prevState.filmstripBecomingVisible
                && props._filmstripVisible
        };
    }

    /**
     * Initializes a new {@code Labels} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            filmstripBecomingVisible: false
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _filmstripVisible } = this.props;
        const { filmstripBecomingVisible } = this.state;
        const className = `large-video-labels ${
            filmstripBecomingVisible ? 'opening' : ''} ${
            _filmstripVisible ? 'with-filmstrip' : 'without-filmstrip'}`;

        return (
            <div className = { className } >
                {
                    this._renderE2EELabel()
                }
                {
                    this._renderRecordingLabel(
                        JitsiRecordingConstants.mode.FILE)
                }
                {
                    this._renderRecordingLabel(
                        JitsiRecordingConstants.mode.STREAM)
                }
                {
                    this._renderLocalRecordingLabel()
                }
                {
                    this._renderTranscribingLabel()
                }
                {
                    this.props._showVideoQualityLabel
                        && this._renderVideoQualityLabel()
                }
                {
                    this._renderInsecureRoomNameLabel()
                }
            </div>
        );
    }

    _renderE2EELabel: () => React$Element<*>;

    _renderLocalRecordingLabel: () => React$Element<*>;

    _renderRecordingLabel: string => React$Element<*>;

    _renderTranscribingLabel: () => React$Element<*>;

    _renderInsecureRoomNameLabel: () => React$Element<any>;

    _renderVideoQualityLabel: () => React$Element<*>;
}

export default connect(_mapStateToProps)(Labels);
