// @flow

import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import AbstractLiveStreamButton, {
    _mapStateToProps,
    type Props
} from './AbstractLiveStreamButton';

/**
 * An implementation of a button for starting and stopping live streaming.
 */
class LiveStreamButton extends AbstractLiveStreamButton<Props> {
    iconName = 'public';
    toggledIconName = 'public';
}

export default translate(connect(_mapStateToProps)(LiveStreamButton));
