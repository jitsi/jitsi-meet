/* eslint-disable max-len, react-native/no-inline-styles */
import { useClerk } from '@clerk/clerk-react';
import React, { useEffect, useRef } from 'react';

/**
 * The NextRound marketing landing page, shown to visitors who reach the root of
 * meet.next-round.online without a Clerk session.
 *
 * This is a faithful port of the standalone Express-served landing that used to
 * live in the `nextround20` repo. Rather than rewrite ~700 lines of hand-tuned
 * HTML/CSS as JSX (and risk drift), the original markup is rendered verbatim
 * inside a Shadow DOM. That isolates its generic class names (`.btn`, `.section`,
 * `.hero`, …) from Jitsi's global stylesheet in both directions, so nothing has
 * to be renamed or prefixed.
 *
 * Every call-to-action that would start or join an interview requires staff auth,
 * so they all open Clerk's sign-in modal (`clerk.openSignIn`) instead of linking
 * out. Once the user signs in, `AuthGate` swaps this landing for the signed-in
 * Welcome surface.
 */

/**
 * The landing markup, including its own <style> and Google Fonts <link>. Injected
 * as-is into a shadow root. CTAs carry `data-nr-signin` (open Clerk sign-in) or
 * `data-nr-join` (jump into a room by code); those hooks are wired up in the
 * effect below.
 */
