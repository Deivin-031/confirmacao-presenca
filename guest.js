
import { auth, db } from './firebase.js';

import {
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const $ = id => document.getElementById(id);

const token = new URLSearchParams(location.search).get('c');

let family;
let deadline = null;
let lastAttending = [];
let saving = false;
let avisoEncerrado = false;

// VERIFICA SE O PRAZO TERMINOU
function expired() {
  return deadline !== null &&
    Date.now() >= deadline.getTime();
}

// ATUALIZA O AVISO DE PRAZO
function atualizarAvisoPrazo() {
  const aviso = $('avisoPrazo');

  if (!aviso) return;

  if (!deadline) {
    aviso.innerHTML = `
      <h3>Prazo para confirmação</h3>
      <p>Prazo ainda não definido.</p>
      <p class="aviso-importante">
        <strong>ATENÇÃO!</strong>
        A confirmação de presença é obrigatória
        para acesso ao evento.
      </p>
      <p>
        A entrada será permitida somente às pessoas
        confirmadas na lista da portaria.
      </p>
    `;
    return;
  }

  if (expired()) {
    if (avisoEncerrado) return;

    avisoEncerrado = true;

    aviso.innerHTML = `
      <h3>Prazo de confirmação encerrado</h3>

      <p class="aviso-importante">
        O período para confirmação de presença
        chegou ao fim.
      </p>

      <p>
        Devido ao número limitado de convidados,
        a entrada no evento será permitida
        exclusivamente às pessoas que confirmaram
        sua presença dentro do prazo estabelecido
        e permanecem na lista.
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

      <p>
        Agradecemos sua compreensão e carinho!
      </p>

      <p>
        <small>
          Quem já confirmou poderá cancelar sua
          presença individualmente a qualquer momento.
        </small>
      </p>
    `;

    return;
  }

  avisoEncerrado = false;

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

  aviso.innerHTML = `
    <h3>Prazo para confirmação</h3>

    <p id="dataLimite">
      Confirme até ${dataFormatada}
    </p>

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

// ATUALIZA O CRONÔMETRO
function atualizarContador() {
  const contador = $('contadorPresenca');

  if (!contador) return;

  if (!deadline) {
    contador.hidden = true;
    return;
  }

  const restante = deadline.getTime() - Date.now();

  if (restante <= 0) {
    contador.hidden = true;
    atualizarAvisoPrazo();
    return;
  }

  contador.hidden = false;

  const total = Math.ceil(restante / 1000);

  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  $('dias').textContent =
    String(dias).padStart(2, '0');

  $('horas').textContent =
    String(horas).padStart(2, '0');

  $('minutos').textContent =
    String(minutos).padStart(2, '0');

  $('segundos').textContent =
    String(segundos).padStart(2, '0');
}

// ATUALIZA OS BOTÕES
function updateControls() {
  const closed = expired();

  document
    .querySelectorAll('input[name="member"]')
    .forEach(el => {
      el.disabled =
        closed && !lastAttending.includes(el.value);
    });

  $('deadlineNotice').textContent = closed
    ? 'Prazo encerrado: você pode apenas desmarcar pessoas já confirmadas.'
    : 'Selecione as pessoas que estarão presentes:';

  $('confirmBtn').textContent = closed
    ? 'Salvar cancelamentos'
    : 'Confirmar selecionados';

  $('confirmBtn').disabled =
    saving || (closed && lastAttending.length === 0);

  $('declineBtn').disabled =
    saving || (closed && lastAttending.length === 0);
}

// MENSAGENS
function message(text) {
  $('message').textContent = text;
}

// JANELA CENTRAL DE CONFIRMAÇÃO
function mostrarConfirmacao(status, attending) {
  let modal = document.getElementById('modalConfirmacao');

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalConfirmacao';
    modal.className = 'modal-confirmacao';

    modal.innerHTML = `
      <div
        class="modal-confirmacao-caixa"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloConfirmacao"
        aria-describedby="textoConfirmacao"
      >
        <div class="modal-confirmacao-icone"
             aria-hidden="true">✓</div>

        <h2 id="tituloConfirmacao">
          Alteração realizada!
        </h2>

        <p id="textoConfirmacao"></p>

        <button type="button" id="fecharConfirmacao">
          OK
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  const texto = status === 'yes'
    ? `Confirmados: ${attending.join(', ')}`
    : 'Nenhum integrante confirmado.';

  $('textoConfirmacao').textContent = texto;

  modal.classList.add('visivel');

  const botao = $('fecharConfirmacao');

  function fechar() {
    modal.classList.remove('visivel');
    document.removeEventListener('keydown', aoPressionarTecla);
    $('confirmBtn').focus();
  }

  function aoPressionarTecla(evento) {
    if (evento.key === 'Escape') {
      fechar();
    }

    if (evento.key === 'Tab') {
      evento.preventDefault();
      botao.focus();
    }
  }

  botao.onclick = fechar;

  document.addEventListener('keydown', aoPressionarTecla);

  botao.focus();
}

// CONVIDADOS SELECIONADOS
function selected() {
  return [
    ...document.querySelectorAll(
      'input[name="member"]:checked'
    )
  ].map(el => el.value);
}

// SALVA A CONFIRMAÇÃO
async function save(status, attending) {
  if (saving) return;

  if (
    expired() &&
    (
      attending.some(
        name => !lastAttending.includes(name)
      ) ||
      (family.status !== 'yes' && attending.length)
    )
  ) {
    message(
      'Prazo encerrado. Não é possível adicionar ou reativar confirmações.'
    );
    return;
  }

  saving = true;
  updateControls();

  try {
    await updateDoc(
      doc(db, 'families', token),
      {
        status,
        attending,
        updatedAt: serverTimestamp()
      }
    );

    family.status = status;
    family.attending = attending;
    lastAttending = [...attending];

    message(
      expired()
        ? 'Cancelamento salvo. Após o prazo, não é possível confirmar novamente.'
        : 'Resposta salva com sucesso! Você pode voltar a este link para alterar sua resposta.'
    );

    $('lastStatus').textContent =
      status === 'yes'
        ? `Confirmados: ${attending.join(', ')}`
        : 'Nenhum integrante confirmado.';

    // EXIBE OS NOMES NO CENTRO DA TELA
    mostrarConfirmacao(status, attending);

  } catch (err) {
    message(
      'Não foi possível salvar. Verifique sua conexão e tente novamente.'
    );
    console.error(err);

  } finally {
    saving = false;
    updateControls();
  }
}

// CARREGA O CONVITE
async function init() {
  if (!token || !/^[A-Za-z0-9]{8}$/.test(token)) {
    message(
      'Convite inválido. Peça seu link individual ao organizador.'
    );
    return;
  }

  try {
    await signInAnonymously(auth);

    const snap = await getDoc(
      doc(db, 'families', token)
    );

    if (!snap.exists()) {
      message('Convite não encontrado.');
      return;
    }

    family = snap.data();

    lastAttending = [
      ...(family.attending || [])
    ];

    // BUSCA A DATA DEFINIDA NO ADMIN
    const settings = await getDoc(
      doc(db, 'settings', 'rsvp')
    );

    deadline =
      settings.exists() && settings.data().deadline
        ? settings.data().deadline.toDate()
        : null;

    // EXIBE AVISO E CRONÔMETRO
    atualizarAvisoPrazo();
    atualizarContador();

    // NOME DA FAMÍLIA
    $('familyName').textContent = family.name;

    // MONTA A LISTA DE CONVIDADOS
    const members = $('members');
    members.replaceChildren();

    family.members.forEach(name => {
      const label = document.createElement('label');
      label.className = 'member';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'member';
      input.value = name;

      input.checked =
        (family.attending || []).includes(name);

      const span = document.createElement('span');
      span.textContent = name;

      label.append(input, span);
      members.append(label);
    });

    // STATUS ATUAL
    $('lastStatus').textContent =
      family.status === 'pending'
        ? 'Ainda não há resposta registrada.'
        : family.status === 'no'
          ? 'Resposta atual: ninguém irá.'
          : `Resposta atual: ${(family.attending || []).join(', ')}`;

    $('message').textContent = '';
    $('family').hidden = false;

    updateControls();

    // ATUALIZA A CADA SEGUNDO
    setInterval(() => {
      atualizarContador();
      updateControls();
    }, 1000);

    // CONFIRMAR PRESENÇA
    $('rsvpForm').addEventListener(
      'submit',
      e => {
        e.preventDefault();

        const names = selected();

        if (!names.length) {
          message(
            'Selecione ao menos uma pessoa ou use “Ninguém poderá comparecer”.'
          );
          return;
        }

        save('yes', names);
      }
    );

    // CANCELAR PRESENÇA
    $('declineBtn').addEventListener(
      'click',
      () => {
        if (
          confirm(
            'Confirmar que ninguém desta família poderá comparecer?'
          )
        ) {
          document
            .querySelectorAll('input[name="member"]')
            .forEach(el => {
              el.checked = false;
            });

          save('no', []);
        }
      }
    );

  } catch (err) {
    message(
      'Não foi possível abrir o convite. Confira a configuração do Firebase e tente novamente.'
    );

    console.error(err);
  }
}

init();
