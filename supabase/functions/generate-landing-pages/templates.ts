/**
 * Scorama-derived HTML templates with {{PLACEHOLDER}} substitution points.
 *
 * Placeholders:
 *   {{BRAND_NAME}}          - public brand name (e.g. "Acme Bet")
 *   {{LEGAL_COMPANY}}       - legal entity name (e.g. "Acme Limited")
 *   {{LOGO_URL}}            - public URL to uploaded brand logo image
 *   {{PRIMARY_COLOR}}       - hex brand primary (e.g. "#9818EB")
 *   {{PRIMARY_LIGHT}}       - lightened variant (e.g. "#CB8BF4")
 *   {{PRIMARY_BG_TINT}}     - rgba tint for backgrounds (e.g. "rgba(152,24,235,0.07)")
 *   {{PRIMARY_BORDER_TINT}} - rgba tint for borders (e.g. "rgba(152,24,235,0.15)")
 *   {{PRIMARY_BORDER_STRONG}} - stronger rgba for glows (e.g. "rgba(152,24,235,0.25)")
 *   {{DOMAIN}}              - primary domain without protocol (e.g. "acmebet.com")
 *   {{PLATFORM_URL}}        - full URL for platform CTA (e.g. "https://play.acmebet.com")
 *   {{SUPPORT_EMAIL}}       - support email address
 *   {{COUNTRY}}             - short country label for badge (e.g. "NIGERIA")
 *   {{JURISDICTION_FULL}}   - jurisdiction for legal copy (e.g. "Federal Republic of Nigeria")
 *   {{TAGLINE}}             - hero tagline (e.g. "Bet Smart. Win Big.")
 *   {{DESCRIPTION}}         - hero paragraph text
 *   {{TERMS_CONTENT}}       - full inner HTML of terms sections (h2/p/ul blocks)
 *   {{PRIVACY_CONTENT}}     - full inner HTML of privacy sections
 *   {{RG_CONTENT}}          - full inner HTML of responsible gambling sections
 *   {{RG_HELPLINES_HTML}}   - support-card divs for helpline resources
 */

// ─── index.html ────────────────────────────────────────────────────────────

