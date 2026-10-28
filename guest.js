import { auth, db } from './firebase.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const $ = id => document.getElementById(id);
const token = new URLSearchParams(location.search).get('convite');
let family;
function message(text) { $('message').textContent = text; }
function selected() { return [...document.querySelectorAll('input[name="member"]:checked')].map(el => el.value); }
async function save(status, attending) {
  $('confirmBtn').disabled = $('declineBtn').disabled = true;
  try {
    await updateDoc(doc(db, 'families', token), { status, attending, updatedAt: serverTimestamp() });
    message('Resposta salva com sucesso! Você pode voltar a este link para alterar sua resposta.');
    $('lastStatus').textContent = status === 'yes' ? `Confirmados: ${attending.join(', ')}` : 'Nenhum integrante confirmado.';
  } catch (err) { message('Não foi possível salvar. Verifique sua conexão e tente novamente.'); console.error(err); }
  finally { $('confirmBtn').disabled = $('declineBtn').disabled = false; }
}
async function init() {
  if (!token || !/^[a-f0-9]{48}$/.test(token)) { message('Convite inválido. Peça seu link individual ao organizador.'); return; }
  try {
    await signInAnonymously(auth);
    const snap = await getDoc(doc(db, 'families', token));
    if (!snap.exists()) { message('Convite não encontrado.'); return; }
    family = snap.data();
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
    $('rsvpForm').addEventListener('submit', e => { e.preventDefault(); const names = selected(); if (!names.length) { message('Selecione ao menos uma pessoa ou use “Ninguém poderá comparecer”.'); return; } save('yes', names); });
    $('declineBtn').addEventListener('click', () => { if (confirm('Confirmar que ninguém desta família poderá comparecer?')) { document.querySelectorAll('input[name="member"]').forEach(el => el.checked = false); save('no', []); } });
  } catch (err) { message('Não foi possível abrir o convite. Confira a configuração do Firebase e tente novamente.'); console.error(err); }
}
init();
