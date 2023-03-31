// @flow

import { connect } from 'react-redux';

import { CLOSE_CAPTIONS_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { IconSubtitles } from '../../base/icons/svg';

import {
    AbstractClosedCaptionButton,
    _abstractMapStateToProps
} from './AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {
    accessibilityLabel = 'toolbar.accessibilityLabel.cc';
    icon = IconSubtitles;
    label = 'transcribing.start';
    toggledLabel = 'transcribing.stop';
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object, ownProps: Object) {
    const enabled = getFeatureFlag(state, CLOSE_CAPTIONS_ENABLED, true);
    const abstractProps = _abstractMapStateToProps(state, ownProps);

    return {
        ...abstractProps,
        visible: abstractProps.visible && enabled
    };
}

export default translate(connect(mapStateToProps)(ClosedCaptionButton));
