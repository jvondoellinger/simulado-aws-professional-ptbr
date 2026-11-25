# Simulados AWS Professional em pt-BR

22 testes de estudo do AWS Certified Solutions Architect Professional, com **830 questões únicas** em seis plataformas. Enunciados, alternativas, explicações disponíveis e imagens estão traduzidos para português brasileiro. Quatro questões do SaveMyCert não têm gabarito na captura e ficam fora da nota.

## Como usar

Baixe `index.html` e abra o arquivo no navegador. O HTML incorpora os dados, estilos, scripts e imagens e funciona sozinho, sem dependências ou servidor.

## Recursos

- Seletor de seis plataformas e 22 testes, com os 16 testes do Tutorials Dojo preservados.
- Remoção global de repetições: cada questão permanece apenas no primeiro teste em que apareceu.
- Enunciados, alternativas e explicações em pt-BR, com os originais em inglês disponíveis.
- Botão **Confirmar resposta** por questão, com gabarito, destaque das alternativas e explicação automática.
- Múltipla seleção corrigida pelo conjunto completo, sem pontuação parcial.
- Cronômetro independente por teste, com iniciar, pausar, continuar e zerar.
- Início automático do cronômetro na primeira marcação; troca de teste pausa o anterior.
- Respostas, confirmações e tempos persistidos localmente no navegador.
- Imagens incluídas localmente, com textos traduzidos dentro dos diagramas por OCR e substituição programática. Os originais também estão disponíveis.
- Busca, navegação por questão, impressão e layout responsivo.
- Seletor de plataforma e importação local de pacotes JSON, armazenados em IndexedDB neste navegador.
- Questões de associação e ordenação com correção pela sequência completa.
- Questões importadas sem gabarito são identificadas e excluídas da nota.

## Importação local

Use **Importar pacote local de questões (JSON)** para adicionar um pacote com `tests`, `questions` e `images`. O aplicativo processa o arquivo no navegador e não o envia a um servidor. A importação preserva os 16 testes existentes e evita duplicar os mesmos identificadores. Pacotes podem conter questões `single`, `multi`, `order` e `match`; imagens devem estar incorporadas como data URI ou na pasta `assets`.

O HTML já incorpora os conjuntos de Tutorials Dojo (370), Certicab (200), CertOcean (150), ExamPark (75), SaveMyCert (15) e AWS Skill Builder (20). As capturas brutas de rede não fazem parte do repositório. Os cronômetros continuam separados por teste.

## Organização das questões

As 16 tentativas originais têm 75 questões cada. Foram removidas 830 ocorrências repetidas, mantendo 370 questões. Por isso, os testes mais recentes têm menos questões.

## Arquivos

- `index.html`: edição completa e autossuficiente, com 830 questões e imagens incorporadas.

Os arquivos abaixo são as fontes auxiliares da versão modular anterior; a edição completa é `index.html`.
- `styles.css`: estilos e impressão.
- `app.js`: seleção de teste, correção, explicações, persistência e cronômetros.
- `data-import.js`: validação, combinação e armazenamento local de pacotes.
- `data/bank.js`: conteúdo dos testes, traduções e gabaritos.
- `assets/images/`: diagramas traduzidos e imagens originais.

## Conteúdo e traduções

Conteúdo proveniente dos testes de prática de Tutorials Dojo, Certicab, CertOcean, ExamPark, SaveMyCert e AWS Skill Builder. Os nomes dos serviços AWS e trechos de código foram preservados. As traduções são automáticas; o OCR pode reconhecer incorretamente texto pequeno, e os originais estão disponíveis para conferência. As marcações são locais e não são enviadas ao Tutorials Dojo.
