// Os preços são definidos exclusivamente no D1.
const API = 'https://casamento-pagamentos.davy-dado.workers.dev';
const carrinho = {};
const CONTRIB_ID = "contribuicao-livre-convidado";
let contribuicaoCentavos = 0;
let presentes = [];
const moeda = centavos => (centavos/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const params = new URLSearchParams(location.search);
const codigo = params.get('c');
if (codigo && /^[A-Za-z0-9]{8}$/.test(codigo)) {
  document.getElementById('voltar').href = 'index.html?c='+encodeURIComponent(codigo)+'#presentes';
}
const catalogo = document.getElementById('catalogo');
const pagar = document.getElementById('pagar');
const aviso = document.getElementById('aviso-pagamento');
const mensagemStatus = (texto, erro=false) => {
  aviso.textContent = texto;
  aviso.style.color = erro ? '#a11932' : '#665b60';
};
function atualizar() {
  const itens = document.getElementById('itens');
  itens.replaceChildren();
  let total=0, quantidade=0;
  for (const p of presentes) {
    const q=carrinho[p.id]||0;
    if (!q) continue;
    total+=p.price_cents*q; quantidade+=q;
    const linha=document.createElement('div'); linha.className='item';
    const info=document.createElement('span'); info.textContent=p.name+' × '+q;
    const botoes=document.createElement('div');
    const menos=document.createElement('button'); menos.textContent='−';
    menos.setAttribute('aria-label','Remover um '+p.name);
    menos.onclick=()=>{carrinho[p.id]=Math.max(0,q-1);atualizar();};
    const mais=document.createElement('button'); mais.textContent='+';
    mais.setAttribute('aria-label','Adicionar um '+p.name);
    mais.onclick=()=>{if(q<20){carrinho[p.id]=q+1;atualizar();}};
    botoes.append(menos,mais); linha.append(info,botoes); itens.append(linha);
  }
  if (contribuicaoCentavos > 0) {
    total += contribuicaoCentavos; quantidade++;
    const linha = document.createElement('div'); linha.className='item';
    const info = document.createElement('span');
    info.textContent = 'Contribuição a desejar do convidado 😊 — ' + moeda(contribuicaoCentavos);
    const remover = document.createElement('button');
    remover.textContent = 'Remover';
    remover.onclick = () => { contribuicaoCentavos = 0; atualizar(); };
    linha.append(info, remover); itens.append(linha);
  }
  if (!quantidade) itens.textContent='Nenhum presente selecionado ainda.';
  document.getElementById('quantidade').textContent=quantidade;
  document.getElementById('total').textContent=moeda(total);
  pagar.disabled=!quantidade;
  const flutuante = document.getElementById('abrir-carrinho');
  document.getElementById('flutuante-quantidade').textContent = '(' + quantidade + ')';
  document.getElementById('flutuante-total').textContent = moeda(total);
  flutuante.hidden = quantidade === 0;

}
function desenhar() {
  catalogo.replaceChildren();
  // A contribuicao especial aparece mesmo sem presentes cadastrados.

  for(const p of presentes) {
    const card=document.createElement('article'); card.className='presente';
    const imagem=document.createElement('div'); imagem.className='ilustracao';
    if(p.image_url && /^https:\/\//i.test(p.image_url)) {
      const img=document.createElement('img');img.src=p.image_url;img.alt=p.name;img.loading='lazy';
      imagem.append(img);
    } else imagem.textContent='🎁';
    const nome=document.createElement('h3');nome.textContent=p.name;
    const desc=document.createElement('p');desc.textContent=p.description||'Presente para os noivos';
    const preco=document.createElement('strong');preco.textContent=moeda(p.price_cents);
    const botao=document.createElement('button');botao.textContent='Adicionar ao carrinho';
    botao.onclick=()=>{if((carrinho[p.id]||0)<20){carrinho[p.id]=(carrinho[p.id]||0)+1;atualizar();}};
    card.append(imagem,nome,desc,preco,botao);catalogo.append(card);
  }
  const card = document.createElement('article'); card.className='presente contribuicao-card';
  card.innerHTML = `<div class="ilustracao">😊</div>
    <h3>Contribuição a desejar do convidado 😊</h3>
    <p>Sua presença já é um presente especial! Mas, se desejar nos presentear, escolha o valor com carinho. Ficaremos muito felizes com sua contribuição! ❤️</p>
    <div class="valores-contribuicao" role="group" aria-label="Valores sugeridos">
      <button type="button" data-centavos="5000">R$ 50</button>
      <button type="button" data-centavos="10000">R$ 100</button>
      <button type="button" data-centavos="20000">R$ 200</button>
    </div>
    <label class="contribuicao-label" for="valor-contribuicao">Ou digite outro valor (R$)</label>
    <input id="valor-contribuicao" type="text" inputmode="decimal" placeholder="Ex.: 75,00" autocomplete="off" />
    <button type="button" class="adicionar-contribuicao">Adicionar contribuição ao carrinho</button>
    <p class="contribuicao-aviso" role="status" aria-live="polite"></p>`;
  const input = card.querySelector('#valor-contribuicao');
  const alerta = card.querySelector('.contribuicao-aviso');
  card.querySelectorAll('[data-centavos]').forEach(botao => {
    botao.addEventListener('click', () => {
      input.value = moeda(Number(botao.dataset.centavos)).replace('R$','').trim();
      alerta.textContent = '';
      card.querySelectorAll('[data-centavos]').forEach(b => b.classList.toggle('selecionado', b === botao));
    });
  });
  input.addEventListener('input', () => card.querySelectorAll('[data-centavos]').forEach(b => b.classList.remove('selecionado')));
  card.querySelector('.adicionar-contribuicao').addEventListener('click', () => {
    const raw = input.value.trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
    const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
    if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(normalized)) {
      alerta.textContent = 'Informe um valor válido, por exemplo 75,00.'; return;
    }
    const cents = Math.round(Number(normalized) * 100);
    if (!Number.isSafeInteger(cents) || cents < 100 || cents > 100000000) {
      alerta.textContent = 'Escolha um valor entre R$ 1,00 e R$ 1.000.000,00.'; return;
    }
    contribuicaoCentavos = cents;
    atualizar();
    alerta.textContent = 'Contribuição adicionada ao carrinho!';
  });
  catalogo.prepend(card);
}
async function carregar() {
  catalogo.textContent='Carregando presentes...';
  try {
    const r=await fetch(API+'/api/gifts',{cache:'no-store'});
    if(!r.ok) throw Error('Não foi possível consultar o catálogo');
    const data=await r.json();
    if(!Array.isArray(data.gifts))throw Error('Resposta inválida');
    presentes=data.gifts.filter(p=>typeof p.id==='string'&&Number.isSafeInteger(p.price_cents)&&p.price_cents>0);
    desenhar();atualizar();
  } catch(e) {
    catalogo.textContent='Não foi possível carregar os presentes. Atualize a página para tentar novamente.';
    mensagemStatus('Erro de conexão com o catálogo.',true);
  }
}
pagar.addEventListener('click',async()=>{
  const nome=document.getElementById('nome').value.trim();
  if(nome.length<2){mensagemStatus('Informe seu nome para continuar.',true);document.getElementById('nome').focus();return;}
  const items=Object.entries(carrinho).filter(([,quantity])=>quantity>0).map(([id,quantity])=>({id,quantity}));
  if (contribuicaoCentavos > 0) {
    items.push({id: CONTRIB_ID, quantity: 1, amount_cents: contribuicaoCentavos});
  }
  if(!items.length)return;
  pagar.disabled=true;pagar.textContent='Preparando pagamento...';
  mensagemStatus('Conectando ao Mercado Pago...');
  try {
    const r=await fetch(API+'/api/checkout',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({buyer_name:nome,items})
    });
    const data=await r.json();
    if(!r.ok||!data.checkout_url||!/^https:\/\/[^/]*mercadopago\./i.test(data.checkout_url)) {
      throw Error(data.error||'Não foi possível iniciar o checkout.');
    }
    location.assign(data.checkout_url);
  } catch(e) {
    mensagemStatus('Não foi possível iniciar o pagamento: '+e.message,true);
    pagar.disabled=false;pagar.textContent='Ir para pagamento';
  }
});
carregar();

// Atalho para o carrinho no celular, sem alterar o checkout.
const atalhoCarrinho = document.getElementById('abrir-carrinho');
atalhoCarrinho.addEventListener('click', () => {
  const painel = document.getElementById('painel-carrinho');
  painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const nome = document.getElementById('nome');
  if (nome) setTimeout(() => nome.focus({preventScroll:true}), 450);
});
