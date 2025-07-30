import React from 'react';
import ReactDOM from 'react-dom';

import AlwaysOnTop from './AlwaysOnTop';

// Render the main/root Component.
/* eslint-disable-next-line react/no-deprecated */
ReactDOM.render(<AlwaysOnTop />, document.getElementById('react'));

window.addEventListener(
    'beforeunload',
    /* eslint-disable-next-line react/no-deprecated */
    () => ReactDOM.unmountComponentAtNode(document.getElementById('react') ?? document.body));
