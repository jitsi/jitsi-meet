import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../base/label/components/native/ExpandedLabel';

import { AUD_LABEL_COLOR } from './styles';

type Props = AbstractProps & WithTranslation;

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code VideoQualityLabel}.
 */
class VideoQualityExpandedLabel extends ExpandedLabel<Props> {
    /**
     * Returns the color this expanded label should be rendered with.
     *
     * @returns {string}
     */
    _getColor() {
        return AUD_LABEL_COLOR;
    }

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        return this.props.t('videoStatus.audioOnlyExpanded');
    }
}

export default translate(VideoQualityExpandedLabel);