const LANDING_HTML = `
<style>
  :host{ all: initial; display:block; }
  *{box-sizing:border-box;}
  .nr-root{
    --blue:#1a73e8; --blue-hover:#1967d2; --blue-press:#185abc;
    --green:#34a853; --yellow:#fbbc04; --red:#ea4335;
    --ink:#202124; --grey:#5f6368; --grey-2:#80868b; --line:#dadce0;
    --bg:#ffffff; --bg-soft:#f8f9fa; --bg-soft-2:#f1f3f4;
    --tint-blue:#e8f0fe; --tint-green:#e6f4ea; --tint-yellow:#fef7e0; --tint-red:#fce8e6;
    --elev-1:0 1px 2px rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15);
    --elev-2:0 1px 3px rgba(60,64,67,.30), 0 4px 8px 3px rgba(60,64,67,.15);
    --elev-3:0 2px 6px 2px rgba(60,64,67,.15), 0 8px 24px 4px rgba(60,64,67,.15);
    --r-sm:8px; --r-md:16px; --r-lg:28px; --r-pill:100px;
    --maxw:1128px;
    background:var(--bg); color:var(--ink);
    font-family:"Roboto",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    font-size:16px; line-height:1.5; -webkit-font-smoothing:antialiased;
    display:block;
  }
  /* Bare element selectors (not '.nr-root X') so these base resets stay
     lower-specificity than the component rules that set per-element margins /
     colours (e.g. .hero-note's margin-top, .cta h2's white). Shadow DOM already
     scopes them to the landing. */
  h1,h2,h3{font-family:"Poppins",sans-serif; font-weight:600; color:var(--ink); margin:0; letter-spacing:-.01em;}
  p{margin:0;}
  /* Bare 'a' (not '.nr-root a') so this reset stays lower-specificity than the
     .btn colour rules below — otherwise .btn-primary's white text loses. */
  a{color:inherit; text-decoration:none;}
  .wrap{max-width:var(--maxw); margin:0 auto; padding:0 24px;}

  /* ---------- Buttons ---------- */
  .btn{
    display:inline-flex; align-items:center; gap:8px; cursor:pointer; border:none;
    font-family:"Roboto",sans-serif; font-size:15px; font-weight:500; line-height:1;
    border-radius:var(--r-pill); padding:0 24px; height:44px; transition:.18s ease;
    white-space:nowrap;
  }
  .btn-primary{background:var(--blue); color:#fff;}
  .btn-primary:hover{background:var(--blue-hover); box-shadow:var(--elev-1);}
  .btn-primary:active{background:var(--blue-press);}
  .btn-ghost{background:transparent; color:var(--blue); padding:0 12px;}
  .btn-ghost:hover{background:var(--tint-blue);}
  .btn-outline{background:#fff; color:var(--blue); border:1px solid var(--line);}
  .btn-outline:hover{background:var(--bg-soft); border-color:#c7ccd1;}
  .btn svg{width:20px; height:20px;}

  /* ---------- Top bar ---------- */
  header{position:sticky; top:0; z-index:50; background:rgba(255,255,255,.92); backdrop-filter:blur(8px); transition:box-shadow .2s, border-color .2s; border-bottom:1px solid transparent;}
  header.scrolled{box-shadow:var(--elev-1); border-bottom-color:var(--line);}
  .nav{display:flex; align-items:center; height:64px; gap:20px;}
  .brand{display:flex; align-items:center; gap:11px; font-family:"Poppins"; font-weight:600; font-size:21px; color:var(--ink); cursor:pointer;}
  .logo-mark{width:34px; height:34px; flex:none;}
  .nav-links{display:flex; gap:4px; margin-left:24px;}
  .nav-links a{color:var(--grey); font-size:15px; font-weight:500; padding:8px 14px; border-radius:var(--r-pill); transition:.15s;}
  .nav-links a:hover{background:var(--bg-soft-2); color:var(--ink);}
  .nav-right{margin-left:auto; display:flex; align-items:center; gap:8px;}
  .menu-toggle{display:none; background:none; border:none; cursor:pointer; padding:8px; border-radius:50%;}
  .menu-toggle:hover{background:var(--bg-soft-2);}

  /* ---------- Hero ---------- */
  .hero{padding:56px 0 40px;}
  .hero-grid{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.05fr); gap:56px; align-items:center;}
  .eyebrow{display:inline-flex; align-items:center; gap:8px; background:var(--tint-blue); color:var(--blue-press); font-size:13px; font-weight:500; padding:6px 14px; border-radius:var(--r-pill); margin-bottom:22px;}
  .eyebrow .dots{display:inline-flex; gap:3px;}
  .eyebrow .dots i{width:7px; height:7px; border-radius:50%; display:block;}
  h1.hero-title{font-size:clamp(34px,4.6vw,52px); line-height:1.08; font-weight:600;}
  h1.hero-title .accent{color:var(--blue);}
  .hero-sub{margin-top:20px; font-size:18px; color:var(--grey); max-width:30em;}

  .action-row{display:flex; gap:12px; margin-top:32px; flex-wrap:wrap; align-items:center;}
  .join-field{display:flex; align-items:center; gap:10px; border:1px solid var(--line); border-radius:var(--r-pill); height:44px; padding:0 8px 0 16px; background:#fff; transition:.15s; min-width:236px;}
  .join-field:focus-within{border-color:var(--blue); box-shadow:0 0 0 1px var(--blue);}
  .join-field svg{width:20px; height:20px; color:var(--grey-2); flex:none;}
  .join-field input{border:none; outline:none; font-family:"Roboto"; font-size:15px; color:var(--ink); width:100%; background:transparent;}
  .join-field input::placeholder{color:var(--grey-2);}
  .join-btn{background:none; border:none; color:var(--blue); font-weight:500; font-size:15px; cursor:pointer; padding:8px 12px; border-radius:var(--r-pill);}
  .join-btn:hover{background:var(--tint-blue);}
  .hero-note{margin-top:22px; padding-top:22px; border-top:1px solid var(--line); color:var(--grey); font-size:14.5px; max-width:34em;}
  .hero-note a{color:var(--blue); font-weight:500; cursor:pointer;}

  /* ---------- Hero product mock (signature) ---------- */
  .stage{position:relative;}
  .room{position:relative; background:#202124; border-radius:var(--r-md); padding:16px; box-shadow:var(--elev-3); overflow:hidden;}
  .room-top{display:flex; align-items:center; justify-content:space-between; color:#e8eaed; font-size:12.5px; margin-bottom:12px;}
  .room-top .rec{display:inline-flex; align-items:center; gap:7px; background:rgba(234,67,53,.16); color:#f6aea6; padding:4px 10px; border-radius:var(--r-pill); font-weight:500;}
  .room-top .rec i{width:8px; height:8px; border-radius:50%; background:var(--red); display:block; animation:blink 1.6s infinite;}
  .room-top .meta{color:#9aa0a6; font-variant-numeric:tabular-nums;}
  .tiles{display:grid; grid-template-columns:1fr; gap:10px;}
  .tile-main{position:relative; aspect-ratio:16/10; border-radius:12px; background:linear-gradient(150deg,#3c4043,#282a2d); overflow:hidden; display:flex; align-items:center; justify-content:center;}
  .avatar{width:96px; height:96px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:"Poppins"; font-weight:600; font-size:36px; color:#fff; background:#5b8def;}
  .tile-name{position:absolute; left:12px; bottom:12px; background:rgba(0,0,0,.45); color:#fff; font-size:13px; font-weight:500; padding:4px 10px; border-radius:6px;}
  .tile-self{position:absolute; right:12px; bottom:12px; width:104px; aspect-ratio:16/11; border-radius:9px; background:linear-gradient(150deg,#41474d,#2b2e31); border:1px solid rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center;}
  .tile-self .avatar-sm{width:42px; height:42px; border-radius:50%; background:#34a853; color:#fff; display:flex; align-items:center; justify-content:center; font-family:"Poppins"; font-weight:600; font-size:16px;}
  .controls{display:flex; justify-content:center; gap:10px; margin-top:14px;}
  .ctrl{width:44px; height:44px; border-radius:50%; background:#3c4043; display:flex; align-items:center; justify-content:center; color:#e8eaed;}
  .ctrl svg{width:20px; height:20px;}
  .ctrl.end{background:var(--red); width:60px; border-radius:var(--r-pill);}

  .integrity{position:absolute; top:64px; right:-14px; width:250px; background:#fff; border-radius:14px; box-shadow:var(--elev-3); padding:14px 15px; }
  .integrity h4{font-family:"Poppins"; font-size:13px; font-weight:600; margin:0 0 2px; display:flex; align-items:center; gap:8px;}
  .integrity h4 .shield{width:18px; height:18px; color:var(--blue);}
  .integrity .cap{font-size:11.5px; color:var(--grey-2); margin-bottom:12px;}
  .signal{display:flex; align-items:center; gap:10px; padding:8px 9px; border-radius:9px; margin-bottom:6px; font-size:12.5px; opacity:0; transform:translateY(6px); animation:pop .5s forwards;}
  .signal:nth-child(3){animation-delay:.4s;}
  .signal:nth-child(4){animation-delay:1.4s; background:var(--tint-red);}
  .signal:nth-child(5){animation-delay:2.6s;}
  .signal .ico{width:26px; height:26px; border-radius:7px; flex:none; display:flex; align-items:center; justify-content:center;}
  .signal .ico svg{width:15px; height:15px;}
  .signal.clean .ico{background:var(--tint-green); color:var(--green);}
  .signal.warn .ico{background:#fde3e1; color:var(--red);}
  .signal .txt{line-height:1.25;}
  .signal .txt b{font-weight:500; color:var(--ink);}
  .signal .txt span{display:block; color:var(--grey-2); font-size:11px;}
  .signal .t{margin-left:auto; color:var(--grey-2); font-family:"Roboto Mono"; font-size:10.5px;}

  /* ---------- Feature sections ---------- */
  .section{padding:72px 0;}
  .feat{display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center;}
  .feat.rev .feat-visual{order:2;}
  .feat-eyebrow{font-size:13px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; margin-bottom:14px;}
  .feat h2{font-size:clamp(26px,3vw,34px); line-height:1.15;}
  .feat > .feat-text > p.lead{margin-top:16px; font-size:17px; color:var(--grey);}
  .feat-list{list-style:none; padding:0; margin:24px 0 0;}
  .feat-list li{display:flex; gap:14px; padding:12px 0; border-top:1px solid var(--line);}
  .feat-list li:first-child{border-top:none;}
  .feat-list .li-ico{width:34px; height:34px; border-radius:9px; flex:none; display:flex; align-items:center; justify-content:center;}
  .feat-list .li-ico svg{width:19px; height:19px;}
  .feat-list b{font-weight:500; display:block; font-size:15.5px;}
  .feat-list span{color:var(--grey); font-size:14.5px;}

  .panel{border-radius:var(--r-lg); padding:30px; position:relative; overflow:hidden; min-height:340px; display:flex; flex-direction:column; justify-content:center;}
  .panel.blue{background:var(--tint-blue);}
  .panel.green{background:var(--tint-green);}
  .panel.yellow{background:var(--tint-yellow);}
  .panel.red{background:var(--tint-red);}

  /* integrity feed panel */
  .feed{background:#fff; border-radius:14px; box-shadow:var(--elev-2); padding:16px;}
  .feed-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid var(--line);}
  .feed-head b{font-family:"Poppins"; font-size:14px;}
  .feed-head .live{display:inline-flex; align-items:center; gap:6px; font-size:11.5px; color:var(--green); font-weight:500;}
  .feed-head .live i{width:7px; height:7px; border-radius:50%; background:var(--green); animation:blink 1.6s infinite;}
  .feed-row{display:flex; align-items:center; gap:11px; padding:9px 4px; font-size:13px;}
  .feed-row .fico{width:30px; height:30px; border-radius:8px; flex:none; display:flex; align-items:center; justify-content:center;}
  .feed-row .fico svg{width:16px; height:16px;}
  .feed-row.ok .fico{background:var(--tint-green); color:var(--green);}
  .feed-row.flag .fico{background:#fde3e1; color:var(--red);}
  .feed-row b{font-weight:500;}
  .feed-row .ft{margin-left:auto; font-family:"Roboto Mono"; font-size:11px; color:var(--grey-2);}
  .keys{display:flex; gap:6px; margin-top:2px;}
  .kbd{font-family:"Roboto Mono"; font-size:11px; background:var(--bg-soft-2); border:1px solid var(--line); border-bottom-width:2px; border-radius:5px; padding:2px 7px; color:var(--ink);}

  /* ---------- How it works ---------- */
  .how{background:var(--bg-soft); border-radius:var(--r-lg); padding:56px 40px;}
  .how h2{text-align:center; font-size:clamp(26px,3vw,34px);}
  .how-sub{text-align:center; color:var(--grey); margin-top:12px; font-size:17px;}
  .steps{display:grid; grid-template-columns:repeat(3,1fr); gap:28px; margin-top:44px;}
  .step{position:relative; background:#fff; border-radius:var(--r-md); padding:26px 24px; box-shadow:var(--elev-1);}
  .step .n{font-family:"Poppins"; font-weight:600; font-size:14px; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:16px;}
  .step h3{font-size:18px; margin-bottom:8px;}
  .step p{color:var(--grey); font-size:14.5px;}

  /* ---------- CTA ---------- */
  .cta{background:linear-gradient(120deg,#1a73e8,#1558c0); border-radius:var(--r-lg); padding:56px 40px; text-align:center; color:#fff;}
  .cta h2{color:#fff; font-size:clamp(26px,3.2vw,36px);}
  .cta p{color:#d2e3fc; margin-top:14px; font-size:17px;}
  .cta-actions{display:flex; gap:12px; justify-content:center; margin-top:28px; flex-wrap:wrap;}
  .cta .btn-white{background:#fff; color:var(--blue);}
  .cta .btn-white:hover{background:#f1f3f4; box-shadow:var(--elev-1);}
  .cta .btn-line{background:transparent; color:#fff; border:1px solid rgba(255,255,255,.5);}
  .cta .btn-line:hover{background:rgba(255,255,255,.12);}

  /* ---------- Footer ---------- */
  footer{padding:56px 0 40px; border-top:1px solid var(--line); margin-top:80px;}
  .foot-grid{display:flex; justify-content:space-between; gap:40px; flex-wrap:wrap;}
  .foot-brand{max-width:260px;}
  .foot-brand .brand{margin-bottom:14px;}
  .foot-brand p{color:var(--grey); font-size:14px;}
  .foot-cols{display:flex; gap:64px; flex-wrap:wrap;}
  .foot-col h5{font-family:"Roboto"; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--grey); margin:0 0 14px;}
  .foot-col a{display:block; color:var(--ink); font-size:14.5px; padding:5px 0; cursor:pointer;}
  .foot-col a:hover{color:var(--blue);}
  .foot-bottom{display:flex; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-top:44px; padding-top:24px; border-top:1px solid var(--line); color:var(--grey-2); font-size:13px;}
  .foot-bottom .disclaimer{max-width:52ch;}

  /* ---------- Reveal + keyframes ---------- */
  .reveal{opacity:0; transform:translateY(20px); transition:opacity .6s ease, transform .6s ease;}
  .reveal.in{opacity:1; transform:none;}
  @keyframes pop{to{opacity:1; transform:none;}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:.35;}}
  @keyframes rise{from{opacity:0; transform:translateY(16px);}to{opacity:1; transform:none;}}
  .hero-anim{animation:rise .7s ease both;}
  .hero-anim.d2{animation-delay:.08s;}
  .hero-anim.d3{animation-delay:.16s;}
  .hero-anim.d4{animation-delay:.24s;}

  /* ---------- AI interviewer ---------- */
  .ai-chat{background:#fff; border:1px solid var(--line); border-radius:18px; padding:20px; box-shadow:var(--elev-1);}
  .ai-chat-head{display:flex; align-items:center; gap:10px; padding-bottom:14px; border-bottom:1px solid var(--line); margin-bottom:14px;}
  .ai-chat-head .avatar-sm{width:38px; height:38px; border-radius:50%; background:var(--blue); color:#fff; display:flex; align-items:center; justify-content:center; font-family:"Poppins"; font-weight:600; font-size:14px;}
  .ai-chat-head b{font-size:14.5px;}
  .ai-chat-head span{display:block; font-size:12.5px; color:var(--grey);}
  .ai-live{margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:600; color:var(--green);}
  .ai-live i{width:7px; height:7px; border-radius:50%; background:var(--green); animation:blink 1.6s infinite;}
  .ai-msg{max-width:88%; padding:10px 14px; border-radius:14px; font-size:14px; line-height:1.45; margin-bottom:10px;}
  .ai-msg.bot{background:var(--tint-blue); border-bottom-left-radius:4px;}
  .ai-msg.cand{background:var(--bg-soft); margin-left:auto; border-bottom-right-radius:4px;}
  .ai-msg .who{display:block; font-size:11.5px; font-weight:600; letter-spacing:.03em; text-transform:uppercase; color:var(--grey); margin-bottom:3px;}
  .ai-msg .ctx{display:inline-flex; align-items:center; gap:6px; margin-top:8px; font-size:12px; font-weight:600; color:var(--blue); background:#fff; border:1px solid var(--line); border-radius:var(--r-pill); padding:4px 10px;}
  .ai-msg .ctx svg{width:13px; height:13px;}
  .ai-wave{display:flex; align-items:center; gap:3px; padding:6px 2px 0;}
  .ai-wave i{width:3px; border-radius:2px; background:var(--blue); animation:wave 1s ease-in-out infinite;}
  .ai-wave i:nth-child(1){height:8px;} .ai-wave i:nth-child(2){height:14px; animation-delay:.1s;}
  .ai-wave i:nth-child(3){height:18px; animation-delay:.2s;} .ai-wave i:nth-child(4){height:12px; animation-delay:.3s;}
  .ai-wave i:nth-child(5){height:7px; animation-delay:.4s;}
  @keyframes wave{0%,100%{transform:scaleY(.5);}50%{transform:scaleY(1);}}

  /* ---------- Pricing + FAQ ---------- */
  .pricing-head{text-align:center; max-width:640px; margin:0 auto;}
  .pricing-head h2{font-size:clamp(28px,3.2vw,38px);}
  .pricing-head p{color:var(--grey); font-size:18px; margin-top:14px;}

  .bill-toggle{display:inline-flex; align-items:center; gap:6px; background:var(--bg-soft-2); border-radius:var(--r-pill); padding:5px; margin:28px auto 0; position:relative;}
  .bill-toggle button{border:none; background:transparent; cursor:pointer; font-family:"Roboto"; font-size:14px; font-weight:500; color:var(--grey); padding:9px 20px; border-radius:var(--r-pill); transition:.18s; display:inline-flex; align-items:center; gap:8px;}
  .bill-toggle button.active{background:#fff; color:var(--ink); box-shadow:var(--elev-1);}
  .save-badge{font-size:11px; font-weight:600; color:var(--green); background:var(--tint-green); padding:2px 8px; border-radius:var(--r-pill);}
  .toggle-center{display:flex; justify-content:center;}

  .price-grid{display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:44px; align-items:stretch;}
  .price-card{border:1px solid var(--line); border-radius:22px; background:#fff; padding:32px 28px; display:flex; flex-direction:column; transition:.2s;}
  .price-card:hover{box-shadow:var(--elev-2);}
  .price-card.popular{border:2px solid var(--blue); box-shadow:var(--elev-2); position:relative;}
  .pop-badge{position:absolute; top:-13px; left:50%; transform:translateX(-50%); background:var(--blue); color:#fff; font-size:12px; font-weight:600; padding:5px 16px; border-radius:var(--r-pill); font-family:"Roboto";}
  .price-name{font-family:"Poppins"; font-weight:600; font-size:20px;}
  .price-amount-row{display:flex; align-items:baseline; gap:6px; margin-top:16px;}
  .price-amount{font-family:"Poppins"; font-weight:600; font-size:44px; line-height:1; letter-spacing:-.02em;}
  .price-per{color:var(--grey); font-size:15px;}
  .annual-note{color:var(--green); font-size:13px; font-weight:500; margin-top:8px; min-height:18px;}
  .price-features{list-style:none; padding:0; margin:24px 0 28px; flex:1;}
  .price-features li{display:flex; gap:11px; align-items:flex-start; padding:8px 0; font-size:14.5px; color:var(--ink);}
  .price-features .chk{width:20px; height:20px; flex:none; border-radius:50%; background:var(--tint-green); color:var(--green); display:flex; align-items:center; justify-content:center; margin-top:1px;}
  .price-features .chk svg{width:12px; height:12px;}
  .price-cta{width:100%; justify-content:center;}

  .faq-wrap{max-width:820px; margin:0 auto;}
  .faq-wrap h2{text-align:center; font-size:clamp(26px,3vw,34px); margin-bottom:8px;}
  .faq-wrap .faq-intro{text-align:center; color:var(--grey); font-size:17px; margin-bottom:36px;}
  .faq-item{border-top:1px solid var(--line);}
  .faq-item:last-child{border-bottom:1px solid var(--line);}
  .faq-q{width:100%; background:none; border:none; cursor:pointer; text-align:left; display:flex; align-items:center; gap:20px; padding:22px 4px; font-family:"Poppins"; font-weight:500; font-size:17px; color:var(--ink);}
  .faq-q:hover{color:var(--blue);}
  .faq-ic{margin-left:auto; flex:none; width:26px; height:26px; display:flex; align-items:center; justify-content:center; color:var(--grey); transition:transform .3s ease;}
  .faq-item.open .faq-ic{transform:rotate(45deg); color:var(--blue);}
  .faq-a{overflow:hidden; max-height:0; transition:max-height .32s ease;}
  .faq-item.open .faq-a{max-height:420px;}
  .faq-a p{color:var(--grey); font-size:15.5px; line-height:1.6; padding:0 4px 24px; max-width:70ch;}
  .faq-a a{color:var(--blue); font-weight:500;}

  /* ---------- Responsive ---------- */
  @media (max-width:920px){
    .hero-grid{grid-template-columns:1fr; gap:44px;}
    .feat{grid-template-columns:1fr; gap:36px;}
    .feat.rev .feat-visual{order:0;}
    .steps{grid-template-columns:1fr;}
    .nav-links{display:none;}
    .menu-toggle{display:flex;}
    .integrity{right:8px; top:52px; width:220px;}
    .price-grid{grid-template-columns:1fr; max-width:440px; margin-left:auto; margin-right:auto;}
  }
  @media (max-width:520px){
    .hero{padding:36px 0 24px;}
    .action-row{flex-direction:column; align-items:stretch;}
    .join-field{min-width:0;}
    .integrity{position:static; width:auto; margin-top:14px; box-shadow:var(--elev-1);}
    .how,.cta,.panel{padding-left:22px; padding-right:22px;}
    .foot-cols{gap:32px;}
  }
  @media (prefers-reduced-motion:reduce){
    *{animation:none !important; transition:none !important;}
    .reveal{opacity:1; transform:none;}
    .signal{opacity:1; transform:none;}
    .faq-a{transition:none;}
  }
</style>

<div class="nr-root" id="top">
<!-- ============ HEADER ============ -->
<header id="hdr">
  <div class="wrap nav">
    <a class="brand" data-nr-scroll="top" aria-label="NextRound home">
      <svg class="logo-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="2" y="8" width="26" height="24" rx="6" fill="#1a73e8"/>
        <path d="M30 16.5 L37 12 V28 L30 23.5 Z" fill="#34a853"/>
        <circle cx="12" cy="15.5" r="2.4" fill="#fbbc04"/>
        <rect x="8" y="21" width="12" height="3.4" rx="1.7" fill="#ffffff" opacity=".9"/>
        <circle cx="24.5" cy="27" r="2.2" fill="#ea4335"/>
      </svg>
      NextRound
    </a>
    <nav class="nav-links">
      <a href="#ai">AI Interviewer</a>
      <a href="#integrity">Anti-cheating</a>
      <a href="#pricing">Pricing</a>
      <a href="#faq">FAQ</a>
    </nav>
    <div class="nav-right">
      <a class="btn btn-ghost" data-nr-signin>Sign in</a>
      <a class="btn btn-primary" data-nr-signin>Start an interview</a>
      <button class="menu-toggle" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
</header>

<main>
<!-- ============ HERO ============ -->
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <span class="eyebrow hero-anim">
        <span class="dots"><i style="background:#1a73e8"></i><i style="background:#34a853"></i><i style="background:#fbbc04"></i><i style="background:#ea4335"></i></span>
        Like Google Meet — but for interviews, powered by AI
      </span>
      <h1 class="hero-title hero-anim d2">Interviews 2.0 — <span class="accent">AI-powered</span>. Zero cheating.</h1>
      <p class="hero-sub hero-anim d3">An AI interviewer runs your first rounds. Live rounds stay cheat-proof. You meet only the candidates worth meeting.</p>

      <div class="action-row hero-anim d4">
        <a class="btn btn-primary" data-nr-signin>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4Z"/></svg>
          New interview
        </a>
        <div class="join-field">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></svg>
          <input type="text" id="nr-join-input" placeholder="Enter a code or link" aria-label="Enter an interview code or link" />
          <button class="join-btn" data-nr-join>Join</button>
        </div>
      </div>
      <p class="hero-note hero-anim d4">No installs for candidates — they join from a browser link. <a href="#ai">See how it works →</a></p>
    </div>

    <!-- signature: live interview room -->
    <div class="stage hero-anim d3">
      <div class="room" aria-label="Interview room preview">
        <div class="room-top">
          <span class="rec"><i></i> Recording</span>
          <span class="meta">Senior Backend Engineer · 34:12</span>
        </div>
        <div class="tiles">
          <div class="tile-main">
            <div class="avatar" style="background:#5b8def">AK</div>
            <span class="tile-name">Aida K. · Candidate</span>
            <div class="tile-self"><div class="avatar-sm">NR</div></div>
          </div>
        </div>
        <div class="controls">
          <div class="ctrl"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2Z"/></svg></div>
          <div class="ctrl"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4Z"/></svg></div>
          <div class="ctrl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16v11H4z"/><path d="M9 20h6M12 16v4"/></svg></div>
          <div class="ctrl end"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85a.98.98 0 0 1-1.35-.03L.29 13.08a.99.99 0 0 1 .03-1.4C3.34 8.78 7.46 7 12 7s8.66 1.78 11.68 4.68a.99.99 0 0 1 .03 1.4l-2.58 2.36a.98.98 0 0 1-1.35.03 12.6 12.6 0 0 0-2.66-1.85.998.998 0 0 1-.56-.9v-3.1A15.6 15.6 0 0 0 12 9Z"/></svg></div>
        </div>
      </div>

      <!-- floating integrity panel -->
      <div class="integrity">
        <h4><svg class="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/></svg> Integrity monitor</h4>
        <p class="cap">Live during the interview</p>
        <div class="signal clean"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div class="txt"><b>In interview tab</b><span>Focused</span></div></div>
        <div class="signal warn"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg></div><div class="txt"><b>Paste detected</b><span>Ctrl + V</span></div><span class="t">34:02</span></div>
        <div class="signal warn"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="14" height="10" rx="2"/><rect x="9" y="9" width="13" height="9" rx="2"/></svg></div><div class="txt"><b>2nd display connected</b><span>External monitor</span></div><span class="t">34:07</span></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ FEATURE · AI INTERVIEWER ============ -->
<section class="section" id="ai" style="padding-top:0">
  <div class="wrap feat reveal">
    <div class="feat-text">
      <div class="feat-eyebrow" style="color:var(--blue)">Round 1 · AI Interviewer</div>
      <h2>Let AI run the first round for you</h2>
      <p class="lead">An AI interviewer joins the room like a real participant — it greets the candidate, talks naturally, watches the screen share, and follows your interview plan. You get the transcript and scores, not another hour in your calendar.</p>
      <ul class="feat-list">
        <li>
          <div class="li-ico" style="background:var(--tint-blue); color:var(--blue)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 12a7 7 0 0 1-14 0M12 19v3"/></svg></div>
          <div><b>Talks like a person</b><span>Real-time voice with natural turn-taking — candidates can interrupt, think out loud, and switch languages mid-call.</span></div>
        </li>
        <li>
          <div class="li-ico" style="background:var(--tint-green); color:var(--green)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></div>
          <div><b>Sees the screen share</b><span>It reads the candidate's code, portfolio, or task live — and asks follow-up questions about what's actually on screen.</span></div>
        </li>
        <li>
          <div class="li-ico" style="background:var(--tint-yellow); color:#b8860b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg></div>
          <div><b>Sticks to your plan</b><span>Every candidate gets the same structured screening — same questions, same bar, zero scheduling.</span></div>
        </li>
        <li>
          <div class="li-ico" style="background:var(--tint-red); color:var(--red)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
          <div><b>Transcript &amp; scoring in minutes</b><span>A full transcript and an AI scorecard against your criteria land in the shared workspace right after the call.</span></div>
        </li>
      </ul>
    </div>
    <div class="feat-visual">
      <div class="panel blue">
        <div class="ai-chat" aria-label="AI interviewer conversation preview">
          <div class="ai-chat-head">
            <div class="avatar-sm">AI</div>
            <div><b>Aina · AI Interviewer</b><span>Senior Backend Engineer · first-round screening</span></div>
            <span class="ai-live"><i></i> In call</span>
          </div>
          <div class="ai-msg bot">
            <span class="who">Aina · AI</span>
            Hi Aida! I'm Aina, the AI interviewer for this role. The call is recorded and analyzed — ready to start?
          </div>
          <div class="ai-msg cand">
            <span class="who">Aida K. · Candidate</span>
            Sure. I'll share my screen and walk you through the project.
          </div>
          <div class="ai-msg bot">
            <span class="who">Aina · AI</span>
            I can see your editor — a FastAPI service with <b>schemas</b>, <b>models</b> and <b>api</b> modules. How does the payment webhook stay idempotent under retries?
            <span class="ctx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> Watching screen share</span>
          </div>
          <div class="ai-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ FEATURE · INTEGRITY ============ -->
<section class="section" id="integrity">
  <div class="wrap feat reveal">
    <div class="feat-text">
      <div class="feat-eyebrow" style="color:var(--red)">Round 2 · Live with your team</div>
      <h2>Then meet them live — with zero cheating</h2>
      <p class="lead"><b>7 in 10</b> candidates cheat with AI tools in live interviews. NextRound flags the signals in real time — so you never have to guess.</p>
      <ul class="feat-list">
        <li>
          <div class="li-ico" style="background:var(--tint-blue); color:var(--blue)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg></div>
          <div><b>Tab &amp; window switching</b><span>Know the moment a candidate leaves the interview tab or opens another window.</span></div>
        </li>
        <li>
          <div class="li-ico" style="background:var(--tint-yellow); color:#b8860b"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg></div>
          <div><b>Keystrokes &amp; shortcuts</b><span>Every keypress — including copy and paste — laid out in a clear timeline.</span></div>
        </li>
        <li>
          <div class="li-ico" style="background:var(--tint-green); color:var(--green)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="13" height="9" rx="2"/><rect x="9" y="10" width="13" height="9" rx="2"/></svg></div>
          <div><b>Multiple monitors</b><span>Get flagged automatically when an external display is connected.</span></div>
        </li>
      </ul>
    </div>
    <div class="feat-visual">
      <div class="panel red">
        <div class="feed">
          <div class="feed-head"><b>Integrity timeline</b><span class="live"><i></i> Live</span></div>
          <div class="feed-row ok"><div class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div><b>Interview started</b></div><span class="ft">00:00</span></div>
          <div class="feed-row flag"><div class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg></div><div><b>Switched to another tab</b><div class="keys"><span class="kbd">Alt</span><span class="kbd">Tab</span></div></div><span class="ft">12:41</span></div>
          <div class="feed-row flag"><div class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></div><div><b>Pasted into answer</b><div class="keys"><span class="kbd">Ctrl</span><span class="kbd">V</span></div></div><span class="ft">13:02</span></div>
          <div class="feed-row flag"><div class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="13" height="9" rx="2"/><rect x="9" y="10" width="13" height="9" rx="2"/></svg></div><div><b>Second display detected</b></div><span class="ft">13:05</span></div>
          <div class="feed-row ok"><div class="fico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><div><b>Returned to interview</b></div><span class="ft">13:20</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============ PRICING ============ -->
<section class="section" id="pricing" style="padding-top:0">
  <div class="wrap reveal">
    <div class="pricing-head">
      <h2>Simple, transparent pricing</h2>
      <p>Pay as you go. No hidden fees. Built for teams and companies of all sizes.</p>
    </div>
    <div class="toggle-center">
      <div class="bill-toggle" role="tablist" aria-label="Billing period">
        <button class="active" data-bill="m" role="tab" aria-selected="true">Monthly</button>
        <button data-bill="y" role="tab" aria-selected="false">Yearly <span class="save-badge">2 months free</span></button>
      </div>
    </div>

    <div class="price-grid">
      <!-- Free -->
      <div class="price-card">
        <div class="price-name">Free</div>
        <div class="price-amount-row"><span class="price-amount" data-m="$0" data-y="$0">$0</span><span class="price-per">/month</span></div>
        <div class="annual-note" data-note=""></div>
        <ul class="price-features">
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>1 user per organization</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>5 interviews per month</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Anti-cheating protection</li>
        </ul>
        <a class="btn btn-outline price-cta" data-nr-signin>Get started</a>
      </div>

      <!-- Pro -->
      <div class="price-card popular">
        <span class="pop-badge">Popular</span>
        <div class="price-name">Pro</div>
        <div class="price-amount-row"><span class="price-amount" data-m="$139" data-y="$116">$139</span><span class="price-per">/month</span></div>
        <div class="annual-note" data-note="Billed $1,390 / year"></div>
        <ul class="price-features">
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>5 users per organization</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>15 interviews per month</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Anti-cheating protection</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Interview recording</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>AI candidate scoring</li>
        </ul>
        <a class="btn btn-primary price-cta" data-nr-signin>Choose Pro</a>
      </div>

      <!-- Pro Max -->
      <div class="price-card">
        <div class="price-name">Pro Max</div>
        <div class="price-amount-row"><span class="price-amount" data-m="$314" data-y="$262">$314</span><span class="price-per">/month</span></div>
        <div class="annual-note" data-note="Billed $3,140 / year"></div>
        <ul class="price-features">
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Unlimited users per organization</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Unlimited interviews per month</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Anti-cheating protection</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Interview recording</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>AI candidate scoring</li>
          <li><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>Premium support</li>
        </ul>
        <a class="btn btn-outline price-cta" data-nr-signin>Choose Pro Max</a>
      </div>
    </div>
  </div>
</section>

<!-- ============ FAQ ============ -->
<section class="section" id="faq" style="padding-top:0">
  <div class="wrap reveal">
    <div class="faq-wrap">
      <h2>Frequently asked questions</h2>
      <p class="faq-intro">Straight answers about how the anti-cheating actually works.</p>

      <div class="faq-item open">
        <button class="faq-q" aria-expanded="true">
          Why is it impossible to detect an AI cheating app?
          <span class="faq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        </button>
        <div class="faq-a"><p>AI overlays are the eyes and ears. They run as a desktop app on top of everything else. Even in a clean virtual machine, an overlay still works — because for the end user the information is delivered through system audio and the image on the screen, which no process check can see.</p></div>
      </div>

      <div class="faq-item">
        <button class="faq-q" aria-expanded="false">
          Why not ask candidates to install detection software that checks processes?
          <span class="faq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        </button>
        <div class="faq-a"><p>At first glance it seems simple, but the downsides and risks are significant. For candidates, being asked to install software on a personal device sends a bad signal and creates security risks. For companies, it raises real reputation and legal concerns. Our web-based approach removes all of this — no installation, no privacy issues, and no legal complications.</p></div>
      </div>

      <div class="faq-item">
        <button class="faq-q" aria-expanded="false">
          What makes NextRound different?
          <span class="faq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        </button>
        <div class="faq-a"><p>NextRound combines keyboard-only signal tracking — tab switching, window switching, copy/paste, and other shortcuts — with multiple-monitor detection. Most importantly, we found an innovative way to eliminate the risk of AI overlays completely, with no desktop software to install.</p></div>
      </div>

      <div class="faq-item">
        <button class="faq-q" aria-expanded="false">
          How can I validate the anti-cheating system?
          <span class="faq-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
        </button>
        <div class="faq-a"><p>Test it yourself by running a mock interview. As the candidate, try one of the popular cheating tools like <a href="https://cluely.com/" target="_blank" rel="noopener">Cluely</a> during a test round — NextRound detects and prevents the attempt in real time. For comparison, try the same thing on a standard Zoom or MS Teams call and you'll see the overlay work unchecked. That contrast is exactly why NextRound exists.</p></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ CTA ============ -->
<section class="section" id="cta" style="padding-top:0">
  <div class="wrap">
    <div class="cta reveal">
      <h2>Start interviewing in minutes</h2>
      <p>Create your first monitored interview room — candidates join from a browser link.</p>
      <div class="cta-actions">
        <a class="btn btn-white" data-nr-signin>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4Z"/></svg>
          New interview
        </a>
        <a class="btn btn-line" data-nr-scroll="top">Enter a code or link</a>
      </div>
    </div>
  </div>
</section>
</main>

<!-- ============ FOOTER ============ -->
<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a class="brand" data-nr-scroll="top">
          <svg class="logo-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="2" y="8" width="26" height="24" rx="6" fill="#1a73e8"/>
            <path d="M30 16.5 L37 12 V28 L30 23.5 Z" fill="#34a853"/>
            <circle cx="12" cy="15.5" r="2.4" fill="#fbbc04"/>
            <rect x="8" y="21" width="12" height="3.4" rx="1.7" fill="#ffffff" opacity=".9"/>
            <circle cx="24.5" cy="27" r="2.2" fill="#ea4335"/>
          </svg>
          NextRound
        </a>
        <p>The interview room that verifies real skills. Fair by default, monitored by design.</p>
      </div>
      <div class="foot-cols">
        <div class="foot-col">
          <h5>Product</h5>
          <a href="#ai">AI Interviewer</a>
          <a href="#integrity">Anti-cheating</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div class="foot-col">
          <h5>Company</h5>
          <a data-nr-signin>Sign in</a>
          <a href="#pricing">Pricing</a>
          <a href="https://next-round.online/" target="_blank" rel="noopener">next-round.online</a>
        </div>
        <div class="foot-col">
          <h5>Legal</h5>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Candidate consent</a>
        </div>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 NextRound. All rights reserved.</span>
      <span class="disclaimer">NextRound is an independent product and is not affiliated with, endorsed by, or sponsored by Google LLC. Google Meet is a trademark of Google LLC.</span>
    </div>
  </div>
</footer>
</div>
`;

