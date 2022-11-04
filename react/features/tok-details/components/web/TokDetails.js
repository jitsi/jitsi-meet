import TokDetailsButoon from './TokDetailsButoon';
import './TokDetails.css';
import React, {useEffect, useRef, useState} from 'react';
import {BottomSheet} from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';
import Collapsible from 'react-collapsible';
import {IconLink, IconSlowMotion, IconUpDownArrow} from '../../../base/icons';
import {translate} from '../../../base/i18n';
import {connect} from '../../../base/redux';
import {isMobileBrowser} from '../../../base/environment/utils';

export type Props = {
    /**
     * Display  translated strings..
     */
    _sendTranscriptMessage: Array<string>,
    /**
     * Display  translated count..
     */
    _sendTranscriptCount: Array<string>,
    /**
     * The participant's current display name which should be shown.
     */
    _nameToDisplay: string,
}
const Tok = (props: Props) => {
    const [open, setOpen] = useState(false);
    const focusOPenRef = useRef();
    const tokList = [
        {
            "product": "Ear Buds",
            "duration": "10:40",
            "children": [
                {
                    "subProduct": "Skullcandy",
                    "count": "10",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/103"
                },
                {
                    "subProduct": "Boat EarBuds",
                    "count": "12",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/110"
                }]
        },
        {
            "product": "Watches",
            "duration": "05:29",
            "children": [
                {
                    "subProduct": "Rollex",
                    "count": "4",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/112"
                },
                {
                    "subProduct": "Rollexs",
                    "count": "5",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/117"
                }]
        },
        {
            "product": "Mobiles",
            "duration": "06:30",
            "children": [
                {
                    "subProduct": "Apple iphone 12",
                    "count": "12",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/106"
                },
                {
                    "subProduct": "Nord ce 2",
                    "count": "15",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/102"
                }]
        },
        {
            "product": "Laptops",
            "duration": "08:10",
            "children": [
                {
                    "subProduct": "New Dell Inspiron 15 3505",
                    "count": "8",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/126"
                },
                {
                    "subProduct": "Dell Latitude 7490",
                    "count": "6",
                    "url": "http://custommeet3.centralus.cloudapp.azure.com/#/ProductDetailsPage/127"
                }]
        }
    ]
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

    function trigger(product, duration) {
        return (
            <div className='collapseHeader'>
                <div className='transcriptHead'>
                    <div className="iconUrl">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            width: '30%'
                        }}>
                            <IconSlowMotion
                                width={'20px'}
                                height={'20px'}/>
                            <p className='tokMarkP'>{product}</p>
                        </div>
                        <p style={{width:'30%'}}>Show Products</p>
                        <p>{duration}</p>
                    </div>
                </div>
            </div>
        )
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
                snapPoints={({maxHeight}) => [maxHeight / 2, maxHeight * 0.6]}
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
                    <div style={{marginTop: '10px'}}></div>
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
                    <div style={{marginTop: '10px'}}></div>
                    <Collapsible trigger={tokMarkTrigger()} open={true}>
                        <div className="collapseHeader">
                            {tokList.map((value, index) => {
                                return (
                                    <Collapsible
                                        trigger={trigger(value.product, value.duration)}>  {
                                        value.children.map((childrenValue, index) => {
                                            return (
                                                <div className='transcriptHead'  onClick={() => {
                                                    if (isMobileBrowser()) {
                                                        if (window.flutter_inappwebview) {
                                                            console.log('beforeTokUrl');
                                                            const args = `${childrenValue.url}`;
                                                            console.log('afterTokUrl', args);
                                                            window.flutter_inappwebview.callHandler('handleTokMarkUrls', args);
                                                            console.log('TokUrl', args);
                                                        } else {
                                                            console.log('InAppWebViewNotLoaded');
                                                        }
                                                    } else {
                                                        window.open(childrenValue.url);
                                                    }
                                                }}>
                                                    <div
                                                        className="transcriptMarks">
                                                        <div
                                                            className="tokMarkDiv">
                                                            <p className="tokMarkSubProduct">
                                                                {childrenValue.subProduct}</p>
                                                        </div>
                                                            <p>count : {childrenValue.count}</p>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                    </Collapsible>
                                )
                            })}
                        </div>
                    </Collapsible>
                </div>
            </BottomSheet>
        </>
    )
        ;
};

function _mapStateToProps(state) {
    const {_sendTranscriptMessage} = state['features/subtitles'];
    const {_sendTranscriptCount} = state['features/subtitles'];
    return {
        _sendTranscriptMessage: _sendTranscriptMessage,
        _sendTranscriptCount: _sendTranscriptCount
    };
}

export default translate(connect(_mapStateToProps)(Tok));



