/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals, react/no-multi-comp */
import { OrganizationSwitcher, UserButton, useAuth, useOrganization } from '@clerk/clerk-react';
// Material Design 3 web components (the design system Google Meet is built on).
// Side-effect imports register the custom elements; React 19 renders them natively.
import '@material/web/button/filled-button.js';
import '@material/web/button/text-button.js';
import '@material/web/dialog/dialog.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/list/list-item.js';
import '@material/web/list/list.js';
import '@material/web/menu/menu-item.js';
import '@material/web/menu/menu.js';
import '@material/web/textfield/outlined-text-field.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { createApi } from './api';

/**
 * MD3 colour tokens, tuned to Google Meet's blue instead of Material's default
 * baseline purple. Applied on the page root so every md-* child inherits them.
 */
const MD_THEME = {
    '--md-sys-color-primary': '#1a73e8',
    '--md-sys-color-on-primary': '#ffffff',
    '--md-sys-color-outline': '#dadce0',
    '--md-sys-color-on-surface': '#202124',
    '--md-sys-color-on-surface-variant': '#5f6368',

    // Meet's controls are pills (fully rounded), 48px tall, 14px/500 labels.
    '--md-filled-button-container-shape': '24px',
    '--md-filled-button-container-height': '48px',
    '--md-filled-button-label-text-size': '14px',
    '--md-filled-button-label-text-weight': '500',
    '--md-filled-button-leading-space': '24px',
    '--md-filled-button-trailing-space': '24px',
    '--md-text-button-label-text-size': '14px',
    '--md-text-button-label-text-weight': '500',
    '--md-outlined-text-field-container-shape': '24px',
    '--md-outlined-text-field-top-space': '14px',
    '--md-outlined-text-field-bottom-space': '14px'
} as React.CSSProperties;

// Meet uses Google Sans, falling back to Roboto (which Jitsi already loads).
const FONT_STACK = '"Google Sans", Roboto, Arial, sans-serif';

/**
 * Sends the browser into a Jitsi room with a minted token. The token in the URL
 * makes the auth gate bypass Clerk, so this lands directly in the call.
 *
 * @param {string} roomName - The Jitsi room name.
 * @param {string} jwt - The minted moderator JWT.
 * @returns {void}
 */
function goToRoom(roomName: string, jwt: string) {
    // Jitsi consumes the `?jwt=` and clears it from the URL, and does not persist
    // it — so a refresh would have no token and the auth gate would re-enter the
    // user as a guest. Stash the staff token so the gate can re-apply it on
    // reload and keep the original (moderator) role. See AuthGate.web.tsx.
    try {
        window.sessionStorage.setItem('nr_room_jwt', jwt);
        window.sessionStorage.setItem('nr_room_name', roomName);
    } catch (e) {
        // Storage may be unavailable; the initial join still works via the URL.
    }
    window.location.assign(`/${encodeURIComponent(roomName)}?jwt=${encodeURIComponent(jwt)}`);
}

/**
 * Accepts either a bare meeting code (`abc-defg-hij`) or a full link pasted from
 * the invite modal (`http://host/abc-defg-hij?…`) and returns just the code.
 *
 * @param {string} input - What the user typed or pasted.
 * @returns {string} The meeting code.
 */
