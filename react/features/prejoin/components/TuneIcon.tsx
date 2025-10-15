import React from 'react';

const styles = {
    icon: {
        margin: '0 4px',
        verticalAlign: 'middle',
    },
};

const TuneIcon = () => (
    <svg
        fill = '#ffffff'
        height = '24px'
        style = { styles.icon }
        viewBox = '0 0 24 24'
        width = '24px'
        xmlns = 'http://www.w3.org/2000/svg'>
        <path
            d = 'M0 0h24v24H0z'
            fill = 'none' />
        <path d = 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z' />
    </svg>
);

export default TuneIcon;
