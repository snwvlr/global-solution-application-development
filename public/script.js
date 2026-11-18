const campoBusca = document.querySelector(".campo-busca");
const mensagemBusca = document.querySelector(".mensagem-busca");
const resultados = document.querySelector(".resultados");
const secaoFavoritos = document.querySelector(".favoritos");
const listaFavoritos = document.querySelector(".lista-favoritos");
const painel = document.querySelector(".painel");
const painelLetreiro = document.querySelector(".painel-letreiro");
const painelDestino = document.querySelector(".painel-destino");
const estrelaPainel = document.querySelector(".btn-estrela-painel");
const horaAtualizacao = document.querySelector(".hora-atualizacao");
const mensagemPainel = document.querySelector(".mensagem-painel");
const filtroAcessivel = document.querySelector(".filtro-acessivel");
const listaOnibus = document.querySelector(".lista-onibus");

let linhasEncontradas = [];
let favoritos = [];
let linhaAberta = null;
let onibus = [];
let temporizador = null;

function mensagemDeErro(status) {
  if (status === 400) {
    return "Não foi possível fazer essa consulta. Confira o que foi digitado.";
  }
  if (status === 401) {
    return "A SPTrans recusou o token do app. Tente mais tarde.";
  }
  if (status === 429) {
    return "Muitas consultas seguidas. Espere alguns segundos.";
  }
  if (status === 500) {
    return "O app está sem acesso à SPTrans no momento. Tente mais tarde.";
  }
  if (status === 502 || status === 504) {
    return "A SPTrans demorou ou não respondeu. Tente de novo.";
  }
  return "A SPTrans não respondeu (status " + status + "). Tente de novo.";
}

function letreiro(linha) {
  return linha.lt + "-" + linha.tl;
}

function destino(linha) {
  // a SPTrans devolve cada linha duas vezes, uma por sentido: no sl 1 o ônibus vai para o terminal
  // principal (tp) e no sl 2 vai para o secundário (ts). conferimos isso olhando os ônibus andando no mapa
  if (linha.sl === 1) {
    return linha.tp;
  }
  return linha.ts;
}

function textoSentido(linha) {
  // linha circular sai e volta para o mesmo terminal, então mostramos ida e volta em vez do destino
  if (linha.lc) {
    if (linha.sl === 1) {
      return "Linha circular (ida)";
    }
    return "Linha circular (volta)";
  }
  return "Sentido " + destino(linha);
}

async function buscarLinhas(event) {
  event.preventDefault();
  const termo = campoBusca.value.trim();

  if (termo.length < 2) {
    mensagemBusca.textContent = "Digite pelo menos 2 caracteres.";
    return;
  }

  mensagemBusca.textContent = "Buscando...";
  resultados.innerHTML = "";
  linhasEncontradas = [];

  try {
    // sem o encodeURIComponent, um # ou & digitado na busca quebra a URL
    const resposta = await fetch(API_URL + "?rota=Linha/Buscar&termosBusca=" + encodeURIComponent(termo));

    if (resposta.status !== 200) {
      mensagemBusca.textContent = mensagemDeErro(resposta.status);
      return;
    }

    linhasEncontradas = await resposta.json();

    if (linhasEncontradas.length === 0) {
      mensagemBusca.textContent = "Nenhuma linha encontrada. Confira o número ou tente o nome do bairro.";
      return;
    }

    if (linhasEncontradas.length > MAX_RESULTADOS) {
      mensagemBusca.textContent =
        "Mostrando " + MAX_RESULTADOS + " de " + linhasEncontradas.length + " resultados. Digite o número da linha para refinar.";
      linhasEncontradas = linhasEncontradas.slice(0, MAX_RESULTADOS);
    } else {
      mensagemBusca.textContent = linhasEncontradas.length + " resultado(s).";
    }

    renderizarLinhas(resultados, linhasEncontradas);
  } catch (erro) {
    mensagemBusca.textContent = "Não foi possível conectar. Verifique a internet.";
  }
}

function ehFavorita(cl) {
  return favoritos.findIndex((linha) => linha.cl === cl) !== -1;
}

function estrelaDe(cl) {
  if (ehFavorita(cl)) {
    return "★";
  }
  return "☆";
}

function renderizarLinhas(div, lista) {
  div.innerHTML = "";

  lista.forEach((linha) => {
    div.innerHTML += `
      <div class="item-linha">
        <span class="letreiro">${letreiro(linha)}</span>
        <div class="item-info">
          <h3>${textoSentido(linha)}</h3>
          <p>${linha.tp} - ${linha.ts}</p>
        </div>
        <div class="item-botoes">
          <button class="btn-estrela" title="Salvar em minhas linhas" onclick="alternarFavorito(${linha.cl})">
            ${estrelaDe(linha.cl)}
          </button>
          <a class="btn" href="#painel" onclick="abrirLinha(${linha.cl})">Ver ônibus</a>
        </div>
      </div>
    `;
  });
}

