import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import { INDICATOR_DISPLAY_THRESHOLD } from '../AbstractConnectionIndicator';

export const CONNECTOR_INDICATOR_LOST = BaseTheme.palette.ui05;
export const CONNECTOR_INDICATOR_OTHER = BaseTheme.palette.action01;
export const CONNECTOR_INDICATOR_COLORS = [

    // Full (3 bars)
    {
        color: BaseTheme.palette.success01,
        percent: INDICATOR_DISPLAY_THRESHOLD
    },

    // 2 bars.
    {
        color: BaseTheme.palette.warning01,
        percent: 10
    },

    // 1 bar.
    {
        color: BaseTheme.palette.iconError,
        percent: 0
    }
];

export const iconStyle = {
    fontSize: 14
};
