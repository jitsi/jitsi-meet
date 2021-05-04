// @flow

import Button from '@atlaskit/button';
import Flag from '@atlaskit/flag';
import EditorInfoIcon from '@atlaskit/icon/glyph/editor/info';
import { colors } from '@atlaskit/theme';
import React, { useCallback, useState } from 'react';
import type { Dispatch } from 'redux';

import { setAudioOnly } from '../../../base/audio-only';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { setPreferredVideoQuality } from '../../../video-quality';
import { VIDEO_QUALITY_LEVELS } from '../../../video-quality/constants';

type Props = {
    audioOnly: boolean,
    dispatch: Dispatch<any>,
    hdAlertEnabled: boolean
}

const HD_VIDEO_QUALITY = VIDEO_QUALITY_LEVELS.HIGH;
const ICON_COLOR = colors.N0;

const uid = window.Date.now();
const appearance = 'normal';

/**
 * HdVideoAlert component.
 *
 * @returns {React$Element<any>}
 */
function HdVideoAlert({ audioOnly, hdAlertEnabled, dispatch }: Props) {
    const [ visible, setVisible ] = useState(true);

    const _setPreferredVideoQuality = qualityLevel => {
        dispatch(setPreferredVideoQuality(qualityLevel));
        if (audioOnly) {
            dispatch(setAudioOnly(false));
        }
    };

    const _onDismissed = useCallback(() => {
        setVisible(false);
    });

    const _onClick = useCallback(() => {
        _setPreferredVideoQuality(HD_VIDEO_QUALITY);
        _onDismissed();
    }, []);

    if (!visible || !hdAlertEnabled) {
        return null;
    }

    const button = (<Button
        className = 'button'
        onClick = { _onClick } >
        {'Improve my video quality'}
    </Button>);

    const icon = (<EditorInfoIcon
        label = { appearance }
        secondaryColor = { ICON_COLOR }
        size = { 'medium' } />);

    return (<div className = 'hd-video-alert'>
        <div className = 'hd-video-alert-container'>
            <Flag
                appearance = { appearance }
                description = { button }
                icon = { icon }
                id = { uid }
                isDismissAllowed = { true }
                onDismissed = { _onDismissed }
                testId = { uid }
                title = { 'Load HD for better video quality ?' } />
        </div>
    </div>);
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code HdVideoAlert} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const { hdAlertEnabled } = state['features/notifications'];

    return {
        audioOnly,
        hdAlertEnabled
    };
}

export default translate(connect(_mapStateToProps)(HdVideoAlert));
