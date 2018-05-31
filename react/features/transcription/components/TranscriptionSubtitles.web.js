import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * The React {@code Component} class of {@link TranscriptionSubtitles}
 * for style changes from css/_transcriptionSubtitles
 */
const className = 'transcription-subtitles';

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 *
 * Jigasi will send a JSON object via
 * {@code ConferenceEvents.ENDPOINT_MESSAGE_RECEIVED}. An example of a json
 * object sent by jigasi is:
 *
 * {
 *  'jitsi-meet-muc-msg-topic':'transcription-result',
 *  'payload':{
 *     'transcript':[
 *        {
 *           'confidence':0,
 *           'text':'how are'
 *        }
 *     ],
 *     'is_interim':true,
 *     'language':'en-US',
 *     'message_id':'8360900e-5fca-4d9c-baf3-6b24206dfbd7',
 *     'event':'SPEECH',
 *     'participant':{
 *        'name':'Nik',
 *        'id':'2fe3ac1c'
 *     },
 *     'stability':0.009999999776482582,
 *     'timestamp':'2017-08-21T14:35:46.342Z'
 *  }
 * }
 *
 */
class TranscriptionSubtitles extends React.Component<Props, State> {
    /**
     * The type of the React {@code Component} props of
     * {@link TranscriptionSubtitles}.
     */
    static propTypes = {
        transcriptionSubtitles: PropTypes.arrayOf(PropTypes.element)
    };

    /**
     * The type of the React {@code Component} state of
     * {@link TranscriptionSubtitles}.
     */
    state = {
        hidden: false
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.state.hidden) {
            return null;
        }

        return (
            <div className = { className }>
                { this.props.transcriptionSubtitles }
            </div>
        );
    }
}

/**
 * Maps the conference in the Redux state to the associated
 * {@code TranscriptionSubtitles's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     transcriptionSubtitles: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        transcriptionSubtitles:
        state['features/transcription'].transcriptionSubtitles
    };
}

export default connect(_mapStateToProps)(TranscriptionSubtitles);
