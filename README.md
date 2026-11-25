# Simulados AWS Professional em pt-BR

16 testes de estudo do AWS Certified Solutions Architect Professional, com **370 questões únicas**, gabaritos e explicações completas traduzidos automaticamente para português brasileiro.

## Como usar

Baixe o ZIP do repositório, extraia a pasta e abra `index.html` no navegador. Mantenha os arquivos e a pasta `assets` juntos. Não é necessário instalar dependências ou iniciar um servidor.

## Recursos

- Seletor de testes 1 a 16, com o teste original de 75 questões preservado.
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

Os pacotes pessoais e as capturas de rede não fazem parte deste repositório. A edição pessoal em arquivo HTML pode incorporar esses pacotes para uso sem importação. Os cronômetros continuam separados por teste.

## Organização das questões

As 16 tentativas originais têm 75 questões cada. Foram removidas 830 ocorrências repetidas, mantendo 370 questões. Por isso, os testes mais recentes têm menos questões.

## Arquivos

- `index.html`: estrutura da página.
- `styles.css`: estilos e impressão.
- `app.js`: seleção de teste, correção, explicações, persistência e cronômetros.
- `data-import.js`: validação, combinação e armazenamento local de pacotes.
- `data/bank.js`: conteúdo dos testes, traduções e gabaritos.
- `assets/images/`: diagramas traduzidos e imagens originais.

## Conteúdo e traduções

Conteúdo proveniente dos testes de prática do Tutorials Dojo. Os nomes dos serviços AWS e trechos de código foram preservados. As traduções são automáticas; o OCR pode reconhecer incorretamente texto pequeno, e os originais estão disponíveis para conferência. As marcações são locais e não são enviadas ao Tutorials Dojo.