export const INDEX_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{BRAND_NAME}} – {{TAGLINE}}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --brand: {{PRIMARY_COLOR}};
    --brand-light: {{PRIMARY_LIGHT}};
    --brand-dark: #6B10A8;
    --navy: #283748;
    --bg: #0A0A0F;
    --surface: #13131A;
    --surface2: #1C1C28;
    --text: #F0F0F8;
    --muted: #7A7A9A;
    --border: {{PRIMARY_BORDER_TINT}};
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }

  nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 2.5rem;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0;
    background: rgba(10,10,15,0.92);
    backdrop-filter: blur(16px);
    z-index: 100;
  }
  .logo { display: flex; align-items: center; }
  .nav-links { display: flex; gap: 2rem; list-style: none; }
  .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; transition: color 0.2s; }
  .nav-links a:hover { color: var(--text); }

  .hero {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center;
    padding: 7rem 2rem 5rem;
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; top: -150px; left: 50%; transform: translateX(-50%);
    width: 700px; height: 700px;
    background: radial-gradient(circle, {{PRIMARY_BG_TINT}} 0%, transparent 65%);
    pointer-events: none;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: {{PRIMARY_BG_TINT}};
    color: var(--brand-light);
    border: 1px solid {{PRIMARY_BORDER_STRONG}};
    border-radius: 100px;
    padding: 0.35rem 1rem;
    font-size: 0.78rem; font-weight: 500;
    letter-spacing: 0.06em; text-transform: uppercase;
    margin-bottom: 2rem;
  }
  .badge-dot { width: 6px; height: 6px; background: var(--brand); border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .hero h1 {
    font-family: 'Syne', sans-serif;
    font-size: clamp(3rem, 9vw, 6.5rem);
    font-weight: 800; line-height: 1.0;
    letter-spacing: -0.02em;
    margin-bottom: 1.5rem;
    max-width: 16ch;
  }
  .hero h1 .accent { color: var(--brand); }
  .hero p { font-size: 1.1rem; color: var(--muted); max-width: 460px; line-height: 1.7; margin-bottom: 2.5rem; }

  .cta-group { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-bottom: 1.25rem; }
  .btn-primary {
    background: var(--brand); color: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 600;
    border: none; border-radius: 10px; padding: 0.9rem 2.25rem;
    cursor: pointer; text-decoration: none; display: inline-block;
    transition: background 0.2s, transform 0.15s;
    box-shadow: 0 0 30px {{PRIMARY_BORDER_STRONG}};
  }
  .btn-primary:hover { background: var(--brand-dark); transform: translateY(-2px); }
  .btn-secondary {
    background: transparent; color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500;
    border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0.9rem 2.25rem;
    cursor: pointer; text-decoration: none; display: inline-block;
    transition: border-color 0.2s, transform 0.15s;
  }
  .btn-secondary:hover { border-color: var(--brand-light); transform: translateY(-2px); }
  .signin-link { font-size: 0.875rem; color: var(--muted); text-decoration: none; }
  .signin-link:hover { color: var(--brand-light); }

  .app-badges { display: flex; gap: 1rem; justify-content: center; margin-top: 3rem; flex-wrap: wrap; }
  .app-badge {
    display: flex; align-items: center; gap: 0.75rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 0.7rem 1.4rem;
    text-decoration: none; color: var(--text);
    transition: border-color 0.2s, transform 0.15s;
  }
  .app-badge:hover { border-color: var(--brand); transform: translateY(-1px); }
  .app-badge svg { width: 22px; height: 22px; fill: var(--text); flex-shrink: 0; }
  .badge-text { text-align: left; line-height: 1.3; }
  .badge-text small { font-size: 0.68rem; color: var(--muted); display: block; }
  .badge-text strong { font-size: 0.9rem; }

  .steps {
    padding: 5rem 2rem;
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    text-align: center;
  }
  .steps h2 { font-family: 'Syne', sans-serif; font-size: 2.2rem; font-weight: 700; margin-bottom: 3rem; }
  .steps-grid { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; max-width: 820px; margin: 0 auto; }
  .step { flex: 1; min-width: 180px; max-width: 240px; }
  .step-num {
    width: 52px; height: 52px; border-radius: 50%;
    background: {{PRIMARY_BG_TINT}}; border: 1px solid {{PRIMARY_BORDER_STRONG}};
    color: var(--brand-light); font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 1.1rem;
  }
  .step h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
  .step p { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }

  .responsible { padding: 3.5rem 2rem; text-align: center; max-width: 660px; margin: 0 auto; }
  .responsible p { font-size: 0.85rem; color: var(--muted); line-height: 1.8; }
  .responsible strong { color: var(--text); }
  .responsible a { color: var(--muted); }

  footer {
    border-top: 1px solid var(--border);
    padding: 2.5rem 2rem;
    display: flex; flex-direction: column; align-items: center; gap: 1.5rem; text-align: center;
  }
  .footer-links { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; list-style: none; }
  .footer-links a { color: var(--muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
  .footer-links a:hover { color: var(--brand-light); }
  .footer-social { display: flex; gap: 1.25rem; }
  .footer-social a { color: var(--muted); text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
  .footer-social a:hover { color: var(--text); }
  .footer-copy { font-size: 0.78rem; color: var(--muted); }

  /* Mobile menu */
  .mobile-menu-toggle { display: none; background: transparent; border: none; color: var(--text); cursor: pointer; padding: 0.5rem; align-items: center; justify-content: center; }
  .mobile-menu-toggle svg { width: 24px; height: 24px; display: block; }
  .mobile-menu-overlay { display: none; position: fixed; inset: 0; background: rgba(10,10,15,0.98); backdrop-filter: blur(20px); z-index: 200; flex-direction: column; justify-content: center; align-items: center; gap: 1.75rem; }
  .mobile-menu-overlay a { color: var(--text); text-decoration: none; font-size: 1.25rem; font-weight: 500; }
  .mobile-menu-overlay a:hover { color: var(--brand-light); }
  .mobile-menu-close { position: absolute; top: 1.25rem; right: 1.25rem; background: transparent; border: none; color: var(--text); cursor: pointer; padding: 0.5rem; }
  .mobile-menu-close svg { width: 24px; height: 24px; display: block; }
  body.menu-open { overflow: hidden; }
  body.menu-open .mobile-menu-overlay { display: flex; }

  @media (max-width: 768px) {
    nav { padding: 0.9rem 1.25rem; }
    .nav-links { display: none; }
    .mobile-menu-toggle { display: inline-flex; }

    .hero { padding: 3.5rem 1.25rem 3rem; }
    .hero-badge { font-size: 0.7rem; padding: 0.3rem 0.85rem; margin-bottom: 1.25rem; }
    .hero h1 {
      font-size: clamp(2rem, 8vw, 3rem) !important;
      line-height: 1.1 !important;
      letter-spacing: -0.02em !important;
      max-width: 100%;
      word-break: break-word;
      overflow-wrap: break-word;
      padding: 0 0.25rem;
    }
    .hero p { font-size: 0.95rem; padding: 0 0.5rem; margin-bottom: 1.75rem; max-width: 100%; }

    .cta-group { flex-direction: column; width: 100%; padding: 0 1rem; gap: 0.75rem; }
    .btn-primary, .btn-secondary { width: 100%; padding: 0.85rem 1.25rem; text-align: center; }

    .app-badges { margin-top: 2rem; gap: 0.6rem; padding: 0 1rem; }
    .app-badge { padding: 0.6rem 1rem; flex: 1; min-width: 0; justify-content: center; }

    .steps { padding: 3.5rem 1.25rem; }
    .steps h2 { font-size: 1.6rem; margin-bottom: 2rem; }
    .steps-grid { gap: 1.5rem; flex-direction: column; align-items: center; }
    .step { min-width: 100%; max-width: 100%; }

    .responsible { padding: 2.5rem 1.25rem; }
    .responsible p { font-size: 0.8rem; }

    footer { padding: 2rem 1.25rem; gap: 1.25rem; }
    .footer-links { flex-direction: column; gap: 0.75rem; }
    .footer-social { flex-wrap: wrap; justify-content: center; gap: 1rem; }
  }

  @media (max-width: 480px) {
    .hero { padding: 2.75rem 1rem 2.5rem; }
    .hero h1 { font-size: clamp(1.75rem, 7vw, 2.5rem) !important; }
    .hero-badge { font-size: 0.65rem; }
  }
</style>
</head>
<body>

<nav>
  <div class="logo">
    <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}} logo" style="height:32px;width:auto" />
  </div>
  <ul class="nav-links">
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="{{PLATFORM_URL}}/sportsbook">Sports</a></li>
    <li><a href="{{PLATFORM_URL}}/casino">Casino</a></li>
    <li><a href="mailto:{{SUPPORT_EMAIL}}">Support</a></li>
  </ul>
  <button class="mobile-menu-toggle" aria-label="Open menu" onclick="document.body.classList.add('menu-open')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
</nav>

<div class="mobile-menu-overlay">
  <button class="mobile-menu-close" aria-label="Close menu" onclick="document.body.classList.remove('menu-open')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
  <a href="#how-it-works" onclick="document.body.classList.remove('menu-open')">How it works</a>
  <a href="{{PLATFORM_URL}}/sportsbook">Sports</a>
  <a href="{{PLATFORM_URL}}/casino">Casino</a>
  <a href="mailto:{{SUPPORT_EMAIL}}">Support</a>
</div>

<section class="hero">
  <span class="hero-badge"><span class="badge-dot"></span>Now Live in {{COUNTRY}}</span>
  <h1>{{TAGLINE}}</h1>
  <p>{{DESCRIPTION}}</p>
  <div class="cta-group">
    <a href="{{PLATFORM_URL}}" class="btn-primary">Play Now</a>
    <a href="{{PLATFORM_URL}}/onboarding" class="btn-secondary">Create Account</a>
  </div>
  <a href="{{PLATFORM_URL}}/onboarding" class="signin-link">Already have an account? Sign In</a>
  <div class="app-badges">
    <a href="#" class="app-badge">
      <svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      <div class="badge-text"><small>Download on the</small><strong>App Store</strong></div>
    </a>
    <a href="#" class="app-badge">
      <svg viewBox="0 0 24 24"><path d="M3.18 23.76c.34.19.72.24 1.1.16l12.19-6.97-2.62-2.62-10.67 9.43zm-1.61-20.4C1.23 3.72 1 4.13 1 4.67v14.67c0 .54.23.95.58 1.31l.07.06 8.22-8.22v-.19L1.57 3.36zm18.52 8.81l-2.33-1.33-2.93 2.93 2.93 2.93 2.34-1.34c.67-.38.67-1.01 0-1.19zM4.28.08L16.47 7.05l-2.62 2.62L3.18.24C3.52.08 3.94.13 4.28.08z"/></svg>
      <div class="badge-text"><small>Get it on</small><strong>Google Play</strong></div>
    </a>
  </div>
</section>

<section class="steps" id="how-it-works">
  <h2>Get Started in 3 Easy Steps</h2>
  <div class="steps-grid">
    <div class="step">
      <div class="step-num">1</div>
      <h3>Sign Up</h3>
      <p>Create your free account in under 2 minutes.</p>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <h3>Deposit</h3>
      <p>Fund your account instantly with your preferred payment method.</p>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <h3>Bet &amp; Win</h3>
      <p>Pick your markets, place your bets, and collect your winnings.</p>
    </div>
  </div>
</section>

<div class="responsible">
  <p>
    <strong>18+ only.</strong> Only persons aged 18 years and above are permitted to register and play.
    Please gamble responsibly and only bet what you can afford to lose.<br><br>
    Customer Support — Email: <a href="mailto:{{SUPPORT_EMAIL}}">{{SUPPORT_EMAIL}}</a>
  </p>
</div>

<footer>
  <div class="footer-logo">
    <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}} logo" style="height:28px;width:auto" />
  </div>
  <ul class="footer-links">
    <li><a href="terms.html">Terms &amp; Conditions</a></li>
    <li><a href="privacy.html">Privacy Policy</a></li>
    <li><a href="responsible-gambling.html">Responsible Gambling</a></li>
  </ul>
  <div class="footer-social">
    <a href="#">Twitter (X)</a>
    <a href="#">Instagram</a>
    <a href="#">Facebook</a>
  </div>
  <p class="footer-copy">&copy; 2026 {{LEGAL_COMPANY}}. All rights reserved.</p>
