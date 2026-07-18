/* eslint-disable react-native/no-inline-styles, react-native/no-color-literals, react/no-multi-comp */
import {
    ClerkProvider,
    OrganizationList,
    SignIn,
    SignedIn,
    SignedOut,
    useOrganization
} from '@clerk/clerk-react';
import React from 'react';

import Welcome from './Welcome.web';
import { CLERK_PUBLISHABLE_KEY, FONT_STACK, NEXTROUND_API_BASE } from './constants';

// Clerk's control components are typed to return `ReactNode`, which the
// @types/react version bundled here rejects as a JSX element (TS2786). They
// render fine at runtime; cast them to plain component types.
type ChildrenProps = { children?: React.ReactNode; };
const SignedInGate = SignedIn as unknown as React.ComponentType<ChildrenProps>;
const SignedOutGate = SignedOut as unknown as React.ComponentType<ChildrenProps>;

/**
 * True when the current page load carries a Jitsi room token.
 *
 * NextRound mints a short-lived JWT for everyone who is allowed into a room —
 * candidates (who never touch Clerk) and staff panelists alike. So the presence
 * of a token is exactly the signal "this person is entering a room, let them
 * through". Only the token-less surface — where staff sign in and create
 * interviews — is gated behind a Clerk session.
 *
 * The token can arrive as a `?jwt=` search param, a `#jwt=` hash fragment, or,
 * on a reload after Jitsi has consumed the URL, in sessionStorage.
 *
 * @returns {boolean}
 */
function hasRoomToken(): boolean {
    try {
        const { search, hash } = window.location;

        if ((/[?&]jwt=/).test(search) || (/[#&]jwt=/).test(hash)) {
            return true;
        }

        if (window.sessionStorage.getItem('jwt')) {
            return true;
        }
    } catch (e) {
        // Accessing storage can throw in locked-down contexts; treat as no token.
    }

    return false;
}

/**
 * The room code in the URL path, or '' at the root/welcome page. A candidate's
 * shared link is just `/<code>` on the main app.
 *
 * @returns {string}
 */
function roomCodeFromPath(): string {
    try {
        return decodeURIComponent(window.location.pathname.replace(/^\/+|\/+$/g, ''));
    } catch (e) {
        return '';
    }
}

/**
 * The staff (moderator) token stashed by `goToRoom` for this exact room, if it
 * is still valid. Jitsi consumes the `?jwt=` and doesn't persist it, so on a
 * refresh we re-apply this token to keep the original role instead of falling
 * back to a guest token.
 *
 * @param {string} roomCode - The room in the path.
 * @returns {string | null} The stashed token, or null.
 */
function stashedRoomToken(roomCode: string): string | null {
    try {
        const jwt = window.sessionStorage.getItem('nr_room_jwt');
        const room = window.sessionStorage.getItem('nr_room_name');

        if (!jwt || room !== roomCode) {
            return null;
        }
        const b64 = (jwt.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));

        if (payload?.exp && (payload.exp * 1000) < Date.now()) {
            return null;
        }

        return jwt;
    } catch (e) {
        return null;
    }
}

/**
 * Re-enters the room with a stashed staff token after a refresh, preserving the
 * moderator role.
 *
 * @param {Object} props - The room code and the stashed token.
 * @returns {ReactElement}
 */
function StashRestore({ code, token }: { code: string; token: string; }) {
    React.useEffect(() => {
        window.location.replace(
            `/${encodeURIComponent(code)}?jwt=${encodeURIComponent(token)}`);
    }, [ code, token ]);

    return (
        <div
            style = {{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#5f6368',
                fontFamily: FONT_STACK,
                fontSize: '16px'
            }}>
            Возвращаемся в комнату…
        </div>
    );
}

/**
 * A candidate opened a shared room link (`/<code>`, no token). Exchange the code
 * for a short-lived guest token via the public endpoint, then reload into the
 * room with that token — so the candidate never signs in and never sees the API
 * origin. The random code is the credential, like a Google Meet link.
 *
 * @param {Object} props - Contains the room code from the path.
 * @returns {ReactElement}
 */
function GuestRoomEntry({ code }: { code: string; }) {
    const [ error, setError ] = React.useState('');

    React.useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${NEXTROUND_API_BASE}/api/rooms/guest-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const body = await res.json();

                if (!res.ok) {
                    throw new Error(body.error || 'Не удалось подключиться к встрече');
                }
                if (!cancelled) {
                    window.location.replace(
                        `/${encodeURIComponent(body.roomName)}?jwt=${encodeURIComponent(body.jwt)}`);
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e.message);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ code ]);

    return (
        <div
            style = {{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: error ? '#c5221f' : '#5f6368',
                fontFamily: FONT_STACK,
                fontSize: '16px'
            }}>
            { error || 'Подключение к встрече…' }
        </div>
    );
}

/**
 * Branded, centered sign-in screen shown to staff who reach NextRound without a
 * room token and without a Clerk session.
 *
 * @returns {ReactElement}
 */
function NextRoundSignIn() {
    return (
        <div
            style = {{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                background: '#040404',
                fontFamily: FONT_STACK
            }}>
            <div
                style = {{
                    color: '#fff',
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                }}>
                NextRound
            </div>
            <SignIn routing = 'virtual' />
        </div>
    );
}

