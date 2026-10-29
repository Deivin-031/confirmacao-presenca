# Contribuição a desejar do convidado 😊

1. Substitua os arquivos do site no GitHub pelos arquivos deste ZIP.
2. No Cloudflare, abra o Worker `casamento-pagamentos`, substitua TODO o código pelo arquivo `worker-casamento-contribuicao.js` incluído na raiz do ZIP e clique em Deploy.
3. Não é necessário criar manualmente o presente no D1: o Worker cria um registro inativo de referência na primeira contribuição.
4. Teste em sandbox com um valor sugerido e outro digitado. Confirme no painel administrativo o valor e status.
5. O valor mínimo é R$ 1,00 e o máximo R$ 1.000.000,00. O valor é validado novamente no Worker.
6. As compras de presentes comuns continuam funcionando.

Importante: mantenha as variáveis e segredos já configurados no Cloudflare.
