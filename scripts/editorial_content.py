import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def save(name,obj):
 (ROOT/'src/data'/name).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')))
summaries='''
Criação, queda, alianças e a família de Abraão. A narrativa vai das origens do mundo à preservação da família de José no Egito.
A libertação do Egito conduz à aliança no Sinai e à construção do tabernáculo. Observe como redenção e responsabilidade caminham juntas.
Sacrifícios, sacerdócio, pureza e santidade na vida de Israel. Leia suas leis no contexto da aliança, sem transferi-las automaticamente à vida atual.
A caminhada de Israel pelo deserto expõe conflitos, incredulidade e provisão. A contagem do povo enquadra a passagem entre gerações.
Discursos de Moisés retomam a aliança antes da entrada na terra. Lembrar, amar e obedecer são verbos centrais do livro.
A entrada em Canaã, a distribuição da terra e a renovação da aliança. A promessa recebida exige fidelidade na vida comunitária.
Um ciclo de infidelidade, opressão, clamor e libertação marca a vida de Israel. O livro também retrata a deterioração da liderança e da sociedade.
Uma família atravessa perda, migração e recomeço. A lealdade de Rute e a atuação de Boaz conectam a história à linhagem de Davi.
Samuel, Saul e Davi participam da transição para a monarquia. A narrativa contrasta aparência, poder e obediência a Deus.
O reinado de Davi reúne conquistas, promessas, pecado e consequências familiares. O arrependimento não apaga a responsabilidade pelos atos.
O reinado de Salomão, o templo e a divisão do reino. As histórias de Elias confrontam idolatria e abuso de poder.
As histórias de Eliseu antecedem a queda de Israel e Judá. A narrativa interpreta as crises à luz da ruptura da aliança.
Genealogias e o reinado de Davi são recontados com atenção ao culto e à preparação do templo. A memória sustenta a identidade da comunidade.
Do reinado de Salomão ao exílio e ao decreto de Ciro. O templo, as reformas e a busca de Deus organizam o relato.
O retorno do exílio e a reconstrução do templo expressam a restauração da comunidade. A leitura da Lei ocupa lugar central.
A reconstrução dos muros de Jerusalém se liga à reorganização da vida comunitária. Oração, trabalho e compromisso aparecem lado a lado.
Uma rainha judia enfrenta a ameaça de extermínio de seu povo na Pérsia. A narrativa explica a memória celebrada na festa de Purim.
Um homem justo sofre, e seus amigos procuram explicar sua dor. O livro desafia respostas fáceis que reduzem todo sofrimento a punição pessoal.
Orações e cânticos expressam louvor, lamento, gratidão e confiança. Observe o gênero de cada poema antes de tratá-lo como promessa isolada.
Sabedoria para escolhas, palavras, trabalho e relacionamentos. Seus provérbios descrevem padrões da vida, sem funcionar como garantias mecânicas.
Uma reflexão sobre a transitoriedade da vida e os limites da realização humana. O livro questiona a tentativa de controlar tudo por meio de conquistas.
Poemas de amor celebram o desejo, a beleza e o encontro. A tradição também os lê simbolicamente, distinguindo interpretação do sentido literário imediato.
Juízo e esperança atravessam os oráculos dirigidos a Judá e às nações. A santidade de Deus e a promessa de restauração unem diferentes seções.
O profeta confronta a infidelidade de Judá antes da queda de Jerusalém. A esperança inclui a promessa de uma nova aliança.
Poemas lamentam a devastação de Jerusalém. A expressão da dor convive com a esperança na misericórdia de Deus.
Visões e atos simbólicos comunicam juízo e restauração no contexto do exílio. A presença de Deus não é reduzida a um edifício.
Narrativas de fidelidade em impérios estrangeiros se unem a visões apocalípticas. Os símbolos exigem atenção ao gênero e ao contexto.
O casamento do profeta funciona como sinal da ruptura da aliança. Juízo, amor e chamado ao retorno estruturam a mensagem.
Uma calamidade leva ao chamado ao arrependimento. A promessa do derramamento do Espírito é retomada por Pedro em Atos 2.
O profeta denuncia injustiça social, culto vazio e exploração. A justiça praticada é parte inseparável da fidelidade a Deus.
Um oráculo contra Edom denuncia a violência e a indiferença diante da calamidade do povo irmão. O dia do Senhor encerra a perspectiva.
O profeta reluta em anunciar a mensagem a Nínive. A misericórdia de Deus confronta os limites da compaixão humana.
Denúncia da corrupção e anúncio de esperança para Israel e Judá. A justiça, a misericórdia e a humildade aparecem no chamado de Miqueias 6:8.
O anúncio da queda de Nínive confronta a violência imperial. A linguagem poética descreve juízo sobre a opressão.
O profeta questiona a injustiça e dialoga com Deus. A oração final expressa confiança em meio à perda.
O dia do Senhor anuncia juízo e purificação. A esperança de restauração acompanha o chamado à humildade.
No período após o exílio, o profeta incentiva a reconstrução do templo. As prioridades comunitárias são colocadas em questão.
Visões e mensagens encorajam a comunidade que retornou do exílio. A restauração de Jerusalém abre horizontes de esperança messiânica.
O profeta confronta a negligência no culto e na vida comunitária. A fidelidade à aliança orienta suas advertências.
Jesus é apresentado em ligação com a história de Israel. Discursos e narrativas desenvolvem o anúncio do Reino e o caminho do discipulado.
Um relato ágil do ministério, sofrimento e ressurreição de Jesus. A pergunta sobre sua identidade atravessa ações e encontros.
O evangelho destaca a ação do Espírito, a oração e a atenção aos marginalizados. O caminho de Jesus segue em direção a Jerusalém.
Sinais e discursos convidam à fé em Jesus, a Palavra encarnada. O prólogo, os encontros e o caminho até a cruz iluminam sua identidade.
A expansão do testemunho de Jesus vai de Jerusalém a Roma. O Espírito orienta uma comunidade que atravessa fronteiras culturais.
Paulo desenvolve sua exposição do evangelho, da graça e da vida pela fé. Os capítulos finais ligam a teologia à convivência e ao serviço.
Uma comunidade dividida recebe orientação sobre unidade, ética, dons e ressurreição. O amor é indispensável ao uso dos dons.
Paulo reflete sobre ministério, reconciliação, generosidade e fraqueza. A defesa de sua missão assume a forma do serviço.
A carta defende a liberdade em Cristo e contesta a imposição da circuncisão aos gentios. A vida no Espírito produz frutos na convivência.
A unidade em Cristo se desdobra na vida da igreja e nos relacionamentos. O corpo e a casa são imagens recorrentes da comunidade.
Alegria, humildade e perseverança marcam a carta escrita no contexto de prisão. O exemplo de Cristo orienta a vida comunitária.
A centralidade de Cristo fundamenta a nova vida. O autor confronta práticas e ensinamentos que desviam dessa suficiência.
Encorajamento a uma comunidade jovem em meio à pressão. Santidade, amor fraternal e esperança na vinda de Cristo orientam a carta.
Orientações sobre perseverança e expectativas acerca da vinda de Cristo. A esperança não dispensa a responsabilidade cotidiana.
Instruções sobre ensino, liderança e cuidado comunitário. A boa conduta acompanha a responsabilidade de transmitir a fé.
Um apelo à fidelidade, coragem e perseverança no ministério. A transmissão do ensino e a utilidade das Escrituras recebem destaque.
Orientações para organizar a comunidade e promover boas obras. A graça recebida transforma a maneira de viver.
Um pedido pessoal em favor de Onésimo desafia a relação entre senhor e escravo. O vínculo em Cristo abre uma nova perspectiva de acolhimento.
Cristo é apresentado como sumo sacerdote e mediador de uma nova aliança. Advertências e exemplos de fé chamam à perseverança.
A fé é examinada por seus efeitos concretos. Cuidado com os vulneráveis, domínio da língua e justiça nas relações são temas centrais.
Esperança e santidade em meio ao sofrimento. A identidade da comunidade sustenta o testemunho e a perseverança.
A carta combate ensinamentos destrutivos e incentiva o crescimento na fé. A esperança futura pede uma vida responsável no presente.
Amor, verdade e comunhão são marcas da vida em Cristo. A fé confessada é examinada na maneira de tratar o próximo.
Uma breve carta sobre amor, verdade e discernimento. A hospitalidade é pensada em relação à responsabilidade pelo ensino.
A hospitalidade a colaboradores do evangelho é colocada em destaque. O contraste entre Gaio e Diótrefes expõe formas diferentes de liderança.
Um chamado à perseverança diante de ensinamentos e práticas destrutivas. A advertência se une à misericórdia no cuidado com os outros.
Cartas às igrejas e visões simbólicas anunciam juízo, resistência e esperança. A leitura apocalíptica culmina na renovação de todas as coisas.
'''.strip().splitlines()
assert len(summaries)==66
save('summaries.json',summaries)

