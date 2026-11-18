# Onde está meu ônibus

Aplicativo web que mostra no mapa, em tempo real, onde estão os ônibus de uma linha de São Paulo, usando os dados da API Olho Vivo da SPTrans.

Global Solution 2026.2 - Application Development - 2º ano de Ciência da Computação (FIAP)

**Aplicação publicada:** https://global-solution-application-develop.vercel.app

## O problema

Quem espera no ponto não sabe se o ônibus está a dois quarteirões ou ainda saindo do terminal, nem quantos carros da linha estão rodando. O app mostra a posição de cada ônibus da linha, enviada pelo GPS do veículo, e se ele é acessível.

## Funcionalidades

- Busca de linhas pelo número ou pelo nome (ex.: 875A, 8000, Lapa).
- Escolha do sentido da linha.
- Mapa com a posição atual de cada ônibus da linha, atualizado a cada 30 segundos.
- Lista dos ônibus em circulação, com destaque para os acessíveis. Ao clicar em um ônibus, o mapa vai até ele.
- Filtro para ver só os ônibus acessíveis.
- Linhas favoritas salvas no navegador (localStorage).
- Layout adaptado para celular.

## Tecnologias

- HTML, CSS e JavaScript
- API Olho Vivo (SPTrans)
- Leaflet e OpenStreetMap para o mapa
- Função serverless do Vercel

## Como funciona

A API Olho Vivo não responde a chamadas feitas direto do navegador (bloqueio de CORS) e o login devolve um cookie de sessão. Por isso o front-end não chama a SPTrans diretamente: ele chama `/api/olhovivo`, uma função que roda no Vercel. Essa função faz o login com o token, guarda o cookie e repassa a consulta. Assim o token também não fica exposto no código do site.

Endpoints da API Olho Vivo usados:

| Endpoint | Uso |
|---|---|
| `POST /Login/Autenticar?token=` | Login com o token |
| `GET /Linha/Buscar?termosBusca=` | Busca de linhas pelo número ou nome |
| `GET /Posicao/Linha?codigoLinha=` | Posição atual dos ônibus da linha |

## Estrutura

```
global-solution-application-development/
├── api/
│   └── olhovivo.js     função serverless que fala com a SPTrans
├── public/             arquivos do site
│   ├── index.html
│   ├── style.css
│   ├── config.js       endereço da API e configurações
│   ├── script.js       busca, favoritos e lista de ônibus
│   ├── mapa.js         mapa com Leaflet
│   └── favicon.svg
├── dev-server.js       servidor para rodar no computador
├── vercel.json
├── .env.example
└── INTEGRANTES.txt
```

## Como rodar no computador

É preciso ter o Node.js 22 ou mais recente. Não há pacotes para instalar.

1. Gerar um token em [Meus Aplicativos](https://www.sptrans.com.br/desenvolvedores/) na área de desenvolvedores da SPTrans.
2. Copiar o arquivo `.env.example` com o nome `.env.local` e colocar o token no lugar de `cole_seu_token_aqui`.
3. Na pasta do projeto, rodar:

```bash
npm run dev
```

4. Abrir http://localhost:3000.

## Publicação no Vercel

1. Importar o repositório em vercel.com (Add New > Project).
2. Em Environment Variables, criar a variável `SPTRANS_TOKEN` com o token.
3. Clicar em Deploy.

## Créditos

Dados de transporte: SPTrans, API Olho Vivo (https://www.sptrans.com.br/desenvolvedores/). Mapas: Leaflet e OpenStreetMap. As posições vêm do GPS dos ônibus e podem ter alguns segundos de atraso.

## Integrantes

- João Vitor Anunciação Oliveira - RM567539
- Paulo Ribeiro Marinho - RM567459

A divisão das tarefas está em `INTEGRANTES.txt`.