</footer>

</body>
</html>`;

// ─── terms.html ────────────────────────────────────────────────────────────

export const TERMS_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{BRAND_NAME}} – Terms &amp; Conditions</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--brand:{{PRIMARY_COLOR}};--brand-light:{{PRIMARY_LIGHT}};--bg:#0A0A0F;--surface:#13131A;--text:#F0F0F8;--muted:#7A7A9A;--border:{{PRIMARY_BORDER_TINT}}}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);line-height:1.8}
  nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2.5rem;border-bottom:1px solid var(--border);background:rgba(10,10,15,0.95);position:sticky;top:0;z-index:100}
  .logo img{height:28px;width:auto}
  .back{color:var(--muted);text-decoration:none;font-size:0.9rem;transition:color 0.2s}
  .back:hover{color:var(--brand-light)}
  .content{max-width:760px;margin:0 auto;padding:4rem 2rem 6rem}
  h1{font-family:'Syne',sans-serif;font-size:2.5rem;font-weight:700;margin-bottom:0.5rem}
  .last-updated{color:var(--muted);font-size:0.85rem;margin-bottom:3rem}
  h2{font-size:1.1rem;font-weight:600;color:var(--brand-light);margin:2.5rem 0 0.75rem}
  p,li{font-size:0.95rem;color:#C0C0D8;margin-bottom:0.75rem}
  ul,ol{padding-left:1.5rem;margin-bottom:1rem}
  li{margin-bottom:0.4rem}
  strong{color:var(--text)}
  .license-block{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-top:3rem;font-size:0.85rem;color:var(--muted);line-height:1.7}
  footer{border-top:1px solid var(--border);padding:2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center}
  .footer-links{display:flex;gap:1.5rem;flex-wrap:wrap;justify-content:center;list-style:none}
  .footer-links a{color:var(--muted);text-decoration:none;font-size:0.85rem}
  .footer-links a:hover{color:var(--brand-light)}
  .footer-copy{font-size:0.78rem;color:var(--muted)}
</style>
</head>
<body>
<nav>
  <div class="logo">
    <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}} logo" style="height:28px;width:auto" />
  </div>
  <a href="index.html" class="back">&#8592; Back to Home</a>
</nav>

<div class="content">
  <h1>Terms &amp; Conditions</h1>
  <p class="last-updated">Last updated: April 2026</p>

  {{TERMS_CONTENT}}

  <div class="license-block">
    <p>{{BRAND_NAME}} is licensed and regulated under the laws of {{JURISDICTION_FULL}}.<br>
    <strong>18+</strong> Only persons aged 18 years and above are permitted to register and play. Please gamble responsibly.<br><br>
    Customer Support — Email: <a href="mailto:{{SUPPORT_EMAIL}}" style="color:var(--brand-light)">{{SUPPORT_EMAIL}}</a></p>
  </div>
</div>

<footer>
  <ul class="footer-links">
    <li><a href="terms.html">Terms &amp; Conditions</a></li>
    <li><a href="privacy.html">Privacy Policy</a></li>
    <li><a href="responsible-gambling.html">Responsible Gambling</a></li>
  </ul>
  <p class="footer-copy">&copy; 2026 {{LEGAL_COMPANY}}. All rights reserved.</p>
</footer>
</body>
</html>`;

