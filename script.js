/**
 * Qual é a Palavra? - Jogo de Duplas
 * Script principal do jogo com integração Firebase
 */

// Firebase configuration - Substitua com suas próprias credenciais
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-message-sender-id",
  appId: "seu-app-id"
};

// Inicializar Firebase (descomente quando configurar)
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const storage = firebase.storage();
// const rtdb = firebase.database();

// Código principal do jogo
(function() {
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     VARIÁVEIS GLOBAIS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  // Sessão e estado do jogo
  let sessionId = generateSessionId();
  let gameState = {
    active: false,
    currentWord: 0,
    currentTeam: 0,
    currentClueGiverIndex: 0, // Índice do próximo jogador a dar dica na rodada atual
    isFirstTry: true
  };
  
  // Jogadores e times
  let jogadores = [];
  let duplas = [];
  let scores = [];
  
  // Palavras e histórico
  let palavrasRodada = [];
  let historico = [];
  
  // Controle de timer
  let tempoMaximoValue = 60;
  let tempoRestante = 60;
  let timerInterval = null;
  let timerJaIniciado = false;
  
  // Controle de papel (quem dá dica vs quem adivinha)
  let papelAtual = 0; // 0: jogador1 dá dica, jogador2 adivinha; 1: jogador2 dá dica, jogador1 adivinha
  
  // Controle da sequência de jogadores dando dica
  let ordemDicas = []; // Guarda a ordem de quem deu dica nesta palavra
  
  // Fotos e câmera
  let cameraStream = null;
  let tempFotoDataUrl = "";
  
  // Quantidade mínima de palavras por rodada
  const MIN_PALAVRAS_RODADA = 50;
  
  // Configurações
  let modoDuplas = "aleatorio";
  
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     LISTA DE PALAVRAS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  const palavrasList = [
    // Substantivos comuns
    "Amor", "Gato", "Casa", "Pão", "Anel", "Mesa", "Bolo", "Faro", "Onça", "Alvo", "Vela", "Abacate",
    "Bola", "Café", "Dedo", "Escola", "Festa", "Gaveta", "Homem", "Ilha", "Janela", "Kiwi", "Limão",
    "Mala", "Navio", "Olho", "Porta", "Queijo", "Rato", "Sapo", "Tela", "Uva", "Vento", "Xícara",
    "Zebra", "Água", "Banho", "Carro", "Dança", "Estrela", "Fogo", "Gelo", "História", "Igreja",
    "Jardim", "Leite", "Mar", "Noite", "Ovo", "Peixe", "Quadro", "Rio", "Sol", "Terra", "Universo",
    
    // Adjetivos
    "Alegre", "Bonito", "Calmo", "Doce", "Estranho", "Feliz", "Grande", "Humilde", "Inteligente",
    "Jovem", "Lindo", "Macio", "Novo", "Organizado", "Pequeno", "Quente", "Rico", "Suave", "Triste",
    
    // Profissões
    "Médico", "Professor", "Bombeiro", "Piloto", "Dentista", "Padeiro", "Advogado", "Motorista",
    
    // Lugares
    "Praia", "Montanha", "Cidade", "Floresta", "Deserto", "Parque", "Museu", "Cinema", "Teatro",
    
    // Animais
    "Macaco", "Leão", "Tigre", "Girafa", "Elefante", "Papagaio", "Cachorro", "Cobra", "Lobo",
    "Coelho", "Panda", "Urso", "Águia", "Tubarão", "Baleia", "Golfinho", "Formiga", "Abelha",
    
    // Alimentos
    "Pizza", "Hambúrguer", "Sorvete", "Chocolate", "Banana", "Laranja", "Maçã", "Abacaxi", "Morango",
    "Manga", "Batata", "Cenoura", "Arroz", "Feijão", "Macarrão", "Salada", "Carne", "Frango", "Peixe",
    
    // Esportes
    "Futebol", "Vôlei", "Basquete", "Natação", "Tênis", "Ciclismo", "Boxe", "Judô", "Surf", "Corrida",
    
    // Tecnologia
    "Celular", "Computador", "Internet", "Tablet", "Camera", "Teclado", "Mouse", "Monitor", "Impressora",
    
    // Itens de casa
    "Sofá", "Cama", "Televisão", "Geladeira", "Fogão", "Cadeira", "Tapete", "Espelho", "Abajur", "Relógio",
    
    // Meios de transporte
    "Avião", "Trem", "Ônibus", "Barco", "Bicicleta", "Caminhão", "Helicóptero", "Submarino", "Foguete",
    
    // Natureza
    "Árvore", "Flor", "Nuvem", "Chuva", "Neve", "Vento", "Vulcão", "Cachoeira", "Montanha", "Oceano",
    
    // Verbos
    "Correr", "Cantar", "Dançar", "Nadar", "Comer", "Beber", "Dormir", "Sonhar", "Trabalhar", "Estudar",
    
    // Roupas
    "Camisa", "Calça", "Vestido", "Sapato", "Boné", "Chapéu", "Meia", "Casaco", "Luva", "Cachecol",
    
    // Cores
    "Vermelho", "Azul", "Verde", "Amarelo", "Roxo", "Rosa", "Laranja", "Marrom", "Preto", "Branco",
    
    // Instrumentos musicais
    "Violão", "Piano", "Bateria", "Flauta", "Saxofone", "Violino", "Guitarra", "Teclado", "Trompete",
    
    // Partes do corpo
    "Cabeça", "Braço", "Perna", "Pé", "Mão", "Coração", "Joelho", "Cotovelo", "Ombro", "Orelha",
    
    // Sentimentos
    "Alegria", "Tristeza", "Raiva", "Medo", "Amor", "Saudade", "Esperança", "Ansiedade", "Paz", "Felicidade",
    
    // Objetos variados
    "Chave", "Cinto", "Livro", "Caneta", "Lápis", "Borracha", "Martelo", "Tesoura", "Panela", "Garfo",
    "Colher", "Faca", "Prato", "Copo", "Garrafa", "Escada", "Remédio", "Perfume", "Sabonete", "Toalha",
    
    // Elementos da natureza
    "Lago", "Ilha", "Deserto", "Iceberg", "Caverna", "Vale", "Areia", "Pedra", "Diamante", "Ouro",
    "Prata", "Bronze", "Metal", "Madeira", "Plástico", "Vidro", "Papel", "Algodão", "Seda", "Couro",
    
    // Mais palavras comuns
    "Tempo", "Rua", "Avenida", "Praça", "Mercado", "Loja", "Banco", "Correio", "Hospital", "Farmácia",
    "Padaria", "Livraria", "Biblioteca", "Restaurante", "Café", "Hotel", "Aeroporto", "Estação", "Porto",
    "Jardim", "Piscina", "Ginásio", "Estádio", "Palco", "Teatro", "Música", "Dança", "Poesia", "Romance",
    "Comédia", "Drama", "Terror", "Aventura", "Ficção", "Documentário", "Notícia", "Revista", "Jornal"
  ];

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     CAPTURAS DO DOM
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  const modalRegras = document.getElementById("modalRegras");
  const btnRegras = document.getElementById("btnRegras");
  const btnFecharModal = document.getElementById("btnFecharModal");
  const btnFalarRegras = document.getElementById("btnFalarRegras");

  const configScreen = document.getElementById("config-screen");
  const mainScreen = document.getElementById("main-screen");
  const endScreen = document.getElementById("end-screen");

  const inputTempoMaximo = document.getElementById("tempoMaximo");
  const inputNomeJogador = document.getElementById("nomeJogador");
  const inputFotoJogador = document.getElementById("fotoJogador");
  const listaJogadoresEl = document.getElementById("listaJogadores");

  const btnAbrirCamera = document.getElementById("btnAbrirCamera");
  const btnCapturarFoto = document.getElementById("btnCapturarFoto");
  const videoCamera = document.getElementById("videoCamera");
  const canvasFoto = document.getElementById("canvasFoto");

  const btnAdicionarJogador = document.getElementById("btnAdicionarJogador");
  const btnIniciar = document.getElementById("btnIniciar");
  const btnEncerrar = document.getElementById("btnEncerrar");
  const btnTrocar = document.getElementById("btnTrocar");
  const btnPular = document.getElementById("btnPular");

  const btnToggleTempo = document.getElementById("btnToggleTempo");
  const btnResetTempo = document.getElementById("btnResetTempo");

  const btnEnviarDica = document.getElementById("btnEnviarDica");
  const btnEnviarChute = document.getElementById("btnEnviarChute");

  const scoreContainer = document.getElementById("scoreContainer");
  const doadorEl = document.getElementById("doador");
  const doadorFoto = document.getElementById("doadorFoto");
  const adivinhadorEl = document.getElementById("adivinhador");
  const adivinhadorFoto = document.getElementById("adivinhadorFoto");
  const palavraSecretaEl = document.getElementById("palavraSecreta");
  const conteudoPalavraEl = document.getElementById("conteudoPalavra");
  const tempoRestanteEl = document.getElementById("tempoRestante");
  const campoDica = document.getElementById("campoDica");
  const campoChute = document.getElementById("campoChute");
  const historicoAcoes = document.getElementById("historicoAcoes");

  const endResultado = document.getElementById("resultado");
  const endPontuacaoFinal = document.getElementById("pontuacaoFinal");
  const winnerBox = document.getElementById("winnerBox");
  const winnerPhotos = document.getElementById("winnerPhotos");
  const btnSair = document.getElementById("btnSair");
  const btnCompartilhar = document.getElementById("btnCompartilhar");

  const togglePalavraCheckbox = document.getElementById("togglePalavra");
  const eyeIcon = document.getElementById("eyeIcon");
  
  const palavraAtualEl = document.getElementById("palavraAtual");
  const duplaAtualIndicador = document.getElementById("duplaAtualIndicador");
  const ultimoEvento = document.getElementById("ultimoEvento");
  const ultimoEventoConteudo = document.getElementById("ultimoEventoConteudo");
  
  // QR Code e sessão
  const qrCodeContainer = document.getElementById("qrCodeContainer");
  const sessionDisplay = document.getElementById("sessionDisplay");

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     FUNÇÕES DE FIREBASE
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  // Gerar um ID de sessão único
  function generateSessionId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  // Inicializar a sessão no Firebase
  function initializeFirebaseSession() {
    // Descomente quando configurar o Firebase
    /*
    return db.collection('sessions').doc(sessionId).set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      players: [],
      teams: [],
      gameState: gameState,
      words: palavrasRodada.map(word => ({ word: word, used: false })),
      active: true
    });
    */
    return Promise.resolve(); // Remova quando implementar Firebase
  }
  
  // Atualizar estado do jogo no Firebase
  function updateGameState() {
    // Descomente quando configurar o Firebase
    /*
    return db.collection('sessions').doc(sessionId).update({
      gameState: gameState,
      teams: duplas.map((dupla, index) => ({
        players: dupla,
        score: scores[index]
      }))
    });
    */
    return Promise.resolve(); // Remova quando implementar Firebase
  }
  
  // Gerar QR code para a sessão
  function generateQRCode() {
    if (window.QRCode && qrCodeContainer) {
      qrCodeContainer.innerHTML = '';
      
      // URL para a página de registro de jogador
      const registrationUrl = `${window.location.origin}/register.html?session=${sessionId}`;
      
      // Criar QR code
      new QRCode(qrCodeContainer, {
        text: registrationUrl,
        width: 180,
        height: 180,
        colorDark: "#4f46e5",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      
      // Exibir ID da sessão
      if (sessionDisplay) {
        sessionDisplay.textContent = `Código da Sessão: ${sessionId}`;
      }
    }
  }
  
  // Registrar um jogador via Firebase
  function registerPlayerViaFirebase(name, photoUrl) {
    // Descomente quando configurar o Firebase
    /*
    return db.collection('sessions').doc(sessionId).collection('players').add({
      name: name,
      photo: photoUrl,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then((docRef) => {
      // Adicionar o jogador à lista local
      const player = {
        id: docRef.id,
        name: name,
        photo: photoUrl,
        color: colorPalette[jogadores.length % colorPalette.length]
      };
      jogadores.push(player);
      renderJogadores();
      
      return player;
    });
    */
    // Remova quando implementar Firebase
    const player = {
      id: Math.random().toString(36).substring(7),
      name: name,
      photo: photoUrl,
      color: colorPalette[jogadores.length % colorPalette.length]
    };
    jogadores.push(player);
    renderJogadores();
    return Promise.resolve(player);
  }
  
  // Ouvir por novos jogadores via Firebase
  function listenForNewPlayers() {
    // Descomente quando configurar o Firebase
    /*
    return db.collection('sessions').doc(sessionId).collection('players')
      .orderBy('timestamp')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const playerData = change.doc.data();
            const existingPlayer = jogadores.find(p => p.id === change.doc.id);
            
            if (!existingPlayer) {
              const player = {
                id: change.doc.id,
                name: playerData.name,
                photo: playerData.photo,
                color: colorPalette[jogadores.length % colorPalette.length]
              };
              jogadores.push(player);
              renderJogadores();
              mostrarMensagem(`${player.name} entrou no jogo!`, "info");
            }
          }
        });
      });
    */
  }
  
  // Verificar entrada de dicas ou chutes via Firebase
  function listenForGuessesAndClues() {
    // Descomente quando configurar o Firebase
    /*
    return db.collection('sessions').doc(sessionId).collection('actions')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const action = change.doc.data();
            
            // Processa a ação conforme seu tipo
            if (action.type === 'clue' && 
                action.teamIndex === gameState.currentTeam && 
                isPlayersTurnToGiveClue(action.playerId)) {
              
              processClueFromFirebase(action.playerId, action.content);
            }
            else if (action.type === 'guess' && 
                    action.teamIndex === gameState.currentTeam && 
                    isPlayersTurnToGuess(action.playerId)) {
              
              processGuessFromFirebase(action.playerId, action.content);
            }
          }
        });
      });
    */
  }
  
  // Processar dica recebida via Firebase
  function processClueFromFirebase(playerId, clue) {
    // Implementar quando necessário
    // Exemplo: btnEnviarDica.click() se o valor da dica for válido
  }
  
  // Processar chute recebido via Firebase
  function processGuessFromFirebase(playerId, guess) {
    // Implementar quando necessário
    // Exemplo: btnEnviarChute.click() se o valor do chute for válido
  }
  
  // Verificar se é a vez do jogador dar dica
  function isPlayersTurnToGiveClue(playerId) {
    // Implementar lógica para verificar se é a vez deste jogador dar dica
    return true; // Placeholder
  }
  
  // Verificar se é a vez do jogador adivinhar
  function isPlayersTurnToGuess(playerId) {
    // Implementar lógica para verificar se é a vez deste jogador adivinhar
    return true; // Placeholder
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     CONFETTI SETUP
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  const confettiCanvas = document.getElementById("confettiCanvas");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  });

  // Função para lançar confetti
  function launchConfetti(duration = 2000) {
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: Math.random() * 60 + 100,
        spread: 55,
        origin: { x: Math.random(), y: Math.random() * 0.3 },
        colors: ['#4f46e5', '#a855f7', '#3b82f6', '#10b981'],
        useWorker: true
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  // Função para celebrar acerto com animação
  function celebrarAcerto(duplaIndex) {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 flex items-center justify-center z-50 pointer-events-none";

    const duoContainer = document.createElement("div");
    duoContainer.className = "flex items-center gap-8";

    const [p1, p2] = duplas[duplaIndex];
    [p1, p2].forEach(pl => {
      const imgEl = document.createElement("img");
      imgEl.src = pl.photo || "https://via.placeholder.com/64";
      imgEl.alt = "Foto";
      imgEl.className = "object-cover rounded-full";
      imgEl.style.width = "192px";
      imgEl.style.height = "192px";
      imgEl.style.animation = "growAndFade 2s forwards";
      imgEl.style.border = "4px solid #4f46e5";
      imgEl.style.boxShadow = "0 0 20px rgba(79, 70, 229, 0.6)";
      duoContainer.appendChild(imgEl);
    });

    overlay.appendChild(duoContainer);
    document.body.appendChild(overlay);

    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 2000);
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     REGRAS (MODAL)
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnRegras.addEventListener("click", () => {
    modalRegras.classList.remove("hidden");
    modalRegras.classList.add("flex");
    modalRegras.querySelector('.bg-white').classList.add('modal-content');
    setTimeout(() => {
      modalRegras.classList.add('modal-visible');
    }, 10);
  });

  btnFecharModal.addEventListener("click", () => {
    modalRegras.classList.remove('modal-visible');
    setTimeout(() => {
      modalRegras.classList.add("hidden");
      modalRegras.classList.remove("flex");
    }, 300);
  });

  btnFalarRegras.addEventListener("click", () => {
    const msg = new SpeechSynthesisUtterance();
    msg.text = "1) Forme duplas de jogadores. 2) A dupla que inicia pode ganhar 2 pontos se acertar de primeira. 3) Se errar, valem 1 ponto. 4) Se pular ou o tempo acabar, passa para a próxima dupla. 5) Os jogadores alternam entre dar dicas e adivinhar. 6) Ao final, a dupla com mais pontos vence.";
    msg.lang = "pt-BR";
    speechSynthesis.speak(msg);
  });

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     MODO DUPLAS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  document.getElementById("btnModoAleatorio").addEventListener("click", (e) => {
    modoDuplas = e.target.dataset.modo; // "aleatorio"
    e.target.classList.add("bg-indigo-100");
    e.target.classList.add("text-indigo-800");
    e.target.classList.add("border-indigo-400");
    document.getElementById("btnModoSequencial").classList.remove("bg-indigo-100");
    document.getElementById("btnModoSequencial").classList.remove("text-indigo-800");
    document.getElementById("btnModoSequencial").classList.remove("border-indigo-400");
  });

  document.getElementById("btnModoSequencial").addEventListener("click", (e) => {
    modoDuplas = e.target.dataset.modo; // "manual"
    e.target.classList.add("bg-indigo-100");
    e.target.classList.add("text-indigo-800");
    e.target.classList.add("border-indigo-400");
    document.getElementById("btnModoAleatorio").classList.remove("bg-indigo-100");
    document.getElementById("btnModoAleatorio").classList.remove("text-indigo-800");
    document.getElementById("btnModoAleatorio").classList.remove("border-indigo-400");
  });

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     INICIAR / ENCERRAR / SAIR
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnIniciar.addEventListener("click", iniciarJogo);
  btnEncerrar.addEventListener("click", encerrarPartida);
  btnSair.addEventListener("click", sairParaConfig);

  // Função para iniciar o jogo
  function iniciarJogo() {
    if (jogadores.length < 4 || jogadores.length % 2 !== 0) {
      mostrarMensagem("É necessário ter ao menos 4 jogadores (número par).", "warning");
      return;
    }
    
    // Reset das variáveis
    duplas = [];
    scores = [];
    palavrasRodada = [];
    historico = [];
    ordemDicas = [];
    
    // Inicializar estado do jogo
    gameState = {
      active: true,
      currentWord: 0,
      currentTeam: 0,
      currentClueGiverIndex: 0,
      isFirstTry: true
    };
    
    papelAtual = 0; // Começa com jogador 1 dando dica
    timerJaIniciado = false;
    pararTimer();

    // Configuração de tempo
    tempoMaximoValue = parseInt(inputTempoMaximo.value) || 60;
    tempoRestante = tempoMaximoValue;
    tempoRestanteEl.textContent = tempoRestante;
    tempoRestanteEl.classList.remove("text-red-600");
    tempoRestanteEl.classList.add("text-green-600");

    // Formar duplas
    let arrCopia = [...jogadores];
    if (modoDuplas === "aleatorio") shuffleArray(arrCopia);
    for (let i = 0; i < arrCopia.length; i += 2) {
      duplas.push([arrCopia[i], arrCopia[i + 1]]);
    }
    scores = new Array(duplas.length).fill(0);

    // Selecionar palavras para o jogo
    shuffleArray(palavrasList);
    palavrasRodada = palavrasList.slice(0, Math.max(MIN_PALAVRAS_RODADA, palavrasList.length));

    // Inicializar UI
    palavraAtualEl.textContent = (gameState.currentWord + 1);
    atualizarDuplaAtualIndicador();
    togglePalavraCheckbox.checked = false;
    palavraSecretaEl.classList.add("hidden");
    eyeIcon.textContent = "🙈";

    renderPontuacao();
    atualizarDuplaNaTela();
    exibirTelaPrincipal();
    
    // Adicionar classe de destaque ao botão de iniciar tempo
    btnToggleTempo.classList.add('pulse-button');
    
    // Feedback visual e sonoro de início
    launchConfetti(1000);
    mostrarMensagem("Jogo iniciado! Vamos lá!", "success");
    
    // Inicializar Firebase
    initializeFirebaseSession().then(() => {
      // Ouvir por novos jogadores e ações
      listenForNewPlayers();
      listenForGuessesAndClues();
    });
  }

  // Função para encerrar a partida
  function encerrarPartida() {
    gameState.active = false;
    updateGameState();
    
    exibirTelaFinal();
    pararTimer();
    let maiorPontuacao = Math.max(...scores);
    let indicesMax = scores.map((v, i) => (v === maiorPontuacao ? i : -1)).filter(x => x >= 0);

    if (indicesMax.length > 1) {
      endResultado.innerHTML = '<i class="fas fa-trophy text-yellow-500 mr-2"></i> Temos um Empate!';
    } else {
      const [p1, p2] = duplas[indicesMax[0]];
      endResultado.innerHTML = '<i class="fas fa-trophy text-yellow-500 mr-2"></i> Dupla Vencedora: <span class="font-bold text-indigo-700">' + p1.name + ' & ' + p2.name + '</span>';
    }

    endPontuacaoFinal.innerHTML = '<h2 class="font-semibold text-lg mb-3 text-indigo-700"><i class="fas fa-chart-bar mr-2"></i> Pontuação Final</h2><div class="bg-white p-3 rounded-lg shadow-inner">';
    duplas.forEach((dupla, idx) => {
      const div = document.createElement("div");
      div.className = "flex items-center gap-2 my-3 p-3 rounded-lg" + (scores[idx] === maiorPontuacao ? " bg-yellow-100 border-l-4 border-yellow-500" : " border-l-4 border-gray-200");
      
      dupla.forEach((p) => {
        if (p.photo) {
          const img = document.createElement("img");
          img.src = p.photo;
          img.alt = "Foto";
          img.className = "w-10 h-10 object-cover rounded-full border-2" + (scores[idx] === maiorPontuacao ? " border-yellow-400" : " border-gray-200");
          div.appendChild(img);
        }
      });
      
      const sp = document.createElement("span");
      sp.className = "flex-grow text-lg" + (scores[idx] === maiorPontuacao ? " font-bold text-yellow-800" : "");
      sp.textContent = dupla[0].name.toUpperCase() + " & " + dupla[1].name.toUpperCase();
      div.appendChild(sp);
      
      const pts = document.createElement("span");
      pts.className = "text-2xl font-extrabold" + (scores[idx] === maiorPontuacao ? " text-yellow-600" : " text-indigo-600");
      pts.textContent = scores[idx] + " pts";
      div.appendChild(pts);
      
      endPontuacaoFinal.appendChild(div);
    });
    endPontuacaoFinal.innerHTML += '</div>';

    // Exibir fotos vencedores + troféu
    winnerBox.classList.add("hidden");
    winnerPhotos.innerHTML = "";
    
    if (indicesMax.length > 0) {
      indicesMax.forEach((mx) => {
        const [p1, p2] = duplas[mx];
        [p1, p2].forEach((pl) => {
          const img = document.createElement("img");
          img.src = pl.photo || "https://via.placeholder.com/64";
          img.alt = pl.name;
          img.className = "w-20 h-20 object-cover rounded-full border-4 border-yellow-400 shadow-lg";
          winnerPhotos.appendChild(img);
        });
      });
      
      winnerBox.classList.remove("hidden");
      launchConfetti(6000);
    }
  }

  // Função para voltar à tela de configuração
  function sairParaConfig() {
    // Limpar variáveis de jogo
    jogadores = [];
    duplas = [];
    scores = [];
    historico = [];
    palavrasRodada = [];
    ordemDicas = [];
    
    // Resetar estado do jogo
    gameState = {
      active: false,
      currentWord: 0,
      currentTeam: 0,
      currentClueGiverIndex: 0,
      isFirstTry: true
    };
    
    // Limpar campos
    inputNomeJogador.value = "";
    inputFotoJogador.value = "";
    
    // Atualizar UI
    renderJogadores();
    exibirTelaConfig();
    
    // Atualizar Firebase (se implementado)
    if (gameState.active) {
      gameState.active = false;
      updateGameState();
    }
    
    // Gerar nova sessão
    sessionId = generateSessionId();
    if (window.QRCode) {
      generateQRCode();
    }
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     TROCAR PALAVRA
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnTrocar.addEventListener("click", trocarPalavra);
  
  function trocarPalavra() {
    const doadorNome = getDoadorName();
    registrarHistorico("TROCAR", "Palavra trocada", doadorNome);
    pararTimer();

    // Pega uma nova palavra aleatória
    const randomIndex = Math.floor(Math.random() * palavrasList.length);
    const nova = palavrasList[randomIndex];
    palavrasRodada[gameState.currentWord] = nova;

    // Reset do tempo
    tempoRestante = tempoMaximoValue;
    tempoRestanteEl.textContent = tempoRestante;
    tempoRestanteEl.classList.remove("text-red-600");
    tempoRestanteEl.classList.add("text-green-600");

    // Atualiza a palavra na tela
    conteudoPalavraEl.textContent = nova;
    togglePalavraCheckbox.checked = false;
    palavraSecretaEl.classList.add("hidden");
    eyeIcon.textContent = "🙈";
    
    // Resetar a sequência de jogadores para a nova palavra
    resetarSequenciaJogadores();
    
    mostrarMensagem("A palavra foi trocada!", "warning");
    
    // Atualizar Firebase
    updateGameState();
  }
  
  // Resetar a sequência de jogadores para uma nova palavra
  function resetarSequenciaJogadores() {
    // Resetar a lista de ordem de dicas
    ordemDicas = [];
    
    // Alternar para o próximo jogador a dar a dica para a nova palavra
    // O primeiro a dar dica na nova palavra é o segundo da palavra anterior
    if (gameState.currentClueGiverIndex > 0) {
      // Se já houve pelo menos um jogador dando dica antes, começar com ele
      gameState.currentClueGiverIndex = 0;
    }
    
    // Atualizar a UI
    atualizarDuplaNaTela();
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     PULAR PALAVRA
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnPular.addEventListener("click", () => {
    const doadorNome = getDoadorName();
    registrarHistorico("PULOU", "Palavra pulada", doadorNome);
    pararTimer();
    passarParaProximaPalavra();
    
    mostrarMensagem("Palavra pulada! Próxima dupla.", "info");
  });

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     TIMER / BOTÕES
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnToggleTempo.addEventListener("click", () => {
    if (timerInterval) {
      pararTimer();
      btnToggleTempo.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      iniciarTimer();
      btnToggleTempo.innerHTML = '<i class="fas fa-pause"></i>';
      btnToggleTempo.classList.remove('pulse-button');
    }
  });
  
  btnResetTempo.addEventListener("click", () => {
    pararTimer();
    btnToggleTempo.innerHTML = '<i class="fas fa-play"></i>';
    tempoRestante = tempoMaximoValue;
    tempoRestanteEl.textContent = tempoRestante;
    tempoRestanteEl.classList.remove("text-red-600");
    tempoRestanteEl.classList.add("text-green-600");
    tempoRestanteEl.classList.remove("animate-pulse");
    
    mostrarMensagem("Tempo reiniciado!", "info");
  });

  function iniciarTimer() {
    if (timerInterval) return;
    
    timerInterval = setInterval(() => {
      tempoRestante--;
      tempoRestanteEl.textContent = tempoRestante;

      if (tempoRestante <= 10) {
        tempoRestanteEl.classList.remove("text-green-600");
        tempoRestanteEl.classList.add("text-red-600");
        
        // Feedback visual para tempo acabando
        if (tempoRestante <= 5) {
          tempoRestanteEl.classList.add("animate-pulse");
        }
      } else {
        tempoRestanteEl.classList.remove("text-red-600");
        tempoRestanteEl.classList.add("text-green-600");
        tempoRestanteEl.classList.remove("animate-pulse");
      }
      
      if (tempoRestante <= 0) {
        pararTimer();
        btnToggleTempo.innerHTML = '<i class="fas fa-play"></i>';
        
        const doadorNome = getDoadorName();
        registrarHistorico("PULOU", "Tempo esgotado", doadorNome);
        
        // Passar para o próximo jogador na sequência
        passarParaProximoJogadorMesmaPalavra();
        
        mostrarMensagem("Tempo esgotado! Próximo jogador.", "danger");
      }
    }, 1000);
  }
  
  function pararTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      tempoRestanteEl.classList.remove("animate-pulse");
    }
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     DICA E CHUTE
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnEnviarDica.addEventListener("click", () => {
    const dica = campoDica.value.trim();
    if (!dica) {
      mostrarMensagem("Digite uma dica antes de enviar!", "warning");
      campoDica.focus();
      return;
    }
    
    const doadorNome = getDoadorName();
    registrarHistorico("DICA", dica, doadorNome);
    campoDica.value = "";
    
    // Alternar visibilidade dos boxes
    document.getElementById("boxDoador").classList.remove("active-turn-box");
    document.getElementById("boxAdiv").classList.add("active-turn-box");

    if (!timerJaIniciado) {
      iniciarTimer();
      btnToggleTempo.innerHTML = '<i class="fas fa-pause"></i>';
      btnToggleTempo.classList.remove('pulse-button');
      timerJaIniciado = true;
    }
    
    // Registrar na ordem de dicas
    ordemDicas.push({
      playerId: duplas[gameState.currentTeam][papelAtual === 0 ? 0 : 1].id,
      playerName: doadorNome
    });
    
    mostrarMensagem(`${doadorNome} enviou a dica: "${dica}"`, "info");
    
    // Gravar no Firebase se implementado
    //db.collection('sessions').doc(sessionId).collection('actions').add({...});
  });
  
  btnEnviarChute.addEventListener("click", () => {
    const chute = campoChute.value.trim();
    if (!chute) {
      mostrarMensagem("Digite um chute antes de enviar!", "warning");
      campoChute.focus();
      return;
    }
    
    const palavraAtual = palavrasRodada[gameState.currentWord];
    if (!palavraAtual) return;

    const adivNome = getAdivinhadorName();
    
    if (chute.toLowerCase() === palavraAtual.toLowerCase()) {
      // ACERTO
      const pts = gameState.isFirstTry ? 2 : 1;
      registrarHistorico("ACERTO", chute, adivNome, pts);
      scores[gameState.currentTeam] += pts;
      renderPontuacao();
      launchConfetti();
      celebrarAcerto(gameState.currentTeam);
      
      // Passar para a próxima palavra e preparar para a próxima dupla
      passarParaProximaPalavra();
      
      document.getElementById("boxAdiv").classList.remove("active-turn-box");
      document.getElementById("boxDoador").classList.add("active-turn-box");
      
      mostrarMensagem(`${adivNome} ACERTOU e ganhou ${pts} pontos!`, "success");
      
      // Atualizar Firebase
      updateGameState();
    } else {
      // ERRO
      registrarHistorico("ERRO", chute, adivNome);
      gameState.isFirstTry = false;
      
      // Passar para o próximo jogador na sequência
      passarParaProximoJogadorMesmaPalavra();
      
      mostrarMensagem(`${adivNome} errou! Resposta: "${chute}"`, "danger");
      
      // Atualizar Firebase
      updateGameState();
    }
    campoChute.value = "";
  });

  // Função para passar para a próxima palavra
  function passarParaProximaPalavra() {
    gameState.currentWord++;
    gameState.isFirstTry = true;
    
    // Verificar se acabaram as palavras
    if (gameState.currentWord >= palavrasRodada.length) {
      // Adicionar mais palavras se necessário em vez de encerrar
      shuffleArray(palavrasList);
      palavrasRodada = palavrasRodada.concat(palavrasList.slice(0, 20));
    }
    
    // Atualizar contador de palavra atual
    palavraAtualEl.textContent = (gameState.currentWord + 1);
    
    // Alternar papéis se tivermos dado a volta completa nas duplas
    if (ordemDicas.length >= duplas.length) {
      alternarPapeis();
    }
    
    // Definir próxima dupla
    gameState.currentTeam = (gameState.currentTeam + 1) % duplas.length;
    
    // Resetar a sequência de jogadores para a nova palavra
    resetarSequenciaJogadores();
    
    // Atualizar indicador de dupla atual
    atualizarDuplaAtualIndicador();
    
    // Resetar timer
    tempoRestante = tempoMaximoValue;
    tempoRestanteEl.textContent = tempoRestante;
    tempoRestanteEl.classList.remove("text-red-600");
    tempoRestanteEl.classList.add("text-green-600");
    tempoRestanteEl.classList.remove("animate-pulse");
    
    // Resetar UI da palavra
    togglePalavraCheckbox.checked = false;
    palavraSecretaEl.classList.add("hidden");
    eyeIcon.textContent = "🙈";
    
    // Atualizar UI
    atualizarDuplaNaTela();
  }

  // Função para passar para o próximo jogador na sequência, mantendo a mesma palavra
  function passarParaProximoJogadorMesmaPalavra() {
    // Passar para a próxima dupla
    gameState.currentTeam = (gameState.currentTeam + 1) % duplas.length;
    
    // Atualizar indicador de dupla atual
    atualizarDuplaAtualIndicador();
    
    // Resetar timer
    tempoRestante = tempoMaximoValue;
    tempoRestanteEl.textContent = tempoRestante;
    tempoRestanteEl.classList.remove("text-red-600");
    tempoRestanteEl.classList.add("text-green-600");
    tempoRestanteEl.classList.remove("animate-pulse");

    // Resetar UI da palavra
    togglePalavraCheckbox.checked = false;
    palavraSecretaEl.classList.add("hidden");
    eyeIcon.textContent = "🙈";
    
    // Atualizar UI
    atualizarDuplaNaTela();
  }
  
  // Alternar os papéis (quem dá dica vs quem adivinha)
  function alternarPapeis() {
    papelAtual = papelAtual === 0 ? 1 : 0;
    mostrarMensagem("Papéis alternados: Quem adivinhava agora dá a dica e vice-versa!", "info");
  }

  // Função para atualizar o indicador da dupla atual
  function atualizarDuplaAtualIndicador() {
    if (duplas.length === 0) return;
    
    const [p1, p2] = duplas[gameState.currentTeam];
    duplaAtualIndicador.textContent = `${p1.name} & ${p2.name}`;
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     EXIBIR / ESCONDER TELAS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  function exibirTelaConfig() {
    configScreen.classList.remove("hidden");
    mainScreen.classList.add("hidden");
    endScreen.classList.add("hidden");
  }
  
  function exibirTelaPrincipal() {
    configScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    endScreen.classList.add("hidden");
  }
  
  function exibirTelaFinal() {
    configScreen.classList.add("hidden");
    mainScreen.classList.add("hidden");
    endScreen.classList.remove("hidden");
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     RENDER DE PONTUAÇÃO, DUPLAS, ETC.
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  function atualizarDuplaNaTela() {
    if (duplas.length === 0) return;
    
    // Determinar quem dá dica e quem adivinha com base no papelAtual
    const doadorIndex = papelAtual === 0 ? 0 : 1;
    const adivinhadorIndex = papelAtual === 0 ? 1 : 0;
    
    const doadorPlayer = duplas[gameState.currentTeam][doadorIndex];
    const adivPlayer = duplas[gameState.currentTeam][adivinhadorIndex];
    
    doadorEl.textContent = doadorPlayer.name.toUpperCase();
    adivinhadorEl.textContent = adivPlayer.name.toUpperCase();
    conteudoPalavraEl.textContent = palavrasRodada[gameState.currentWord] || "";

    if (doadorPlayer.photo) {
      doadorFoto.src = doadorPlayer.photo;
      doadorFoto.classList.remove("hidden");
    } else {
      doadorFoto.classList.add("hidden");
    }
    
    if (adivPlayer.photo) {
      adivinhadorFoto.src = adivPlayer.photo;
      adivinhadorFoto.classList.remove("hidden");
    } else {
      adivinhadorFoto.classList.add("hidden");
    }

    document.getElementById("boxDoador").classList.remove("active-turn-box");
    document.getElementById("boxAdiv").classList.remove("active-turn-box");
    document.getElementById("boxDoador").classList.add("active-turn-box");
    
    // Limpar campos de entrada
    campoDica.value = "";
    campoChute.value = "";
    
    // Pausar timer quando mudar de dupla/jogador
    pararTimer();
    btnToggleTempo.innerHTML = '<i class="fas fa-play"></i>';
    btnToggleTempo.classList.add('pulse-button');
    
    // Exibir status atual
    mostrarMensagem(`Vez da dupla: ${doadorPlayer.name} (doador) & ${adivPlayer.name} (adivinhador)`, "info");
  }

  function renderPontuacao() {
    scoreContainer.innerHTML = "";
    
    duplas.forEach((dupla, idx) => {
      const row = document.createElement("div");
      row.className = "flex items-center gap-2 bg-white rounded-lg p-2 shadow" + 
                     (idx === gameState.currentTeam ? " border-2 border-indigo-500" : "");

      dupla.forEach((p) => {
        if (p.photo) {
          const img = document.createElement("img");
          img.src = p.photo;
          img.alt = "Foto";
          img.className = "w-10 h-10 object-cover rounded-full player-photo";
          row.appendChild(img);
        }
      });
      
      const nomes = document.createElement("span");
      nomes.className = "font-semibold text-sm ml-2";
      nomes.textContent = dupla[0].name.toUpperCase() + " & " + dupla[1].name.toUpperCase();
      row.appendChild(nomes);

      const pts = document.createElement("span");
      pts.className = "text-indigo-700 font-extrabold text-lg ml-auto";
      pts.textContent = `${scores[idx]} pts`;
      row.appendChild(pts);

      scoreContainer.appendChild(row);
    });
  }

  // Função para mostrar mensagem temporária
  function mostrarMensagem(texto, tipo) {
    let icon, bgClass;
    
    switch(tipo) {
      case "success":
        icon = '<i class="fas fa-check-circle mr-2 text-green-600"></i>';
        bgClass = "bg-green-100";
        break;
      case "warning":
        icon = '<i class="fas fa-exclamation-triangle mr-2 text-amber-600"></i>';
        bgClass = "bg-amber-100";
        break;
      case "danger":
        icon = '<i class="fas fa-times-circle mr-2 text-red-600"></i>';
        bgClass = "bg-red-100";
        break;
      case "info":
      default:
        icon = '<i class="fas fa-info-circle mr-2 text-indigo-600"></i>';
        bgClass = "bg-indigo-100";
    }
    
    ultimoEventoConteudo.innerHTML = icon + texto;
    ultimoEvento.className = `mt-4 ${bgClass} p-3 rounded-lg shadow-sm`;
    ultimoEvento.classList.remove("hidden");
    ultimoEvento.classList.add("highlight-latest");
    
    // Após 5 segundos, remover o destaque
    setTimeout(() => {
      ultimoEvento.classList.remove("highlight-latest");
    }, 5000);
  }

  // Histórico com cores diferentes
  function registrarHistorico(acao, texto, jogador, pontos) {
    const currentWord = palavrasRodada[gameState.currentWord] || "";
    const novoItem = { acao, texto, jogador, points: pontos, palavra: currentWord };
    
    historico.push(novoItem);
    atualizarHistoricoNaTela();
    
    // Registrar no Firebase se estiver configurado
    /*
    if (firebase) {
      db.collection('sessions').doc(sessionId).collection('history').add({
        ...novoItem,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    */
  }
  
  function atualizarHistoricoNaTela() {
    historicoAcoes.innerHTML = "";
    
    historico.forEach((h, index) => {
      let mensagem = "";
      let icone = "";
      let bgClass = "bg-gray-100";
      let borderClass = "";
      
      // Distinção de cor no histórico
      if (h.acao === "DICA") {
        icone = '<i class="fas fa-lightbulb text-yellow-500"></i>';
        mensagem = `${icone} ${h.jogador}: "${h.texto}"`;
        bgClass = "bg-blue-50";
        borderClass = "dica-card";
      } 
      else if (h.acao === "ERRO") {
        icone = '<i class="fas fa-times-circle text-red-500"></i>';
        mensagem = `${icone} ${h.jogador}: "${h.texto}"`;
        bgClass = "bg-red-50";
        borderClass = "erro-card";
      }
      else if (h.acao === "ACERTO") {
        icone = '<i class="fas fa-check-circle text-green-500"></i>';
        mensagem = `${icone} ${h.jogador} <span class="font-bold text-green-600">+${h.points || 0} pts</span>`;
        bgClass = "bg-green-50";
        borderClass = "acerto-card";
      }
      else if (h.acao === "PULOU") {
        icone = '<i class="fas fa-forward text-amber-500"></i>';
        mensagem = `${icone} ${h.jogador}: ${h.texto}`;
        bgClass = "bg-amber-50";
        borderClass = "pular-card";
      }
      else if (h.acao === "TROCAR") {
        icone = '<i class="fas fa-sync-alt text-purple-500"></i>';
        mensagem = `${icone} ${h.jogador}: ${h.texto}`;
        bgClass = "bg-purple-50";
        borderClass = "trocar-card";
      }

      const secretIcon = document.createElement("span");
      secretIcon.innerHTML = '<i class="fas fa-eye text-indigo-500"></i>';
      secretIcon.className = "ml-2 hover-scale";
      secretIcon.title = "Ver palavra secreta";
      secretIcon.addEventListener("click", () => {
        alert(`A palavra secreta era: ${h.palavra}`);
      });

      // Card do histórico
      const card = document.createElement("div");
      card.className = `${bgClass} ${borderClass} rounded-lg p-2 min-w-[150px] text-sm flex items-center justify-between history-card shadow-sm`;
      
      const messageSpan = document.createElement("span");
      messageSpan.innerHTML = mensagem;
      card.appendChild(messageSpan);
      card.appendChild(secretIcon);

      // Destacar o último cartão de histórico
      if (index === historico.length - 1) {
        card.classList.add("highlight-latest");
      }

      historicoAcoes.appendChild(card);
    });
    
    // Rola automaticamente para o fim do histórico
    historicoAcoes.scrollLeft = historicoAcoes.scrollWidth;
    
    // Atualizar último evento com o evento mais recente
    if (historico.length > 0) {
      const ultimo = historico[historico.length - 1];
      let tipo;
      
      switch(ultimo.acao) {
        case "ACERTO":
          tipo = "success";
          break;
        case "ERRO":
          tipo = "danger";
          break;
        case "PULOU":
        case "TROCAR":
          tipo = "warning";
          break;
        case "DICA":
        default:
          tipo = "info";
      }
      
      let mensagem;
      if (ultimo.acao === "ACERTO") {
        mensagem = `${ultimo.jogador} acertou e ganhou ${ultimo.points} pontos!`;
      } else if (ultimo.acao === "ERRO") {
        mensagem = `${ultimo.jogador} errou. Resposta: "${ultimo.texto}"`;
      } else if (ultimo.acao === "DICA") {
        mensagem = `${ultimo.jogador} deu a dica: "${ultimo.texto}"`;
      } else {
        mensagem = `${ultimo.jogador}: ${ultimo.texto}`;
      }
      
      mostrarMensagem(mensagem, tipo);
    }
  }

  // Funções auxiliares para obter nomes dos jogadores
  function getDoadorName() {
    if (duplas.length === 0) return "";
    
    // Determinar o doador com base no papelAtual
    const doadorIndex = papelAtual === 0 ? 0 : 1;
    return duplas[gameState.currentTeam][doadorIndex].name.toUpperCase();
  }
  
  function getAdivinhadorName() {
    if (duplas.length === 0) return "";
    
    // Determinar o adivinhador com base no papelAtual
    const adivinhadorIndex = papelAtual === 0 ? 1 : 0;
    return duplas[gameState.currentTeam][adivinhadorIndex].name.toUpperCase();
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     PALAVRA SECRETA (OLHINHO)
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  togglePalavraCheckbox.addEventListener("change", (e) => {
    if (e.target.checked) {
      palavraSecretaEl.classList.remove("hidden");
      eyeIcon.textContent = "👁️";
    } else {
      palavraSecretaEl.classList.add("hidden");
      eyeIcon.textContent = "🙈";
    }
  });

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     CÂMERA
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnAbrirCamera.addEventListener("click", async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoCamera.srcObject = cameraStream;
      videoCamera.classList.remove("hidden");
      btnCapturarFoto.classList.remove("hidden");
      canvasFoto.classList.add("hidden");
    } catch (e) {
      alert("Não foi possível acessar a câmera: " + e);
    }
  });
  
  btnCapturarFoto.addEventListener("click", () => {
    if (!cameraStream) return;
    
    canvasFoto.classList.remove("hidden");
    canvasFoto.width = videoCamera.videoWidth;
    canvasFoto.height = videoCamera.videoHeight;
    
    const ctx = canvasFoto.getContext("2d");
    ctx.drawImage(videoCamera, 0, 0, canvasFoto.width, canvasFoto.height);
    
    let dataUrl = canvasFoto.toDataURL("image/png");
    videoCamera.classList.add("hidden");
    btnCapturarFoto.classList.add("hidden");
    
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
    tempFotoDataUrl = dataUrl;
    
    mostrarMensagem("Foto capturada com sucesso!", "success");
  });

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     ADICIONAR JOGADOR
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnAdicionarJogador.addEventListener("click", adicionarJogador);
  
  // Evento de tecla Enter para adicionar jogador
  inputNomeJogador.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      adicionarJogador();
    }
  });
  
  function adicionarJogador() {
    if (jogadores.length >= 10) {
      mostrarMensagem("Máximo de 10 jogadores atingido!", "warning");
      return;
    }
    
    let nome = inputNomeJogador.value.trim() || `Jogador ${jogadores.length + 1}`;
    let colorClass = colorPalette[jogadores.length % colorPalette.length];
    let foto = "";
    const file = inputFotoJogador.files[0];

    if (tempFotoDataUrl) {
      foto = tempFotoDataUrl;
      tempFotoDataUrl = "";
      pushJogador(nome, colorClass, foto);
    } else if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        foto = ev.target.result;
        pushJogador(nome, colorClass, foto);
      };
      reader.readAsDataURL(file);
    } else {
      pushJogador(nome, colorClass, foto);
    }
  }
  
  const colorPalette = [
    "bg-indigo-100 text-indigo-800",
    "bg-green-100 text-green-800",
    "bg-amber-100 text-amber-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-orange-100 text-orange-800",
    "bg-blue-100 text-blue-800",
    "bg-teal-100 text-teal-800"
  ];
  
  function pushJogador(name, color, photo) {
    const playerId = Math.random().toString(36).substring(7);
    const player = { id: playerId, name, color, photo };
    
    jogadores.push(player);
    inputNomeJogador.value = "";
    inputFotoJogador.value = "";
    renderJogadores();
    
    mostrarMensagem(`Jogador "${name}" adicionado com sucesso!`, "success");
    
    // Adicionar ao Firebase se implementado
    //registerPlayerViaFirebase(name, photo);
  }
  
  function removerJogador(idx) {
    const nomeJogador = jogadores[idx].name;
    
    // Remover do Firebase se implementado
    /*
    if (firebase && jogadores[idx].id) {
      db.collection('sessions').doc(sessionId).collection('players').doc(jogadores[idx].id).delete();
    }
    */
    
    jogadores.splice(idx, 1);
    renderJogadores();
    mostrarMensagem(`Jogador "${nomeJogador}" removido!`, "info");
  }
  
  function renderJogadores() {
    listaJogadoresEl.innerHTML = "";
    
    if (jogadores.length === 0) {
      const msgVazia = document.createElement("div");
      msgVazia.className = "text-center p-4 text-gray-500 italic";
      msgVazia.innerHTML = '<i class="fas fa-users-slash mr-2"></i> Nenhum jogador adicionado';
      listaJogadoresEl.appendChild(msgVazia);
      return;
    }
    
    jogadores.forEach((pl, i) => {
      const div = document.createElement("div");
      div.className = `${pl.color} p-3 rounded-lg mb-2 shadow-sm font-bold flex items-center justify-between transition-all hover:shadow-md`;

      const left = document.createElement("div");
      left.className = "flex items-center gap-3";
      
      if (pl.photo) {
        const imgEl = document.createElement("img");
        imgEl.src = pl.photo;
        imgEl.alt = "Foto";
        imgEl.className = "w-10 h-10 object-cover rounded-full shadow-sm";
        left.appendChild(imgEl);
      } else {
        // Avatar de placeholder se não tiver foto
        const avatar = document.createElement("div");
        avatar.className = "w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold shadow-sm";
        avatar.textContent = pl.name.substring(0, 1).toUpperCase();
        left.appendChild(avatar);
      }
      
      const sp = document.createElement("span");
      sp.textContent = pl.name;
      left.appendChild(sp);

      div.appendChild(left);

      const btnRem = document.createElement("button");
      btnRem.innerHTML = '<i class="fas fa-trash-alt"></i>';
      btnRem.className = "bg-red-400 hover:bg-red-500 text-white p-2 rounded-full shadow-sm transition-all hover:shadow";
      btnRem.title = "Remover jogador";
      btnRem.addEventListener("click", () => removerJogador(i));
      div.appendChild(btnRem);

      listaJogadoresEl.appendChild(div);
    });
    
    // Exibir contador de jogadores
    const contador = document.createElement("div");
    contador.className = "text-center p-2 text-xs text-indigo-600 font-semibold";
    contador.innerHTML = `<i class="fas fa-users mr-1"></i> ${jogadores.length} jogador(es) (mínimo 4, necessário número par)`;
    listaJogadoresEl.appendChild(contador);
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     COMPARTILHAR
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  btnCompartilhar.addEventListener("click", () => {
    const mensagem = `Fui campeão no jogo "Qual é a Palavra?"! Venha jogar você também!`;
    
    // Tentar usar Web Share API se disponível
    if (navigator.share) {
      navigator.share({
        title: 'Qual é a Palavra?',
        text: mensagem,
        url: window.location.href,
      })
      .catch((error) => {
        console.log('Erro ao compartilhar:', error);
        compartilharWhatsApp(mensagem);
      });
    } else {
      compartilharWhatsApp(mensagem);
    }
  });
  
  function compartilharWhatsApp(mensagem) {
    const linkWhats = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhats, "_blank");
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     SHUFFLE
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     EVENTOS PARA TELAS PEQUENAS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  // Melhorar experiência em telas pequenas
  function ajustarLayoutParaTelaPequena() {
    if (window.innerWidth < 640) {
      // Adicionar classes para melhor visualização em telas pequenas
      document.querySelectorAll('.md\\:flex-row').forEach(el => {
        el.classList.add('mobile-stack');
      });
    } else {
      document.querySelectorAll('.mobile-stack').forEach(el => {
        el.classList.remove('mobile-stack');
      });
    }
  }

  window.addEventListener('resize', ajustarLayoutParaTelaPequena);
  
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     DICAS E NOTIFICAÇÕES EXTRAS
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  // Adicionar dicas para os campos
  campoDica.addEventListener('focus', () => {
    mostrarMensagem('Digite uma dica para ajudar seu parceiro a adivinhar a palavra!', 'info');
  });
  
  campoChute.addEventListener('focus', () => {
    mostrarMensagem('Digite seu chute para a palavra secreta!', 'info');
  });

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     INICIALIZAÇÃO
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  function inicializarApp() {
    // Exibir tela de configuração
    exibirTelaConfig();
    
    // Ajustar layout para tela pequena
    ajustarLayoutParaTelaPequena();
    
    // Renderizar jogadores (vazio inicialmente)
    renderJogadores();
    
    // Gerar QR code se a biblioteca estiver disponível
    if (window.QRCode) {
      generateQRCode();
    }
    
    // Inicializar Firebase se configurado
    /*
    if (firebase) {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      storage = firebase.storage();
      rtdb = firebase.database();
    }
    */
    
    // Mensagem de boas-vindas
    mostrarMensagem("Bem-vindo ao jogo Qual é a Palavra! Adicione jogadores para começar.", "info");
    
    // Eventos para pulsação de botões
    setTimeout(() => {
      if (!btnRegras.classList.contains('clicked')) {
        btnRegras.classList.add('pulse-button');
        setTimeout(() => {
          btnRegras.classList.remove('pulse-button');
        }, 5000);
      }
    }, 2000);
    
    btnRegras.addEventListener('click', function() {
      this.classList.remove('pulse-button');
      this.classList.add('clicked');
    });
  }
  
  // Iniciar o aplicativo
  inicializarApp();
})();