lessons=[
{'id':'origem','category':'Fundamentos','title':'Uma biblioteca, muitas vozes','subtitle':'Como a Bíblia chegou até nós','source':'jornada','pages':'7–15, 175','read':'Lucas 1:1-4','sections':[
 ['Uma coleção formada ao longo do tempo','A Bíblia reúne narrativas, leis, poemas, profecias, evangelhos e cartas. Esses textos nasceram em ambientes diferentes e foram preservados, copiados, reunidos e traduzidos por comunidades de fé. A unidade da leitura cristã não elimina essa diversidade literária.'],
 ['Os cânones das tradições cristãs','O leitor deste aplicativo usa os 66 livros do cânon protestante, seguindo a organização predominante dos PDFs. A Bíblia católica contém 73 livros; os cânones ortodoxos variam. A diferença envolve principalmente os livros e acréscimos do Antigo Testamento, e não uma simples contagem de páginas.'],
 ['Tradição e investigação histórica','Os PDFs frequentemente apresentam autoria e datas tradicionais como certezas. No estudo, diferencie a atribuição recebida pela tradição das conclusões da pesquisa histórica, que podem variar. Também não existe uma contagem de palavras e versículos universal para todas as edições.']],
 'question':'Que gênero literário você está lendo e como ele muda suas expectativas sobre o texto?'},
{'id':'linguas','category':'Fundamentos','title':'Do manuscrito à tradução','subtitle':'Hebraico, aramaico e grego koiné','source':'jornada','pages':'11, 15','read':'João 1:1-18','sections':[
 ['Três línguas no horizonte','A maior parte do Antigo Testamento foi escrita em hebraico; há também trechos em aramaico, como partes de Daniel e Esdras. O Novo Testamento foi escrito em grego koiné. Traduzir implica escolhas de vocabulário, sintaxe e contexto.'],
 ['O que a comparação oferece','No leitor, a Bíblia Livre pode ser comparada ao texto hebraico WLC ou ao grego Textus Receptus de Stephanus. São edições textuais identificadas, não os manuscritos autógrafos. Elas não representam todas as variantes conhecidas dos manuscritos.'],
 ['Uma palavra não é uma fórmula','Uma palavra pode ter vários sentidos. O significado é delimitado pela frase, pelo gênero e pelo argumento do autor. Um verbete do dicionário ajuda a investigar; não substitui a leitura do capítulo. Diferenças de numeração entre edições podem impedir um alinhamento exato de versículos.']],
 'question':'Que escolha de tradução você percebe ao comparar João 1:1 com o vocábulo grego lógos?'},
{'id':'alianca','category':'Panorama','title':'Aliança, caminho e presença','subtitle':'Lendo o Pentateuco em conjunto','source':'jornada','pages':'16, 21–68','read':'Êxodo 19:1-6','sections':[
 ['Uma história em cinco livros','Gênesis apresenta as origens e as famílias dos patriarcas. Êxodo narra a libertação e a aliança. Levítico explora santidade e culto; Números acompanha a travessia do deserto; Deuteronômio retoma a aliança diante de uma nova geração.'],
 ['Libertação antes da resposta','No relato do Êxodo, a libertação antecede a entrega das instruções no Sinai. Observe a ordem da narrativa: quem Deus é, o que fez e como o povo é chamado a responder. Evite retirar uma lei de seu enquadramento histórico e literário.'],
 ['O tabernáculo como presença','O tabernáculo articula presença, santidade e vida comunitária. Ao relacionar essas imagens com o Novo Testamento, registre a ligação textual que sustenta sua interpretação, distinguindo-a de uma associação pessoal.']],
 'question':'Como Êxodo 19 relaciona o que Deus fez à vocação do povo?'},
{'id':'reinos','category':'História','title':'Um povo entre reinos e exílio','subtitle':'Memória, crise e reconstrução','source':'jornada','pages':'103, 111–123','read':'2 Reis 25:1-12','sections':[
 ['Uma monarquia que se divide','As narrativas de Samuel e Reis apresentam Saul, Davi e Salomão e, depois, a divisão entre o reino do norte, Israel, e o reino do sul, Judá. Os nomes dos reinos e suas capitais devem ser lidos com atenção ao período narrado.'],
 ['Exílio e impérios','A queda de Samaria diante da Assíria, em 722/721 a.C., e a destruição de Jerusalém pelos babilônios, em 587/586 a.C., são marcos históricos. Variações de um ano refletem sistemas de datação e debates historiográficos; não devem ser escondidas.'],
 ['Retorno e reconstrução','No período persa, a comunidade reconstrói o templo e reorganiza a vida em Jerusalém. Esdras e Neemias ligam reconstrução material, leitura da Lei e compromisso comunitário. O retorno não elimina todos os conflitos.']],
 'question':'Que relação o relato estabelece entre a crise política e a vida espiritual da comunidade?'},
{'id':'poesia','category':'Panorama','title':'Quando a fé se torna oração','subtitle':'Salmos e literatura de sabedoria','source':'jornada','pages':'124–133','read':'Salmos 13:1-6','sections':[
 ['Louvor e lamento','Os Salmos oferecem linguagem para agradecer, pedir ajuda, lamentar e adorar. Leia o poema inteiro e acompanhe seus movimentos. Uma pergunta dolorosa no início pode se transformar em confiança, sem negar o sofrimento.'],
 ['Sabedoria e limites','Provérbios ensina padrões de vida sábia; Jó e Eclesiastes confrontam respostas simplistas e expõem os limites humanos. Esses livros devem dialogar: uma máxima não explica isoladamente toda experiência de sofrimento.'],
 ['Do texto à oração','Observe as imagens do poema e escreva uma oração com suas próprias palavras. Distinga o que o salmista expressa da aplicação que você faz hoje. Não transforme automaticamente uma descrição poética em uma garantia individual.']],
 'question':'Que espaço sua vida de oração oferece à dor, à dúvida e à gratidão?'},
{'id':'messias','category':'Profecias','title':'Promessa e leitura messiânica','subtitle':'Textos em diálogo entre os Testamentos','source':'profecias','pages':'3–7','read':'Miqueias 5:2-5','sections':[
 ['Comece pelo primeiro contexto','Antes de buscar um cumprimento, leia o oráculo em seu contexto original: quem fala, a quem se dirige e qual crise enfrenta. A profecia pode denunciar o presente, convocar à justiça e anunciar esperança, além de falar do futuro.'],
 ['A leitura cristã do cumprimento','Mateus 2:1–6 relaciona Belém a Miqueias 5:2. Mateus 1:22–23 aplica Isaías 7:14 ao nascimento de Jesus. Trata-se da leitura cristã desses textos; o contexto de Isaías e a tradução de seus termos também são discutidos por intérpretes judeus e cristãos.'],
 ['Uma correção necessária no PDF','O material aproxima Isaías 7:14 do nascimento em Belém. Convém distinguir as referências: Mateus 1 cita Isaías sobre o sinal do nascimento; Mateus 2 cita Miqueias a respeito de Belém. Registrar essa distinção torna a preparação do estudo mais precisa.']],
 'question':'Qual ligação o próprio Novo Testamento faz com o texto que você está estudando?'},
{'id':'apocalipse','category':'Profecias','title':'Esperança em linguagem de visões','subtitle':'Como ler a literatura apocalíptica','source':'profecias','pages':'6–11','read':'Apocalipse 1:9-20','sections':[
 ['Imagens para comunidades reais','Apocalipse se apresenta a igrejas concretas da Ásia Menor. Números, animais, cores e cenas de culto compõem sua linguagem simbólica. Observe as explicações que o próprio livro oferece antes de buscar equivalências em notícias atuais.'],
 ['Interpretações reconhecidas','Leituras preteristas enfatizam o horizonte dos primeiros destinatários; futuristas destacam acontecimentos futuros; idealistas examinam padrões recorrentes; historicistas relacionam visões ao curso da história. Há abordagens mistas e diferenças dentro de cada grupo.'],
 ['Fidelidade sem especulação','O PDF reconhece controvérsias interpretativas. Preserve essa cautela: identifique sua abordagem e seus argumentos. O texto convida à perseverança e à esperança; uma data calculada para o fim dos tempos não é resultado seguro desse estudo.']],
 'question':'Que consolo essa passagem oferecia aos primeiros leitores, e o que isso ensina hoje?'},
{'id':'estudar','category':'Prática','title':'Da leitura à vida cotidiana','subtitle':'Um método para estudar e preparar mensagens','source':'desafio','pages':'9–11','read':'Tiago 1:19-27','sections':[
 ['Observe antes de aplicar','Leia a passagem inteira e anote personagens, repetições, conexões e o fluxo do argumento. Faça perguntas que o texto possa responder. Considere os versículos anteriores e posteriores.'],
 ['Interprete com responsabilidade','Compare passagens relacionadas, investigue termos e reconheça o gênero literário. Separe o que o texto afirma, a interpretação que você propõe e a aplicação que fará. Se houver dúvida, registre-a em vez de inventar uma resposta.'],
 ['Prepare uma resposta concreta','No devocional, escreva uma oração e uma atitude praticável. Na pregação, formule uma ideia central, sustente cada ponto com a passagem e conclua com uma aplicação coerente. O editor ajuda a organizar sua reflexão e a guardar suas referências.']],
 'question':'Qual pequena atitude responde ao que você compreendeu nesta leitura?'}]