// ─── privacy.html ──────────────────────────────────────────────────────────

export const PRIVACY_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{BRAND_NAME}} – Privacy Policy</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--brand:{{PRIMARY_COLOR}};--brand-light:{{PRIMARY_LIGHT}};--bg:#0A0A0F;--surface:#13131A;--text:#F0F0F8;--muted:#7A7A9A;--border:{{PRIMARY_BORDER_TINT}}}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);line-height:1.8}
  nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2.5rem;border-bottom:1px solid var(--border);background:rgba(10,10,15,0.95);position:sticky;top:0;z-index:100}
  .logo img{height:28px;width:auto}
  .back{color:var(--muted);text-decoration:none;font-size:0.9rem;transition:color 0.2s}
  .back:hover{color:var(--brand-light)}
  .content{max-width:760px;margin:0 auto;padding:4rem 2rem 6rem}
  h1{font-family:'Syne',sans-serif;font-size:2.5rem;font-weight:700;margin-bottom:0.5rem}
  .last-updated{color:var(--muted);font-size:0.85rem;margin-bottom:3rem}
  h2{font-size:1.1rem;font-weight:600;color:var(--brand-light);margin:2.5rem 0 0.75rem}
  p,li{font-size:0.95rem;color:#C0C0D8;margin-bottom:0.75rem}
  ul{padding-left:1.5rem;margin-bottom:1rem}
  li{margin-bottom:0.4rem}
  strong{color:var(--text)}
  .license-block{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-top:3rem;font-size:0.85rem;color:var(--muted);line-height:1.7}
  footer{border-top:1px solid var(--border);padding:2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center}
  .footer-links{display:flex;gap:1.5rem;flex-wrap:wrap;justify-content:center;list-style:none}
  .footer-links a{color:var(--muted);text-decoration:none;font-size:0.85rem}
  .footer-links a:hover{color:var(--brand-light)}
  .footer-copy{font-size:0.78rem;color:var(--muted)}
</style>
</head>
<body>
<nav>
  <div class="logo">
    <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}} logo" style="height:28px;width:auto" />
  </div>
  <a href="index.html" class="back">&#8592; Back to Home</a>