/**
 * Extracts a room code from a raw code or a full interview link a visitor pasted
 * into the hero "join" field. A pasted link is `https://…/<code>`, so we keep the
 * last non-empty path segment; a bare code is returned as-is.
 *
 * @param {string} raw - The value typed into the join field.
 * @returns {string} The room code, or '' if nothing usable was entered.
 */
function parseJoinCode(raw: string): string {
    const value = raw.trim();

    if (!value) {
        return '';
    }

    try {
        if ((/^https?:\/\//i).test(value)) {
            const url = new URL(value);
            const seg = url.pathname.split('/').filter(Boolean).pop();

            return seg ? decodeURIComponent(seg) : '';
        }
    } catch (e) {
        // Not a valid URL; fall through and treat the input as a raw code.
    }

    // A bare code: drop any surrounding slashes and take the last path-like part.
    return value.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() ?? '';
}

/**
 * The Google Fonts the landing needs (Poppins for headings, Roboto Mono for
 * timestamps). Jitsi already serves Roboto, so it is omitted here.
 */
const FONTS_HREF
    = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Roboto+Mono:wght@400;500&display=swap';

/**
 * Ensures the landing's web fonts are loaded at the *document* level. `@font-face`
 * rules declared inside a shadow root are ignored by browsers, so a <link> in the
 * shadow HTML would leave headings falling back to serif — the stylesheet must
 * live in the document <head> for shadow content to pick the fonts up.
 *
 * @returns {void}
 */
function ensureFonts() {
    if (document.getElementById('nr-landing-fonts')) {
        return;
    }
    const link = document.createElement('link');

    link.id = 'nr-landing-fonts';
    link.rel = 'stylesheet';
    link.href = FONTS_HREF;
    document.head.appendChild(link);
}

/**
 * Renders the NextRound marketing landing inside an isolated shadow root and
 * wires its interactive behaviours (sticky header, scroll-reveal, billing toggle,
 * FAQ accordion) plus the Clerk sign-in / join-by-code call-to-actions.
 *
 * @returns {ReactElement}
 */
export default function Landing() {
    const clerk = useClerk();
    const hostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const host = hostRef.current;

        if (!host) {
            return;
        }

        ensureFonts();

        const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

        root.innerHTML = LANDING_HTML;

        const cleanups: Array<() => void> = [];

        // Jitsi is a single-screen SPA: its base stylesheet pins <html>/<body>
        // to the viewport height with `overflow: clip`. The landing is a tall,
        // scrolling marketing page, so that clipping traps its content. Relax it
        // with inline overrides while the landing is mounted, and restore the
        // originals on unmount so the fixed-viewport app/room behaves normally
        // once the user signs in.
        [ document.documentElement, document.body ].forEach(el => {
            const prev = {
                height: el.style.height,
                overflowX: el.style.overflowX,
                overflowY: el.style.overflowY
            };

            el.style.height = 'auto';
            el.style.overflowX = 'hidden';
            el.style.overflowY = 'auto';
            cleanups.push(() => {
                el.style.height = prev.height;
                el.style.overflowX = prev.overflowX;
                el.style.overflowY = prev.overflowY;
            });
        });
        const on = (
                el: EventTarget | null,
                type: string,
                fn: EventListenerOrEventListenerObject,
                opts?: AddEventListenerOptions
        ) => {
            if (!el) {
                return;
            }
            el.addEventListener(type, fn, opts);
            cleanups.push(() => el.removeEventListener(type, fn, opts));
        };

        // --- Auth CTAs → open Clerk sign-in ---
        root.querySelectorAll<HTMLElement>('[data-nr-signin]').forEach(el => {
            on(el, 'click', (e: Event) => {
                e.preventDefault();
                clerk.openSignIn({});
            });
        });

        // --- Join by code / pasted link ---
        const joinInput = root.querySelector<HTMLInputElement>('#nr-join-input');
        const doJoin = () => {
            const code = parseJoinCode(joinInput?.value ?? '');

            if (code) {
                // A candidate's link is just `/<code>` on the main app; the auth
                // gate exchanges it for a guest token and drops them into the room.
                window.location.assign(`/${encodeURIComponent(code)}`);
            } else {
                // Nothing usable typed — treat "Join" as a prompt to sign in.
                clerk.openSignIn({});
            }
        };

        root.querySelectorAll<HTMLElement>('[data-nr-join]').forEach(el => {
            on(el, 'click', (e: Event) => {
                e.preventDefault();
                doJoin();
            });
        });
        on(joinInput, 'keydown', (e: Event) => {
            if ((e as KeyboardEvent).key === 'Enter') {
                e.preventDefault();
                doJoin();
            }
        });

        // --- In-page scroll-to-top anchors (brand / "Enter a code or link") ---
        root.querySelectorAll<HTMLElement>('[data-nr-scroll="top"]').forEach(el => {
            on(el, 'click', (e: Event) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // --- In-page section anchors (#ai, #integrity, #pricing, #faq, ...) ---
        // The sections live inside the shadow root, so a plain `href="#id"` can't
        // resolve them against the light DOM — nothing scrolls. Intercept the
        // clicks and scroll the shadow element into view, offset for the ~64px
        // sticky header. A bare `href="#"` (placeholder link) is just neutralised.
        const STICKY_OFFSET = 76;
        const scrollToId = (id: string) => {
            const target = id && root.getElementById(id);

            if (target) {
                const y = target.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;

                window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });

                return true;
            }

            return false;
        };

        root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(a => {
            on(a, 'click', (e: Event) => {
                e.preventDefault();
                scrollToId((a.getAttribute('href') || '').slice(1));
            });
        });

        // Honour a hash in the URL on load (e.g. /#integrity), once laid out.
        if (window.location.hash.length > 1) {
            requestAnimationFrame(() => scrollToId(window.location.hash.slice(1)));
        }

        // --- Sticky header shadow on scroll ---
        const hdr = root.getElementById('hdr');
        const onScroll = () => hdr?.classList.toggle('scrolled', window.scrollY > 8);

        onScroll();
        on(window, 'scroll', onScroll, { passive: true });

        // --- Billing toggle (monthly / yearly) ---
        const billBtns = root.querySelectorAll<HTMLButtonElement>('.bill-toggle button');
        const amounts = root.querySelectorAll<HTMLElement>('.price-amount');
        const notes = root.querySelectorAll<HTMLElement>('.annual-note');
        const setBilling = (mode: string) => {
            billBtns.forEach(b => {
                const active = b.dataset.bill === mode;

                b.classList.toggle('active', active);
                b.setAttribute('aria-selected', active ? 'true' : 'false');
            });
            amounts.forEach(a => {
                a.textContent = mode === 'y' ? (a.dataset.y ?? '') : (a.dataset.m ?? '');
            });
            notes.forEach(n => {
                n.textContent = mode === 'y' ? (n.dataset.note ?? '') : '';
            });
        };

        billBtns.forEach(b => on(b, 'click', () => setBilling(b.dataset.bill ?? 'm')));

        // --- FAQ accordion ---
        root.querySelectorAll<HTMLElement>('.faq-q').forEach(q => {
            on(q, 'click', () => {
                const item = q.closest('.faq-item');

                if (!item) {
                    return;
                }
                const isOpen = item.classList.contains('open');

                item.classList.toggle('open', !isOpen);
                q.setAttribute('aria-expanded', String(!isOpen));
            });
        });

        // --- Scroll reveal ---
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const revealEls = root.querySelectorAll<HTMLElement>('.reveal');

        if (!reduce && 'IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12 });

            revealEls.forEach(el => io.observe(el));
            cleanups.push(() => io.disconnect());
        } else {
            revealEls.forEach(el => el.classList.add('in'));
        }

        return () => cleanups.forEach(fn => fn());
    }, [ clerk ]);

    return (
        <div
            ref = { hostRef }
            style = {{ minHeight: '100vh' }} />
    );
}
