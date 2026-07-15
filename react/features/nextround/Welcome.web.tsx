/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals, react/no-multi-comp */
import { OrganizationSwitcher, UserButton, useAuth, useOrganization } from '@clerk/clerk-react';
import React, { useCallback, useEffect, useState } from 'react';

import { createApi } from './api';

/**
 * Sends the browser into a Jitsi room with a minted token. The token in the URL
 * makes the auth gate bypass Clerk, so this lands directly in the call.
 *
 * @param {string} roomName - The Jitsi room name.
 * @param {string} jwt - The minted moderator JWT.
 * @returns {void}
 */
function goToRoom(roomName: string, jwt: string) {
    window.location.assign(`/${encodeURIComponent(roomName)}?jwt=${encodeURIComponent(jwt)}`);
}

/* eslint-disable react/jsx-sort-props, react/jsx-max-props-per-line */
const CamIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <path d = 'M15 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3.5l4 3.5V7l-4 3.5Z' fill = 'currentColor' />
    </svg>
);
const LinkIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <path d = 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1' stroke = 'currentColor' strokeLinecap = 'round' strokeWidth = '2' />
    </svg>
);
const PlusIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <path d = 'M12 5v14M5 12h14' stroke = 'currentColor' strokeLinecap = 'round' strokeWidth = '2' />
    </svg>
);
const CopyIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <rect height = '13' rx = '2' stroke = 'currentColor' strokeWidth = '2' width = '13' x = '9' y = '9' />
        <path d = 'M5 15V5a2 2 0 0 1 2-2h10' stroke = 'currentColor' strokeWidth = '2' />
    </svg>
);
/* eslint-enable react/jsx-sort-props, react/jsx-max-props-per-line */

/**
 * Google-Meet-style landing for staff: start an instant interview room, get a
 * shareable candidate link, or join a room by code. Signed-in + org is
 * guaranteed by the gate above this component.
 *
 * @returns {ReactElement}
 */
