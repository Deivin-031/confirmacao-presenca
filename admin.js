
import { auth, db } from './firebase.js';

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const $ = id => document.getElementById(id);

let families = [];

function feedback(msg) {
  $('feedback').textContent = msg;
}

// LINK CURTO DE CONVITE
function inviteLink(id) {
  return new URL(
    `./?c=${encodeURIComponent(id)}`,
    location.href
  ).href;
}

// GERA CÓDIGO ALEATÓRIO DE 8 CARACTERES
function token() {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const bytes = new Uint8Array(16);
  let result = '';

  while (result.length < 8) {
    crypto.getRandomValues(bytes);

    for (const byte of bytes) {
      if (byte < 248 && result.length < 8) {
        result += alphabet[byte % 62];
      }
    }
  }

  return result;
}

// CADASTRA FAMÍLIA SEM REPETIR CÓDIGO
async function createFamilyWithUniqueToken(data) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = token();
    const ref = doc(db, 'families', id);

    const created = await runTransaction(
      db,
      async transaction => {
        const existing = await transaction.get(ref);

        if (existing.exists()) {
          return false;
        }

        transaction.set(ref, data);
        return true;
      }
    );

    if (created) {
      return id;
    }
  }

  throw new Error(
    'Não foi possível gerar um convite exclusivo.'
  );
}

// PREPARA CÉLULAS DO CSV
function csvCell(v) {
  return '"' +
    String(v ?? '')
      .replace(/^[=+\-@\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
}

// EXPORTA CONFIRMAÇÕES
function exportCsv() {
  const rows = [[
    'Família',
    'Integrante',
    'Resposta da família',
    'Presença do integrante',
    'Link'
  ]];

  for (const f of families) {
    for (const m of f.members) {
      rows.push([
        f.name,
        m,
        f.status === 'yes'
          ? 'Confirmada'
          : f.status === 'no'
            ? 'Recusada'
            : 'Pendente',
        f.status === 'pending'
          ? 'Pendente'
          : f.attending.includes(m)
            ? 'Sim'
            : 'Não',
        inviteLink(f.id)
      ]);
    }
  }

  const blob = new Blob(
    [
      '\uFEFF' +
      rows
        .map(row => row.map(csvCell).join(';'))
        .join('\r\n')
    ],
    { type: 'text/csv;charset=utf-8' }
  );

  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);

  a.href = url;
  a.download = 'confirmacoes.csv';
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// EXIBE ESTATÍSTICAS E FAMÍLIAS
function render() {
  const confirmed = families.filter(
    f => f.status === 'yes'
  );

  const declined = families.filter(
    f => f.status === 'no'
  );

  const pending = families.filter(
    f => f.status === 'pending'
  );

  const people = families.flatMap(
    f => f.members
  );

  const attending = confirmed.reduce(
    (sum, f) => sum + f.attending.length,
    0
  );

  const stats = [
    ['Famílias', families.length],
    ['Confirmadas', confirmed.length],
    ['Recusadas', declined.length],
    ['Pendentes', pending.length],
    ['Pessoas convidadas', people.length],
    ['Pessoas confirmadas', attending]
  ];

  $('stats').replaceChildren(
    ...stats.map(([label, value]) => {
      const el = document.createElement('div');
      el.className = 'stat';

      const b = document.createElement('strong');
      b.textContent = value;

      const s = document.createElement('span');
      s.textContent = label;

      el.append(b, s);
      return el;
    })
  );

  const query = $('search')
    .value
    .toLocaleLowerCase('pt-BR')
    .trim();

  const list = $('familiesList');
  list.replaceChildren();

  const filtered = families.filter(
    f => [f.name, ...f.members]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
      .includes(query)
  );

  if (!filtered.length) {
    const p = document.createElement('p');
    p.textContent = 'Nenhuma família encontrada.';
    list.append(p);
  }

  for (const f of filtered) {
    const article = document.createElement('article');
    article.className = 'family-card';

    const heading = document.createElement('h3');
    heading.textContent = f.name;

    const status = document.createElement('span');
    status.className = `status ${f.status}`;

    status.textContent =
      f.status === 'yes'
        ? 'Confirmada'
        : f.status === 'no'
          ? 'Recusada'
          : 'Pendente';

    const names = document.createElement('p');

    names.textContent = f.members.map(
      m => `${m}${
        f.status !== 'pending'
          ? (
              f.attending.includes(m)
                ? ' ✓'
                : ' —'
            )
          : ''
      }`
    ).join(' · ');

    const actions = document.createElement('div');
    actions.className = 'actions';

    // COPIAR LINK
    const copy = document.createElement('button');
    copy.className = 'outline';
    copy.textContent = 'Copiar convite';

    copy.onclick = async () => {
      const link = inviteLink(f.id);

      try {
        await navigator.clipboard.writeText(link);
        feedback(`Link da ${f.name} copiado.`);
      } catch {
        prompt('Copie o link:', link);
      }
    };

    // EXCLUIR FAMÍLIA
    const del = document.createElement('button');
    del.className = 'danger outline';
    del.textContent = 'Excluir';

    del.onclick = async () => {
      if (!confirm(
        `Excluir ${f.name}? O link deixará de funcionar.`
      )) {
        return;
      }

      try {
        await deleteDoc(
          doc(db, 'families', f.id)
        );

        feedback('Família excluída.');
        await load();

      } catch (e) {
        feedback(
          'Erro ao excluir. Verifique as permissões.'
        );
        console.error(e);
      }
    };

    actions.append(copy, del);

    article.append(
      heading,
      status,
      names,
      actions
    );

    list.append(article);
  }
}

// CARREGA FAMÍLIAS
async function load() {
  const snap = await getDocs(
    collection(db, 'families')
  );

  families = snap.docs.map(
    d => ({
      id: d.id,
      ...d.data()
    })
  );

  families.sort(
    (a, b) => a.name.localeCompare(
      b.name,
      'pt-BR'
    )
  );

  render();
}

// CARREGA PRAZO
async function loadDeadline() {
  const snap = await getDoc(
    doc(db, 'settings', 'rsvp')
  );

  if (!snap.exists() || !snap.data().deadline) {
    $('deadlineInfo').textContent =
      'Nenhum prazo configurado. Defina um antes de enviar os convites.';
    return;
  }

  const date = snap.data().deadline.toDate();

  const br = new Intl.DateTimeFormat(
    'sv-SE',
    {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }
  ).format(date).replace(' ', 'T');

  $('deadline').value = br;

  $('deadlineInfo').textContent =
    'Prazo atual: ' +
    date.toLocaleString(
      'pt-BR',
      { timeZone: 'America/Sao_Paulo' }
    );
}

// SALVA PRAZO
$('deadlineForm').addEventListener(
  'submit',
  async e => {
    e.preventDefault();

    const value = $('deadline').value;

    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return;
    }

    const [datePart, timePart] = value.split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min] = timePart.split(':').map(Number);

    const utcGuess = Date.UTC(
      y,
      m - 1,
      d,
      h,
      min
    );

    const fmt = new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: 'America/Sao_Paulo',
        timeZoneName: 'shortOffset'
      }
    );

    const offsetLabel = fmt
      .formatToParts(new Date(utcGuess))
      .find(x => x.type === 'timeZoneName')
      .value;

    const match = offsetLabel.match(
      /GMT([+-])(\d{1,2})(?::(\d{2}))?/
    );

    if (!match) {
      feedback(
        'Não foi possível identificar o fuso de Brasília.'
      );
      return;
    }

    const offset =
      (match[1] === '+' ? 1 : -1) *
      (
        Number(match[2]) * 60 +
        Number(match[3] || 0)
      );

    const instant = new Date(
      utcGuess - offset * 60000
    );

    $('deadlineBtn').disabled = true;

    try {
      await setDoc(
        doc(db, 'settings', 'rsvp'),
        {
          deadline: Timestamp.fromDate(instant)
        }
      );

      await loadDeadline();
      feedback('Prazo atualizado com sucesso.');

    } catch (err) {
      console.error(err);

      feedback(
        'Erro ao salvar o prazo. Confira as regras do Firestore.'
      );

    } finally {
      $('deadlineBtn').disabled = false;
    }
  }
);

