/* RCET shared components — served at /shared/rcet.js
 *
 *   <rcet-header team="Marketing"></rcet-header>   sticky site header
 *   <rcet-footer team="Marketing"></rcet-footer>   site footer
 *
 * Both render plain HTML into the page (no shadow DOM), styled by /shared/rcet.css,
 * so a team's own CSS can restyle them. Admins edit this file; team folders can't.
 */
(() => {
  const SITE = 'https://www.rotmancommercetech.com/';
  const EMAIL = 'rotmancommercetech@gmail.com';
  const ADDRESS = '105 St. George St, Toronto, ON M5S 3E6';
  const SOCIAL = [
    ['Instagram', 'https://www.instagram.com/rotman.tech/'],
    /* ['LinkedIn', 'https://www.linkedin.com/company/...'], */
  ];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wordmark = () => '<span class="rcet-brand__text">Rotman Commerce<b>Emerging Technologies</b></span>';

  class RcetHeader extends HTMLElement {
    connectedCallback() {
      const team = this.getAttribute('team');
      this.innerHTML = `
<header class="rcet-header">
  <div class="rcet-container rcet-header__inner">
    <a class="rcet-brand" href="${SITE}"><img class="rcet-brand__logo" src="/shared/assets/brand/logo-256.png" alt="" width="36" height="36">${wordmark()}</a>
    <nav class="rcet-header__nav" aria-label="Site">
      <a href="/">All teams</a>
      <a href="${SITE}">Main site</a>
      ${team ? `<span class="rcet-header__current">${esc(team)}</span>` : ''}
    </nav>
  </div>
</header>`;
    }
  }

  class RcetFooter extends HTMLElement {
    connectedCallback() {
      const team = this.getAttribute('team');
      const links = SOCIAL.map(([name, url]) => `<a href="${url}" rel="noopener">${esc(name)}</a>`).join('');
      this.innerHTML = `
<footer class="rcet-footer">
  <div class="rcet-container rcet-footer__inner">
    <div>
      ${wordmark()}
      <p>${ADDRESS}<br><a href="mailto:${EMAIL}">${EMAIL}</a></p>
    </div>
    <nav aria-label="RCET links">${links}<a href="${SITE}">rotmancommercetech.com</a><a href="/">All teams</a></nav>
    <p class="rcet-footer__note">${team ? `This page was written by the ${esc(team)} team. ` : ''}Every page here is authored by the people named on it and served separately from the main RCET site. Views are their own.</p>
  </div>
</footer>`;
    }
  }

  customElements.define('rcet-header', RcetHeader);
  customElements.define('rcet-footer', RcetFooter);
})();
