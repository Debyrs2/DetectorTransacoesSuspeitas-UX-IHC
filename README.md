DataGuard - Detecção de Transações Suspeitas

O DataGuard é uma plataforma inteligente de análise de Big Data voltada para a identificação de anomalias financeiras. O projeto utiliza métodos estatísticos avançados para processar grandes volumes de dados e detectar possíveis fraudes ou erros operacionais com alta precisão e performance.

Este sistema foi desenvolvido como parte do projeto acadêmico de Matemática Computacional Aplicada a Big Data.
🚀 Funcionalidades

    Gestão de Datasets: Upload, renomeação, substituição e exclusão de bases de dados nos formatos .csv, .xlsx e .xls.

    Análise Estatística Multivariada: Implementação de quatro métodos principais para detecção de anomalias: Sigma, Z-Score, IQR e MAD.

    Processamento em Lotes (Streaming): Algoritmo de Welford para cálculo de média e desvio padrão em tempo real, permitindo analisar arquivos massivos sem estourar a memória do servidor.

    Visualização Interativa: Gráficos dinâmicos gerados via Chart.js que destacam pontos de anomalia em relação à tendência geral.

    Acessibilidade Completa: Integração com VLibras, modos para daltônicos, leitura confortável (alto contraste) e leitor de tela interativo.

    Internacionalização: Interface totalmente traduzida para Português (PT), Inglês (EN) e Espanhol (ES).

    Segurança: Sistema de login com autenticação via Tokens JWT (HMAC-SHA256) e persistência de dados.

🧠 Fundamentação Matemática

O motor de análise baseia-se em:

    Z-Score: Mede quantos desvios padrões um dado está da média (σx−μ​).

    IQR (Amplitude Interquartílica): Resistente a outliers, foca na dispersão dos 50% centrais dos dados (Q3−Q1).

    MAD (Desvio Absoluto da Mediana): A métrica mais robusta para bases com alta incidência de fraudes.

🛠️ Tecnologias Utilizadas
Backend

    Python 3.12+.

    FastAPI: Framework de alta performance para a construção da API.

    Pandas: Manipulação e análise vetorial de dados.

    Uvicorn: Servidor ASGI para execução da aplicação.

Frontend

    HTML5 & CSS3: Design moderno com Glassmorphism e variáveis para troca de temas.

    JavaScript (Vanilla): Lógica de interface, consumo de API assíncrona e manipulação de DOM.

    Chart.js: Renderização de gráficos de tendência no Canvas.

    Driver.js: Sistema de tour interativo para novos usuários.

🔧 Como Executar

    Instale as dependências:
    Bash

    pip install -r requirements.txt

    Inicie a API:
    Bash

    python main.py

    A API ficará disponível em http://127.0.0.1:8000.

Este é um projeto acadêmico sem fins comerciais..