// LOGIN
$('loginForm').addEventListener(
  'submit',
  async e => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(
        auth,
        $('email').value.trim(),
        $('password').value
      );

      feedback('');

    } catch (err) {
      feedback(
        'Não foi possível entrar. Confira e-mail, senha e configuração do Firebase.'
      );
      console.error(err);
    }
  }
);

// LOGOUT
$('logout').onclick = () => signOut(auth);

// EXPORTAR
$('export').onclick = exportCsv;

// PESQUISAR
$('search').addEventListener(
  'input',
  render
);

// CADASTRAR NOVA FAMÍLIA
$('createForm').addEventListener(
  'submit',
  async e => {
    e.preventDefault();

    const name = $('newName').value.trim();

    const members = [
      ...new Set(
        $('newMembers')
          .value
          .split(/\r?\n/)
          .map(s => s.trim())
          .filter(Boolean)
      )
    ];

    if (
      !name ||
      !members.length ||
      members.length > 50 ||
      members.some(s => s.length > 100)
    ) {
      feedback(
        'Informe um nome e entre 1 e 50 integrantes (até 100 caracteres por nome).'
      );
      return;
    }

    $('createBtn').disabled = true;

    try {
      const id = await createFamilyWithUniqueToken({
        name,
        members,
        status: 'pending',
        attending: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      $('createForm').reset();

      const link = inviteLink(id);

      $('newLink').textContent =
        `Convite criado: ${link}`;

      await load();

      feedback(
        'Família cadastrada com sucesso.'
      );

    } catch (err) {
      feedback(
        'Não foi possível cadastrar. Verifique se seu e-mail é administrador nas regras.'
      );

      console.error(err);

    } finally {
      $('createBtn').disabled = false;
    }
  }
);

// AUTENTICAÇÃO DO ADMINISTRADOR
onAuthStateChanged(
  auth,
  async user => {
    $('loginSection').hidden = !!user;
    $('dashboard').hidden = !user;

    if (user) {
      try {
        await Promise.all([
          load(),
          loadDeadline()
        ]);

        feedback('');

      } catch (err) {
        feedback(
          'Acesso negado. Confira se este e-mail está autorizado nas regras do Firestore.'
        );

        console.error(err);
      }

    } else {
      families = [];
      $('familiesList').replaceChildren();
    }
  }
);


// GERENCIAMENTO DE PRESENTES E PEDIDOS NO CLOUDFLARE D1
const ADMIN_API = 'https://casamento-pagamentos.davy-dado.workers.dev';
let adminGifts = [];
async function adminRequest(path, method = 'GET', body) {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre no painel novamente.');
  const token = await user.getIdToken();
  const r = await fetch(ADMIN_API + path, {
    method,
    headers: { 'Authorization': 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Falha ao acessar o Worker (' + r.status + ')');
  return data;
}
function setAdminTab(gifts) {
  $('guestsArea').hidden = gifts;
  $('giftsArea').hidden = !gifts;
  $('tabGuests').classList.toggle('selected', !gifts);
  $('tabGifts').classList.toggle('selected', gifts);
  if (gifts) refreshGiftAdmin();
}
$('tabGuests').onclick = () => setAdminTab(false);
$('tabGifts').onclick = () => setAdminTab(true);
const reais = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
function resetGiftForm() {
  $('giftForm').reset();
  $('giftId').value = '';
  $('giftStock').value = '0';
  $('giftActive').checked = true;
  $('giftFormTitle').textContent = 'Adicionar presente';
}
$('giftCancel').onclick = resetGiftForm;
async function refreshGiftAdmin() {
  try {
    const [g, o] = await Promise.all([
      adminRequest('/api/admin/gifts'),
      adminRequest('/api/admin/orders')
    ]);
    adminGifts = g.gifts || [];
    const list = $('adminGiftsList');
    list.replaceChildren();
    for (const gift of adminGifts) {
      const card = document.createElement('article');
      card.className = 'family-card';
      const title = document.createElement('h3');
      title.textContent = gift.name + ' — ' + reais(gift.price_cents);
      const details = document.createElement('p');
      details.textContent = `${gift.category || 'Sem categoria'} · ${gift.active ? 'Disponível' : 'Oculto'} · Estoque: ${gift.stock === 0 ? 'Ilimitado' : gift.stock}`;
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'outline'; edit.textContent = 'Editar';
      edit.onclick = () => {
        $('giftId').value = gift.id;
        $('giftName').value = gift.name;
        $('giftDescription').value = gift.description || '';
        $('giftPrice').value = (gift.price_cents / 100).toFixed(2);
        $('giftCategory').value = gift.category || '';
        $('giftImage').value = gift.image_url || '';
        $('giftStock').value = gift.stock;
        $('giftActive').checked = !!gift.active;
        $('giftFormTitle').textContent = 'Editar presente';
        $('giftForm').scrollIntoView({ behavior: 'smooth' });
      };
      card.append(title, details, edit); list.append(card);
    }
    if (!adminGifts.length) list.textContent = 'Nenhum presente cadastrado.';
    const ordersList = $('adminOrdersList');
    ordersList.replaceChildren();
    for (const order of o.orders || []) {
      const card = document.createElement('article'); card.className = 'family-card';
      const title = document.createElement('h3'); title.textContent = `${order.buyer_name} — ${reais(order.total_cents)}`;
      const details = document.createElement('p');
      const statuses = { paid: 'Pago', pending: 'Pendente', rejected: 'Recusado', cancelled: 'Cancelado', refunded: 'Reembolsado', charged_back: 'Contestação' };
      details.textContent = `${statuses[order.status] || order.status} · ${order.created_at || ''} · Pagamento: ${order.mp_payment_id || '—'}`;
      card.append(title, details); ordersList.append(card);
    }
    if (!(o.orders || []).length) ordersList.textContent = 'Nenhum pedido registrado.';
    feedback('Presentes e pedidos atualizados.');
  } catch (e) { feedback('Não foi possível carregar presentes e pedidos: ' + e.message); console.error(e); }
}
$('refreshOrders').onclick = refreshGiftAdmin;
$('giftForm').addEventListener('submit', async event => {
  event.preventDefault();
  const cents = Math.round(Number($('giftPrice').value) * 100);
  const body = {
    name: $('giftName').value.trim(), description: $('giftDescription').value.trim(),
    price_cents: cents, category: $('giftCategory').value.trim(),
    image_url: $('giftImage').value.trim(), stock: Number($('giftStock').value),
    active: $('giftActive').checked
  };
  if (!Number.isSafeInteger(cents) || cents < 1) return feedback('Valor inválido.');
  $('giftSave').disabled = true;
  try {
    const id = $('giftId').value;
    await adminRequest(id ? '/api/admin/gifts/' + encodeURIComponent(id) : '/api/admin/gifts', id ? 'PUT' : 'POST', body);
    resetGiftForm(); await refreshGiftAdmin(); feedback('Presente salvo com sucesso.');
  } catch (e) { feedback('Erro ao salvar presente: ' + e.message); }
  finally { $('giftSave').disabled = false; }
});
