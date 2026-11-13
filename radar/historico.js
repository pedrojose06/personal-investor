/* Barra de hist\u00f3rico do Radar pr\u00e9-mercado B3.
   L\u00ea relatorios/index.json (mais recente primeiro) e mostra, no topo da p\u00e1gina,
   a data do relat\u00f3rio aberto e a navega\u00e7\u00e3o entre os relat\u00f3rios guardados.
   Fica num Shadow DOM para n\u00e3o herdar nem alterar o estilo de cada relat\u00f3rio. */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var raiz = new URL('.', script.src);
  var atual = script.getAttribute('data-relatorio') || '';
  var embutido = false;
  try { embutido = window.self !== window.top; } catch (e) { embutido = true; }
  if (embutido) {
    // Dentro da aba Hoje do painel: sem barra, e os links abrem fora do quadro.
    var abreFora = function () {
      Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) { if (!a.target) { a.target = '_blank'; a.rel = 'noopener'; } });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', abreFora); else abreFora();
    return;
  }
  fetch(new URL('relatorios/index.json', raiz), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (lista) {
      if (!Array.isArray(lista) || !lista.length) return;
      lista = lista.slice().sort(function (a, b) { return a.data < b.data ? 1 : -1; });
      var i = lista.findIndex(function (x) { return x.data === atual; });
      if (i < 0) i = 0;
      var item = lista[i];
      var url = function (x) { return new URL(x.arquivo, raiz).href; };

      var host = document.createElement('div');
      host.setAttribute('data-radar-historico', '');
      host.style.marginBottom = '20px';
      var sh = host.attachShadow({ mode: 'open' });
      sh.innerHTML =
        '<style>' +
        ':host{all:initial;display:block;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;--b:#f7f7f4;--f:#1d2420;--m:#5f6b66;--l:#d7dad5;--a:#23405b;--s:#ffffff}' +
        '@media (prefers-color-scheme:dark){:host{--b:#151b18;--f:#e8ece9;--m:#9aa6a0;--l:#2f3833;--a:#8fb4d6;--s:#1d2420}}' +
        '.bar{background:var(--b);color:var(--f);border-bottom:1px solid var(--l);padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));box-sizing:border-box;width:100%;overflow:hidden}' +
        '.in{max-width:1080px;margin:0 auto;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center}' +
        '.t{font-weight:600}.m{color:var(--m);font-size:13px}' +
        '.tag{font-size:12px;font-weight:600;border-radius:999px;padding:2px 9px;border:1px solid currentColor}' +
        '.novo{color:#1f7a4d}.velho{color:#a8741a}' +
        '@media (prefers-color-scheme:dark){.novo{color:#5fcf94}.velho{color:#e2b04f}}' +
        '.nav{display:flex;gap:6px;align-items:center;margin-left:auto;flex-wrap:wrap;min-width:0;max-width:100%}'+'@media (max-width:640px){.nav{margin-left:0;width:100%}.nav label{display:none}.nav select{flex:1 1 0}}' +
        'select{min-width:0;width:auto}'+'select,a.b{box-sizing:border-box;font:inherit;color:var(--f);background:var(--s);border:1px solid var(--l);border-radius:8px;padding:6px 10px;text-decoration:none;max-width:100%}' +
        'a.b:hover{border-color:var(--a)}a.b[aria-disabled=true]{opacity:.4;pointer-events:none}' +
        'label{color:var(--m);font-size:13px}' +
        '</style>' +
        '<div class="bar"><div class="in">' +
        '<span class="t">Relat\u00f3rio de ' + esc(item.rotulo) + '</span>' +
        (i === 0 ? '<span class="tag novo">mais recente</span>' : '<span class="tag velho">relat\u00f3rio antigo</span>') +
        '<span class="m">' + lista.length + ' relat\u00f3rio' + (lista.length > 1 ? 's' : '') + ' guardado' + (lista.length > 1 ? 's' : '') + '</span>' +
        '<div class="nav">' +
        '<a class="b" id="ant" target="_self">\u2190 Anterior</a>' +
        '<label for="sel">Ir para</label><select id="sel"></select>' +
        '<a class="b" id="prox" target="_self">Pr\u00f3ximo \u2192</a>' +
        '</div></div></div>';

      var sel = sh.getElementById('sel');
      lista.forEach(function (x, k) {
        var o = document.createElement('option');
        o.value = url(x);
        o.textContent = x.rotulo + (k === 0 ? ' (mais recente)' : '') + (x.resumo ? ' \u00b7 ' + x.resumo : '');
        if (k === i) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { location.href = sel.value; });
      var ant = sh.getElementById('ant'), prox = sh.getElementById('prox');
      if (lista[i + 1]) ant.href = url(lista[i + 1]); else ant.setAttribute('aria-disabled', 'true');
      if (i > 0) prox.href = url(lista[i - 1]); else prox.setAttribute('aria-disabled', 'true');
      document.body.insertBefore(host, document.body.firstChild);
      fetch(new URL('../anteriores.html', raiz), { method: 'HEAD', cache: 'no-store' }).then(function (r) {
        if (!r.ok) return;
        var nav = sh.querySelector('.nav');
        var todos = document.createElement('a'); todos.className = 'b'; todos.target = '_self';
        todos.href = new URL('../anteriores.html', raiz).href; todos.textContent = 'Todos os preg\u00f5es';
        var painel = document.createElement('a'); painel.className = 'b'; painel.target = '_self';
        painel.href = new URL('../', raiz).href; painel.textContent = 'Painel';
        nav.appendChild(todos); nav.appendChild(painel);
      }).catch(function () {});
    })
    .catch(function () {});

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
})();