/**
 * B2B gate: every interview belongs to a company, so a signed-in staff member
 * must have an active Clerk organization before the dashboard can act. If they
 * have none selected, let them create or pick one.
 *
 * @param {ChildrenProps} props - Children to render once an org is active.
 * @returns {ReactElement | null}
 */
function RequireOrg({ children }: ChildrenProps) {
    const { organization, isLoaded } = useOrganization();

    if (!isLoaded) {
        return null;
    }

    if (!organization) {
        return (
            <div
                style = {{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    background: '#040404',
                    fontFamily: FONT_STACK
                }}>
                <div
                    style = {{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 600
                    }}>
                    Choose your company
                </div>
                <OrganizationList
                    afterCreateOrganizationUrl = '/'
                    afterSelectOrganizationUrl = '/'
                    hidePersonal = { true } />
            </div>
        );
    }

    return <>{ children }</>;
}

/**
 * Removes any leftover room token from the URL and sessionStorage. Jitsi's
 * hang-up redirect returns to the base URL with the room's `jwt` still attached.
 *
 * @returns {void}
 */
function clearStrayToken() {
    try {
        window.sessionStorage.removeItem('jwt');
        window.sessionStorage.removeItem('nr_room_jwt');
        window.sessionStorage.removeItem('nr_room_name');
        const url = new URL(window.location.href);

        if (url.searchParams.has('jwt') || (/[#&]jwt=/).test(url.hash)) {
            url.searchParams.delete('jwt');
            url.hash = '';
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    } catch (e) {
        // Best effort.
    }
}

/**
 * True when the stray token in the URL belongs to a guest (candidate), i.e. it
 * carries `moderator: false`. Used to show candidates a thank-you screen after
 * they hang up instead of a staff sign-in. The token is only decoded, never
 * trusted — this is a UX branch, not an auth decision.
 *
 * @returns {boolean}
 */
function strayTokenIsGuest(): boolean {
    try {
        const jwt = new URLSearchParams(window.location.search).get('jwt');

        if (!jwt) {
            return false;
        }
        const b64 = (jwt.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));

        return payload?.context?.user?.moderator === false;
    } catch (e) {
        return false;
    }
}

/**
 * Thank-you screen shown to a candidate after they leave the interview.
 *
 * @returns {ReactElement}
 */
function GuestEnded() {
    React.useEffect(() => {
        clearStrayToken();
    }, []);

    return (
        <div
            style = {{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: '#ffffff',
                color: '#202124',
                fontFamily: FONT_STACK,
                textAlign: 'center',
                padding: '0 24px'
            }}>
            <div style = {{ fontSize: '18px', fontWeight: 600, color: '#5f6368' }}>NextRound</div>
            <h1 style = {{ fontSize: '30px', fontWeight: 400, color: '#3c4043', margin: '8px 0 0' }}>
                Интервью завершено
            </h1>
            <p style = {{ fontSize: '16px', color: '#5f6368', margin: 0 }}>
                Спасибо за участие! Эту вкладку можно закрыть.
            </p>
        </div>
    );
}

/**
 * The NextRound landing at the root path. A stray `jwt` left by a hang-up
 * redirect would be mistaken for a room, so strip it, then render the Clerk gate.
 *
 * @returns {ReactElement}
 */
function RootLanding() {
    React.useEffect(() => {
        clearStrayToken();
    }, []);

    return (
        <ClerkProvider
            afterSignOutUrl = '/'
            publishableKey = { CLERK_PUBLISHABLE_KEY }>
            <SignedInGate>
                <RequireOrg>
                    <Welcome />
                </RequireOrg>
            </SignedInGate>
            <SignedOutGate>
                <NextRoundSignIn />
            </SignedOutGate>
        </ClerkProvider>
    );
}

/**
 * Wraps a Jitsi entry-point component with NextRound's Clerk staff gate.
 *
 * The decision is PATH-FIRST: only `/<code>` is a room. The root is always the
 * NextRound landing, even if a stray `?jwt=` lingers there after a hang-up.
 *
 * - Room path + token → render the Jitsi room (staff moderator or in-room).
 * - Room path, no token → mint a guest token in-app and join (candidate link).
 * - Root → NextRound landing: sign in, pick a company, start/join a meeting.
 *
 * @param {React.ComponentType} WrappedApp - The entry-point component to gate.
 * @returns {React.ComponentType} The gated component.
 */
export function withNextRoundAuth(WrappedApp: React.ComponentType<any>): React.ComponentType<any> {
    return function NextRoundAuthGate(props: any) {
        const roomCode = roomCodeFromPath();

        if (roomCode) {
            // In-room with a token in the URL: render the Jitsi room.
            if (hasRoomToken()) {
                return <WrappedApp { ...props } />;
            }

            // Refresh case: Jitsi stripped the token. If we stashed a staff token
            // for this room, re-apply it so the moderator keeps their role.
            const stashed = stashedRoomToken(roomCode);

            if (stashed) {
                return (
                    <StashRestore
                        code = { roomCode }
                        token = { stashed } />
                );
            }

            // Otherwise it's a candidate opening a shared link: mint a guest token.
            return <GuestRoomEntry code = { roomCode } />;
        }

        // A candidate who just hung up returns to `/?jwt=<guest token>`. Show a
        // thank-you screen instead of the staff sign-in.
        if (strayTokenIsGuest()) {
            return <GuestEnded />;
        }

        return <RootLanding />;
    };
}
