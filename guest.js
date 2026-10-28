import { auth, db } from './firebase.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const $ = id => document.getElementById(id);
const token = new URLSearchParams(location.search).get('convite');
let family;
let deadline = null;
let lastAttending = [];
let saving = false;
function expired() { return deadline !== null && Date.now() > deadline.getTime(); }
function updateControls() {
  const closed = expired();
  document.querySelectorAll('input[name="member"]').forEach(el => { el.disabled = closed && !lastAttending.includes(el.value); });
  $('deadlineNotice').textContent = closed ? 'Prazo encerrado: você pode apenas desmarcar pessoas já confirmadas.' : 'Selecione as pessoas que estarão presentes:';
  $('confirmBtn').textContent = closed ? 'Salvar cancelamentos' : 'Confirmar selecionados';
  $('confirmBtn').disabled = saving || (closed && lastAttending.length === 0);
  $('declineBtn').disabled = saving || (closed && lastAttending.length === 0);
}

function message(text) { $('message').textContent = text; }
function selected() { return [...document.querySelectorAll('input[name="member"]:checked')].map(el => el.value); }
async function save(status, attending) {
  if (saving) return;
  if (expired() && (attending.some(name => !lastAttending.includes(name)) || (family.status !== 'yes' && attending.length))) {
    message('Prazo encerrado. Não é possível adicionar ou reativar confirmações.'); return;
  }
  saving = true; updateControls();
  try {
    await updateDoc(doc(db, 'families', token), { status, attending, updatedAt: serverTimestamp() });
    family.status = status; family.attending = attending; lastAttending = [...attending];
    message(expired() ? 'Cancelamento salvo. Após o prazo, não é possível confirmar novamente.' : 'Resposta salva com sucesso! Você pode voltar a este link para alterar sua resposta.');
    $('lastStatus').textContent = status === 'yes' ? `Confirmados: ${attending.join(', ')}` : 'Nenhum integrante confirmado.';
  } catch (err) { message('Não foi possível salvar. Verifique sua conexão e tente novamente.'); console.error(err); }
  finally { saving = false; updateControls(); }
}
async function init() {
  if (!token || !/^[a-f0-9]{48}$/.test(token)) { message('Convite inválido. Peça seu link individual ao organizador.'); return; }
  try {
    await signInAnonymously(auth);
    const snap = await getDoc(doc(db, 'families', token));
    if (!snap.exists()) { message('Convite não encontrado.'); return; }
    family = snap.data();
    lastAttending = [...(family.attending || [])];
    const settings = await getDoc(doc(db, 'settings', 'rsvp'));
    deadline = settings.exists() && settings.data().deadline ? settings.data().deadline.toDate() : null;
    const dataLimite = document.getElementById('dataLimite');
  if (deadline) {
    const dataFormatada = new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(deadline);

  dataLimite.textContent =
    `Confirme até ${dataFormatada}`;
} else {
  dataLimite.textContent =
  'Prazo ainda não definido.';
}

    $('familyName').textContent = family.name;
    const members = $('members');
    family.members.forEach(name => {
      const label = document.createElement('label'); label.className = 'member';
      const input = document.createElement('input'); input.type = 'checkbox'; input.name = 'member'; input.value = name;
      input.checked = (family.attending || []).includes(name);
      const span = document.createElement('span'); span.textContent = name;
      label.append(input, span); members.append(label);
    });
    $('lastStatus').textContent = family.status === 'pending' ? 'Ainda não há resposta registrada.' : family.status === 'no' ? 'Resposta atual: ninguém irá.' : `Resposta atual: ${(family.attending || []).join(', ')}`;
    $('message').textContent = '';
    $('family').hidden = false;
    updateControls();
    setInterval(updateControls, 30000);
    $('rsvpForm').addEventListener('submit', e => { e.preventDefault(); const names = selected(); if (!names.length) { message('Selecione ao menos uma pessoa ou use “Ninguém poderá comparecer”.'); return; } save('yes', names); });
    $('declineBtn').addEventListener('click', () => { if (confirm('Confirmar que ninguém desta família poderá comparecer?')) { document.querySelectorAll('input[name="member"]').forEach(el => el.checked = false); save('no', []); } });
  } catch (err) { message('Não foi possível abrir o convite. Confira a configuração do Firebase e tente novamente.'); console.error(err); }
}
init();
