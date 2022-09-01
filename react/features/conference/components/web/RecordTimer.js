import React, { useEffect, useState, useRef } from 'react';
import { getConferenceName } from '../../../base/conference';
import { connect } from 'react-redux';

type Props = {

    /**
     * The conference display name.
     */
    _subject: string
}
const RecordTimer = (props) => {
    const [ timer, setTimer ] = useState(3595);
    const [ isActive, setIsActive ] = useState(false);
    const increment = useRef(null);

    useEffect(() => {
        if (props._toggleRecordTimer) {
            console.log('RecordTimer11',props._toggleRecordTimer)
            if (!isActive) {
                handleStart();
            }
        } else {
            handleReset();
        }
    });
    const handleStart = () => {
        setIsActive(true);
        increment.current = setInterval(() => {
            setTimer((timer) => timer + 1);
        }, 1000);
    };

    const handleReset = () => {
        clearInterval(increment.current);
        setIsActive(false);
        // setIsPaused(false)
        setTimer(0);
    };

    const formatTime = () => {
        const getSeconds = `0${(timer % 60)}`.slice(-2);
        const minutes = `${Math.floor(timer / 60)}`;
        const getMinutes = `0${minutes % 60}`.slice(-2);
        const getHours = `0${Math.floor(timer / 3600)}`.slice(-2);

        return `${getHours} : ${getMinutes} : ${getSeconds}`;
    };

    return (
        <div>
            <p className="subject-text--content" style={{
                background: 'rgba(0,0,0,.6)',
                borderRadius: '3px 3px 3px 3px',
                boxSizing: 'border-box',
                fontSize: '10px',
                lineHeight: '28px',
                padding: '0 16px',
                height: '28px',
                maxWidth: '300px',
                marginLeft: '2px',
                visibility: props._toggleRecordTimer ? 'visible' : 'hidden'
            }}><span style={{
                color: 'red',
                marginRight: '6px',
                lineHeight: '28px'
            }}>REC</span>{formatTime()}</p>
        </div>
    );
};

function _mapStateToProps(state) {

    return {
        _subject: getConferenceName(state)

    };
}

export default connect(_mapStateToProps)(RecordTimer);
