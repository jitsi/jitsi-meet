// @flow

import React from 'react';

import {getLocalParticipant} from '../../base/participants';
import {connect} from '../../base/redux';
import {getLargeVideoParticipant} from '../../large-video/functions';
import {isLayoutTileView} from '../../video-layout';

import {
    _abstractMapStateToProps,
    AbstractCaptions,
    type AbstractCaptionsProps
} from './AbstractCaptions';
import {isMobileBrowser} from '../../base/environment/utils';
import {
    sendTranscriptText,
    showTranscriptData,
    showTranscriptionBite
} from '../actions';
import {translate} from '../../base/i18n';
import type {Dispatch} from 'redux';

export type Props = {

    /**
     * Whether the subtitles container is lifted above the invite box.
     */
    _isLifted: boolean, /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,
    _transcript: $ObjMap,
} & AbstractCaptionsProps;

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */

let textStore = '';
let transcriptJSonData;
let stringData;
let parseData;
let allData = [];

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
            bite: '',
            i: 0
        };
    };

    componentDidMount() {
        setInterval(async () => {
            allData = [];
            const args = `${textStore}`;
            try {
                if (isMobileBrowser()) {
                    if (window.flutter_inappwebview) {
                        this.props.dispatch(sendTranscriptText(args));
                        window.flutter_inappwebview.callHandler('handleTranscriptArgs', args)
                            .then((e) => {
                                transcriptJSonData = JSON.stringify(e);
                                const {transcriptBite} = JSON.parse(transcriptJSonData);
                                console.log('transcriptBite', transcriptBite);
                                for (let i = 0; i < transcriptBite.length; i++) {
                                    allData.push(`${transcriptBite[i]['bite']} ${transcriptBite[i]['count']}`);
                                }
                                this.setState({
                                    data: allData
                                });
                                if (this.state.i < 12) {
                                    console.log('setState');
                                    this.setState({
                                        i: this.state.i + 1,
                                        bite: `${parseData[this.state.i]['bite']}`
                                    });
                                } else {
                                    this.state.bite = '';
                                    this.state.i = 0;
                                }
                            });
                        this.props.dispatch(showTranscriptData(this.state.data));
                        this.props.dispatch(showTranscriptionBite(this.state.bite));
                        textStore = '';
                    } else {
                        console.log('InAppWebViewNotLoaded');
                    }
                } else {
                    this.props.dispatch(sendTranscriptText(textStore));
                    console.log('structuredWebArgs', args);
                    window.opener.postMessage(JSON.stringify({
                        'polytok': args
                    }), 'https://custommeet4.centralus.cloudapp.azure.com/');
                    window.addEventListener('message', (event) => {
                        stringData = JSON.stringify(event.data);
                        parseData = JSON.parse(stringData);
                        console.log('parseData', parseData);
                    });
                    for (let i = 0; i < parseData.length; i++) {
                        allData.push(`${parseData[i]['bite']} ${parseData[i]['count']}`);
                    }

                    this.setState({
                        data: allData
                    });
                    this.props.dispatch(showTranscriptData(this.state.data));

                    if (this.state.i < 12) {
                        console.log('setState');
                        this.setState({
                            i: this.state.i + 1,
                            bite: `${parseData[this.state.i]['bite']}`
                        });
                    } else {
                        this.state.bite = '';
                        this.state.i = 0;
                    }
                    this.props.dispatch(showTranscriptionBite(this.state.bite));
                    textStore = '';
                }
            } catch (e) {
                console.log('got an exception : ', e);
            }
        }, 10000);
    }


    _renderParagraph(id: string, text: string, textWithOutName: string): React$Element<*> {
        textStore = textStore + textWithOutName;
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
