# Homem Forjado — Escrituras & vida

Aplicativo de estudo bíblico em português, com visual de manuscrito, feito a partir dos quatro PDFs fornecidos pelo usuário. Funciona como site estático, sem APIs pagas ou chaves de acesso.

## Executar

Requer Node.js 20 ou superior. Não há dependências para instalar.

```sh
npm run build
npm test
npm run dev
```

## Conteúdo e recursos

- Bíblia Livre 2018 completa: 66 livros, 1.189 capítulos, 31.102 versículos, busca e referências.
- Consulta em paralelo ao WLC (hebraico e trechos aramaicos) e Textus Receptus Stephanus 1550 (grego). Os capítulos não são um interlinear; as numerações podem diferir.
- 8 trilhas editoriais, 66 panoramas dos livros, linha do tempo e 30 verbetes introdutórios.
- 20 semanas, 120 reflexões extraídas do devocional fornecido e 20 dias de revisão criados para o app. O PDF recebido não contém 365 reflexões completas.
- Plano complementar de 365 dias que percorre exatamente uma vez todos os capítulos da Bíblia.
- Banco de 250 perguntas do PDF; 29 conferidas com referências, demais em revisão e fora da pontuação. Gabarito ausente na questão 237 preservado como ausente.
- Editor de pregações com salvamento local, inserção de versículos, perguntas-guia, exportação de texto e impressão/salvar PDF pelo navegador.
- Anotações, destaques, diário e progresso em localStorage; exportação e importação de backup JSON sem substituir registros já existentes.
- Service Worker para leitura offline; download opcional das 66 edições de consulta. Links aos PDFs pessoais e ao léxico externo precisam de conexão.

## Dados pessoais e materiais

Os PDFs originais não estão neste repositório. A biblioteca do app aponta para os arquivos pessoais no ChatGPT, que exigem o acesso do proprietário. Marcas com contatos presentes em um PDF não foram incorporadas ao conteúdo editorial. No modo sem conta, as notas e pregações ficam no navegador. Limpar os dados do site pode apagar esses registros; exporte um backup.

O projeto usa uma nova chave `homem-forjado-v2` e não apaga chaves anteriores. Para recuperar registros de uma versão antiga, seria necessário conhecer o formato daquela versão.

## Fontes e direitos

- Bíblia Livre (BLIVRE), © 2018 Diego Santos, Mario Sérgio e Marco Teles. Revisão da tradição de Almeida. Projeto: https://sites.google.com/site/biblialivre/ . Licença Creative Commons Atribuição 4.0: https://creativecommons.org/licenses/by/4.0/ . O texto foi apenas estruturado para o leitor, sem paráfrase dos versículos.
- Westminster Leningrad Codex, Westminster Hebrew Institute: https://tanach.us/Pages/Tanach.xml#License . Livre para copiar, distribuir e modificar sob suas condições. Texto em hebraico com os trechos aramaicos pertinentes.
- Textus Receptus (Stephanus 1550), domínio público, conforme os metadados do fornecedor.
- Dados estruturados: https://github.com/midvash/bible-data . Metadados de edição verificados durante a implementação.
- Reflexões devocionais: Paulo Marcondes, conforme o PDF fornecido. Mantidas com indicação das páginas de origem. Os outros três materiais são identificados por título; autoria não foi inferida quando não estava clara.
- Dicionário: definições introdutórias editoriais; os códigos Strong encaminham a verbetes do Blue Letter Bible para consulta externa.

As trilhas são sínteses e adaptações dos temas dos PDFs. Incluem distinções entre contexto, interpretação cristã e aplicação, e notas sobre erros e repetições dos materiais. Autoria e datas tradicionais não são apresentadas como consenso histórico. O cânon do leitor é o protestante; católicos e ortodoxos usam cânones diferentes.

## Implantação

Vercel: preset Other, comando de build `npm run build`, saída `dist`. O `vercel.json` inclui configuração estática e cabeçalhos básicos. Nenhuma variável de ambiente é necessária. A proteção de acesso é uma configuração da Vercel e deve ser preservada no projeto.

