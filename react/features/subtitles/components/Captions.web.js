// @flow

import React from 'react';

import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import { getLargeVideoParticipant } from '../../large-video/functions';
import { isLayoutTileView } from '../../video-layout';

import {
    _abstractMapStateToProps,
    AbstractCaptions,
    type AbstractCaptionsProps
} from './AbstractCaptions';
import { isMobileBrowser } from '../../base/environment/utils';
import { showTranscriptData } from '../actions';
import { translate } from '../../base/i18n';
import type { Dispatch } from 'redux';

export type Props = {

    /**
     * Whether the subtitles container is lifted above the invite box.
     */
    _isLifted: boolean, /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>, _transcript: $ObjMap
} & AbstractCaptionsProps;

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */

let textStore = '';
let transcriptJSonData;
let stringData;
let parseData;

class Captions extends AbstractCaptions<Props> {

    /**
     * Renders the transcription text.
     *
     * {@code text} has been created.
     * name.
     * @protected
     * @returns {React$Element} - The React element which displays the text.
     * @param props
     */

    constructor(props) {
        super(props);
        this.state = {
            data: '',
            i: 0
        };
    };

    componentDidMount() {
        setInterval(async () => {
            const args = `${textStore}`;
            try {
                if (isMobileBrowser()) {
                    if (window.flutter_inappwebview) {
                        let structuredArgs = args.replaceAll('Fellow Jitser:', '');
                        window.flutter_inappwebview.callHandler('handleTranscriptArgs', structuredArgs)
                            .then((e) => {
                                transcriptJSonData = JSON.stringify(e);
                                const { transcriptBite } = JSON.parse(transcriptJSonData);
                                if (this.state.i < 6) {
                                    this.setState({
                                        i: this.state.i + 1,
                                        data: `${transcriptBite[this.state.i]['bite']} ${transcriptBite[this.state.i]['count']}`
                                    });
                                } else {
                                    this.state.data = '';
                                    this.state.i = 0;
                                }
                            });
                        this.props.dispatch(showTranscriptData(this.state.data));
                        textStore = '';
                    } else {
                        console.log('InAppWebViewNotLoaded');
                    }
                } else {
                    window.opener.postMessage(JSON.stringify({
                        'polytok': args
                    }), 'https://custommeet4.centralus.cloudapp.azure.com/');
                    window.addEventListener('message', (event) => {
                        stringData = JSON.stringify(event.data);
                        parseData = JSON.parse(stringData);
                    });
                    if (this.state.i < 6) {
                        this.setState({
                            i: this.state.i + 1,
                            data: `${parseData[this.state.i]['bite']} ${parseData[this.state.i]['count']}`
                        });
                    } else {
                        this.state.data = '';
                        this.state.i = 0;
                    }
                    console.log(`dataaaaa  ${this.state.data}`);
                    this.props.dispatch(showTranscriptData(this.state.data));
                    textStore = '';
                }
            } catch (e) {
                console.log('got an exception : ', e);
            }
        }, 10000);
    }


    _renderParagraph(id: string, text: string): React$Element<*> {
        textStore = textStore + text;
        return (<p key={id}>
            <span>{text}</span>
        </p>);
    }

    /**
     * Renders the subtitles container.
     *
     * @param {Array<React$Element>} paragraphs - An array of elements created
     * for each subtitle using the {@link _renderParagraph} method.
     * @protected
     * @returns {React$Element} - The subtitles container.
     */
    _renderSubtitlesContainer(paragraphs: Array<React$Element<*>>): React$Element<*> {
        const className = this.props._isLifted ? 'transcription-subtitles lifted' : 'transcription-subtitles';
        return (<div className={className}>
            {paragraphs}
        </div>);
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
function mapStateToProps(state) {
    const isTileView = isLayoutTileView(state);
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const localParticipant = getLocalParticipant(state);

    return {
        ..._abstractMapStateToProps(state),
        _isLifted: largeVideoParticipant && largeVideoParticipant?.id !== localParticipant?.id && !isTileView
    };
}

export default translate(connect(mapStateToProps)(Captions));
