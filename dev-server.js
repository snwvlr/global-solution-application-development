// servidor para a gente testar o app no computador com npm run dev.
// ele entrega os arquivos da pasta public e chama a mesma função da pasta api que roda no Vercel

import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";
import handler from "./api/olhovivo.js";

const PORTA = 3000;
const PASTA_PUBLICA = path.join(import.meta.dirname, "public");
const ARQUIVO_ENV = path.join(import.meta.dirname, ".env.local");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function carregarToken() {
  try {
    Object.assign(process.env, parseEnv(await readFile(ARQUIVO_ENV, "utf8")));
  } catch {
    console.log("Arquivo .env.local não encontrado.");
  }
}

function adaptarParaVercel(req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  res.status = (codigo) => {
    res.statusCode = codigo;
    return res;
  };
  res.json = (dados) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(dados));
  };
}

async function servirArquivo(caminhoUrl, res) {
  try {
    const arquivo = path.join(PASTA_PUBLICA, decodeURIComponent(caminhoUrl === "/" ? "/index.html" : caminhoUrl));
    if (!arquivo.startsWith(PASTA_PUBLICA)) {
      res.statusCode = 403;
      return res.end();
    }
    const conteudo = await readFile(arquivo);
    res.setHeader("Content-Type", TIPOS[path.extname(arquivo)] || "application/octet-stream");
    res.end(conteudo);
  } catch {
    res.statusCode = 404;
    res.end("Não encontrado");
  }
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname === "/api/olhovivo") {
      await carregarToken();
      adaptarParaVercel(req, res, url);
      return handler(req, res);
    }

    servirArquivo(url.pathname, res);
  })
  .listen(PORTA, () => console.log("Rodando em http://localhost:" + PORTA));
