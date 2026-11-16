// Instalacao opcional do painel; nao altera autenticacao nem dados.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./admin-sw.js').catch(console.warn));
}
let pendingInstall = null;
const installButton = document.getElementById('installAdminApp');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pendingInstall = event;
  installButton.hidden = false;
});
installButton?.addEventListener('click', async () => {
  if (!pendingInstall) return;
  pendingInstall.prompt();
  await pendingInstall.userChoice;
  pendingInstall = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { pendingInstall = null; installButton.hidden = true; });
