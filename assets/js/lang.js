/* ============================================================
   LANG.JS — EN/DE language toggle for joveljose.com
   Reads/writes localStorage key "lang". Called by inline
   setLang() handlers on each page.
   ============================================================ */

(function () {

  function applyLang(lang) {
    document.querySelectorAll('[data-en],[data-de]').forEach(function (el) {
      var text = lang === 'de' ? el.getAttribute('data-de') : el.getAttribute('data-en');
      if (text !== null) el.innerHTML = text;
    });

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    document.documentElement.setAttribute('lang', lang === 'de' ? 'de' : 'en');
  }

  /* Exposed globally so onclick handlers can call it */
  window.setLang = function (lang) {
    localStorage.setItem('lang', lang);
    applyLang(lang);
  };

  /* Apply saved preference on every page load */
  var saved = localStorage.getItem('lang') || 'en';
  /* Run after DOM is ready — this script is loaded at bottom of body */
  applyLang(saved);

})();