function normalizeMeetingCode(input: string): string {
    const cleaned = input.trim().replace(/[?#].*$/, '').replace(/\/+$/, '');

    return (cleaned.split('/').pop() || '').trim();
}

/* eslint-disable react/jsx-sort-props, react/jsx-max-props-per-line */
const CamIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <path d = 'M15 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3.5l4 3.5V7l-4 3.5Z' fill = 'currentColor' />
    </svg>
);
const KeyboardIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <rect height = '12' rx = '2' stroke = 'currentColor' strokeWidth = '2' width = '20' x = '2' y = '6' />
        <path d = 'M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8' stroke = 'currentColor' strokeLinecap = 'round' strokeWidth = '2' />
    </svg>
);
const CalendarIcon = () => (
    <svg fill = 'none' height = '20' viewBox = '0 0 24 24' width = '20'>
        <rect height = '15' rx = '2' stroke = 'currentColor' strokeWidth = '2' width = '16' x = '4' y = '5' />
        <path d = 'M4 9h16M8 3v4M16 3v4' stroke = 'currentColor' strokeLinecap = 'round' strokeWidth = '2' />
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
const SlideLinkIcon = () => (
    <svg fill = 'none' height = '56' viewBox = '0 0 24 24' width = '56'>
        <path d = 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1' stroke = '#1a73e8' strokeLinecap = 'round' strokeWidth = '2' />
    </svg>
);
const SlideLobbyIcon = () => (
    <svg fill = 'none' height = '56' viewBox = '0 0 24 24' width = '56'>
        <circle cx = '12' cy = '12' r = '9' stroke = '#1a73e8' strokeWidth = '2' />
        <path d = 'M12 7v5l3 2' stroke = '#1a73e8' strokeLinecap = 'round' strokeWidth = '2' />
    </svg>
);
const SlidePlayIcon = () => (
    <svg fill = 'none' height = '56' viewBox = '0 0 24 24' width = '56'>
        <circle cx = '12' cy = '12' r = '9' stroke = '#1a73e8' strokeWidth = '2' />
        <path d = 'M10 9l5 3-5 3V9Z' fill = '#1a73e8' />
    </svg>
);
/* eslint-enable react/jsx-sort-props, react/jsx-max-props-per-line */

const SLIDES = [
    {
        title: 'Ссылка для приглашения',
        text: 'Нажмите «Новое интервью», чтобы получить ссылку и отправить её кандидату.'
    },
    {
        title: 'Комната ожидания',
        text: 'Кандидат ждёт в лобби, пока вы не впустите его в интервью.'
    },
    {
        title: 'Начните сразу',
        text: 'Нажмите «Начать интервью сейчас» — и вы уже в комнате как интервьюер.'
    }
];

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
    const [ nav, setNav ] = useState<'calls' | 'meetings'>('meetings');
    const [ slide, setSlide ] = useState(0);

    const menuRef = useRef<HTMLElement>(null);
    const dialogRef = useRef<HTMLElement>(null);

    const [ now, setNow ] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);

        return () => clearInterval(t);
    }, []);

    // Auto-advance the feature carousel, like the Google Meet landing.
    useEffect(() => {
        const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 6000);

        return () => clearInterval(t);
    }, []);

    const onPrevSlide = useCallback(() => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length), []);
    const onNextSlide = useCallback(() => setSlide(s => (s + 1) % SLIDES.length), []);
    const clock = `${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · ${
        now.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}`;

    const toggleMenu = useCallback(() => setMenuOpen(o => !o), []);
    const closeModal = useCallback(() => {
        setInviteUrl(null);
        setHost(null);
    }, []);

    // React maps only known DOM events, so md-menu / md-dialog "closed" events
    // (outside click, Esc) need native listeners to stay in sync with state.
    useEffect(() => {
        const el = menuRef.current;

        if (!el) {
            return;
        }
        const onClosed = () => setMenuOpen(false);

        el.addEventListener('closed', onClosed);

        return () => el.removeEventListener('closed', onClosed);
    }, []);

    useEffect(() => {
        const el = dialogRef.current;

        if (!el) {
            return;
        }
        const onClosed = () => closeModal();

        el.addEventListener('closed', onClosed);

        return () => el.removeEventListener('closed', onClosed);
    }, [ closeModal ]);

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
        const meetingCode = normalizeMeetingCode(code);

        if (!meetingCode) {
            return;
        }
        setBusy(true);
        setError('');
        try {
            const m = await api.joinByCode(meetingCode);

            goToRoom(m.roomName, m.jwt);
        } catch (e: any) {
            setError(e.message);
            setBusy(false);
        }
    }, [ api, code ]);

    // md-outlined-text-field re-dispatches the native `input` event, so read the
    // value off the element rather than relying on React's change synthetics.
    const onCodeChange = useCallback(
        (e: React.FormEvent<HTMLElement>) => setCode((e.target as HTMLInputElement).value ?? ''), []);
    const onCodeKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                onJoin();
            }
        }, [ onJoin ]);

    const onNavMeetings = useCallback(() => setNav('meetings'), []);
    const onNavCalls = useCallback(() => setNav('calls'), []);

    // md-list-item has no container-color/shape token, so the Meet-style active
    // pill has to be painted on the host element; the internal container is
    // transparent and renders on top of it.
    const navStyle = (active: boolean): React.CSSProperties => ({
        display: 'block',
        background: active ? '#e8f0fe' : 'transparent',
        borderRadius: '0 24px 24px 0',
        overflow: 'hidden',
        cursor: 'pointer',
        '--md-list-item-label-text-color': active ? '#1a73e8' : '#3c4043',
        '--md-list-item-leading-icon-color': active ? '#1a73e8' : '#5f6368',
        '--md-list-item-label-text-size': '14px',
        '--md-list-item-label-text-weight': active ? '500' : '400',
        '--md-list-item-one-line-container-height': '48px'
    } as React.CSSProperties);


    const arrowBtn: React.CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px solid #dadce0',
        background: 'transparent',
        color: '#5f6368',
        fontSize: '20px',
        cursor: 'pointer',
        flexShrink: 0,
        '--md-icon-button-icon-size': '20px'
    } as React.CSSProperties;

    return (
        <div
            style = {{
                ...MD_THEME,
                minHeight: '100vh',
                background: '#ffffff',
                color: '#202124',
                fontFamily: FONT_STACK,
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

            <div style = {{ display: 'flex', flex: 1, minHeight: 0 }}>
                <aside style = {{ width: '240px', flexShrink: 0, paddingRight: '12px' }}>
                    <md-list style = {{ background: 'transparent' }}>
                        <md-list-item
                            onClick = { onNavMeetings }
                            style = { navStyle(nav === 'meetings') }
                            type = 'button'>
                            <span slot = 'start'>
                                <CalendarIcon />
                            </span>
                            <div slot = 'headline'>Встречи</div>
                        </md-list-item>
                        <md-list-item
                            onClick = { onNavCalls }
                            style = { navStyle(nav === 'calls') }
                            type = 'button'>
                            <span slot = 'start'>
                                <CamIcon />
                            </span>
                            <div slot = 'headline'>Вызовы</div>
                        </md-list-item>
                    </md-list>
                </aside>

                { nav === 'meetings' ? (
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
                                lineHeight: '52px',
                                fontWeight: 400,
                                color: '#202124',
                                margin: '0 0 16px',
                                maxWidth: '620px'
                            }}>
                            Видеоинтервью для вашей команды
                        </h1>
                        <p
                            style = {{
                                fontSize: '16px',
                                lineHeight: '24px',
                                color: '#5f6368',
                                margin: '0 0 40px',
                                maxWidth: '560px'
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
                            <span style = {{ position: 'relative' }}>
                                <md-filled-button
                                    disabled = { busy }
                                    id = 'nr-new-meeting'
                                    onClick = { toggleMenu }
                                    style = {{ '--md-filled-button-container-height': '48px' } as React.CSSProperties}>
                                    <span slot = 'icon'>
                                        <CamIcon />
                                    </span>
                                    { busy ? 'Создаём…' : 'Новая встреча' }
                                </md-filled-button>
                                <md-menu
                                    anchor = 'nr-new-meeting'
                                    open = { menuOpen }
                                    ref = { menuRef }
                                    style = {{ '--md-menu-container-shape': '12px' } as React.CSSProperties}>
                                    <md-menu-item onClick = { onCreateLink }>
                                        <span slot = 'start'>
                                            <LinkIcon />
                                        </span>
                                        <div slot = 'headline'>Новое интервью</div>
                                    </md-menu-item>
                                    <md-menu-item onClick = { onStartNow }>
                                        <span slot = 'start'>
                                            <PlusIcon />
                                        </span>
                                        <div slot = 'headline'>Начать интервью сейчас</div>
                                    </md-menu-item>
                                </md-menu>
                            </span>

                            <div style = {{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <md-outlined-text-field
                                    disabled = { busy }
                                    onInput = { onCodeChange }
                                    onKeyDown = { onCodeKeyDown }
                                    placeholder = 'Введите код встречи или ссылку'
                                    style = {{ width: '280px' }}
                                    value = { code }>
                                    <span slot = 'leading-icon'>
                                        <KeyboardIcon />
                                    </span>
                                </md-outlined-text-field>
                                <md-text-button
                                    disabled = { busy || !code.trim() }
                                    onClick = { onJoin }>
                                    Присоединиться
                                </md-text-button>
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

                        { /* Meet separates the actions from the carousel with a hairline. */ }
                        <div
                            style = {{
                                width: '100%',
                                maxWidth: '640px',
                                height: '1px',
                                background: '#dadce0',
                                marginTop: '40px'
                            }} />

                        <div
                            style = {{
                                marginTop: '56px',
                                width: '100%',
                                maxWidth: '520px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                            <div
                                style = {{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '24px'
                                }}>
                                <md-icon-button
                                    aria-label = 'Назад'
                                    onClick = { onPrevSlide }
                                    style = { arrowBtn }>
                                    ‹
                                </md-icon-button>
                                <div
                                    style = {{
                                        width: '220px',
                                        height: '220px',
                                        borderRadius: '50%',
                                        background: '#e8f0fe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                    { slide === 0 && <SlideLinkIcon /> }
                                    { slide === 1 && <SlideLobbyIcon /> }
                                    { slide === 2 && <SlidePlayIcon /> }
                                </div>
                                <md-icon-button
                                    aria-label = 'Вперёд'
                                    onClick = { onNextSlide }
                                    style = { arrowBtn }>
                                    ›
                                </md-icon-button>
                            </div>
                            <h3
                                style = {{
                                    fontSize: '22px',
                                    fontWeight: 400,
                                    color: '#3c4043',
                                    margin: '28px 0 8px'
                                }}>
                                { SLIDES[slide].title }
                            </h3>
                            <p
                                style = {{
                                    fontSize: '15px',
                                    color: '#5f6368',
                                    margin: 0,
                                    maxWidth: '380px'
                                }}>
                                { SLIDES[slide].text }
                            </p>
                            <div style = {{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                                { SLIDES.map((s, i) => (
                                    <span
                                        key = { s.title }
                                        style = {{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: i === slide ? '#1a73e8' : '#dadce0'
                                        }} />
                                )) }
                            </div>
                        </div>
                    </main>
                ) : (
                    <main
                        style = {{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '10vh 24px 0'
                        }}>
                        <div>
                            <h2 style = {{ fontSize: '24px', fontWeight: 400, color: '#3c4043', margin: '0 0 8px' }}>
                                Вызовы
                            </h2>
                            <p style = {{ fontSize: '16px', color: '#5f6368', margin: 0 }}>
                                Раздел появится позже.
                            </p>
                        </div>
                    </main>
                ) }
            </div>

            <md-dialog
                open = { Boolean(inviteUrl) }
                ref = { dialogRef }
                style = {{ '--md-dialog-container-shape': '16px' } as React.CSSProperties}>
                <div slot = 'headline'>Данные для подключения к встрече</div>
                <div slot = 'content'>
                    <p style = {{ color: '#5f6368', fontSize: '15px', margin: '0 0 20px' }}>
                        Отправьте эту ссылку кандидату. Сохраните её, если планируете
                        интервью позже.
                    </p>
                    <div
                        style = {{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: '#e8f0fe',
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
                        <md-icon-button
                            onClick = { onCopy }
                            title = 'Скопировать'>
                            <CopyIcon />
                        </md-icon-button>
                    </div>
                    { copied && (
                        <p style = {{ color: '#1e8e3e', fontSize: '13px', margin: '10px 0 0' }}>
                            Ссылка скопирована
                        </p>
                    ) }
                </div>
                <div slot = 'actions'>
                    <md-text-button onClick = { closeModal }>Закрыть</md-text-button>
                    <md-filled-button onClick = { onJoinAsHost }>Войти как интервьюер</md-filled-button>
                </div>
            </md-dialog>
        </div>
    );
}
