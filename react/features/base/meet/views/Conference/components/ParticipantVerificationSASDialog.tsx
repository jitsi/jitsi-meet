import React from 'react';

const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    fontSize: '20px',
    position: 'absolute',
    bottom: '17px',
    right: '17px',
};

const ParticipantVerificationSASDialog = ({
    sas
}: { sas: string[][]; }) => {

    const emojis = sas;

    return (<div style = { containerStyle }>
        { emojis.slice(0, 7).map((emoji, index) =>
            <span key = { index }>{emoji[0]}</span>
        )}
    </div>
    );
};

export default ParticipantVerificationSASDialog;
