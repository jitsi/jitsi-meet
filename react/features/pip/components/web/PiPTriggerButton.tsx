import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.web';
import { IconPip } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { enterPiP } from '../../actions';

interface IProps extends AbstractButtonProps {
    _isDocPiPActive?: boolean;
}

/**
 * PiP toggle button
 * Either opens or closes the existing picture in picture window
 * Opens Document PiP or Video PiP based on browser availability and hides when both are not supported (eg: firefox).
 */
class PipTriggerButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    override label = 'toolbar.pipOpen';
    override toggledLabel = 'toolbar.pipClose';
    override tooltip = 'toolbar.pipOpen';
    override toggledTooltip = 'toolbar.pipClose';
    override icon = IconPip;

    override _isToggled(): boolean {
        return Boolean(this.props._isDocPiPActive);
    }

    override _handleClick() {
        const { dispatch } = this.props;
        sendAnalytics(createToolbarEvent('picture-in-picture'));
        dispatch(enterPiP());
    }
}

function mapStateToProps(state: IReduxState): Partial<IProps> {
    return {
        _isDocPiPActive: Boolean(state['features/pip']?.isPiPActive)
    };
}

export default connect(mapStateToProps)(translate(PipTriggerButton));