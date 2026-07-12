import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.web';
import { IconPip } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { togglePip } from '../../actions';

interface IProps extends AbstractButtonProps {
    _isPiPActive: boolean;
}

/**
 * PiP toggle button
 * Either opens or closes the existing picture in picture window
 * Opens Document PiP or Video PiP based on browser availability and hides when both are not supported (eg: firefox).
 */
class PipTriggerButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.pip';
    override label = 'toolbar.pip';
    override toggledLabel = 'toolbar.pipClose';
    override tooltip = 'toolbar.pip';
    override toggledTooltip = 'toolbar.pipClose';
    override icon = IconPip;

    override _isToggled(): boolean {
        return Boolean(this.props._isPiPActive);
    }

    override _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('picture-in-picture', { enable: !this._isToggled() }));
        dispatch(togglePip());
    }
}

function mapStateToProps(state: IReduxState) {
    return {
        _isPiPActive: Boolean(state['features/pip']?.isPiPActive)
    };
}

export default translate(connect(mapStateToProps)(PipTriggerButton));
