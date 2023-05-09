import React from 'react';
import ReactDOM from 'react-dom';

import AlwaysOnTop from './AlwaysOnTop';

// Render the main/root Component.
ReactDOM.render(<AlwaysOnTop />, document.getElementById('react'));

window.addEventListener(
    'beforeunload',
    () => ReactDOM.unmountComponentAtNode(document.getElementById('react') ?? document.body));
