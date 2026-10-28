# Confirmação de presença por família — GitHub Pages + Firebase

Projeto estático em português, com convites individuais, confirmação por integrante, painel administrativo, exportação CSV e banco de dados Firestore.

## 1. Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com/ e clique em **Adicionar projeto**.
2. Crie um projeto (por exemplo `casamento-presencas`).
3. No projeto, vá a **Authentication > Sign-in method** e ative **E-mail/senha** e **Anônimo**.
4. Em **Authentication > Users**, crie manualmente o usuário administrador com **seu e-mail** e uma senha forte. Não coloque essa senha no código.
5. Vá a **Firestore Database > Create database** e escolha uma região próxima. Inicie com regras de produção (não deixe o banco aberto).
6. Em **Project settings > Your apps**, registre um aplicativo **Web** (`</>`) e copie os campos de configuração do Firebase.
7. Abra `config.js` e substitua todos os valores de exemplo pelos valores da configuração do aplicativo Web.
8. Abra `firestore.rules` e substitua `SEU_EMAIL_ADMIN_AQUI` pelo e-mail exato do usuário administrador criado na etapa 4.
9. No console Firebase, em **Firestore Database > Rules**, cole o conteúdo completo de `firestore.rules` e clique em **Publish**.
10. Em **Authentication > Settings > Authorized domains**, adicione `SEUUSUARIO.github.io` (sem `https://` nem caminho), caso não esteja na lista.

**IMPORTANTE:** não publique o projeto antes de aplicar as regras de segurança. A configuração web do Firebase pode aparecer no código público; a senha de administrador não pode.

## 2. Publicar no GitHub Pages

1. Acesse https://github.com/new e crie um repositório **Public** chamado `confirmacao-presenca`.
2. No repositório, clique em **Add file > Upload files** e envie os arquivos da pasta `rsvp-familias` para a **raiz** do repositório (não envie uma pasta envolvendo todos eles).
3. Clique em **Commit changes**.
4. Vá a **Settings > Pages**. Em **Build and deployment**, selecione **Deploy from a branch** e escolha a branch `main` e a pasta `/ (root)`. Salve.
5. Aguarde a publicação. O endereço será parecido com `https://SEUUSUARIO.github.io/confirmacao-presenca/`.
6. Acesse `https://SEUUSUARIO.github.io/confirmacao-presenca/admin.html` e entre com o e-mail/senha cadastrados no Firebase.
7. Cadastre uma família de teste, copie o link gerado e abra-o em janela anônima ou outro navegador. Confirme alguns integrantes. Volte ao painel e atualize a página para ver o resultado.

## 3. Como usar

- **Adicionar família:** informe o nome da família e os nomes dos integrantes, um por linha. Clique em **Cadastrar e gerar link**.
- **Enviar convite:** no painel, clique em **Copiar convite** e envie esse link individual pelo WhatsApp para a família.
- **Responder:** a família marca os integrantes que irão ou clica em **Ninguém poderá comparecer**.
- **Alterar resposta:** basta abrir o mesmo link novamente e atualizar a seleção.
- **Consultar:** o painel mostra totais de famílias e pessoas confirmadas. Atualize a página para carregar respostas recentes.
- **Exportar:** clique em **Exportar CSV** para baixar um arquivo que abre no Excel. O arquivo contém dados pessoais; guarde com cuidado.
- **Excluir:** exclui uma família e invalida seu convite; não há recuperação automática.

## 4. Observações importantes de segurança e funcionamento

- Cada convite usa um identificador aleatório criptograficamente forte de 192 bits. **Quem tiver o link poderá ver os nomes e responder pela família**. Isso é intencional para dispensar cadastro dos convidados. Não publique os links em redes sociais.
- O banco de dados **não permite que convidados listem todas as famílias**. Convidados só podem ler um convite cujo código conheçam e alterar os campos de resposta. O painel requer login e e-mail autorizado pelas regras.
- O painel não faz atualização em tempo real: use atualizar/recarregar a página para ver novas confirmações.
- Evite cadastrar dados sensíveis. Informe os convidados sobre o uso de nomes e confirmações para organizar o evento, de acordo com as regras de privacidade aplicáveis.
- O plano gratuito do Firebase tem cotas. Consulte os limites vigentes no console Firebase.
- Se trocar de repositório, confira os links. Se usar domínio próprio, configure-o nos domínios autorizados do Firebase Authentication.
- O projeto não tem prazo-limite de confirmação, notificações automáticas ou edição dos integrantes pelo painel. Você pode solicitar essas melhorias depois.

## 5. Arquivos

- `index.html`, `guest.js`: página e lógica do convidado.
- `admin.html`, `admin.js`: login, cadastro, acompanhamento e exportação.
- `styles.css`: aparência do site.
- `config.js`: configurações do aplicativo Firebase (substituir).
- `firebase.js`: inicialização dos serviços Firebase.
- `firestore.rules`: regras de acesso que precisam ser publicadas no console Firebase.

## 6. Problemas comuns

- **Permission denied:** e-mail administrador nas regras não confere; regras não foram publicadas; ou métodos de login não foram habilitados.
- **auth/unauthorized-domain:** inclua `SEUUSUARIO.github.io` nos domínios autorizados.
- **Convite não encontrado:** confira se o link foi copiado inteiro e se a família ainda está cadastrada.
- **Página vazia:** confira `config.js`, console do navegador e se os arquivos foram enviados para a raiz do repositório.
