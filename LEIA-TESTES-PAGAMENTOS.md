# Integração de presentes — TESTE

- A página `presentes.html` lê o catálogo da rota pública `/api/gifts` no Cloudflare Worker.
- O carrinho envia itens e nome para `/api/checkout`. Os valores são consultados no D1 pelo Worker.
- O botão redireciona ao checkout de teste. Não habilite credenciais reais antes de uma auditoria e testes completos.
- A mensagem do convidado permanece apenas na página, pois a API atual não tem campo para salvá-la.
- O RSVP e a página administrativa original não foram alterados.

## Pendências obrigatórias antes da produção

1. Confirmar a criação de preferência no Mercado Pago com credenciais de teste e testar o retorno de checkout.
2. Endurecer o webhook: verificar assinatura e vincular pagamento à preferência/conta correta, lidar com reembolso/chargeback e falhas de processamento com retentativas.
3. Proteger contra abuso do checkout (rate limiting, Turnstile e limites), implementar idempotência e controle de estoque concorrente.
4. Implementar autenticação administrativa para gestão de presentes e pedidos; atualmente não foi adicionada uma API de administração.
5. Revisar política de privacidade e minimização de dados, e confirmar meios de pagamento disponíveis no checkout.
6. Se o navegador bloquear requisições por CORS, confirmar que SITE_ORIGIN é exatamente `https://deivin-031.github.io`.
