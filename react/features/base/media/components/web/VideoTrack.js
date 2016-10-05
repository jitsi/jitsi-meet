import { connect } from 'react-redux';

import { AbstractVideoTrack } from '../AbstractVideoTrack';

/**
 * Component that renders video element for a specified video track.
 *
 * @extends AbstractVideoTrack
 */
class VideoTrack extends AbstractVideoTrack {
}

/**
 * VideoTrack component's property types.
 *
 * @static
 */
VideoTrack.propTypes = AbstractVideoTrack.propTypes;

export default connect()(VideoTrack);
