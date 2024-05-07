import React, { useState } from 'react';
import { ValidationService } from '../../authentication/internxt/validation.service';
import { AuthService } from '../../authentication/internxt/auth.service';

const Login = (props: { _updateInxtToken: (token: string) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const onButtonClick = async () => {
        // Set initial error values to empty
        setEmailError('');
        setPasswordError('');

        // Check if the user has entered both fields correctly
        if (email.trim().length <= 0) {
            setEmailError('Please enter your email');
            return;
        }

        if (!ValidationService.instance.validateEmail(email)) {
            setEmailError('Please enter a valid email');
            return;
        }

        if (password.trim().length <= 0) {
            setPasswordError('Please enter a password');
            return;
        }

        const is2FANeeded = await AuthService.instance.is2FANeeded(email);
        let twoFactorCode: string | undefined;
        if (is2FANeeded) {
            twoFactorCode = '';
        }

        const loginCredentials = await AuthService.instance.doLogin(email, password, twoFactorCode);

        localStorage.setItem('xToken', loginCredentials.token);
        localStorage.setItem('xMnemonic', loginCredentials.mnemonic);
        localStorage.setItem('xNewToken', loginCredentials.newToken);
        localStorage.setItem('xUser', JSON.stringify(loginCredentials.user));
        props._updateInxtToken(loginCredentials.newToken);
    };

    return (
        <div className='mainContainer'>
            <div style={{ display: 'flex', paddingLeft: '5rem', paddingTop: '2.5rem', paddingBottom: '2.5rem', justifyContent: 'flex-start', flexDirection: 'row', flexShrink: 0 }}>
                <svg width="78" height="8" viewBox="0 0 78 8" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 'auto', width: '7rem', color: 'rgb(24 24 27)' }}>
                    <path d="M1.66857 8H0V0H1.66857V8Z" fill="currentColor"></path>
                    <path d="M12.3242 5.50857V0H13.9813V8H12.2785L8.25562 2.48V8H6.58705V0H8.28991L12.3242 5.50857Z" fill="currentColor"></path>
                    <path d="M18.2824 0H24.0081V1.47429H21.9738V8H20.3167V1.47429H18.2824V0Z" fill="currentColor"></path>
                    <path d="M33.2134 0V1.47429H29.9677V3.18857H32.7677V4.66286H29.9677V6.52571H33.2134V8H28.2991V0H33.2134Z" fill="currentColor"></path>
                    <path d="M44.3458 8H42.3229L40.0829 4.70857H39.5458V8H37.8772V0H41.1001C41.9229 0 42.5515 0.220952 42.9858 0.662857C43.4277 1.10476 43.6487 1.68381 43.6487 2.4C43.6487 3.56571 43.0696 4.2781 41.9115 4.53714L44.3458 8ZM39.5458 3.34857H40.8601C41.2258 3.34857 41.5039 3.27619 41.6944 3.13143C41.8925 2.97905 41.9915 2.73524 41.9915 2.4C41.9915 2.07238 41.8925 1.83619 41.6944 1.69143C41.5039 1.54667 41.2258 1.47429 40.8601 1.47429H39.5458V3.34857Z" fill="currentColor"></path>
                    <path d="M54.3979 5.50857V0H56.055V8H54.3521L50.3293 2.48V8H48.6607V0H50.3636L54.3979 5.50857Z" fill="currentColor"></path>
                    <path d="M64.8818 3.87429L67.6475 8H65.7275L63.9789 5.25714L62.2418 8H60.3332L63.0875 3.88571L60.4818 0H62.3789L63.9789 2.50286L65.5904 0H67.4989L64.8818 3.87429Z" fill="currentColor"></path>
                    <path d="M71.307 0H77.0327V1.47429H74.9984V8H73.3412V1.47429H71.307V0Z" fill="currentColor"></path>
                </svg>
            </div>
            <div className='formContainer'>
                <div className='titleContainer'>
                    <div style={{ color: 'black' }}>Log in</div>
                </div>
                <br />
                <div className='inputContainer'>
                    <input
                        value={email}
                        placeholder="Email"
                        onChange={(ev) => setEmail(ev.target.value)}
                        className='inputBox'
                    />
                    <label className='errorLabel'>{emailError}</label>
                </div>
                <br />
                <div className='inputContainer'>
                    <input
                        type="password"
                        value={password}
                        placeholder="Password"
                        onChange={(ev) => setPassword(ev.target.value)}
                        className='inputBox'
                    />
                    <label className='errorLabel'>{passwordError}</label>
                </div>
                <br />
                <div className='inputContainer'>
                    <input className='inputButton' type="button" onClick={onButtonClick} value={'Log in'} />
                </div>
            </div>
        </div>
    )
};

export default Login;
