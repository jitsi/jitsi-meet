import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { TranslationTreatment } from '../../../audio-translation/constants';
import { getTranslationTreatment } from '../../../audio-translation/functions';
import { IconTranslate } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';

/**
 * The type of the React {@code Component} props of {@link TranslationIndicator}.
 */
interface IProps {

    /**
     * Which of the three treatments to render, or NONE to render nothing.
     */
    _treatment: TranslationTreatment;

    /**
     * The id of the participant this indicator is rendered for.
     */
    participantId: string;

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: TOOLTIP_POSITION;
}

/**
 * Tooltip i18n key per rendered treatment.
 */
const TOOLTIP_KEYS: Record<TranslationTreatment, string> = {
    [TranslationTreatment.BOTH]: 'videothumbnail.translationOnAndReceiving',
    [TranslationTreatment.ENABLED]: 'videothumbnail.translationEnabledForYou',
    [TranslationTreatment.NONE]: '',
    [TranslationTreatment.RECEIVING]: 'videothumbnail.receivingTranslatedAudio'
};

const useStyles = makeStyles()(theme => {
    return {
        dot: {
            backgroundColor: theme.palette.icon01,
            border: `1px solid ${theme.palette.uiBackground}`,
            borderRadius: '50%',
            height: '5px',
            position: 'absolute',
            right: '-1px',
            top: '-1px',
            width: '5px'
        },
        filled: {
            backgroundColor: theme.palette.action01,
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'inline-block',
            padding: '4px',
            position: 'relative'
        },
        outlined: {
            border: `1px solid ${theme.palette.action01}`,
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'inline-block',
            padding: '3px'
        }
    };
});

/**
 * React {@code Component} showing a participant's audio-translation status as one of three treatments: outlined
 * (translation enabled for the local user), filled (receiving translated audio) or filled with a dot (both).
 * Renders nothing when neither applies.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement|null}
 */
const TranslationIndicator = ({ _treatment, tooltipPosition }: IProps) => {
    const { classes: styles, theme } = useStyles();

    if (_treatment === TranslationTreatment.NONE) {
        return null;
    }

    const outlined = _treatment === TranslationTreatment.ENABLED;

    return (
        <div className = { outlined ? styles.outlined : styles.filled }>
            <BaseIndicator
                icon = { IconTranslate }
                iconColor = { outlined ? theme.palette.action01 : theme.palette.icon01 }
                iconId = 'translation-active'
                iconSize = { 16 }
                id = 'translationActive'
                tooltipKey = { TOOLTIP_KEYS[_treatment] }
                tooltipPosition = { tooltipPosition } />
            { _treatment === TranslationTreatment.BOTH && <span className = { styles.dot } /> }
        </div>
    );
};

/**
 * Maps (parts of) the redux state to the component's props.
 *
 * @param {IReduxState} state - The redux state.
 * @param {Object} ownProps - The component's own props.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    return {
        _treatment: getTranslationTreatment(state, ownProps.participantId)
    };
}

export default connect(_mapStateToProps)(TranslationIndicator);
