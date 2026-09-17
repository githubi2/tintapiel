/*
 * Tinta Piel — 登录/注册弹窗组件（内容页/首页「就地弹窗」版）
 * 用法：页面尾部引入 <script src="../assets/auth-widget.js" defer></script>
 * 行为：
 *   - 带 class="nav-login" 或 data-auth-open="login|register" 的元素点击 → 就地弹窗（不跳页）
 *   - 未加载 JS 时，原有 href（工具页 ?login=1）仍可兜底跳转
 *   - 打开带 ?login=1 的链接（旧入口/收藏）也直接就地弹窗
 *   - 登录成功：弹窗关闭 + 导航显示 "Hola, xxx" + 顶部小提示
 *   - Google 按钮为懒加载（首次打开弹窗时才拉 GIS 脚本，不拖慢 SEO 页）
 */
(function () {
  'use strict';
  var d = document;
  if (window.__ttAuth) return;

  var API = (location.protocol === 'file:' || location.port === '8770' || location.port === '8000')
    ? 'http://127.0.0.1:8010/api/v1'
    : '/api/v1';
  var GOOGLE_CLIENT_ID = '547189163396-lgqbc3ucvpejdeg9lndjcn8u9tbge8e8.apps.googleusercontent.com';

  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k) || '';
      if (v === '') localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { return ''; }
  }
  function getToken() { return ls('tt:token'); }
  function getEmail() { return ls('tt:email'); }
  function api(path, opts) {
    opts = opts || {};
    var h = opts.headers || {};
    if (getToken()) h['Authorization'] = 'Bearer ' + getToken();
    if (opts.body && typeof opts.body !== 'string') { h['Content-Type'] = 'application/json'; opts.body = JSON.stringify(opts.body); }
    opts.headers = h;
    return fetch(API + path, opts).then(function (r) { return r.json(); });
  }

  // ===== 样式（与工具页同款，变量带兜底）=====
  var CSS = [
    '.auth-overlay{position:fixed;inset:0;background:rgba(27,23,16,.45);display:flex;align-items:center;justify-content:center;z-index:60;opacity:0;pointer-events:none;transition:opacity .22s ease}',
    '.auth-overlay.open{opacity:1;pointer-events:auto}',
    '.auth-card{position:relative;width:min(400px,92vw);background:var(--surface,#FCFBF7);border:1px solid var(--line,#E4DECE);border-radius:18px;padding:22px;box-shadow:0 30px 80px -30px rgba(27,23,16,.5);color:var(--ink,#1B1710);font-family:inherit}',
    '.auth-card h2{font-family:var(--serif,Georgia),serif;font-size:1.35rem;font-weight:800;margin:0 0 .3rem}',
    '.auth-card p.asub{margin:0 0 14px;font-size:.8rem;color:var(--muted,#7A715F);line-height:1.5}',
    '.auth-tabs{display:flex;gap:6px;margin-bottom:14px}',
    '.auth-tabs button{flex:1;font:inherit;font-size:.78rem;font-weight:700;padding:.5rem;border-radius:9px;border:1.5px solid var(--line,#E4DECE);background:#fff;color:var(--muted,#7A715F);cursor:pointer}',
    '.auth-tabs button.on{background:var(--ink,#121212);border-color:var(--ink,#121212);color:#F6F2E8}',
    '.auth-card .field{margin-bottom:10px}',
    '.auth-card .field label{display:block;font-size:.72rem;font-weight:700;color:var(--ink-2,#4A4335);margin-bottom:5px}',
    '.auth-card .field input{width:100%;font:inherit;font-size:.85rem;padding:.6rem .75rem;border:1.5px solid var(--line,#E4DECE);border-radius:10px;background:#fff;color:var(--ink,#1B1710);outline:none;box-sizing:border-box}',
    '.auth-card .field input:focus{border-color:var(--accent,#C98A26)}',
    '.auth-card .field .row{display:flex;gap:8px}',
    '.auth-card .field .row input{flex:1}',
    '.auth-card .field .row button{flex:0 0 auto;font:inherit;font-size:.75rem;font-weight:700;border:1.5px solid var(--line-2,#D8D0BC);background:#fff;border-radius:10px;padding:0 .8rem;cursor:pointer;color:var(--ink-2,#4A4335)}',
    '.auth-card .field .row button:disabled{opacity:.55;cursor:wait}',
    '.auth-msg{font-size:.75rem;min-height:1.1em;margin:2px 0 10px;color:#A33B2E}',
    '.auth-msg.ok{color:#2F7D4F}',
    '#bAuthSubmit{display:block;width:100%;font:inherit;font-size:.85rem;font-weight:800;color:#F6F2E8;background:var(--ink,#121212);border:1.5px solid var(--ink,#121212);border-radius:10px;padding:.68rem 1rem;cursor:pointer}',
    '#bAuthSubmit:hover{background:var(--accent,#C98A26);border-color:var(--accent,#C98A26)}',
    '#bAuthSubmit:disabled{opacity:.55;cursor:wait}',
    '.auth-close{position:absolute;top:14px;right:16px;border:none;background:none;font-size:1rem;color:var(--muted,#7A715F);cursor:pointer}',
    '.gbox{margin-top:12px}',
    '.orline{display:flex;align-items:center;gap:10px;color:var(--muted,#7A715F);font-size:.72rem;margin:12px 0 10px}',
    '.orline::before,.orline::after{content:"";flex:1;height:1px;background:var(--line,#E4DECE)}',
    '#gslot{display:flex;justify-content:center}',
    '.nav-login{font-size:.83rem;font-weight:700;color:var(--ink-2,#4A4335);text-decoration:none;white-space:nowrap;border-bottom:2px solid transparent;padding-bottom:.1rem}',
    '.nav-login:hover{color:var(--ink,#1B1710);border-bottom-color:var(--accent,#C98A26)}',
    '.tt-toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:var(--ink,#121212);color:#F6F2E8;font-size:.8rem;font-weight:700;padding:.55rem 1.05rem;border-radius:999px;z-index:80;box-shadow:0 18px 40px -18px rgba(27,23,16,.6);opacity:0;transition:opacity .25s ease;pointer-events:none;font-family:inherit}',
    '.tt-toast.show{opacity:1}'
  ].join('');
  var st = d.createElement('style');
  st.textContent = CSS;
  (d.head || d.documentElement).appendChild(st);

  // ===== 弹窗骨架（与工具页同款）=====
  var wrap = d.createElement('div');
  wrap.className = 'auth-overlay';
  wrap.id = 'authOverlay';
  wrap.innerHTML = '<div class="auth-card" role="dialog" aria-modal="true">' +
    '<button class="auth-close" id="authClose" aria-label="Cerrar">✕</button>' +
    '<h2 id="authTitle">Inicia sesión</h2>' +
    '<p class="asub">Necesitas una cuenta para usar el efecto real con IA.</p>' +
    '<div class="auth-tabs"><button id="tabLogin" class="on">Iniciar sesión</button><button id="tabReg">Crear cuenta</button></div>' +
    '<div class="field"><label>Email</label><input type="email" id="fEmail" placeholder="tu@email.com" autocomplete="email"></div>' +
    '<div class="field" id="codeField" hidden><label>Código de verificación</label><div class="row"><input type="text" id="fCode" placeholder="123456" maxlength="6"><button id="bCode">Enviar código</button></div></div>' +
    '<div class="field"><label>Contraseña</label><input type="password" id="fPass" placeholder="Mínimo 6 caracteres" autocomplete="current-password"></div>' +
    '<p class="auth-msg" id="authMsg"></p>' +
    '<div class="auth-actions"><button id="bAuthSubmit">Entrar</button></div>' +
    '<div class="gbox" id="gBox" hidden><div class="orline"><span>o</span></div><div id="gslot"></div></div>' +
    '</div>';
  d.body.appendChild(wrap);

  var authMsg = d.getElementById('authMsg');
  var tabLogin = d.getElementById('tabLogin'), tabReg = d.getElementById('tabReg');
  var codeField = d.getElementById('codeField');
  var bAuthSubmit = d.getElementById('bAuthSubmit');
  var authMode = 'login';

  function setAuthMsg(t, ok) { authMsg.textContent = t || ''; authMsg.classList.toggle('ok', !!ok); }

  // ===== 顶部提示（动作成功后反馈）=====
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) { toastEl = d.createElement('div'); toastEl.className = 'tt-toast'; d.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  // ===== Google 一键登录（GIS 懒加载；与 PixPurge 共用同一 OAuth client）=====
  var gsiInited = false;
  function ensureGSI() {
    if (d.getElementById('tt-gsi')) return;
    var s = d.createElement('script');
    s.id = 'tt-gsi';
    s.src = 'https://accounts.google.com/gsi/client?hl=es';
    s.async = true; s.defer = true;
    d.head.appendChild(s);
  }
  function gsiRender() {
    if (!window.google || !google.accounts || !google.accounts.id) return false;
    if (!gsiInited) {
      try { google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCred }); gsiInited = true; }
      catch (e) { return false; }
    }
    var slot = d.getElementById('gslot');
    if (slot) {
      slot.innerHTML = '';
      try {
        google.accounts.id.renderButton(slot, { theme: 'outline', size: 'large', shape: 'pill', width: 300, locale: 'es', text: authMode === 'login' ? 'signin_with' : 'signup_with' });
        d.getElementById('gBox').hidden = false;
      } catch (e) { /* GIS 渲染失败时保留邮箱登录方式 */ }
    }
    return true;
  }
  function scheduleGSI() {
    ensureGSI();
    var delays = [0, 500, 1500, 3000];
    for (var i = 0; i < delays.length; i++) { (function (dt) { setTimeout(gsiRender, dt); })(delays[i]); }
  }
  function onGoogleCred(resp) {
    if (!resp || !resp.credential) return;
    setAuthMsg('Conectando con Google…', true);
    api('/auth/google/login', { method: 'POST', body: { idToken: resp.credential } }).then(function (j) {
      var dd = (j && j.data) || {};
      var tok = dd.accessToken || dd.token || '';
      if (j && j.code === '00000' && tok) {
        var ge = (dd.user && dd.user.email) || '';
        afterAuth(tok, ge, false);
      } else {
        setAuthMsg((j && j.msg) || 'No se pudo iniciar sesión con Google.');
      }
    }).catch(function () { setAuthMsg('Error de conexión con el servidor.'); });
  }

  // ===== 模式切换 / 打开 / 关闭 =====
  function applyAuthMode() {
    var isLogin = authMode === 'login';
    tabLogin.classList.toggle('on', isLogin);
    tabReg.classList.toggle('on', !isLogin);
    codeField.hidden = isLogin;
    bAuthSubmit.textContent = isLogin ? 'Entrar' : 'Crear cuenta';
    d.getElementById('authTitle').textContent = isLogin ? 'Inicia sesión' : 'Crea tu cuenta';
    scheduleGSI();
  }
  function openAuth(mode) { authMode = mode || 'login'; applyAuthMode(); setAuthMsg(''); wrap.classList.add('open'); }
  function closeAuth() { wrap.classList.remove('open'); }

  function renderNavLogin() {
    var links = d.querySelectorAll('.nav-login');
    var mail = getToken() ? getEmail() : '';
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (!a.getAttribute('data-tt-bound')) {
        a.setAttribute('data-tt-bound', '1');
        a.addEventListener('click', function (e) {
          if (getToken()) return; // 已登录按普通链接走（工具页）
          e.preventDefault();
          openAuth(this.getAttribute('data-auth-open') || 'login');
        });
      }
      if (mail) {
        a.textContent = 'Hola, ' + (mail.split('@')[0] || mail);
        a.setAttribute('data-auth-open', ''); // 已登录后不再弹窗
        a.setAttribute('href', a.getAttribute('href').replace('?login=1', ''));
      }
    }
  }
  function afterAuth(tok, email, wasRegister) {
    ls('tt:token', tok); ls('tt:email', email || '');
    closeAuth();
    renderNavLogin();
    toast(wasRegister ? 'Cuenta creada ✓' : 'Sesión iniciada ✓');
  }

  // ===== 事件绑定 =====
  tabLogin.addEventListener('click', function () { authMode = 'login'; setAuthMsg(''); applyAuthMode(); });
  tabReg.addEventListener('click', function () { authMode = 'register'; setAuthMsg(''); applyAuthMode(); });
  d.getElementById('authClose').addEventListener('click', closeAuth);
  wrap.addEventListener('click', function (e) { if (e.target === wrap) closeAuth(); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('open')) closeAuth(); });

  var bCode = d.getElementById('bCode');
  bCode.addEventListener('click', function () {
    var email = d.getElementById('fEmail').value.trim();
    if (!email) { setAuthMsg('Escribe tu email primero.'); return; }
    bCode.disabled = true; setAuthMsg('Enviando…', true);
    api('/auth/email/code', { method: 'POST', body: { email: email } }).then(function (j) {
      if (j && j.code === '00000') { setAuthMsg('Código enviado. Revisa tu correo.', true); }
      else { setAuthMsg((j && j.msg) || 'No se pudo enviar el código.'); }
    }).catch(function () { setAuthMsg('Error de conexión.'); }).then(function () { bCode.disabled = false; });
  });

  function authSubmit() {
    var email = d.getElementById('fEmail').value.trim();
    var pass = d.getElementById('fPass').value;
    if (!email || !pass) { setAuthMsg('Email y contraseña son obligatorios.'); return; }
    bAuthSubmit.disabled = true;
    var req;
    var wasRegister = authMode === 'register';
    if (!wasRegister) {
      req = api('/auth/email/login', { method: 'POST', body: { email: email, password: pass } });
    } else {
      var code = d.getElementById('fCode').value.trim();
      if (!code) { setAuthMsg('Falta el código de verificación.'); bAuthSubmit.disabled = false; return; }
      req = api('/auth/register', { method: 'POST', body: { email: email, emailCode: code, password: pass } });
    }
    req.then(function (j) {
      var dd = (j && j.data) || {};
      var tok = dd.accessToken || dd.token || '';
      if (j && j.code === '00000' && tok) {
        afterAuth(tok, email, wasRegister);
      } else {
        setAuthMsg((j && j.msg) || 'No se pudo completar. Revisa tus datos.');
      }
    }).catch(function () { setAuthMsg('Error de conexión con el servidor.'); })
      .then(function () { bAuthSubmit.disabled = false; });
  }
  bAuthSubmit.addEventListener('click', authSubmit);
  d.getElementById('fPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') authSubmit(); });
  d.getElementById('fCode').addEventListener('keydown', function (e) { if (e.key === 'Enter') authSubmit(); });

  // 通用触发点：任何带 data-auth-open 的元素（nav-login 已单独绑定）
  d.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== d) {
      if (t.getAttribute && t.getAttribute('data-auth-open') && !(t.classList && t.classList.contains('nav-login'))) {
        if (getToken()) return;
        e.preventDefault();
        openAuth(t.getAttribute('data-auth-open') || 'login');
        return;
      }
      t = t.parentNode;
    }
  });

  renderNavLogin();
  // 旧入口/收藏带 ?login=1：就地弹窗
  try { if (!getToken() && /[?&]login=1/.test(location.search)) { openAuth('login'); } } catch (e) { }

  window.__ttAuth = true;
  window.TTAuth = { open: openAuth, close: closeAuth, loggedIn: function () { return !!getToken(); } };
})();
