import { Theme } from '@mui/material';
import React, { ReactElement } from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { getVideospaceFloatingElementsBottomSpacing } from '../../../base/ui/functions.web';
import { getStageParticipantNameLabelHeight } from '../../../display-name/components/web/styles';
import { shouldDisplayStageParticipantBadge } from '../../../display-name/functions';
import {
    getTransitionParamsForElementsAboveToolbox,
    isToolboxVisible,
    toCSSTransitionValue
} from '../../../toolbox/functions.web';
import { calculateSubtitlesFontSize } from '../../functions.web';
import {
    AbstractCaptions,
    type IAbstractCaptionsProps,
    _abstractMapStateToProps
} from '../AbstractCaptions';

interface IProps extends IAbstractCaptionsProps {

    /**
     * The height of the visible area.
     */
    _clientHeight?: number;

    /**
     * Whether the subtitles container is lifted above the invite box.
     */
    _isLifted: boolean | undefined;

    /**
     * Whether toolbar is shifted up or not.
     */
    _shiftUp: boolean;

    /**
     * Whether the toolbox is visible or not.
     */
    _toolboxVisible: boolean;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
}


const styles = (theme: Theme, props: IProps) => {
    const { _isLifted = false, _clientHeight, _shiftUp = false, _toolboxVisible = false } = props;
    const fontSize = calculateSubtitlesFontSize(_clientHeight);

    // Normally we would use 0.2 * fontSize in order to cover the background gap from line-height: 1.2 but it seems
    // the current font is a little bit larger than it is supposed to be.
    const padding = 0.1 * fontSize;
    let bottom = getVideospaceFloatingElementsBottomSpacing(theme, _toolboxVisible);
    let marginBottom = 0;

    // This is the case where we display the onstage participant display name
    // below the subtitles.
    if (_isLifted) {
        // 10px is the space between the onstage participant display name label and subtitles. We also need
        // to add the padding of the subtitles because it will decrease the gap between the label and subtitles.
        bottom += getStageParticipantNameLabelHeight(theme, _clientHeight) + 10 + padding;
    }

    if (_shiftUp) {
        // The toolbar is shifted up with 30px from the css.
        marginBottom += 30;
    }

    return {
        transcriptionSubtitles: {
            bottom: `${bottom}px`,
            marginBottom: `${marginBottom}px`,
            fontSize: `${fontSize}px`,
            left: '50%',
            maxWidth: '50vw',
            overflowWrap: 'break-word' as const,
            pointerEvents: 'none' as const,
            position: 'absolute' as const,
            textShadow: `
                0px 0px 1px rgba(0,0,0,0.3),
                0px 1px 1px rgba(0,0,0,0.3),
                1px 0px 1px rgba(0,0,0,0.3),
                0px 0px 1px rgba(0,0,0,0.3)`,
            transform: 'translateX(-50%)',
            zIndex: 7, // The popups are with z-index 8. This z-index has to be lower.
            lineHeight: 1.2,
            transition: `bottom ${toCSSTransitionValue(getTransitionParamsForElementsAboveToolbox(_toolboxVisible))}`,

            span: {
                color: '#fff',
                background: 'black',

                // without this when the text is wrapped on 2+ lines there will be a gap in the background:
                padding: `${padding}px 8px`,
                boxDecorationBreak: 'clone' as const
            }
        }
    };
};

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */
class Captions extends AbstractCaptions<IProps> {

    /**
     * Renders the transcription text.
     *
     * @param {string} id - The ID of the transcript message from which the
     * {@code text} has been created.
     * @param {string} text - Subtitles text formatted with the participant's
     * name.
     * @protected
     * @returns {ReactElement} - The React element which displays the text.
     */
    override _renderParagraph(id: string, text: string): ReactElement {
        return (
            <p key = { id }>
                <span>{ text }</span>
            </p>
        );
    }

    /**
     * Renders the subtitles container.
     *
     * @param {Array<ReactElement>} paragraphs - An array of elements created
     * for each subtitle using the {@link _renderParagraph} method.
     * @protected
     * @returns {ReactElement} - The subtitles container.
     */
    override _renderSubtitlesContainer(paragraphs: Array<ReactElement>): ReactElement {
        const classes = withStyles.getClasses(this.props);

        return (
            <div className = { classes.transcriptionSubtitles } >
                { paragraphs }
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code }'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { clientHeight } = state['features/base/responsive-ui'];

    return {
        ..._abstractMapStateToProps(state),
        _isLifted: shouldDisplayStageParticipantBadge(state),
        _clientHeight: clientHeight,
        _shiftUp: state['features/toolbox'].shiftUp,
        _toolboxVisible: isToolboxVisible(state)
    };
}

export default connect(mapStateToProps)(withStyles(Captions, styles));
