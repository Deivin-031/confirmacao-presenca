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

function atualizarAvisoPrazo() {
  const aviso = $('avisoPrazo');
  if (!aviso || !deadline) return;

  if (expired()) {
    aviso.innerHTML = `
      <h3>Prazo de confirmação encerrado</h3>

      <p class="aviso-importante">
        O período para confirmação de presença chegou ao fim.
      </p>

      <p>
        Devido ao número limitado de convidados,
        a entrada no evento será permitida exclusivamente
        às pessoas que confirmaram sua presença dentro
        do prazo e permanecem na lista.
      </p>

      <p>
        Caso não tenha confirmado dentro do prazo,
        você poderá entrar em contato com os noivos
        para consultar a possibilidade de inclusão
        na lista de convidados.
      </p>

      <p class="aviso-importante">
        <strong>
          A inclusão estará sujeita à disponibilidade
          de vagas e não poderá ser garantida.
        </strong>
      </p>

      <p>Agradecemos sua compreensão e carinho!</p>

      <p>
        <small>
          Quem já confirmou poderá cancelar sua
          presença individualmente a qualquer momento.
        </small>
      </p>
    `;
    return;
  }

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(deadline);

  aviso.innerHTML = `
    <h3>Prazo para confirmação</h3>

    <p id="dataLimite">Confirme até ${dataFormatada}</p>

    <p class="aviso-importante">
      <strong>ATENÇÃO!</strong>
      A confirmação de presença é obrigatória
      para acesso ao evento.
    </p>

    <p>
      A entrada será permitida somente às pessoas
      que tiverem seus nomes confirmados
      na lista da portaria.
    </p>

    <p>
      Devido ao número limitado de convidados,
      <strong>
        quem não confirmar sua presença dentro
        do prazo não poderá entrar no evento.
      </strong>
    </p>
  `;
}

function atualizarContador() {
  const contador = $('contadorPresenca');
  if (!contador) return;

  if (!deadline || expired()) {
    contador.hidden = true;
    atualizarAvisoPrazo();
    return;
  }

  contador.hidden = false;

  const restante = Math.max(
    0,
    Math.ceil((deadline.getTime() - Date.now()) / 1000)
  );

  const valores = {
    dias: Math.floor(restante / 86400),
    horas: Math.floor((restante % 86400) / 3600),
    minutos: Math.floor((restante % 3600) / 60),
    segundos: restante % 60
  };

  for (const [id, valor] of Object.entries(valores)) {
    const elemento = $(id);
    if (elemento) {
      elemento.textContent = String(valor).padStart(2, '0');
    }
  }
}

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
    atualizarAvisoPrazo();
    atualizarContador();

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

setInterval(() => {
  atualizarContador();
  updateControls();
}, 1000);
    $('rsvpForm').addEventListener('submit', e => { e.preventDefault(); const names = selected(); if (!names.length) { message('Selecione ao menos uma pessoa ou use “Ninguém poderá comparecer”.'); return; } save('yes', names); });
    $('declineBtn').addEventListener('click', () => { if (confirm('Confirmar que ninguém desta família poderá comparecer?')) { document.querySelectorAll('input[name="member"]').forEach(el => el.checked = false); save('no', []); } });
  } catch (err) { message('Não foi possível abrir o convite. Confira a configuração do Firebase e tente novamente.'); console.error(err); }
}
init();
