// Catálogo demonstrativo: altere nomes, valores e descrições antes de publicar.
const presentes = [
  {id:'cafe', nome:'Cafeteira', valor:250, emoji:'☕', descricao:'Para começar nossos dias juntos'},
  {id:'panelas', nome:'Jogo de panelas', valor:350, emoji:'🍳', descricao:'Para nossas receitas favoritas'},
  {id:'jantar', nome:'Jogo de jantar', valor:220, emoji:'🍽️', descricao:'Para receber quem amamos'},
  {id:'cama', nome:'Jogo de cama', valor:180, emoji:'🛏️', descricao:'Para noites aconchegantes'},
  {id:'lua', nome:'Lua de mel', valor:500, emoji:'✈️', descricao:'Para criar novas memórias'},
  {id:'casa', nome:'Nosso novo lar', valor:100, emoji:'🏡', descricao:'Uma contribuição especial'}
];
const carrinho = {};
const moeda = n => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const params = new URLSearchParams(location.search), codigo = params.get('c');
if (codigo && /^[A-Za-z0-9]{8}$/.test(codigo)) document.getElementById('voltar').href='index.html?c='+encodeURIComponent(codigo)+'#presentes';
const catalogo=document.getElementById('catalogo');
presentes.forEach(p=>{const card=document.createElement('article');card.className='presente';
const imagem=document.createElement('div');imagem.className='ilustracao';imagem.textContent=p.emoji;
const nome=document.createElement('h3');nome.textContent=p.nome;
const desc=document.createElement('p');desc.textContent=p.descricao;
const preco=document.createElement('strong');preco.textContent=moeda(p.valor);
const botao=document.createElement('button');botao.textContent='Adicionar ao carrinho';botao.addEventListener('click',()=>{carrinho[p.id]=(carrinho[p.id]||0)+1;atualizar()});
card.append(imagem,nome,desc,preco,botao);catalogo.append(card)});
function atualizar(){const itens=document.getElementById('itens');itens.replaceChildren();let total=0,quantidade=0;
for(const p of presentes){const q=carrinho[p.id]||0;if(!q)continue;total+=p.valor*q;quantidade+=q;
const linha=document.createElement('div');linha.className='item';const info=document.createElement('span');info.textContent=p.nome+' × '+q;
const botoes=document.createElement('div');const menos=document.createElement('button');menos.textContent='−';menos.setAttribute('aria-label','Remover um '+p.nome);menos.onclick=()=>{carrinho[p.id]--;atualizar()};const mais=document.createElement('button');mais.textContent='+';mais.setAttribute('aria-label','Adicionar um '+p.nome);mais.onclick=()=>{carrinho[p.id]++;atualizar()};botoes.append(menos,mais);linha.append(info,botoes);itens.append(linha)}
if(!quantidade)itens.textContent='Nenhum presente selecionado ainda.';
document.getElementById('quantidade').textContent=quantidade;document.getElementById('total').textContent=moeda(total)}
atualizar();
