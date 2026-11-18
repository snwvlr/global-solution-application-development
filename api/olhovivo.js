// a gente precisou dessa função porque a API da SPTrans bloqueia chamadas feitas direto do navegador (CORS).
// o site chama /api/olhovivo, e ela faz o login com o token, guarda o cookie e repassa a consulta.
// assim o token também fica só no servidor e não aparece no código do site

const BASE_URL = "https://api.olhovivo.sptrans.com.br/v2.1";

// só deixamos passar as duas consultas que o app usa, com o parâmetro que cada uma precisa
const ROTAS = {
  "Linha/Buscar": "termosBusca",
  "Posicao/Linha": "codigoLinha",
};

const DURACAO_SESSAO = 10 * 60 * 1000;

let cookie = null;
let ultimoLogin = 0;

async function login() {
  const resposta = await fetch(BASE_URL + "/Login/Autenticar?token=" + process.env.SPTRANS_TOKEN, {
    method: "POST",
  });

  const texto = await resposta.text();
  if (texto.trim() !== "true") {
    return false;
  }

  const partes = [];
  resposta.headers.getSetCookie().forEach((c) => {
    partes.push(c.split(";")[0]);
  });
  cookie = partes.join("; ");
  ultimoLogin = Date.now();
  return true;
}

export default async function handler(req, res) {
  const rota = req.query.rota;
  const parametro = ROTAS[rota];

  if (!parametro) {
    return res.status(400).json({ erro: "Rota não permitida." });
  }

  const valor = req.query[parametro];
  if (!valor) {
    return res.status(400).json({ erro: "Faltou o parâmetro " + parametro + "." });
  }

  if (!process.env.SPTRANS_TOKEN || process.env.SPTRANS_TOKEN === "cole_seu_token_aqui") {
    return res.status(500).json({ erro: "Token da SPTrans não configurado no servidor." });
  }

  const url = BASE_URL + "/" + rota + "?" + parametro + "=" + encodeURIComponent(valor);

  try {
    // o login vale um tempo, então a gente reaproveita o cookie por 10 minutos em vez de logar toda vez
    if (!cookie || Date.now() - ultimoLogin > DURACAO_SESSAO) {
      const logou = await login();
      if (!logou) {
        return res.status(401).json({ erro: "A SPTrans recusou o token." });
      }
    }

    let resposta = await fetch(url, { headers: { Cookie: cookie } });

    // se a sessão expirou antes disso, a SPTrans devolve 401: a gente loga de novo e tenta mais uma vez
    if (resposta.status === 401 && (await login())) {
      resposta = await fetch(url, { headers: { Cookie: cookie } });
    }

    if (resposta.status !== 200) {
      return res.status(resposta.status).json({ erro: "A SPTrans respondeu com erro." });
    }

    const dados = await resposta.json();
    return res.status(200).json(dados);
  } catch (erro) {
    console.error(erro);
    return res.status(502).json({ erro: "Não foi possível falar com a SPTrans." });
  }
}
