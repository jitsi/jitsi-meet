import TokDetailsButoon from './TokDetailsButoon';
import './TokDetails.css';
import React, { useEffect, useRef, useState } from 'react';
import { BottomSheet } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';
import Collapsible from 'react-collapsible';
import { IconLink, IconSlowMotion, IconUpDownArrow } from '../../../base/icons';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { isMobileBrowser } from '../../../base/environment/utils';

export type Props = {
    /**
     * Display  translated strings..
     */
    _sendTranscriptMessage: Array<string>,
    /**
     * Display  translated count..
     */
    _sendTranscriptCount: Array<string>
}
const Tok = (props: Props) => {
    const [ open, setOpen ] = useState(false);
    const focusOPenRef = useRef();

    const tokBytesTrigger = () => {
        return (
            <div className="BottomCollapse">
                <div className="collapseTitle"><p className="collapseP">Tok
                    Bytes</p>
                    <div className="collapseIcon"><IconUpDownArrow/></div>
                </div>
            </div>
        );
    };
    const tokShopTrigger = () => {
        return (
            <div className="BottomCollapse">
                <div className="collapseTitle"><p className="collapseP">Tok
                    Shop</p>
                    <div className="collapseIcon"><IconUpDownArrow/></div>
                </div>
            </div>
        );
    };

    function tokMarkTrigger() {
        return (
            <div className="BottomCollapse">
                <div className="collapseTitle"><p className="collapseP">Tok
                    Marks</p>
                    <div className="collapseIcon"><IconUpDownArrow/></div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        // Setting focus is to aid keyboard and screen reader nav when activating this iframe
        focusOPenRef.current.focus();
    }, []);


    return (
        <>
            <a onClick={() => setOpen(true)}
               ref={focusOPenRef}>
                <TokDetailsButoon/>
            </a>
            <BottomSheet
                open={open}
                header={
                    <button className="headerButton"
                            onClick={() => setOpen(false)}>
                        Close
                    </button>
                }
                snapPoints={({ maxHeight }) => [ maxHeight / 2, maxHeight * 0.6 ]}
            >
                <div style={{
                    padding: '4px 16px 4px 16px'
                }}>
                    <Collapsible trigger={tokBytesTrigger()}>
                        <div className="collapseHeader">
                            <div className="transcriptHead">
                                {
                                    props._sendTranscriptMessage.length && props._sendTranscriptMessage.map((value, index) => (
                                        <div className="transcriptBody">
                                            <p>{value.split(' ')[0]}</p>
                                            <p>{value.split(' ')[1]}</p>
                                        </div>))}
                            </div>
                        </div>
                    </Collapsible>
                    <div style={{ marginTop: '10px' }}></div>
                    <Collapsible trigger={tokShopTrigger()} open={true}>
                        <div className="collapseHeader">
                            <div className="transcriptHead" onClick={() => {
                                if (isMobileBrowser()) {
                                    if (window.flutter_inappwebview) {
                                        console.log('beforeTokUrl');
                                        const args = 'http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/98';
                                        console.log('afterTokUrl', args);
                                        window.flutter_inappwebview.callHandler('handleTokUrls', args);
                                        console.log('TokUrl', args);
                                    } else {
                                        console.log('InAppWebViewNotLoaded');
                                    }
                                } else {
                                    window.open('http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/98');
                                }

                            }}>
                                <div className="iconUrl">
                                    <IconLink width={'20px'} height={'20px'}/>
                                    <p>Product</p>
                                </div>
                                <div className="iconUrl">
                                    <IconLink width={'20px'} height={'20px'}/>
                                    <p>Product1</p>
                                </div>
                            </div>
                        </div>
                    </Collapsible>
                    <div style={{ marginTop: '10px' }}></div>
                    <Collapsible trigger={tokMarkTrigger()} open={true}>
                        <div className="collapseHeader">
                            <div className="transcriptHead">
                                <div className="transcriptMarks">
                                    <div className="tokMarkDiv">
                                        <IconSlowMotion width={'20px'}
                                                        height={'20px'}/>
                                        <p className="tokMarkP">Tok
                                            TimeStamp1</p>
                                    </div>
                                    <div>
                                        <p>00:05:10</p>
                                    </div>
                                </div>
                                <div className="transcriptMarks">
                                    <div className="tokMarkDiv">
                                        <IconSlowMotion width={'20px'}
                                                        height={'20px'}/>
                                        <p className="tokMarkP">Tok
                                            TimeStamp2</p>
                                    </div>
                                    <div>
                                        <p>00:06:20</p>
                                    </div>
                                </div>
                                <div className="transcriptMarks">
                                    <div className="tokMarkDiv">
                                        <IconSlowMotion width={'20px'}
                                                        height={'20px'}/>
                                        <p className="tokMarkP">Tok
                                            TimeStamp3</p>
                                    </div>
                                    <div>
                                        <p>00:03:30</p>
                                    </div>
                                </div>
                                <div className="transcriptMarks">
                                    <div className="tokMarkDiv">
                                        <IconSlowMotion width={'20px'}
                                                        height={'20px'}/>
                                        <p className="tokMarkP">Tok
                                            TimeStamp4</p>
                                    </div>
                                    <div>
                                        <p>00:04:50</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Collapsible>
                </div>
            </BottomSheet>
        </>
    )
        ;
};

function _mapStateToProps(state) {
    const { _sendTranscriptMessage } = state['features/subtitles'];
    const { _sendTranscriptCount } = state['features/subtitles'];
    return {
        _sendTranscriptMessage: _sendTranscriptMessage,
        _sendTranscriptCount: _sendTranscriptCount
    };
}

export default translate(connect(_mapStateToProps)(Tok));



