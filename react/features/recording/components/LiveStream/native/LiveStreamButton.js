// @flow

import { translate } from '../../../../base/i18n';
import { IconLiveStreaming } from '../../../../base/icons';
import { connect } from '../../../../base/redux';

import AbstractLiveStreamButton, {
    _mapStateToProps,
    type Props
} from '../AbstractLiveStreamButton';

/**
 * An implementation of a button for starting and stopping live streaming.
 */
class LiveStreamButton extends AbstractLiveStreamButton<Props> {
    icon = IconLiveStreaming;
}

export default translate(connect(_mapStateToProps)(LiveStreamButton));
