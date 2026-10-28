# Atualização: prazo e cancelamento individual

1. No arquivo `firestore.rules`, troque `SEU_EMAIL_ADMIN_AQUI` e `SEGUNDO_EMAIL_ADMIN_AQUI` pelos e-mails exatos de seus administradores (ou remova o segundo endereço se houver apenas um).
2. No Firebase Console > Firestore Database > Rules, publique o conteúdo **completo** desse arquivo. O arquivo enviado ao GitHub não publica regras automaticamente.
3. No GitHub, envie/substitua `admin.html`, `admin.js`, `guest.js`, `index.html`, `config.js` e `firestore.rules`. Os demais arquivos podem permanecer.
4. Abra `admin.html`, entre com a conta de administrador e salve uma data/hora limite (horário de Brasília). O prazo é global para todas as famílias.
5. Teste com uma família fictícia: confirmar duas pessoas antes do prazo; colocar prazo no passado; tentar adicionar outra pessoa (deve falhar); cancelar apenas uma (deve funcionar); tentar reativá-la (deve falhar).

O Firestore usa `request.time` no servidor. Após o prazo, apenas reduções estritas da lista de confirmados são aceitas. Um convite sem resposta não pode confirmar após o prazo. A mudança de prazo pelo administrador é imediata. Para confirmar alguém depois do prazo, o administrador pode temporariamente reabrir o prazo.

**Observações:** mantenha o link de convite privado, pois quem o possui pode alterar a resposta da família. Faça testes com dados fictícios antes de usar com convidados reais. As regras de acesso à leitura permitem que o portador de um ID válido consulte os nomes daquela família; o ID tem 192 bits aleatórios.