</nav>

<div class="content">
  <h1>Privacy Policy</h1>
  <p class="last-updated">Last updated: April 2026</p>

  {{PRIVACY_CONTENT}}

  <div class="license-block">
    <p>{{BRAND_NAME}} is licensed and regulated under the laws of {{JURISDICTION_FULL}}.<br>
    <strong>18+</strong> Only persons aged 18 years and above are permitted to register and play. Please gamble responsibly.<br><br>
    Customer Support — Email: <a href="mailto:{{SUPPORT_EMAIL}}" style="color:var(--brand-light)">{{SUPPORT_EMAIL}}</a></p>
  </div>
</div>

<footer>
  <ul class="footer-links">
    <li><a href="terms.html">Terms &amp; Conditions</a></li>
    <li><a href="privacy.html">Privacy Policy</a></li>
    <li><a href="responsible-gambling.html">Responsible Gambling</a></li>
  </ul>
  <p class="footer-copy">&copy; 2026 {{LEGAL_COMPANY}}. All rights reserved.</p>
</footer>
</body>
</html>`;

// ─── responsible-gambling.html ─────────────────────────────────────────────

export const RG_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{BRAND_NAME}} – Responsible Gambling</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--brand:{{PRIMARY_COLOR}};--brand-light:{{PRIMARY_LIGHT}};--bg:#0A0A0F;--surface:#13131A;--text:#F0F0F8;--muted:#7A7A9A;--border:{{PRIMARY_BORDER_TINT}}}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);line-height:1.8}
  nav{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2.5rem;border-bottom:1px solid var(--border);background:rgba(10,10,15,0.95);position:sticky;top:0;z-index:100}
  .logo img{height:28px;width:auto}
  .back{color:var(--muted);text-decoration:none;font-size:0.9rem;transition:color 0.2s}
  .back:hover{color:var(--brand-light)}
  .content{max-width:760px;margin:0 auto;padding:4rem 2rem 6rem}
  h1{font-family:'Syne',sans-serif;font-size:2.5rem;font-weight:700;margin-bottom:0.5rem}
  .last-updated{color:var(--muted);font-size:0.85rem;margin-bottom:3rem}
  h2{font-size:1.1rem;font-weight:600;color:var(--brand-light);margin:2.5rem 0 0.75rem}
  p,li{font-size:0.95rem;color:#C0C0D8;margin-bottom:0.75rem}
  ul{padding-left:1.5rem;margin-bottom:1rem}
  li{margin-bottom:0.4rem}
  strong{color:var(--text)}
  .callout{background:{{PRIMARY_BG_TINT}};border:1px solid {{PRIMARY_BORDER_STRONG}};border-radius:12px;padding:1.5rem 1.75rem;margin:2rem 0}
  .callout p{margin:0;font-size:1rem;color:var(--text)}
  .support-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1rem}
  .support-card strong{display:block;margin-bottom:0.25rem;color:var(--brand-light)}
  .support-card p{margin:0;font-size:0.875rem}
  .support-card a{color:var(--brand-light);text-decoration:none}
  .license-block{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-top:3rem;font-size:0.85rem;color:var(--muted);line-height:1.7}
  footer{border-top:1px solid var(--border);padding:2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center}
  .footer-links{display:flex;gap:1.5rem;flex-wrap:wrap;justify-content:center;list-style:none}
  .footer-links a{color:var(--muted);text-decoration:none;font-size:0.85rem}
  .footer-links a:hover{color:var(--brand-light)}
  .footer-copy{font-size:0.78rem;color:var(--muted)}
</style>
</head>
<body>
<nav>
  <div class="logo">
    <img src="{{LOGO_URL}}" alt="{{BRAND_NAME}} logo" style="height:28px;width:auto" />
  </div>
  <a href="index.html" class="back">&#8592; Back to Home</a>
</nav>

<div class="content">
  <h1>Responsible Gambling</h1>
  <p class="last-updated">Last updated: April 2026</p>

  <div class="callout">
    <p>At {{BRAND_NAME}}, we believe gambling should be fun, safe, and entertaining — it should never be harmful. <strong>Please gamble responsibly and only bet what you can afford to lose.</strong></p>
  </div>

  {{RG_CONTENT}}

  <h2>Getting Help &amp; Support</h2>
  {{RG_HELPLINES_HTML}}

  <div class="callout">
    <p>Gambling should always be enjoyable. If it stops being fun, it's time to take a break.<br><strong>Help is available. You are not alone.</strong></p>
  </div>

  <div class="license-block">
    <p>{{BRAND_NAME}} is licensed and regulated under the laws of {{JURISDICTION_FULL}}.<br>
    <strong>18+</strong> Only persons aged 18 years and above are permitted to register and play.<br><br>
    Customer Support — Email: <a href="mailto:{{SUPPORT_EMAIL}}" style="color:var(--brand-light)">{{SUPPORT_EMAIL}}</a></p>
  </div>
</div>

<footer>
  <ul class="footer-links">
    <li><a href="terms.html">Terms &amp; Conditions</a></li>
    <li><a href="privacy.html">Privacy Policy</a></li>
    <li><a href="responsible-gambling.html">Responsible Gambling</a></li>
  </ul>
  <p class="footer-copy">&copy; 2026 {{LEGAL_COMPANY}}. All rights reserved.</p>
</footer>
</body>
</html>`;