Os arquivos comprimidos em `assets/` contêm os dados bíblicos usados pelo build. O build expande os arquivos e copia `src/` para `dist/`. Os PDFs e a pasta `raw/` são entradas locais de preparação e não são necessários para compilar o aplicativo. Os scripts Python documentam a extração inicial, mas não fazem parte do build de produção.

## Visual de livro aberto — 2.1

A área de estudo usa páginas de papel envelhecido sobre uma capa de couro, índice funcional e marcadores laterais. Em telas de celular, as páginas ficam em sequência e a navegação permanece acessível pela barra inferior e pelo índice completo.

O formato de backup e a chave de armazenamento `homem-forjado-v2` continuam compatíveis. A atualização do cache mantém os livros em idiomas originais já baixados. Essa versão usava apenas armazenamento local.

Validação: build estático; sete testes de conteúdo, referências, plano de leitura e backups; conferência no navegador do início, leitura em português, consulta ao grego, destaques persistentes, anotações e layout com 375 px de largura útil.

## Guias, apresentação e conta (2.2)

Em **Estudos → Guias por passagem**, estão dez guias com contexto, perguntas e referências cruzadas. O mesmo guia abre pelo versículo no leitor. Passagens sem guia editorial oferecem o panorama do livro e perguntas de leitura. Em **Minhas pregações**, abra um esboço e use **Modo de apresentação** para ler em letras maiores, abrir as referências e cronometrar a mensagem.

A conta é opcional. Para habilitá-la em uma implantação:

1. Conecte um projeto Supabase dedicado ao Homem Forjado. Execute `supabase/001_homem_forjado_sync.sql` no SQL Editor para instalar a tabela com acesso por proprietário e a gravação por revisão.
2. Habilite o login por e-mail e inclua `{{ .Token }}` no modelo de e-mail Magic Link para enviar o código de seis dígitos. Confira a entrega de e-mails com a conta que usará o app. A entrega padrão do Supabase é limitada a membros da organização.
3. Configure `HF_SUPABASE_URL` e `HF_SUPABASE_PUBLISHABLE_KEY` no ambiente de produção da Vercel. Use a chave **publishable**, com prefixo `sb_publishable_`. Rode um novo build para publicar as duas configurações públicas.
4. Abra **Biblioteca & ajustes → Minha conta**, entre com o código e use **Incluir registros do navegador** se quiser copiar seus dados locais existentes. A cópia anterior do navegador fica separada da conta.

A sincronização guarda anotações, destaques, pregações, diário e progresso. Leituras em outros dispositivos recuperam a última cópia gravada. Se dois aparelhos editarem o mesmo item, o app espera uma escolha antes de gravar. Os backups JSON continuam disponíveis. O cronômetro e o tamanho de fonte ficam no dispositivo.

## Instalação e leitura offline (2.3)

Em **Biblioteca & ajustes → Instalar aplicativo**, o navegador oferece a instalação ou mostra como adicionar à tela inicial. Há ícones PNG de 192 e 512 pixels, ícone adaptável Android, ícone Apple e atalhos para Bíblia, devocionais e pregações.

O primeiro acesso com internet instala um cache completo da interface, Bíblia portuguesa e materiais locais. **Preparar leitura offline** baixa também os 66 livros em hebraico/grego, mostra o progresso e permite retomar downloads parciais. PDFs pessoais, léxico externo e sincronização de conta precisam de internet. Os dados continuam sujeitos às políticas de armazenamento do navegador; mantenha backups dos registros importantes.

As versões usam cache calculado pelo conteúdo, sem troca automática da versão aberta. Quando houver atualização, o botão **Atualizar agora** ativa a nova versão. O cache dos originais permanece nas atualizações que não alteram esses textos.

Validação: `npm run build && npm test` executa 12 testes, incluindo completude dos ícones/arquivos, ativação explícita e leitura do cache com rede simulada indisponível. Isso não substitui a instalação e o teste de desconexão em um aparelho físico. A configuração do banco continua pendente enquanto não houver projeto Supabase vinculado e teste real de autenticação/sincronização.
