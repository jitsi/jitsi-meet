#!/usr/bin/env python3
"""Verify anonymous room and chat signaling over HTTP without a browser."""

import argparse
import json
import secrets
import ssl
import time
import urllib.request
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape, quoteattr


class Session:
    def __init__(self, url, context):
        self.url = url.rstrip('/') + '/http-bind'
        self.context = context
        self.sid = None
        self.rid = secrets.randbelow(100000000) + 1

    def send(self, content='', extra=''):
        self.rid += 1
        session = f' sid={quoteattr(self.sid)}' if self.sid else ''
        body = (
            f'<body xmlns="http://jabber.org/protocol/httpbind" rid="{self.rid}"{session} {extra}>'
            f'{content}</body>'
        )
        request = urllib.request.Request(
            self.url, body.encode(), {'Content-Type': 'text/xml; charset=utf-8'}
        )
        with urllib.request.urlopen(request, context=self.context, timeout=15) as response:
            result = ET.fromstring(response.read())
        if result.get('type') == 'terminate' and 'type="terminate"' not in extra:
            raise RuntimeError('BOSH session terminated: ' + str(result.get('condition')))
        return result

    def connect(self):
        first = self.send(extra='to="meet.jitsi" wait="1" hold="1" ver="1.6"')
        self.sid = first.attrib['sid']
        auth = self.send('<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="ANONYMOUS"/>')
        if auth.find('.//{urn:ietf:params:xml:ns:xmpp-sasl}success') is None:
            raise RuntimeError('Anonymous authentication did not succeed')
        self.send(extra='to="meet.jitsi" xmlns:xmpp="urn:xmpp:xbosh" xmpp:restart="true"')
        bind = self.send(
            '<iq xmlns="jabber:client" type="set" id="bind">'
            '<bind xmlns="urn:ietf:params:xml:ns:xmpp-bind"><resource>http-probe</resource></bind></iq>'
        )
        if bind.find('.//{urn:ietf:params:xml:ns:xmpp-bind}jid') is None:
            raise RuntimeError('XMPP resource binding failed')
        self.nickname = bind.findtext('.//{urn:ietf:params:xml:ns:xmpp-bind}jid')[:8]

    def until(self, initial, predicate):
        deadline = time.monotonic() + 20
        result = initial
        while not predicate(result):
            if time.monotonic() > deadline:
                raise RuntimeError('Timed out waiting for signaling response')
            result = self.send()
        return result

    def join(self, room, name):
        target = quoteattr(f'{room}/{self.nickname}')
        result = self.send(
            f'<presence xmlns="jabber:client" to={target}><x xmlns="http://jabber.org/protocol/muc"/>'
            f'<nick xmlns="http://jabber.org/protocol/nick">{escape(name)}</nick></presence>'
        )
        for presence in result.findall('{jabber:client}presence'):
            if presence.get('type') == 'error':
                raise RuntimeError('Room join rejected: ' + ET.tostring(presence, encoding='unicode'))
        self.until(result, lambda body: any(
            p.get('from') == f'{room}/{self.nickname}' and p.get('type') != 'error'
            and p.find('.//{http://jabber.org/protocol/muc#user}status[@code="110"]') is not None
            for p in body.findall('{jabber:client}presence')
        ))

    def create_conference(self, room):
        result = self.send(
            '<iq xmlns="jabber:client" to="focus.meet.jitsi" type="set" id="conference">'
            f'<conference xmlns="http://jitsi.org/protocol/focus" room={quoteattr(room)} '
            f'machine-uid="{secrets.token_hex(16)}"/></iq>'
        )
        result = self.until(result, lambda body: body.find('{jabber:client}iq[@id="conference"]') is not None)
        iq = result.find('{jabber:client}iq[@id="conference"]')
        conference = iq.find('{http://jitsi.org/protocol/focus}conference')
        if iq.get('type') != 'result' or conference is None or conference.get('ready') != 'true':
            raise RuntimeError('Conference creation failed: ' + ET.tostring(iq, encoding='unicode'))

    def close(self):
        if self.sid:
            self.send(extra='type="terminate"')
            self.sid = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='https://localhost:18443')
    parser.add_argument('--insecure', action='store_true', help='Accept the local self-signed certificate')
    args = parser.parse_args()
    context = ssl._create_unverified_context() if args.insecure else ssl.create_default_context()
    room = 'http-probe-' + secrets.token_hex(8) + '@muc.meet.jitsi'
    marker = 'chat-probe-' + secrets.token_hex(8)
    sessions = [Session(args.url, context), Session(args.url, context)]
    try:
        for index, session in enumerate(sessions):
            session.connect()
            if index == 0:
                session.create_conference(room)
            session.join(room, f'participant-{index + 1}')
        sessions[0].send(
            f'<message xmlns="jabber:client" to={quoteattr(room)} type="groupchat">'
            f'<body>{marker}</body></message>'
        )
        sessions[1].until(sessions[1].send(), lambda body: any(
            message.get('from') == room + '/' + sessions[0].nickname
            and message.findtext('{jabber:client}body') == marker
            for message in body.findall('{jabber:client}message')
        ))
    finally:
        errors = []
        for session in sessions:
            try:
                session.close()
            except Exception as error:
                errors.append(str(error))
        if errors:
            raise RuntimeError('Session cleanup failed: ' + '; '.join(errors))
    print(json.dumps({'anonymousParticipants': 2, 'roomJoined': True, 'chatDelivered': True,
                      'sessionsClosed': True, 'mediaVerified': False, 'room': room}))


if __name__ == '__main__':
    main()