function renderizarFavoritos() {
  if (favoritos.length === 0) {
    secaoFavoritos.classList.add("escondido");
  } else {
    secaoFavoritos.classList.remove("escondido");
  }
  renderizarLinhas(listaFavoritos, favoritos);
}

function alternarFavorito(cl) {
  const posicao = favoritos.findIndex((linha) => linha.cl === cl);

  if (posicao === -1) {
    const linha = linhasEncontradas.find((l) => l.cl === cl) || linhaAberta;
    favoritos.push(linha);
  } else {
    favoritos.splice(posicao, 1);
  }

  // as linhas favoritas ficam salvas no navegador, então continuam lá quando a pessoa volta no app
  localStorage.setItem("linhasFavoritas", JSON.stringify(favoritos));

  renderizarLinhas(resultados, linhasEncontradas);
  renderizarFavoritos();
  if (linhaAberta) {
    estrelaPainel.textContent = estrelaDe(linhaAberta.cl);
  }
}

function favoritarLinhaAberta() {
  alternarFavorito(linhaAberta.cl);
}

function abrirLinha(cl) {
  linhaAberta = linhasEncontradas.find((l) => l.cl === cl) || favoritos.find((l) => l.cl === cl);
  onibus = [];

  painelLetreiro.textContent = letreiro(linhaAberta);
  painelDestino.textContent = textoSentido(linhaAberta);
  estrelaPainel.textContent = estrelaDe(cl);
  horaAtualizacao.textContent = "";
  listaOnibus.innerHTML = "";
  limparMapa();

  painel.classList.remove("escondido");

  carregarPosicoes();
  iniciarAtualizacao();
}

function fecharPainel() {
  clearInterval(temporizador);
  linhaAberta = null;
  linhaNoMapa = null;
  painel.classList.add("escondido");
}

function iniciarAtualizacao() {
  // limpa o temporizador anterior antes de criar outro, senão a gente acabaria com duas atualizações rodando juntas
  clearInterval(temporizador);
  temporizador = setInterval(carregarPosicoes, INTERVALO_ATUALIZACAO);
}

function atualizarAgora() {
  carregarPosicoes();
  iniciarAtualizacao();
}

async function carregarPosicoes() {
  const linha = linhaAberta;
  if (!linha) {
    return;
  }

  if (onibus.length === 0) {
    mensagemPainel.textContent = "Carregando...";
  }

  let dados;
  try {
    const resposta = await fetch(API_URL + "?rota=Posicao/Linha&codigoLinha=" + linha.cl);

    // se a pessoa trocou de linha enquanto a resposta chegava, a gente ignora essa resposta antiga
    if (linhaAberta !== linha) {
      return;
    }

    if (resposta.status !== 200) {
      mensagemPainel.textContent = mensagemDeErro(resposta.status);
      return;
    }

    dados = await resposta.json();
  } catch (erro) {
    if (linhaAberta === linha) {
      mensagemPainel.textContent = "Não foi possível conectar. Verifique a internet.";
    }
    return;
  }

  onibus = dados.vs || [];
  horaAtualizacao.textContent = "Atualizado às " + dados.hr;
  mostrarOnibus();
}

function mostrarOnibus() {
  if (!linhaAberta) {
    return;
  }

  const acessiveis = onibus.filter((o) => o.a);

  let visiveis = onibus;
  if (filtroAcessivel.checked) {
    visiveis = acessiveis;
  }

  if (onibus.length === 0) {
    mensagemPainel.textContent = "Nenhum ônibus desta linha circulando agora.";
  } else {
    mensagemPainel.textContent = onibus.length + " ônibus em circulação, " + acessiveis.length + " acessíveis.";
  }

  listaOnibus.innerHTML = "";

  visiveis.forEach((o) => {
    let selo = "";
    if (o.a) {
      selo = '<span class="selo-acessivel">Acessível</span>';
    }

    listaOnibus.innerHTML += `
      <a class="item-onibus" href="#mapa" onclick="focarOnibus(${o.py}, ${o.px})">
        <span>Ônibus <b>${o.p}</b></span>
        ${selo}
        <span class="ver-mapa">Ver no mapa</span>
      </a>
    `;
  });

  mostrarNoMapa(linhaAberta, visiveis);
}

function carregarFavoritos() {
  const favoritosSalvos = localStorage.getItem("linhasFavoritas");
  if (favoritosSalvos) {
    favoritos = JSON.parse(favoritosSalvos);
  }
  renderizarFavoritos();
}

carregarFavoritos();