export default function Welcome() {
    const { getToken } = useAuth();
    const { organization } = useOrganization();
    const api = React.useMemo(() => createApi(getToken), [ getToken ]);

    const [ code, setCode ] = useState('');
    const [ busy, setBusy ] = useState(false);
    const [ error, setError ] = useState('');
    const [ menuOpen, setMenuOpen ] = useState(false);
    const [ inviteUrl, setInviteUrl ] = useState<string | null>(null);
    const [ copied, setCopied ] = useState(false);

    // The creator's own moderator token for the room shown in the modal, so they
    // can jump in as interviewer without re-entering the code.
    const [ host, setHost ] = useState<{ jwt: string; roomName: string; } | null>(null);

    const [ now, setNow ] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);

        return () => clearInterval(t);
    }, []);
    const clock = `${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${
        now.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}`;

    const toggleMenu = useCallback(() => setMenuOpen(o => !o), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const closeModal = useCallback(() => {
        setInviteUrl(null);
        setHost(null);
    }, []);

    const onJoinAsHost = useCallback(() => {
        if (host) {
            goToRoom(host.roomName, host.jwt);
        }
    }, [ host ]);

    // "Start interview now": create a room and jump straight into it.
    const onStartNow = useCallback(async () => {
        setMenuOpen(false);
        setBusy(true);
        setError('');
        try {
            const m = await api.instantMeeting();

            goToRoom(m.roomName, m.jwt);
        } catch (e: any) {
            setError(e.message);
            setBusy(false);
        }
    }, [ api ]);

    // "New interview": create a room and show its shareable same-app link.
    // The link is just `<origin>/<code>`; opening it mints a guest token in-app,
    // so the candidate joins on the main application with no separate lobby.
    const onCreateLink = useCallback(async () => {
        setMenuOpen(false);
        setBusy(true);
        setError('');
        setCopied(false);
        try {
            const m = await api.instantMeeting();

            setInviteUrl(`${window.location.origin}/${m.roomName}`);
            setHost({ roomName: m.roomName, jwt: m.jwt });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }, [ api ]);

    const onCopy = useCallback(async () => {
        if (!inviteUrl) {
            return;
        }
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
        } catch (e) {
            // Clipboard can be blocked; the link stays visible to copy manually.
        }
    }, [ inviteUrl ]);

    const onJoin = useCallback(async () => {
        if (!code.trim()) {
            return;
        }
        setBusy(true);
        setError('');
        try {
            const m = await api.joinByCode(code.trim());

            goToRoom(m.roomName, m.jwt);
        } catch (e: any) {
            setError(e.message);
            setBusy(false);
        }
    }, [ api, code ]);

    const onCodeChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value), []);
    const onCodeKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                onJoin();
            }
        }, [ onJoin ]);

    const menuItem = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 20px',
        fontSize: '15px',
        color: '#3c4043',
        background: 'transparent',
        border: 'none',
        width: '100%',
        textAlign: 'left' as const,
        cursor: 'pointer'
    };

    return (
        <div
            style = {{
                minHeight: '100vh',
                background: '#ffffff',
                color: '#202124',
                fontFamily: 'system-ui, "Google Sans", sans-serif',
                display: 'flex',
                flexDirection: 'column'
            }}>
            <header
                style = {{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 28px'
                }}>
                <strong style = {{ fontSize: '20px', letterSpacing: '0.3px', color: '#202124' }}>
                    NextRound
                </strong>
                <div style = {{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style = {{ fontSize: '15px', color: '#5f6368' }}>{ clock }</span>
                    <OrganizationSwitcher hidePersonal = { true } />
                    <UserButton />
                </div>
            </header>

            <main
                style = {{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    textAlign: 'center',
                    padding: '10vh 24px 0',
                    maxWidth: '760px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                <h1
                    style = {{
                        fontSize: '44px',
                        lineHeight: 1.15,
                        fontWeight: 400,
                        color: '#3c4043',
                        margin: '0 0 16px'
                    }}>
                    Видеоинтервью для вашей команды
                </h1>
                <p
                    style = {{
                        fontSize: '18px',
                        color: '#5f6368',
                        margin: '0 0 40px',
                        maxWidth: '520px'
                    }}>
                    { organization?.name
                        ? `${organization.name} · создайте комнату и пригласите кандидата — прямо в браузере.`
                        : 'Создайте комнату и пригласите кандидата — прямо в браузере.' }
                </p>

                <div
                    style = {{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                    <div style = {{ position: 'relative' }}>
                        <button
                            disabled = { busy }
                            onClick = { toggleMenu }
                            style = {{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 22px',
                                background: '#1a73e8',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: busy ? 'default' : 'pointer',
                                opacity: busy ? 0.7 : 1
                            }}
                            type = 'button'>
                            <CamIcon />
                            { busy ? 'Создаём…' : 'Новая встреча' }
                        </button>

                        { menuOpen && (
                            <>
                                <div
                                    onClick = { closeMenu }
                                    style = {{
                                        position: 'fixed',
                                        inset: 0,
                                        zIndex: 10
                                    }} />
                                <div
                                    style = {{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: 0,
                                        minWidth: '320px',
                                        background: '#fff',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                                        padding: '8px 0',
                                        zIndex: 11
                                    }}>
                                    <button
                                        onClick = { onCreateLink }
                                        style = { menuItem }
                                        type = 'button'>
                                        <LinkIcon />
                                        Новое интервью
                                    </button>
                                    <button
                                        onClick = { onStartNow }
                                        style = { menuItem }
                                        type = 'button'>
                                        <PlusIcon />
                                        Начать интервью сейчас
                                    </button>
                                </div>
                            </>
                        ) }
                    </div>

                    <div style = {{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            disabled = { busy }
                            onChange = { onCodeChange }
                            onKeyDown = { onCodeKeyDown }
                            placeholder = 'Введите код встречи'
                            style = {{
                                padding: '12px 14px',
                                width: '220px',
                                background: '#ffffff',
                                color: '#202124',
                                border: '1px solid #dadce0',
                                borderRadius: '10px',
                                fontSize: '15px'
                            }}
                            value = { code } />
                        <button
                            disabled = { busy || !code.trim() }
                            onClick = { onJoin }
                            style = {{
                                padding: '12px 16px',
                                background: 'transparent',
                                color: code.trim() ? '#1a73e8' : '#bdc1c6',
                                border: 'none',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: code.trim() && !busy ? 'pointer' : 'default'
                            }}
                            type = 'button'>
                            Присоединиться
                        </button>
                    </div>
                </div>

                { error && (
                    <div
                        style = {{
                            marginTop: '24px',
                            background: '#fce8e6',
                            border: '1px solid #f3b9b3',
                            color: '#c5221f',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                        { error }
                    </div>
                ) }
            </main>

            { inviteUrl && (
                <div
                    style = {{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(32,33,36,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20
                    }}>
                    <div
                        style = {{
                            width: '440px',
                            maxWidth: '92vw',
                            background: '#e8f0fe',
                            borderRadius: '16px',
                            padding: '28px'
                        }}>
                        <div
                            style = {{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start'
                            }}>
                            <h2
                                style = {{
                                    fontSize: '22px',
                                    fontWeight: 400,
                                    color: '#202124',
                                    margin: 0
                                }}>
                                Данные для подключения к встрече
                            </h2>
                            <button
                                onClick = { closeModal }
                                style = {{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '22px',
                                    color: '#5f6368',
                                    cursor: 'pointer',
                                    lineHeight: 1
                                }}
                                type = 'button'>
                                ✕
                            </button>
                        </div>
                        <p style = {{ color: '#5f6368', fontSize: '15px', margin: '12px 0 20px' }}>
                            Отправьте эту ссылку кандидату. Сохраните её, если планируете
                            интервью позже.
                        </p>
                        <div
                            style = {{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#dbe4f3',
                                borderRadius: '10px',
                                padding: '12px 16px'
                            }}>
                            <span
                                style = {{
                                    flex: 1,
                                    fontSize: '15px',
                                    color: '#202124',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                { inviteUrl }
                            </span>
                            <button
                                onClick = { onCopy }
                                style = {{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#1a73e8',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                                title = 'Скопировать'
                                type = 'button'>
                                <CopyIcon />
                            </button>
                        </div>
                        { copied && (
                            <p style = {{ color: '#1e8e3e', fontSize: '13px', margin: '10px 0 0' }}>
                                Ссылка скопирована
                            </p>
                        ) }
                        <button
                            onClick = { onJoinAsHost }
                            style = {{
                                marginTop: '20px',
                                width: '100%',
                                padding: '12px 16px',
                                background: '#1a73e8',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                            type = 'button'>
                            Войти как интервьюер
                        </button>
                    </div>
                </div>
            ) }
        </div>
    );
}
