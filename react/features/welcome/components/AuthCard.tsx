import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import type { IReduxState } from '../../app/types';
import type { IJwtState } from '../../base/jwt/reducer';
import type { IConfig } from '../../base/config/configType';

interface IProps {
    jwtFromRedux?: IJwtState;
    tokenAuthURL: IConfig['tokenAuthUrl'];
    tokenLogoutURL: IConfig['tokenLogoutUrl'];
}

function base64UrlDecode(base64Url: string): string {
    const padded = base64Url + '==='.slice((base64Url.length + 3) % 4);

    return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

function parseJwtPayload(token: string) {
    try {
        const [ , payloadB64 ] = token.split('.');

        return JSON.parse(base64UrlDecode(payloadB64));
    } catch {
        return null;
    }
}

const AuthCard: React.FC<IProps> = ({ jwtFromRedux, tokenAuthURL, tokenLogoutURL }) => {
    const [ isExpired, setIsExpired ] = useState(false);

    const userData = useMemo(() => {
        const token = jwtFromRedux?.jwt;
        const payload = token ? parseJwtPayload(token) : null;
        const contextUser = payload?.context?.user;

        if (!token || !contextUser) return null;

        return {
            user: {
                name: contextUser?.name || '',
                email: contextUser?.email || '',
                subscriptionStatus: contextUser.subscription_status || 'pending'
            }
        };
    }, [ jwtFromRedux ]);

    useEffect(() => {
        const token = jwtFromRedux?.jwt;

        if (!token) return;

        const payload = parseJwtPayload(token);
        const exp = payload?.exp;

        if (!exp) return;

        const currentTime = Math.floor(Date.now() / 1000);
        const msUntilExpiry = (exp - currentTime) * 1000;

        if (msUntilExpiry <= 0) {
            setIsExpired(true);

            return;
        }

        const timeout = setTimeout(() => {
            setIsExpired(true);
        }, msUntilExpiry);

        return () => clearTimeout(timeout);
    }, [ jwtFromRedux ]);


    const handleLogin = useCallback(() => {
        let loginUrl = tokenAuthURL;

        if (loginUrl) {
            loginUrl = loginUrl
                .replace('{room}', '&no_room=true')
                .replace('{code_challenge}', 'dummy')
                .replace('{state}', '{}');
            window.location.href = loginUrl;
        }
    }, [ tokenAuthURL ]);

    const handleLogout = useCallback(() => {
        const logoutUrl = tokenLogoutURL;

        if (logoutUrl) {
            window.location.href = logoutUrl;
        }
    }, [ tokenLogoutURL ]);

    return (
        <div className = 'welcome-card-text auth-card'>
            <div id = 'jitsi-auth-container'>
                {userData?.user ? (
                    <div className = 'auth-user-info'>
                        <div className = 'auth-header-row'>
                            <h3 className = 'auth-title'>Account</h3>
                            <div className = 'auth-header-buttons'>
                                {/* <button
                                    className = 'welcome-page-button auth-button'
                                    onClick = { handleLogin }
                                    title = 'Refresh Session'>
                                    <svg
                                        fill = 'none'
                                        height = '20'
                                        stroke = 'currentColor'
                                        strokeLinecap = 'round'
                                        strokeLinejoin = 'round'
                                        strokeWidth = '2'
                                        viewBox = '0 0 24 24'
                                        width = '20'
                                        xmlns = 'http://www.w3.org/2000/svg'>
                                        <path d = 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' />
                                        <path d = 'M21 3v5h-5' />
                                        <path d = 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' />
                                        <path d = 'M8 16H3v5' />
                                    </svg>
                                </button> */}
                                <button
                                    className = 'welcome-page-button auth-button auth-logout'
                                    onClick = { handleLogout }>
                                    Logout
                                </button>
                            </div>
                        </div>

                        {[ 'Name', 'Email', 'Subscription Status' ].map((label, i) => {
                            const key = [ 'name', 'email', 'subscriptionStatus' ][i] as keyof typeof userData.user;
                            const value = userData.user?.[key] || 'Not available';
                            const displayValue = key === 'subscriptionStatus' && value === 'active' ? ' Active' : value;

                            return (
                                <div
                                    className = 'auth-user-detail'
                                    key = { label }>
                                    <span className = 'auth-label'>{label}:</span>
                                    <span className = 'auth-value'>{displayValue}</span>
                                </div>
                            );
                        })}

                        <div className = 'auth-buttons'>
                            <div className = 'auth-button-row'>
                                <a
                                    className = { 'welcome-page-button auth-button' }
                                    href = 'https://auth.sonacove.com/realms/jitsi/account'
                                    rel = 'noopener noreferrer'
                                    target = '_blank'>
                                    Manage Account
                                </a>

                                <a
                                    className = 'welcome-page-button auth-button'
                                    href = {
                                        userData.user.subscriptionStatus === 'active'
                                            ? 'https://customer-portal.paddle.com/cpl_01jmwrfanv7gtn3y160bcw8c7w'
                                            : 'https://sonacove.com/onboarding/'
                                    }
                                    rel = 'noopener noreferrer'
                                    target = '_blank'>
                                    Manage Subscription
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className = 'auth-login-container'>
                        <h3 className = 'auth-title'>Login</h3>
                        <p className = 'auth-description'>Sign in to access your account and meetings</p>

                        <button
                            className = 'welcome-page-button auth-button'
                            onClick = { handleLogin }>
                            Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const mapStateToProps = (state: IReduxState) => ({
    jwtFromRedux: state['features/base/jwt'],
    tokenAuthURL: state['features/base/config'].tokenAuthUrl,
    tokenLogoutURL: state['features/base/config'].tokenLogoutUrl
});

export default connect(mapStateToProps)(AuthCard);
