import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { TranslationTreatment } from '../../../audio-translation/constants';
import { getTranslationTreatment } from '../../../audio-translation/functions';
import { IconTranslate } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/native/BaseIndicator';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';

import styles from './styles';

interface IProps {

    /**
     * Which of the three treatments to render, or NONE to render nothing.
     */
    _treatment: TranslationTreatment;

    /**
     * The id of the participant this indicator is rendered for.
     */
    participantId: string;
}

/**
 * Thumbnail badge showing a participant's audio-translation status as one of three treatments: outlined
 * (translation enabled for the local user), filled (receiving translated audio) or filled with a dot (both).
 * Renders nothing when neither applies.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement|null}
 */
const TranslationIndicator = ({ _treatment }: IProps) => {
    if (_treatment === TranslationTreatment.NONE) {
        return null;
    }

    const outlined = _treatment === TranslationTreatment.ENABLED;

    return (
        <View
            style = { (outlined
                ? styles.translationIndicatorOutlined
                : styles.translationIndicatorFilled) as StyleProp<ViewStyle> }>
            <BaseIndicator
                icon = { IconTranslate }
                iconStyle = { outlined ? { color: BaseTheme.palette.action01 } : {} } />
            { _treatment === TranslationTreatment.BOTH
                && <View style = { styles.translationIndicatorDot as StyleProp<ViewStyle> } /> }
        </View>
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
