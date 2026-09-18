/* Shared navigation behavior. Keeps the existing links and labels unchanged. */
(function () {
  function setupNav(nav) {
    var inner = nav.querySelector('.nav-in');
    var links = nav.querySelector('.nav-links');
    if (!inner || !links || inner.querySelector('.nav-menu-toggle')) return;

    /* The home page keeps login inside the links block; move it to the right action area. */
    var login = links.querySelector('.nav-login');
    if (login) inner.appendChild(login);

    var actions = document.createElement('div');
    actions.className = 'nav-actions';
    var directLogin = inner.querySelector(':scope > .nav-login');
    var directButton = inner.querySelector(':scope > .btn-sm');
    if (directLogin) actions.appendChild(directLogin);
    if (directButton) actions.appendChild(directButton);
    if (actions.children.length) inner.appendChild(actions);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-menu-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'site-navigation');
    toggle.setAttribute('aria-label', 'Abrir menú');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    inner.appendChild(toggle);
    links.id = 'site-navigation';

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
      }
    });
  }

  document.querySelectorAll('.site-page .nav').forEach(setupNav);
})();
