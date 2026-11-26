/* Rastreio de anúncio da CRTNG: UTMs até o checkout da Kiwify e pixel da Meta.
   O pixel fica DESLIGADO enquanto META_PIXEL_ID estiver vazio. Para ligar: preencher o ID (Gerenciador de
   Eventos da Meta) e, no mesmo envio, acrescentar o pixel à política de privacidade. Passo a passo em
   03_CRTNG/SITE/PROJETO.md (V3.6), no vault. */
(function () {
  var META_PIXEL_ID = '';
  var CHECKOUT = 'a[href^="https://pay.kiwify.com.br/"]';

  // 1. UTMs: quem chega por anúncio traz utm_*, src, sck ou fbclid no endereço. Ficam guardados na sessão
  //    (vale também para quem cai na home e vai ao curso) e seguem nos links de compra da Kiwify, para a
  //    venda aparecer atribuída ao anúncio no painel da Kiwify.
  var CHAVES = /^(utm_[a-z]+|src|sck|fbclid)$/;
  var guardados = {};
  try { guardados = JSON.parse(sessionStorage.getItem('crtng_utm') || '{}') || {}; } catch (e) { guardados = {}; }
  try {
    new URLSearchParams(location.search).forEach(function (v, k) { if (CHAVES.test(k) && v) guardados[k] = v; });
    sessionStorage.setItem('crtng_utm', JSON.stringify(guardados));
  } catch (e) {}

  function aplicaUtm() {
    var chaves = Object.keys(guardados);
    if (!chaves.length) return;
    document.querySelectorAll(CHECKOUT).forEach(function (a) {
      try {
        var u = new URL(a.href);
        chaves.forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, guardados[k]); });
        a.href = u.toString();
      } catch (e) {}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicaUtm);
  else aplicaUtm();

  // 2. Pixel da Meta, só com o ID preenchido: visita em toda página e início de compra no clique de "Comprar".
  //    A compra em si é contada pela Kiwify, com o mesmo pixel configurado no produto.
  if (!META_PIXEL_ID) return;
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest(CHECKOUT) : null;
    if (a) fbq('track', 'InitiateCheckout');
  }, true);
})();