save('lessons.json',lessons)

terms=[
['Aliança','berít','בְּרִית','H1285','Hebraico','Compromisso que estabelece uma relação e suas responsabilidades. As alianças bíblicas devem ser lidas em seus diferentes contextos narrativos.','Gênesis 15:18'],
['Torá','toráh','תּוֹרָה','H8451','Hebraico','Instrução ou ensino. Pode designar uma orientação específica ou o conjunto conhecido como os cinco livros de Moisés.','Deuteronômio 6:1-9'],
['Paz','shalóm','שָׁלוֹם','H7965','Hebraico','Paz, bem-estar ou integridade, conforme o contexto. O termo abrange relações e condições de vida, não apenas a ausência de conflito.','Números 6:24-26'],
['Amor leal','ḥésed','חֶסֶד','H2617','Hebraico','Bondade, lealdade e amor perseverante. Traduções como misericórdia e amor leal refletem aspectos de seu uso em relações e alianças.','Salmos 136:1'],
['Messias','mashíaḥ','מָשִׁיחַ','H4899','Hebraico','Ungido. Na Bíblia hebraica pode se referir a reis e sacerdotes; na leitura cristã, a esperança messiânica é relacionada a Jesus.','1 Samuel 16:13'],
['Santo','qadósh','קָדוֹשׁ','H6918','Hebraico','Santo, consagrado ou separado para um propósito sagrado. No uso sobre Deus, expressa sua singularidade e santidade.','Levítico 19:2'],
['Sabedoria','ḥokhmáh','חָכְמָה','H2451','Hebraico','Sabedoria e habilidade. O contexto pode envolver perícia artesanal, discernimento prático ou a condução da vida.','Provérbios 1:7'],
['Espírito / vento','rúaḥ','רוּחַ','H7307','Hebraico','Vento, sopro ou espírito. O contexto determina a tradução; não é correto impor o mesmo sentido a cada ocorrência.','Gênesis 1:2'],
['Amém','amén','אָמֵן','H543','Hebraico','Expressão de confirmação e concordância. Em diferentes contextos pode ser traduzida como certamente ou assim seja.','Deuteronômio 27:15'],
['Palavra','lógos','λόγος','G3056','Grego','Palavra, discurso ou mensagem, entre outros sentidos. Em João 1, o termo participa da apresentação de Jesus como a Palavra encarnada.','João 1:1-18'],
['Amor','agápē','ἀγάπη','G26','Grego','Amor. Seu sentido é esclarecido pelo contexto e pela relação descrita. O termo, sozinho, não significa automaticamente amor incondicional.','1 Coríntios 13:1-13'],
['Graça','cháris','χάρις','G5485','Grego','Graça, favor ou dádiva. Em contextos paulinos, relaciona-se à iniciativa generosa de Deus e à vida que responde a ela.','Efésios 2:8-10'],
['Fé','pístis','πίστις','G4102','Grego','Fé, confiança ou fidelidade. A passagem e seu argumento ajudam a entender qual aspecto recebe destaque.','Hebreus 11:1-6'],
['Arrependimento','metánoia','μετάνοια','G3341','Grego','Arrependimento, envolvendo mudança de disposição e orientação. O uso bíblico deve ser estudado em conexão com a resposta a Deus.','Lucas 3:8'],
['Igreja','ekklēsía','ἐκκλησία','G1577','Grego','Assembleia ou comunidade reunida. No Novo Testamento, frequentemente designa comunidades de seguidores de Jesus.','1 Coríntios 1:2'],
['Evangelho','euangélion','εὐαγγέλιον','G2098','Grego','Boa notícia ou anúncio. No Novo Testamento, designa a mensagem sobre Jesus Cristo e o Reino de Deus.','Marcos 1:14-15'],
['Revelação','apokálypsis','ἀποκάλυψις','G602','Grego','Revelação ou desvelamento. Apocalipse é o nome tradicional do livro que se apresenta como revelação de Jesus Cristo.','Apocalipse 1:1'],
['Parábola','parabolḗ','παραβολή','G3850','Grego','Comparação ou narrativa ilustrativa. Observe a situação em que Jesus conta cada parábola e o ponto enfatizado.','Lucas 15:1-7'],
['Cristo','christós','χριστός','G5547','Grego','Ungido, correspondente grego de Messias. No Novo Testamento torna-se um título aplicado a Jesus.','Mateus 16:16'],
['Consolador / defensor','paráklētos','παράκλητος','G3875','Grego','Alguém chamado para auxiliar ou defender. O Evangelho de João aplica o termo ao Espírito; 1 João 2:1 o aplica a Jesus.','João 14:16-17'],
['Redenção','apolýtrōsis','ἀπολύτρωσις','G629','Grego','Libertação ou redenção. A imagem se relaciona à ideia de resgate, aplicada no Novo Testamento à ação salvadora de Deus.','Romanos 3:24'],
['Exegese','','','','Estudo','Investigação do sentido de uma passagem em seu contexto literário, histórico e linguístico. Procura fundamentar a interpretação no texto.','Lucas 24:27'],
['Hermenêutica','','','','Estudo','Reflexão sobre princípios e métodos de interpretação. Ajuda a tornar explícitas as perguntas e pressupostos usados na leitura.','2 Timóteo 2:15'],
['Escatologia','','','','Estudo','Estudo dos temas ligados à consumação da história, ressurreição, juízo e esperança futura. Diferentes tradições desenvolvem perspectivas distintas.','1 Coríntios 15:20-28'],
['Cânon','','','','Estudo','Conjunto de livros reconhecidos como Escritura por uma comunidade religiosa. Os cânones judaico e cristãos não são idênticos.','Lucas 24:44'],
['Pentateuco','','','','Estudo','Nome usado para os cinco primeiros livros da Bíblia: Gênesis, Êxodo, Levítico, Números e Deuteronômio.','Deuteronômio 31:24-26'],
['Septuaginta','','','','Estudo','Designação de uma antiga tradição de traduções gregas das Escrituras judaicas. Seu conteúdo e história não se reduzem a uma única edição uniforme.','Lucas 4:16-21'],
['Tabernáculo','','','','Estudo','Santuário móvel descrito no Pentateuco, associado à presença de Deus e ao culto de Israel no deserto.','Êxodo 25:8-9'],
['Fariseus','','','','História','Grupo judaico do período do Segundo Templo, associado ao estudo e à prática da Torá. Evite reduzir todos os seus membros a uma caricatura.','João 3:1-2'],
['Gentios','','','','História','Designação usada em muitos contextos bíblicos para povos que não pertencem a Israel. A integração de gentios é um tema importante de Atos e das cartas.','Atos 15:1-21']
]
save('dictionary.json',[dict(zip(['term','transliteration','original','strong','language','definition','ref'],t)) for t in terms])
timeline=[
 ['Tradições de Israel','Mundo antigo','Narrativas, leis, poemas e tradições são transmitidos e reunidos ao longo de séculos. A data dos eventos narrados não equivale automaticamente à data de composição do livro.'],
 ['Reinos e exílio','Séculos VIII–VI a.C.','Assíria e Babilônia transformam a história de Israel e Judá. A queda de Jerusalém em 587/586 a.C. marca a experiência do exílio.'],
 ['Retorno e novas comunidades','Períodos persa e helenístico','A comunidade retorna, reconstrói e relê sua história. Traduções gregas ampliam a circulação das Escrituras judaicas.'],
 ['Jesus e a igreja primitiva','Século I d.C.','O ministério de Jesus e a expansão das comunidades cristãs formam o contexto dos evangelhos, de Atos e das cartas.'],
 ['Cópias e reconhecimento dos livros','Primeiros séculos cristãos','Manuscritos circulam e são copiados. O reconhecimento dos livros do Novo Testamento ocorre por um processo histórico; um único concílio não escreveu a Bíblia.'],
 ['Tradução e impressão','Da Antiguidade à era da imprensa','Traduções antigas e, depois, a impressão ampliam o acesso. Manuscritos, variantes e escolhas de tradução continuam sendo estudados.'],
 ['Bíblia em português','Tradição de Almeida e traduções atuais','A tradução ligada a João Ferreira de Almeida marca a história da Bíblia em português. Este app usa a Bíblia Livre, revisão de 2018, com os créditos de seus tradutores.']
]
save('timeline.json',[{'title':a,'date':b,'text':c} for a,b,c in timeline])
print('Editorial content ready: 66 overviews, 8 lessons, 30 terms, 7 historical milestones')
