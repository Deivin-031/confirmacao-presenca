# Lista de presentes — etapa inicial

- A aba **Presentes** foi colocada depois da aba **Presença** no menu. O botão inicial de confirmação foi removido.
- `presentes.html` é uma página do mesmo projeto, com catálogo de exemplo e carrinho para múltiplos presentes.
- **Não há pagamentos ativos**: o botão está desativado intencionalmente.
- Antes de publicar, substitua os presentes e preços de exemplo no arquivo `presentes.js`.
- Para cobrar com Mercado Pago, é necessário backend seguro (ex.: Firebase Functions) criando preferências de checkout a partir de preços validados no servidor; configure as credenciais em segredos do backend, nunca no GitHub Pages.
- Configure notificações (webhooks) com validação de autenticidade, consulta de status no servidor, controle de duplicidade, e registro das compras aprovadas no Firestore com regras apropriadas. Não marque como pago com base apenas no retorno do navegador.
- Não alteramos as regras do Firebase nem o painel de RSVP.
- A página de presentes, por enquanto, não faz validação independente de convite; se precisar restringi-la a convidados, implemente validação de acesso no backend antes da publicação.
