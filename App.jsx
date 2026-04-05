import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Menu, BookOpen, Star, Clock, 
  ChevronLeft, ChevronRight, List, Info, Play,
  User, LogOut, X, Loader2, Home as HomeIcon, Compass, 
  UserCircle, Key, Camera, LayoutGrid, CheckCircle, 
  Library, BookmarkPlus, Edit3, History, Smartphone, Moon, Sun, AlertCircle, Eye,
  MessageSquare, EyeOff, Send, Sparkles, PartyPopper, Zap, Hexagon,
  ArrowDownUp, Flame, Coins, ShoppingCart, Bell, Dices, Infinity as InfinityIcon,
  Target, Crosshair, HelpCircle, ShieldAlert, Check, Timer, Skull, Trophy,
  ZoomIn, ZoomOut, Quote, Filter, Type, Fingerprint
} from 'lucide-react';

// --- INJEÇÃO DO VISUAL (TAILWIND) ---
if (typeof document !== 'undefined') {
  const script = document.createElement('script');
  script.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(script);
}

// --- FIREBASE ---
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, query, getDocs, updateDoc, increment, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzWm7BzAuEgbr3OYXQqzmg7eUwOyuBgLM",
  authDomain: "manga-infinity-2d200.firebaseapp.com",
  projectId: "manga-infinity-2d200",
  storageBucket: "manga-infinity-2d200.firebasestorage.app",
  messagingSenderId: "632600755308",
  appId: "1:632600755308:web:518b99ee9432a12195ec49",
  measurementId: "G-7MCEWM4JFY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = 'manga_infinity_production_db_v1'; 

const TIPOS = ["Todos", "Mangá", "Manhwa", "Manhua"];
const GENEROS = ["Ação", "Aventura", "Romance", "Fantasia", "Sci-Fi", "Terror", "Sistema", "Isekai", "Escolar", "Artes Marciais", "Cultivo", "Comédia", "Drama", "Mistério", "Slice of Life", "Sobrenatural", "Histórico", "Esportes", "Mecha", "Psicológico"];
const LIBRARY_STATUS = ["Lendo", "Planejo Ler", "Finalizado", "Dropado", "Favoritos"];

const FALLBACK_SHOP_ITEMS = [
  { id: 'frame_neon', name: 'Aura Cósmica', type: 'frame', price: 500, css: 'ring-2 ring-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)]' },
  { id: 'frame_cyan', name: 'Neon Cibernético', type: 'frame', price: 1000, css: 'ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.9)]' },
  { id: 'cover_galaxy', name: 'Nebulosa Infinita', type: 'cover', price: 1500, url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800' }
];

// BANCO GIGANTE DE ENIGMAS LOCAL
const MULTIVERSO_ENIGMAS = [
    { q: "Um menino feito de borracha navega os mares para encontrar o maior tesouro do mundo. Que obra é esta?", a: ["one piece", "luffy"] },
    { q: "A humanidade vive confinada em grandes muralhas para se proteger de gigantes devoradores de homens. Qual é a obra?", a: ["shingeki no kyojin", "attack on titan"] },
    { q: "Dois irmãos realizam o maior tabu da Alquimia e perdem seus corpos, partindo em uma jornada pela Pedra Filosofal.", a: ["fullmetal alchemist", "fullmetal alchemist brotherhood"] },
    { q: "Um brilhante estudante encontra um caderno que mata qualquer pessoa cujo nome seja escrito nele.", a: ["death note"] },
    { q: "O Caçador de Rank E mais fraco sobrevive a uma masmorra dupla e desperta um sistema exclusivo de leveling.", a: ["solo leveling"] },
    { q: "Um jovem sem individualidade engole o fio de cabelo do herói número 1 para herdar seu poder.", a: ["boku no hero", "my hero academia"] },
    { q: "Um garoto gentil treina com uma espada especial para curar sua irmã mais nova, que foi transformada em um Oni.", a: ["kimetsu no yaiba", "demon slayer"] },
    { q: "O protagonista engole um dedo amaldiçoado do Rei das Maldições para salvar seus amigos na escola.", a: ["jujutsu kaisen"] },
    { q: "Morto na Terra, reencarna no mundo de magia como um bebê, prometendo viver sua vida sem arrependimentos.", a: ["mushoku tensei"] },
    { q: "O jogador mais forte de um MMORPG fica logado até o servidor desligar e é transportado para o jogo como um esqueleto feiticeiro.", a: ["overlord"] },
    { q: "Assassinado na rua, ele reencarna em um mundo de fantasia na forma de um monstro gosmento azul incrivelmente forte.", a: ["tensei shitara slime", "that time i got reincarnated as a slime"] },
    { q: "Para seguir sua amiga, ele entra em uma torre infinita onde cada andar é um desafio de vida ou morte.", a: ["tower of god"] },
    { q: "O único leitor de uma web novel falida vê o mundo real se transformar exatamente na história que ele leu.", a: ["omniscient reader", "orv", "omniscient reader's viewpoint"] },
    { q: "Pobre e afogado em dívidas, ele faz um pacto e tem o coração substituído por um demônio motosserra.", a: ["chainsaw man"] },
    { q: "A lenda do basquete que abandona o esporte após um acidente, focando em jogar videogame em cadeira de rodas.", a: ["real", "slam dunk", "kuroko no basket"] }, 
    { q: "Conta a história de um espadachim negro amaldiçoado e seu companheiro elfo em um mundo medieval sombrio e brutal.", a: ["berserk"] },
    { q: "Um fracassado descobre que seu pai lhe deixou uma dívida bilionária. Para pagar, ele deve virar um caçador de demônios no submundo.", a: ["chainsaw man"] },
    { q: "Qual obra de ninjas tem clãs, jutsus oculares e uma lua gigante vermelha em seu clímax?", a: ["naruto", "naruto shippuden"] }
];

const compressImage = (file, maxWidth = 300, quality = 0.4) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleSize = maxWidth / img.width;
        const finalWidth = img.width < maxWidth ? img.width : maxWidth;
        const finalHeight = img.width < maxWidth ? img.height : img.height * scaleSize;
        canvas.width = finalWidth; canvas.height = finalHeight;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        resolve(canvas.toDataURL('image/jpeg', quality)); 
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

const timeAgo = (timestamp) => {
    if (!timestamp) return 'Antigo'; 
    const timeMs = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    const diffMs = Date.now() - timeMs;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) return 'NOVO';
    if (diffDays === 1) return '1 dia';
    return `${diffDays} dias`;
};

const getRarityColor = (raridade) => {
    switch(raridade?.toLowerCase()) {
        case 'comum': return 'text-gray-400';
        case 'raro': return 'text-cyan-400';
        case 'epico': return 'text-fuchsia-400';
        case 'lendario': return 'text-amber-400';
        case 'mitico': return 'text-red-500';
        default: return 'text-gray-400';
    }
};

const calculatePenalty = (currentXp, currentLevel, penaltyXp) => {
    let newXp = currentXp - penaltyXp;
    let newLvl = currentLevel;
    while (newXp < 0 && newLvl > 1) {
        newLvl--;
        newXp = (newLvl * 100) + newXp; 
    }
    if (newXp < 0) { newXp = 0; newLvl = 1; }
    return { newXp, newLvl };
};

const getLevelRequirement = (level) => {
    if (level === 1) return 100;
    if (level === 2) return 250;
    if (level === 3) return 500;
    if (level === 4) return 1000;
    return Math.floor(1000 * Math.pow(1.2, level - 4));
};

const getLevelTitle = (level) => {
    if(level < 5) return "Leitor Novato";
    if(level < 10) return "Explorador de Mundos";
    if(level < 20) return "Caçador de Patentes";
    if(level < 30) return "Mestre dos Enigmas";
    if(level < 50) return "Monarca das Sombras";
    if(level < 100) return "Lenda Viva";
    return "Entidade Cósmica";
};

const addXpLogic = (currentXp, currentLvl, gainedXp) => {
    let newXp = currentXp + gainedXp;
    let newLvl = currentLvl;
    let didLevelUp = false;
    while (newXp >= getLevelRequirement(newLvl)) {
        newXp -= getLevelRequirement(newLvl);
        newLvl++;
        didLevelUp = true;
    }
    return { newXp, newLvl, didLevelUp };
};

const removeXpLogic = (currentXp, currentLvl, penaltyXp) => {
    let newXp = currentXp - penaltyXp;
    let newLvl = currentLvl;
    while (newXp < 0 && newLvl > 1) {
        newLvl--;
        newXp += getLevelRequirement(newLvl);
    }
    if (newXp < 0) { newXp = 0; newLvl = 1; }
    return { newXp, newLvl };
};

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="min-h-screen bg-[#050508] text-red-500 p-10 flex flex-col items-center justify-center font-sans"><ShieldAlert className="w-16 h-16 mb-4"/><h1 className="text-2xl font-black">Erro Crítico no Sistema</h1><p className="mt-2 text-red-400">{this.state.error.toString()}</p><button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-md font-bold">Reiniciar Sistema</button></div>;
    return this.props.children;
  }
}

function GlobalToast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-3 rounded-full font-black text-sm border flex items-center gap-3 animate-in slide-in-from-top-5 fade-out duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/95 text-red-300 border-red-500/50 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.8)]' : isWarning ? 'bg-yellow-950/95 text-yellow-300 border-yellow-500/50 shadow-[0_10px_40px_-10px_rgba(234,179,8,0.8)]' : isSuccess ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/50 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.8)]' : 'bg-[#0d0d12]/95 text-white border-white/10 shadow-[0_10px_40px_-10px_rgba(255,255,255,0.1)]'}`}>
      {isError && <AlertCircle className="w-5 h-5"/>}
      {isSuccess && <CheckCircle className="w-5 h-5"/>}
      {isWarning && <ShieldAlert className="w-5 h-5"/>}
      {!isError && !isSuccess && !isWarning && <Zap className="w-5 h-5 text-cyan-400 animate-pulse"/>}
      <span>{toast.text}</span>
    </div>
  );
}

function CommentsSection({ mangaId, chapterId, user, userProfileData, onRequireLogin, showToast }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [sortOrder, setSortOrder] = useState('desc'); 
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const path = chapterId ? `obras/${mangaId}/capitulos/${chapterId}/comments` : `obras/${mangaId}/comments`;
    const q = query(collection(db, path));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({id: d.id, ...d.data()}));
      setComments(list);
    });
    return () => unsub();
  }, [mangaId, chapterId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) return onRequireLogin();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const customAvatar = userProfileData?.avatarUrl || user.photoURL || '';
      const path = chapterId ? `obras/${mangaId}/capitulos/${chapterId}/comments` : `obras/${mangaId}/comments`;
      await addDoc(collection(db, path), {
        text: newComment, userId: user.uid, userName: user.displayName || 'Anônimo', userAvatar: customAvatar, createdAt: Date.now()
      });
      setNewComment('');
      showToast("Comentário enviado!", "success");
    } catch(e) { showToast("Erro ao enviar o comentário.", "error"); } finally { setSubmittingComment(false); }
  };

  const sortedComments = [...comments].sort((a, b) => sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

  return (
    <div className="bg-[#0d0d12]/60 border border-white/10 rounded-xl p-5 md:p-8 shadow-sm w-full max-w-4xl mx-auto mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-black flex items-center gap-2 text-white"><MessageSquare className="w-5 h-5 text-cyan-500"/> Comentários <span className="text-gray-400/60 text-sm">({comments.length})</span></h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
            <button onClick={() => setSortOrder('desc')} className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all duration-300 ${sortOrder === 'desc' ? 'bg-white/5 text-white' : 'text-gray-300/80 hover:text-white'}`}>Recentes</button>
            <button onClick={() => setSortOrder('asc')} className={`flex-1 px-3 py-1.5 rounded text-xs font-bold transition-all duration-300 ${sortOrder === 'asc' ? 'bg-white/5 text-white' : 'text-gray-300/80 hover:text-white'}`}>Antigos</button>
          </div>
          <button onClick={()=>setShowComments(!showComments)} className="bg-[#050508] border border-white/10 text-gray-300/80 hover:text-white rounded-md px-3 py-1.5 transition-colors flex items-center justify-center gap-1.5 font-bold w-full sm:w-auto text-xs duration-300">
             {showComments ? <><EyeOff className="w-3.5 h-3.5"/> Ocultar</> : <><Eye className="w-3.5 h-3.5"/> Mostrar</>}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="animate-in fade-in duration-300 space-y-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 overflow-hidden bg-[#050508] flex-shrink-0 shadow-inner">
               {(userProfileData?.avatarUrl || user?.photoURL) ? <img src={userProfileData.avatarUrl || user.photoURL} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-400/60 bg-[#0d0d12] p-1.5" />}
            </div>
            <form onSubmit={handlePostComment} className="flex-1 relative">
              <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder={user ? "Deixe o seu comentário..." : "Faça login para interagir."} disabled={!user || submittingComment} className="w-full bg-[#050508] border border-white/10 rounded-md px-3 py-3 pr-12 text-white font-medium outline-none focus:border-cyan-500 transition-colors resize-none disabled:opacity-50 text-sm shadow-inner duration-300" rows="2" />
              <button type="submit" disabled={!user || submittingComment || !newComment.trim()} className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white rounded disabled:bg-[#0d0d12] disabled:text-gray-400/60 transition-transform hover:scale-105 shadow-sm duration-300">
                 {submittingComment ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
              </button>
            </form>
          </div>

          <div className="space-y-3 mt-6 pt-5 border-t border-white/10">
            {sortedComments.length === 0 ? (
              <div className="py-6 text-center"><MessageSquare className="w-6 h-6 text-gray-400/60 mx-auto mb-2"/><p className="text-gray-400/60 font-bold text-xs">Seja o primeiro a comentar.</p></div>
            ) : (
              sortedComments.map(comment => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-md bg-[#050508]/50 hover:bg-[#050508] transition-colors border border-transparent hover:border-white/10">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 overflow-hidden bg-[#050508] flex-shrink-0">
                     {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-400/60 bg-[#0d0d12] p-1" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-white text-xs md:text-sm">{comment.userName}</span>
                      <span className="text-[9px] font-bold text-cyan-300 bg-[#0d0d12] border border-white/10 px-1 py-0.5 rounded">{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-medium">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MangaInfinityApp() {
  const [splashTimerDone, setSplashTimerDone] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false); 
  const [currentView, setCurrentView] = useState('home'); 
  
  const [globalToast, setGlobalToast] = useState(null); 
  const [levelUpAlert, setLevelUpAlert] = useState(null); 
  const [dropAlert, setDropAlert] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false); 
  const [showMobileSearch, setShowMobileSearch] = useState(false); 
  
  const [selectedManga, setSelectedManga] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [globalSearch, setGlobalSearch] = useState(''); 
  
  const [mangas, setMangas] = useState([]);
  const [loadingMangas, setLoadingMangas] = useState(true);
  
  const [shopItems, setShopItems] = useState(FALLBACK_SHOP_ITEMS);

  const [user, setUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeEffect: '', activeFont: '', activeMission: null, completedMissions: [] });
  const [userSettings, setUserSettings] = useState({ readMode: 'Cascata', dataSaver: false, theme: 'Escuro' });
  const [libraryData, setLibraryData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false); 

  useEffect(() => {
    const timer = setTimeout(() => setSplashTimerDone(true), 3500); 
    return () => clearTimeout(timer);
  }, []);

  // Busca de Mangás e Capítulos
  useEffect(() => {
    const fetchMangas = async () => {
      try {
        const obrasRef = collection(db, "obras");
        const snap = await getDocs(obrasRef);
        const list = [];
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          const capSnap = await getDocs(collection(db, `obras/${docSnap.id}/capitulos`));
          const chapters = [];
          capSnap.forEach(c => {
            const cData = c.data();
            const rawTime = cData.createdAt || cData.timestamp || Date.now();
            chapters.push({ id: c.id, ...cData, rawTime });
          });
          chapters.sort((a,b) => b.number - a.number);
          list.push({ id: docSnap.id, ...data, chapters });
        }
        list.sort((a, b) => b.createdAt - a.createdAt);
        setMangas(list);
      } catch (error) { console.error(error); } finally { setLoadingMangas(false); }
    };
    fetchMangas();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "loja_itens"));
    const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
            const items = [];
            snap.forEach(d => items.push({ id: d.id, ...d.data() }));
            setShopItems(items);
        } else {
            setShopItems(FALLBACK_SHOP_ITEMS); 
        }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        try {
          const profileRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'profile', 'main');
          const unsubProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserProfileData({ 
                bio: data.bio, avatarUrl: data.avatarUrl, coverUrl: data.coverUrl, 
                xp: data.xp || 0, level: data.level || 1, coins: data.coins || 0, crystals: data.crystals || 0,
                inventory: data.inventory || [], activeFrame: data.activeFrame || '', activeCover: data.activeCover || '', 
                activeEffect: data.activeEffect || '', activeFont: data.activeFont || '',
                activeMission: data.activeMission || null,
                completedMissions: data.completedMissions || []
              });
              if(data.settings) setUserSettings({ ...userSettings, ...data.settings }); 
            } else {
              setDoc(profileRef, { bio: "Leitor Nível 1.", settings: userSettings, xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeMission: null, completedMissions: [] }, { merge: true });
            }
          });

          const libraryRef = collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'library');
          const unsubLib = onSnapshot(query(libraryRef), (snapshot) => {
            const libs = {}; snapshot.docs.forEach(d => libs[d.id] = d.data().status); setLibraryData(libs);
          });

          const historyRef = collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'history');
          const unsubHist = onSnapshot(query(historyRef), (snapshot) => {
            const hist = []; snapshot.docs.forEach(d => hist.push({ id: d.id, ...d.data() }));
            setHistoryData(hist.sort((a,b) => b.timestamp - a.timestamp));
            setDataLoaded(true); 
          });
          return () => { unsubProfile(); unsubLib(); unsubHist(); };
        } catch (error) { console.error(error); }
      } else {
        setUserProfileData({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeEffect: '', activeFont: '', activeMission: null, completedMissions: [] }); setLibraryData({}); setHistoryData([]); setDataLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !userProfileData.activeMission) return;
    const interval = setInterval(async () => {
      const mission = userProfileData.activeMission;
      if (mission && Date.now() > mission.deadline) {
         setGlobalToast({ text: `Missão Falhou pelo Tempo! Penalidade: -${mission.penaltyXp}XP`, type: "error" });
         const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
         let newCoins = Math.max(0, (userProfileData.coins || 0) - mission.penaltyCoins);
         let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, mission.penaltyXp);
         await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, userProfileData.activeMission]);

  const showSplash = !splashTimerDone || !authReady || loadingMangas;

  useEffect(() => {
    if (!showSplash && !user && !isGuest && currentView === 'home') {
      setCurrentView('login');
    }
  }, [showSplash, user, isGuest, currentView]);

  const showToast = (text, type = 'info') => {
    setGlobalToast({ text, type });
    setTimeout(() => setGlobalToast(null), 4000);
  };

  const handleLevelUpAnim = (lvl) => {
      setLevelUpAlert(lvl);
      setTimeout(() => setLevelUpAlert(null), 5000);
  }

  const navigateTo = (view, manga = null, chapter = null) => {
    if (manga) setSelectedManga(manga);
    if (chapter) setSelectedChapter(chapter);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && globalSearch.trim() !== '') navigateTo('search');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsGuest(false);
    setCurrentView('login');
  };

  const handleRandomManga = () => {
    if (mangas.length === 0) {
      showToast("Catálogo vazio.", "error");
      return;
    }
    setIsRandomizing(true);
    setTimeout(() => {
      const random = mangas[Math.floor(Math.random() * mangas.length)];
      navigateTo('details', random);
      setIsRandomizing(false);
    }, 600); 
  };

  const triggerRandomDrop = async () => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
    try {
      await updateDoc(profileRef, { crystals: increment(1) });
      setDropAlert(true);
      setTimeout(() => setDropAlert(false), 2000);
    } catch(e) {}
  };

  const markAsRead = async (manga, chapter, isValidReading) => {
    if (!user) return;
    try {
      const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'history', `${manga.id}_${chapter.id}`);
      const docSnap = await getDoc(ref);
      let isNewRead = false;
      if (!docSnap.exists()) {
        isNewRead = true;
        await setDoc(ref, { mangaId: manga.id, mangaTitle: manga.title, chapterNumber: chapter.number, timestamp: Date.now(), id: `${manga.id}_${chapter.id}` });
      } else {
        await updateDoc(ref, { timestamp: Date.now() });
      }

      if (isNewRead && userProfileData.activeMission?.type === 'read' && userProfileData.activeMission.targetManga === manga.id) {
         if (!isValidReading) {
             showToast("⚠️ Tempo insuficiente (Mín. 45s).", "warning");
             return; 
         }

         const m = userProfileData.activeMission;
         const newCount = m.currentCount + 1;
         const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
         
         if (newCount >= m.targetCount) {
             let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
             let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
             
             let currentCompleted = userProfileData.completedMissions || [];
             if (!currentCompleted.includes(m.targetManga)) currentCompleted = [...currentCompleted, m.targetManga];

             await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
             showToast(`Missão Concluída! +${m.rewardXp} XP | +${m.rewardCoins} Moedas`, "success");
             
             if(didLevelUp) handleLevelUpAnim(newLvl);

         } else {
             await updateDoc(profileRef, { 'activeMission.currentCount': newCount });
             showToast(`Progresso: ${newCount}/${m.targetCount}`, "info");
         }
      }

    } catch(e) { console.error(e) }
  };

  const updateSettings = async (newSettings) => {
    const updated = { ...userSettings, ...newSettings };
    setUserSettings(updated);
    if(user) {
      try { await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { settings: updated }, { merge: true }); } catch(e) {}
    }
  };

  const buyItem = async (item) => {
    const price = item.preco || item.price;
    if ((userProfileData.coins || 0) < price) {
      showToast("Moedas Insuficientes!", "error");
      return;
    }
    const newCoins = userProfileData.coins - price;
    const newInv = [...(userProfileData.inventory || []), item.id];
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { coins: newCoins, inventory: newInv });
    showToast(`Adquirido com sucesso!`, "success");
  };

  const toggleEquipItem = async (item) => {
    const updates = {};
    const cat = item.categoria || item.type;
    
    const isEquipped = userProfileData.activeFrame === item.cssClass || 
                       userProfileData.activeCover === item.preview || userProfileData.activeCover === item.url ||
                       userProfileData.avatarUrl === item.preview || userProfileData.avatarUrl === item.url ||
                       userProfileData.activeEffect === item.cssClass || 
                       userProfileData.activeFont === item.cssClass;

    if (cat === 'moldura' || cat === 'frame') updates.activeFrame = isEquipped ? '' : item.cssClass;
    if (cat === 'capa_fundo' || cat === 'cover') updates.activeCover = isEquipped ? '' : (item.preview || item.url);
    if (cat === 'avatar') updates.avatarUrl = isEquipped ? '' : (item.preview || item.url);
    if (cat === 'efeito' || cat === 'effect') updates.activeEffect = isEquipped ? '' : item.cssClass;
    if (cat === 'nickname' || cat === 'fonte' || cat === 'font') updates.activeFont = isEquipped ? '' : item.cssClass;

    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), updates);
  };

  const synthesizeCrystal = async () => {
    if (userProfileData.crystals < 5) return null;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');

    if (Math.random() < 0.40) {
       await updateDoc(profileRef, { crystals: increment(-5) });
       return { success: false };
    }

    const wonCoins = Math.floor(Math.random() * 10) + 5; 
    const wonXp = Math.floor(Math.random() * 5) + 5;    
    
    let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, wonXp);

    await updateDoc(profileRef, { crystals: increment(-5), coins: increment(wonCoins), xp: newXp, level: newLvl });
    if(didLevelUp) handleLevelUpAnim(newLvl);
    return { success: true, wonCoins, wonXp, leveledUp: didLevelUp, newLvl };
  };

  const handleLibraryToggle = async (mangaId, status) => {
      if (!user) { showToast("Faça login para favoritar obras.", "warning"); return; }
      try {
          const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'library', mangaId.toString());
          if (status === "Remover") await deleteDoc(ref); 
          else await setDoc(ref, { mangaId: mangaId, status: status, updatedAt: Date.now() });
          
          if(status === 'Favoritos') showToast("Adicionado aos Favoritos!", "success");
          else if(status === 'Remover') showToast("Removido da Biblioteca.", "info");
      } catch(error) { showToast('Erro ao atualizar biblioteca.', 'error'); }
  };

  if (showSplash) return <SplashScreen />;

  if (currentView === 'login' || (!user && !isGuest)) {
    return <LoginView onLoginSuccess={() => { setCurrentView('home'); setIsGuest(false); }} onGuestAccess={() => { setIsGuest(true); setCurrentView('home'); }} />;
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-cyan-600 selection:text-white flex flex-col transition-colors duration-300 ${userSettings.theme === 'Claro' ? 'bg-white text-black' : 'bg-[#030407] text-gray-200'} ${userProfileData.activeFont || ''} ${userProfileData.activeEffect || ''}`}>
      
      {/* INJEÇÃO CSS GLOBAL DA LOJA INFINITY */}
      <style dangerouslySetInnerHTML={{__html: shopItems.map(item => `
        .${item.cssClass || 'none'} { ${item.css || ''} }
        ${item.animacao || ''}
      `).join('\n')}} />

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #22d3ee; cursor: pointer; box-shadow: 0 0 15px rgba(34, 211, 238, 0.9); border: 2px solid white;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {levelUpAlert && (
          <div className="fixed top-20 right-4 z-[99999] bg-[#0d0d12]/95 backdrop-blur-md border border-white/10 shadow-[0_5px_30px_rgba(217,70,239,0.2)] text-white px-4 py-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-right fade-out duration-300 pointer-events-none">
             <div className="bg-gradient-to-br from-cyan-600 to-fuchsia-600 p-2 rounded-md shadow-inner">
                 <Trophy className="w-5 h-5 text-white" />
             </div>
             <div className="flex flex-col">
                 <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-black">Level Up!</span>
                 <span className="text-sm font-bold">Nível {levelUpAlert} Alcançado</span>
             </div>
          </div>
      )}

      {dropAlert && (
          <div className="fixed bottom-24 right-4 z-[99999] bg-[#0d0d12]/90 backdrop-blur-md border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] px-3 py-2 rounded-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-out duration-300 pointer-events-none">
              <Hexagon className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-cyan-100 text-xs font-bold">+1 Cristal</span>
          </div>
      )}

      {isRandomizing && (
        <div className="fixed inset-0 z-[2000] bg-[#050508]/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-100 pointer-events-none">
           <Dices className="w-24 h-24 text-fuchsia-500 animate-[spin_0.2s_linear_infinite] drop-shadow-[0_0_50px_rgba(217,70,239,0.6)]" />
        </div>
      )}

      <GlobalToast toast={globalToast} />

      {/* NAVBAR */}
      {currentView !== 'reader' && (
        <nav className="sticky top-0 z-40 bg-[#030407]/80 backdrop-blur-xl border-b border-white/5 shadow-sm relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
                <div className="bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 p-2 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform duration-300"><InfinityIcon className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-fuchsia-300 hidden sm:block">INFINITY</span>
              </div>
              
              <div className="hidden md:block flex-1 max-w-lg mx-8 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400/60 group-focus-within:text-cyan-400 transition-colors" /></div>
                <input type="text" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} onKeyDown={handleSearchSubmit} className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-lg bg-[#0d0d12]/50 text-gray-100 outline-none focus:border-cyan-500 transition-all text-sm" placeholder="Pesquisar a obra e teclar Enter..." />
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-1 md:gap-3 border-r border-white/10 pr-4 md:pr-6">
                  <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 text-gray-300/80 hover:text-cyan-400 transition-colors duration-300" title="Pesquisar">
                    {showMobileSearch ? <X className="w-5 h-5"/> : <Search className="w-5 h-5" />}
                  </button>

                  <button onClick={handleRandomManga} className="p-2 text-gray-300/80 hover:text-fuchsia-400 transition-colors duration-300 group relative" title="Obra Aleatória">
                    <Dices className="w-5 h-5 md:w-5 md:h-5 group-hover:text-fuchsia-400 transition-colors duration-300" />
                  </button>
                  <button onClick={() => showToast("O Sistema não possui novas mensagens no momento.", "info")} className="relative p-2 text-gray-300/80 hover:text-cyan-400 transition-colors duration-300">
                    <Bell className="w-5 h-5 md:w-5 md:h-5"/>
                    <span className="absolute top-1 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse border border-[#050508]"></span>
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-300/80">
                  <button onClick={() => navigateTo('home')} className={`hover:text-cyan-400 transition-colors duration-300 ${currentView === 'home' ? 'text-cyan-400' : ''}`}>Início</button>
                  <button onClick={() => navigateTo('catalog')} className={`hover:text-cyan-400 transition-colors duration-300 ${currentView === 'catalog' ? 'text-cyan-400' : ''}`}>Catálogo</button>
                  <button onClick={() => user ? navigateTo('nexo') : navigateTo('login')} className={`hover:text-fuchsia-400 transition-colors duration-300 flex items-center gap-1 ${currentView === 'nexo' ? 'text-fuchsia-400' : ''}`}><Hexagon className="w-4 h-4"/> Nexo</button>
                  <button onClick={() => user ? navigateTo('library') : navigateTo('login')} className={`hover:text-cyan-400 transition-colors duration-300 ${currentView === 'library' ? 'text-cyan-400' : ''}`}>Biblioteca</button>
                </div>
                {user ? (
                  <div className="cursor-pointer flex items-center gap-3 group" onClick={() => navigateTo('profile')}>
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-sm font-bold text-gray-200 group-hover:text-cyan-300 transition-colors duration-300">{user.displayName || "Leitor"}</span>
                      <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">Nível {userProfileData.level || 1}</span>
                    </div>
                    <div className={`w-9 h-9 rounded-full overflow-hidden bg-[#0d0d12] border border-white/10 group-hover:border-cyan-500 transition-colors duration-300 ${userProfileData.activeFrame || ''}`}>
                      {userProfileData.avatarUrl || user.photoURL ? <img src={userProfileData.avatarUrl || user.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-300/80" />}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => navigateTo('login')} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-bold px-4 py-1.5 rounded-lg hover:scale-105 transition-transform duration-300 shadow-sm text-sm">Entrar</button>
                )}
              </div>
            </div>
          </div>
          
          {showMobileSearch && (
            <div className="absolute top-full left-0 w-full bg-[#050508]/95 backdrop-blur-xl border-b border-white/10 p-3 shadow-xl md:hidden animate-in slide-in-from-top-2 z-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300/80" />
                <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} onKeyDown={(e) => { handleSearchSubmit(e); if(e.key === 'Enter') setShowMobileSearch(false); }} className="w-full pl-9 pr-4 py-2 border border-white/10 rounded-lg bg-[#0d0d12] text-gray-100 outline-none focus:border-cyan-500 text-sm transition-colors duration-300" placeholder="Pesquisar a obra..." autoFocus />
              </div>
            </div>
          )}
        </nav>
      )}

      <main className="flex-1 pb-24 md:pb-12">
        {currentView === 'home' && <HomeView mangas={mangas} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'search' && <SearchView mangas={mangas} query={globalSearch} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'catalog' && <CatalogView mangas={mangas} onNavigate={navigateTo} dataSaver={userSettings.dataSaver} />}
        {currentView === 'library' && <LibraryView mangas={mangas} user={user} libraryData={libraryData} onNavigate={navigateTo} onRequireLogin={() => navigateTo('login')} dataSaver={userSettings.dataSaver} />}
        
        {/* NOVA ÁREA: NEXO VIEW (Aglutina Missões, Forja e Loja) */}
        {currentView === 'nexo' && user && <NexoView user={user} userProfileData={userProfileData} showToast={showToast} mangas={mangas} db={db} appId={APP_ID} onNavigate={navigateTo} onLevelUp={handleLevelUpAnim} synthesizeCrystal={synthesizeCrystal} shopItems={shopItems} buyItem={buyItem} equipItem={toggleEquipItem} />}
        
        {currentView === 'profile' && user && <ProfileView user={user} userProfileData={userProfileData} historyData={historyData} libraryData={libraryData} dataLoaded={dataLoaded} userSettings={userSettings} updateSettings={updateSettings} onLogout={handleLogout} onUpdateData={(n) => setUserProfileData({...userProfileData, ...n})} showToast={showToast} />}
        {currentView === 'details' && selectedManga && <DetailsView manga={selectedManga} libraryData={libraryData} historyData={historyData} user={user} userProfileData={userProfileData} onBack={() => navigateTo('home')} onChapterClick={(m, c) => navigateTo('reader', m, c)} onRequireLogin={() => navigateTo('login')} showToast={showToast} db={db} />}
        {currentView === 'reader' && selectedManga && selectedChapter && <ReaderView manga={selectedManga} chapter={selectedChapter} user={user} userProfileData={userProfileData} onBack={() => navigateTo('details', selectedManga)} onChapterClick={(m, c) => navigateTo('reader', m, c)} triggerRandomDrop={triggerRandomDrop} onMarkAsRead={markAsRead} readMode={userSettings.readMode} onRequireLogin={() => navigateTo('login')} showToast={showToast} libraryData={libraryData} onToggleLibrary={handleLibraryToggle} />}
      </main>

      {/* BOTTOM NAV ATUALIZADA (NOVO BOTÃO NEXO NO MEIO) */}
      {currentView !== 'reader' && (
        <div className="md:hidden fixed bottom-0 w-full bg-[#050508]/95 backdrop-blur-2xl border-t border-white/5 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-around items-center h-[60px] px-2 relative">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'home' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <HomeIcon className="w-5 h-5" /><span className="text-[9px] font-bold">Início</span>
            </button>
            <button onClick={() => navigateTo('catalog')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'catalog' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <LayoutGrid className="w-5 h-5" /><span className="text-[9px] font-bold">Catálogo</span>
            </button>
            
            {/* BOTÃO PRINCIPAL NEXO SALTITANTE */}
            <div className="relative -top-5 flex justify-center w-16">
                <button onClick={() => user ? navigateTo('nexo') : navigateTo('login')} className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-[3px] border-[#030407] shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-transform hover:scale-105 duration-300 ${currentView === 'nexo' ? 'bg-gradient-to-tr from-cyan-500 to-fuchsia-500 text-white' : 'bg-[#0d0d12] text-fuchsia-400'}`}>
                    <Hexagon className="w-6 h-6 relative z-10" fill={currentView === 'nexo' ? "currentColor" : "none"}/>
                    <span className="text-[8px] font-black relative z-10 mt-0.5">NEXO</span>
                </button>
            </div>

            <button onClick={() => user ? navigateTo('library') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'library' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <Library className="w-5 h-5" /><span className="text-[9px] font-bold">Biblioteca</span>
            </button>
            <button onClick={() => user ? navigateTo('profile') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-14 transition-colors duration-300 ${currentView === 'profile' ? 'text-cyan-400' : 'text-gray-400/60 hover:text-cyan-300'}`}>
               <UserCircle className="w-5 h-5" /><span className="text-[9px] font-bold">Perfil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ABERTURA SURREAL COM NEBULOSAS
function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#030407] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes surreal-burst {
            0% { transform: scale(0.8); opacity: 0; filter: blur(20px); }
            50% { transform: scale(1.1); opacity: 1; filter: blur(0px); drop-shadow: 0 0 60px #22d3ee; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glow-sweep {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        @keyframes float-inf {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-15px) scale(1.05); }
        }
      `}</style>
      
      <div className="absolute w-[50rem] h-[50rem] bg-gradient-to-tr from-cyan-900/20 via-[#030407] to-fuchsia-900/10 rounded-full blur-[100px] animate-[spin_12s_linear_infinite]"></div>

      <div className="relative z-10 flex flex-col items-center animate-[surreal-burst_1.2s_ease-out_forwards]">
        <div className="animate-[float-inf_3s_ease-in-out_infinite] mb-6">
           <InfinityIcon className="w-32 h-32 text-white drop-shadow-[0_0_40px_rgba(34,211,238,0.6)]" strokeWidth={1} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 tracking-[0.4em] ml-[0.4em]" style={{ backgroundSize: '200% auto', animation: 'glow-sweep 2.5s linear infinite' }}>
          INFINITY
        </h1>
        <div className="mt-6 text-cyan-400 text-[10px] md:text-xs font-bold tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]">SINCRONIZANDO MULTIVERSO...</div>
      </div>
    </div>
  );
}

function LoginView({ onLoginSuccess, onGuestAccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) { 
        await signInWithEmailAndPassword(auth, email, password); 
        onLoginSuccess(); 
      } else {
        if (!name.trim()) throw { code: 'custom/missing-name' };
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        onLoginSuccess(); 
      }
    } catch (err) { 
      let msg = "Erro ao autenticar. Verifique os seus dados.";
      if(err.code === 'auth/email-already-in-use') msg = "E-mail já cadastrado.";
      if(err.code === 'auth/weak-password') msg = "A senha deve ter 6 caracteres.";
      if(err.code === 'custom/missing-name') msg = "Preencha o seu nome.";
      setError(msg); 
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030407] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="bg-[#0d0d12]/80 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-xl shadow-[0_0_50px_-10px_rgba(34,211,238,0.1)] p-8 z-10 relative animate-in slide-in-from-bottom-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#050508] rounded-lg flex items-center justify-center mx-auto mb-4 shadow-inner border border-white/10"><BookOpen className="w-8 h-8 text-cyan-400" /></div>
          <h2 className="text-2xl font-black text-white">{isLogin ? 'Bem-vindo de volta' : 'Despertar'}</h2>
          <p className="text-gray-400/60 mt-2 text-sm font-medium">Faça login para favoritar e guardar o seu progresso.</p>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-md mb-5 text-sm font-bold border border-red-500/20 text-center animate-in zoom-in-95">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu Apelido" className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors font-medium text-sm" required />}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors font-medium text-sm" required />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha (Mín. 6 caracteres)" className="w-full bg-[#050508] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors font-medium text-sm" required />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-md mt-4 flex justify-center items-center gap-2 transition-all shadow-[0_10px_30px_-10px_rgba(217,70,239,0.3)] disabled:opacity-70 hover:scale-[1.02] duration-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Acessar Infinity' : 'Criar Conta')}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-4 text-center">
          <p className="text-gray-400/60 text-sm font-medium">
            {isLogin ? "Ainda não possui conta? " : "Já possui conta? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-cyan-400 font-black hover:text-cyan-300 transition-colors duration-300">{isLogin ? 'Cadastrar de Graça' : 'Fazer login'}</button>
          </p>
          <div className="w-full h-px bg-white/10 my-1"></div>
          <button onClick={onGuestAccess} className="text-gray-300/80 font-bold hover:text-white transition-colors duration-300 text-sm">Explorar sem login (Visitante)</button>
        </div>
      </div>
    </div>
  );
}

function SearchView({ mangas, query, onNavigate, dataSaver }) {
  const results = useMemo(() => {
    if(!query) return [];
    const lowerQ = query.toLowerCase();
    return mangas.filter(m => m.title.toLowerCase().includes(lowerQ) || (m.author && m.author.toLowerCase().includes(lowerQ)) || m.genres?.some(g => g.toLowerCase().includes(lowerQ)));
  }, [query, mangas]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-300">
      <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Search className="w-8 h-8 text-cyan-400" /> Resultados para "{query}"</h2>
      <p className="text-gray-400/60 mb-8">{results.length} obras encontradas</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {results.map(manga => (
          <div key={manga.id} className="cursor-pointer group flex flex-col gap-2" onClick={() => onNavigate('details', manga)}>
            <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d12] border border-white/10 shadow-sm ${dataSaver ? 'blur-[2px]' : ''}`}>
               <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h3 className="font-bold text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300">{manga.title}</h3>
            {manga.ratingCount > 0 ? (
                <p className="text-xs text-yellow-500 font-bold"><Star className="w-3 h-3 inline" /> {Number(manga.rating).toFixed(1)}</p>
            ) : (
                <p className="text-xs text-gray-400/60 font-medium">Sem avaliação</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeView({ mangas, onNavigate, dataSaver }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [recentFilter, setRecentFilter] = useState('Todos');
  const itemsPerPage = 12;

  const heroMangas = [...mangas].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroMangas.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroMangas.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroMangas]);

  if (mangas.length === 0) return <div className="text-center py-32 text-gray-400/60"><BookOpen className="w-16 h-16 mx-auto mb-4 text-[#0d0d12]"/>Nenhuma obra cadastrada. Acesse o Painel Admin para enviar obras.</div>;

  const destaque = heroMangas.length > 0 ? heroMangas[heroIndex] : mangas[0]; 
  const populares = heroMangas;

  const filteredRecents = useMemo(() => {
    return mangas.filter(m => {
      if (recentFilter === 'Todos') return true;
      if (recentFilter === 'Shoujo') return m.demographic === 'Shoujo' || m.genres?.includes('Shoujo');
      return m.type === recentFilter;
    });
  }, [mangas, recentFilter]);

  const totalPages = Math.ceil(filteredRecents.length / itemsPerPage);
  const currentMangas = filteredRecents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* NOVO CARROSSEL SURREAL COM FADE (GLASSMORPHISM) */}
      <div className="relative w-full h-[40vh] md:h-[50vh] cursor-pointer group overflow-hidden bg-[#030407]" onClick={() => onNavigate('details', destaque)}>
        
        {/* Camadas de Fundo Dinâmicas para Fade Perfeito */}
        {heroMangas.map((manga, idx) => (
           <div key={`bg-${manga.id}`} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === heroIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
              <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
              
              <img src={manga.coverUrl} className={`w-full h-full object-cover blur-xl opacity-30 scale-110 ${dataSaver ? 'hidden' : ''}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#030407] via-transparent to-transparent opacity-80" />
           </div>
        ))}

        {/* Camada de Conteúdo do Destaque Atual */}
        <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end justify-center md:justify-start w-full h-full p-6 md:p-12 mx-auto max-w-7xl gap-6">
          
          <div className="w-28 md:w-44 aspect-[2/3] rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border-[2px] border-white/10 overflow-hidden shrink-0 group-hover:-translate-y-3 transition-transform duration-500 relative">
             <img src={destaque.coverUrl} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          <div className="flex flex-col items-center md:items-start flex-1 w-full text-center md:text-left min-w-0 max-w-2xl">
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2 md:mb-3">
               <span className="bg-white text-black text-[9px] md:text-xs font-black px-2 py-0.5 rounded shadow uppercase tracking-wider">{destaque.type}</span>
               {destaque.ratingCount > 0 && (
                  <span className="bg-black/50 backdrop-blur-md border border-yellow-500/50 text-yellow-400 text-[9px] md:text-xs font-black px-2 py-0.5 rounded shadow flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {Number(destaque.rating).toFixed(1)}</span>
              )}
            </div>

            <h1 className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-md line-clamp-2 leading-tight mb-2 md:mb-4">{destaque.title}</h1>
            
            <p className="hidden md:block text-sm text-gray-300/80 line-clamp-2 mb-6 max-w-xl leading-relaxed">{destaque.synopsis || "Explorar o multiverso nunca foi tão fácil."}</p>
            
            <button onClick={(e) => { e.stopPropagation(); onNavigate('details', destaque); }} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black px-6 py-2.5 md:py-3 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(217,70,239,0.3)] text-xs md:text-sm">
                <Play className="w-4 h-4 fill-current"/> INICIAR LEITURA
            </button>
            
          </div>
        </div>

        {/* Indicadores do Carrossel */}
        <div className="absolute bottom-4 right-0 left-0 flex justify-center gap-2 z-30" onClick={e=>e.stopPropagation()}>
           {heroMangas.map((m, i) => (
             <button key={m.id} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full transition-all duration-500 shadow-md ${heroIndex === i ? 'w-8 bg-cyan-400' : 'w-2 bg-white/30 hover:bg-white/60'}`}></button>
           ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
        <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 mb-4 text-white"><Star className="w-5 h-5 text-yellow-500" /> Mais Populares</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {populares.map((manga) => (
            <div key={`pop-${manga.id}`} className="group cursor-pointer flex flex-col gap-1.5" onClick={() => onNavigate('details', manga)}>
              <div className={`relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-[#0d0d12] border border-white/10 shadow-sm ${dataSaver ? 'blur-[1px]' : ''}`}>
                <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {manga.ratingCount > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow"><Star className="w-2.5 h-2.5 fill-current" /> {Number(manga.rating).toFixed(1)}</div>
                )}
              </div>
              <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300">{manga.title}</h3>
            </div>
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 text-white"><Clock className="w-5 h-5 text-fuchsia-500" /> Lançamentos</h2>
          
          {/* SEM BORDA INFERIOR AQUI COMO PEDIDO */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
             {['Todos', 'Mangá', 'Manhwa', 'Manhua', 'Shoujo'].map(tab => (
               <button key={tab} onClick={() => {setRecentFilter(tab); setCurrentPage(1);}} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-300 whitespace-nowrap ${recentFilter === tab ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white shadow' : 'bg-[#0d0d12] text-gray-300/80 border border-white/10 hover:text-white'}`}>{tab}</button>
             ))}
          </div>
        </div>

        {filteredRecents.length === 0 ? (
           <p className="text-gray-400/60 text-center py-8 font-bold border border-white/10 border-dashed rounded-lg text-sm">Nenhum lançamento encontrado para este filtro.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {currentMangas.map((manga) => (
              <div key={manga.id} className="group cursor-pointer flex flex-col bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-colors duration-300 shadow-sm" onClick={() => onNavigate('details', manga)}>
                <div className={`relative aspect-[2/3] w-full overflow-hidden ${dataSaver ? 'blur-[1px]' : ''}`}>
                  <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{manga.type}</div>
                </div>
                
                <div className="p-2.5 flex flex-col flex-1">
                  <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-300 mb-2">{manga.title}</h3>
                  
                  <div className="mt-auto flex flex-col gap-1.5">
                     {manga.chapters && manga.chapters.slice(0, 2).map((cap, idx) => {
                        const dateVal = cap.createdAt || cap.timestamp || cap.date || Date.now(); 
                        return (
                          <div key={cap.id} onClick={(e) => { e.stopPropagation(); onNavigate('reader', manga, cap); }} className="flex justify-between items-center bg-[#050508]/50 px-2 py-1.5 rounded-md border border-white/10 hover:border-cyan-500/50 transition-colors duration-300">
                             <span className="text-[10px] font-bold text-gray-200 line-clamp-1 max-w-[60%]">Cap. {cap.number}</span>
                             {timeAgo(dateVal) === 'NOVO' ? (
                                 <span className="text-[8px] font-black bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(34,211,238,0.5)]">NOVO</span>
                             ) : (
                                 <span className="text-[8px] font-medium text-gray-400/60">{timeAgo(dateVal)}</span>
                             )}
                          </div>
                        );
                     })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-md bg-[#0d0d12] text-white disabled:opacity-50 border border-white/10 hover:border-cyan-500 transition-colors duration-300"><ChevronLeft className="w-4 h-4"/></button>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-[200px] md:max-w-md">
              {Array.from({length: totalPages}).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center transition-colors duration-300 flex-shrink-0 ${currentPage === i + 1 ? 'bg-cyan-600 text-white shadow-md' : 'bg-[#0d0d12] text-gray-300/80 border border-white/10 hover:border-cyan-500 hover:text-white'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md bg-[#0d0d12] text-white disabled:opacity-50 border border-white/10 hover:border-cyan-500 transition-colors duration-300"><ChevronRight className="w-4 h-4"/></button>
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogView({ mangas, onNavigate, dataSaver }) {
  const [filterType, setFilterType] = useState("Todos");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showGenreModal, setShowGenreModal] = useState(false);

  const toggleGenre = (genre) => setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);

  const filteredMangas = mangas.filter(m => {
    if (filterType !== "Todos" && m.type !== filterType) return false;
    if (selectedGenres.length > 0 && (!m.genres || !selectedGenres.every(g => m.genres.includes(g)))) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      
      {/* REMOVIDO border-b DAQUI TAMBÉM PRA FICAR LIMPO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 gap-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {TIPOS.map(tipo => <button key={tipo} onClick={() => setFilterType(tipo)} className={`whitespace-nowrap font-bold px-4 py-2 rounded-full text-sm transition-colors duration-300 ${filterType === tipo ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white shadow-md' : 'bg-[#0d0d12] text-gray-300/80 hover:text-white border border-white/10'}`}>{tipo}</button>)}
          </div>
          
          <button onClick={() => setShowGenreModal(true)} className="flex items-center gap-2 bg-[#0d0d12] border border-white/10 px-4 py-2 rounded-md text-xs font-bold text-gray-200 hover:bg-white/5 hover:border-cyan-500 transition-colors duration-300 w-full sm:w-auto justify-center shadow-sm">
              <Filter className="w-4 h-4 text-cyan-400"/>
              Filtrar por Gêneros
              {selectedGenres.length > 0 && <span className="bg-fuchsia-600 text-white px-1.5 rounded ml-1">{selectedGenres.length}</span>}
          </button>
      </div>

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-black text-white">Resultados</h2><p className="text-gray-400/60 font-medium text-xs">{filteredMangas.length} obras</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredMangas.map(manga => (
          <div key={manga.id} className="cursor-pointer group flex flex-col gap-1.5" onClick={() => onNavigate('details', manga)}>
             <div className={`aspect-[2/3] rounded-lg overflow-hidden bg-[#0d0d12] border border-white/10 shadow-sm mb-1 ${dataSaver ? 'blur-[1px]' : ''}`}><img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300" /></div>
             <h3 className="font-bold text-xs md:text-sm text-gray-200 line-clamp-1 group-hover:text-cyan-400">{manga.title}</h3>
          </div>
        ))}
      </div>

      {showGenreModal && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300" onClick={() => setShowGenreModal(false)}>
            <div className="bg-[#050508] border-t sm:border border-white/10 rounded-t-xl sm:rounded-xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col slide-in-from-bottom-full sm:slide-in-from-bottom-0 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                    <h2 className="text-lg font-black text-white flex items-center gap-2"><Filter className="w-5 h-5 text-cyan-400"/> Gêneros Literários</h2>
                    <button onClick={() => setShowGenreModal(false)} className="text-gray-400/60 hover:text-white p-1 rounded-md transition-colors duration-300"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 flex flex-wrap gap-2 content-start no-scrollbar">
                    {GENEROS.map(genre => <button key={genre} onClick={() => toggleGenre(genre)} className={`text-xs font-bold px-3 py-2 rounded border transition-colors duration-300 ${selectedGenres.includes(genre) ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-md' : 'bg-[#0d0d12] border-white/10 text-gray-300/80 hover:text-white hover:border-fuchsia-500/50'}`}>{genre}</button>)}
                </div>
                <div className="mt-6 flex gap-3 pt-4 border-t border-white/10">
                     <button onClick={() => setSelectedGenres([])} className="flex-1 bg-[#0d0d12] text-gray-300/80 font-bold py-3 rounded-md hover:bg-white/5 hover:text-white transition-colors duration-300 text-sm border border-white/10">Limpar</button>
                     <button onClick={() => setShowGenreModal(false)} className="flex-1 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-md hover:scale-105 transition-transform duration-300 text-sm shadow-lg">Aplicar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- NEXO HUB (Unifica Missões, Forja e Loja) ---
function NexoView({ user, userProfileData, showToast, mangas, db, appId, onNavigate, onLevelUp, synthesizeCrystal, shopItems, buyItem, equipItem }) {
    const [activeTab, setActiveTab] = useState("Missões");
    const [enigmaAnswer, setEnigmaAnswer] = useState("");
    const [timeLeft, setTimeLeft] = useState("");
    const [confirmModal, setConfirmModal] = useState(null); 
    const [isForgingMission, setIsForgingMission] = useState(false); 
    const [synthesizing, setSynthesizing] = useState(false);

    useEffect(() => {
        if (!userProfileData.activeMission) return;
        const updateTimer = () => {
            const diff = userProfileData.activeMission.deadline - Date.now();
            if (diff <= 0) {
                setTimeLeft("Expirado");
            } else {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const m = Math.floor((diff / 1000 / 60) % 60);
                const s = Math.floor((diff / 1000) % 60);
                let timeStr = "";
                if (d > 0) timeStr += `${d}d `;
                if (h > 0 || d > 0) timeStr += `${h}h `;
                timeStr += `${m}m ${s}s`;
                setTimeLeft(timeStr);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [userProfileData.activeMission]);

    const triggerForgeMission = async (difficulty) => {
        setConfirmModal(null);
        setIsForgingMission(true);
        setTimeout(() => {
            generateMission(difficulty);
        }, 2500); 
    };

    const fetchGlobalEnigma = async (difficulty) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch('https://api.jikan.moe/v4/random/manga', { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            const mangaApi = data.data;
            if(!mangaApi || !mangaApi.title || !mangaApi.synopsis) return null;
            let synopsis = mangaApi.synopsis.split('[')[0].trim(); 
            let snippetLength = difficulty.includes('S') ? 80 : (difficulty.includes('A') || difficulty.includes('B') ? 150 : 300);
            let shortSynopsis = synopsis.substring(0, snippetLength) + "...";
            let genresText = mangaApi.genres && mangaApi.genres.length > 0 ? mangaApi.genres.map(g => g.name).slice(0, difficulty.includes('S') ? 1 : 3).join(', ') : "Desconhecidos";
            let q = `[NEXO GLOBAL DETECTADO]\n\nSinopse Parcial:\n"${shortSynopsis}"\n\nGêneros Pistas: ${genresText}\n\nQual é o nome original ou em inglês da obra?`;
            let answers = [
                mangaApi.title.toLowerCase().trim(), 
                ...(mangaApi.title_english ? [mangaApi.title_english.toLowerCase().trim()] : []), 
                ...(mangaApi.title_japanese ? [mangaApi.title_japanese.toLowerCase().trim()] : [])
            ];
            return { q, a: answers, rawId: mangaApi.mal_id };
        } catch(e) { return null; }
    };

    const generateMission = async (difficulty) => {
        try {
            const now = Date.now();
            let completed = userProfileData.completedMissions || [];
            let possibleTypes = [0, 1, 2]; 
            let missionType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            let newMission = null;

            const rankConfigs = {
                'Rank E': { rxp: 30, rcoin: 15, pxp: 15, pcoin: 10, enigmaTries: 3, enigmaTimeMin: 15, readTimePerCapMin: 60 },
                'Rank C': { rxp: 100, rcoin: 50, pxp: 50, pcoin: 25, enigmaTries: 3, enigmaTimeMin: 10, readTimePerCapMin: 50 },
                'Rank B': { rxp: 150, rcoin: 80, pxp: 80, pcoin: 40, enigmaTries: 2, enigmaTimeMin: 8,  readTimePerCapMin: 45 },
                'Rank A': { rxp: 300, rcoin: 150, pxp: 150, pcoin: 80, enigmaTries: 2, enigmaTimeMin: 5,  readTimePerCapMin: 40 },
                'Rank S': { rxp: 800, rcoin: 400, pxp: 400, pcoin: 200, enigmaTries: 1, enigmaTimeMin: 3,  readTimePerCapMin: 30 },
                'Rank SSS':{ rxp: 2000, rcoin: 1000, pxp: 1000, pcoin: 500, enigmaTries: 1, enigmaTimeMin: 1,  readTimePerCapMin: 20 }
            };
            const conf = rankConfigs[difficulty];

            if (mangas.length === 0 && missionType !== 2) missionType = 2; 

            if (missionType === 1) {
                let validLocalMangas = mangas.filter(item => !completed.includes("enigma_local_" + item.id) && (item.synopsis || (item.genres && item.genres.length > 0)));
                if(validLocalMangas.length === 0) missionType = 2; 
                if (missionType === 1) { 
                    const randomManga = validLocalMangas[Math.floor(Math.random() * validLocalMangas.length)];
                    let q = ""; let a = [randomManga.title.toLowerCase().trim()]; const rand = Math.random();
                    if (rand < 0.4 && randomManga.synopsis && randomManga.synopsis.length > 30) {
                        let cleanDesc = randomManga.synopsis.replace(/<[^>]*>?/gm, '');
                        const regex = new RegExp(randomManga.title, 'gi'); cleanDesc = cleanDesc.replace(regex, '___');
                        const snippetLength = difficulty.includes('S') ? 80 : 160;
                        q = `[CATÁLOGO INFINITY]\n\nSinopse:\n"${cleanDesc.substring(0, snippetLength)}..."\n\nQual é a obra?`;
                    } else if (rand < 0.8 && randomManga.genres && randomManga.genres.length > 0) {
                         q = `[CATÁLOGO INFINITY]\n\nGêneros:\n${randomManga.genres.join(', ')}\n\nQual é a obra?`;
                    } else if (randomManga.author) {
                         q = `[CATÁLOGO INFINITY]\n\nAutor:\n"${randomManga.author}"\n\nQual é a obra?`;
                    } else {
                         q = `Qual é o nome exato desta obra do site:\n${randomManga.title}?`; 
                    }
                    newMission = {
                        id: Date.now().toString(), type: 'enigma', difficulty: difficulty, title: "Conhecimento Infinity",
                        question: q, answer: a, attemptsLeft: conf.enigmaTries,
                        rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.enigmaTimeMin * 60 * 1000) 
                    };
                    completed.push("enigma_local_" + randomManga.id);
                }
            } 
            
            if (missionType === 0) {
                let availableMangas = mangas.filter(item => !completed.includes("read_" + item.id));
                if(availableMangas.length === 0) availableMangas = mangas; 
                if (availableMangas.length > 0) {
                    const randomManga = availableMangas[Math.floor(Math.random() * availableMangas.length)];
                    const totalCaps = randomManga.chapters ? randomManga.chapters.length : 1;
                    let readTarget = 1;
                    if (difficulty === 'Rank E') readTarget = 1;
                    else if (difficulty === 'Rank C') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 3) + 2); 
                    else if (difficulty === 'Rank B') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 5) + 5); 
                    else if (difficulty === 'Rank A') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 10) + 10); 
                    else if (difficulty === 'Rank S') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 20) + 20); 
                    else if (difficulty === 'Rank SSS') readTarget = totalCaps; 
                    
                    newMission = {
                        id: Date.now().toString(), type: 'read', difficulty: difficulty, title: `Missão de Leitura`,
                        desc: difficulty === 'Rank SSS' ? `Leia TODOS OS CAPÍTULOS da obra "${randomManga.title}".` : `Leia ${readTarget} capítulo(s) da obra "${randomManga.title}".`,
                        targetManga: randomManga.id, targetCount: readTarget, currentCount: 0,
                        rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (readTarget * conf.readTimePerCapMin * 60 * 1000)
                    };
                    completed.push("read_" + randomManga.id); 
                } else { missionType = 2; }
            }

            if (missionType === 2 || !newMission) {
                if (Math.random() > 0.5) {
                    const apiEnigma = await fetchGlobalEnigma(difficulty);
                    if (apiEnigma) {
                        newMission = {
                            id: Date.now().toString(), type: 'enigma', difficulty: difficulty, title: "Multiverso Global",
                            question: apiEnigma.q, answer: apiEnigma.a, attemptsLeft: conf.enigmaTries,
                            rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.enigmaTimeMin * 60 * 1000) 
                        };
                        completed.push("api_" + apiEnigma.rawId);
                    }
                }
                if (!newMission) {
                    let availableEnigmas = MULTIVERSO_ENIGMAS.filter(item => !completed.includes(item.q));
                    if (availableEnigmas.length === 0) { completed = []; availableEnigmas = MULTIVERSO_ENIGMAS; }
                    const enigmaData = availableEnigmas[Math.floor(Math.random() * availableEnigmas.length)];
                    newMission = {
                        id: Date.now().toString(), type: 'enigma', difficulty: difficulty, title: "Arquivo Ancestral",
                        question: enigmaData.q, answer: enigmaData.a, attemptsLeft: conf.enigmaTries,
                        rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin, deadline: now + (conf.enigmaTimeMin * 60 * 1000) 
                    };
                    completed.push(enigmaData.q); 
                }
            }
        
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { activeMission: newMission, completedMissions: completed });
            showToast(`Contrato Assinado!`, "success");
        } catch(e) { showToast("Falha na Fenda do Nexo.", "error"); } finally { setIsForgingMission(false); }
    };
    
    const handleEnigmaSubmit = async (e) => {
        e.preventDefault();
        const m = userProfileData.activeMission;
        if (!m || m.type !== 'enigma') return;
        if (!enigmaAnswer.trim()) return showToast("A resposta não pode ser vazia.", "warning");
    
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const userAnswer = enigmaAnswer.toLowerCase().trim();
        const isCorrect = m.answer.some(ans => {
            const correctAns = ans.toLowerCase().trim();
            return userAnswer === correctAns || (userAnswer.length >= 3 && (correctAns.includes(userAnswer) || userAnswer.includes(correctAns)));
        });
        
        if (isCorrect) {
           let { newXp, newLvl, didLevelUp } = addXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.rewardXp);
           let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
           let currentCompleted = userProfileData.completedMissions || [];
           if (!currentCompleted.includes(m.question)) currentCompleted = [...currentCompleted, m.question];
           
           await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
           setEnigmaAnswer(''); showToast(`Enigma Desvendado! Recebeu ${m.rewardXp} XP e ${m.rewardCoins} Moedas.`, "success");
           if(didLevelUp) onLevelUp(newLvl); 
        } else {
           const attempts = m.attemptsLeft - 1;
           if (attempts <= 0) {
               let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
               let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
               await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
               showToast(`Falhou! O Sistema cobrou a penalidade.`, "error");
           } else {
               await updateDoc(profileRef, { 'activeMission.attemptsLeft': attempts });
               showToast(`Incorreto. ${attempts} tentativa(s) restante(s).`, "error");
           }
           setEnigmaAnswer('');
        }
    };
    
    const cancelMission = async () => {
        const m = userProfileData.activeMission;
        if(!m) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
        let { newXp, newLvl } = removeXpLogic(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
        let currentCompleted = userProfileData.completedMissions || [];
        const blockItem = m.type === 'enigma' ? m.question : "read_" + m.targetManga;
        if (!currentCompleted.includes(blockItem)) currentCompleted = [...currentCompleted, blockItem];
        await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
        showToast(`Desistência punida: -${m.penaltyXp}XP | -${m.penaltyCoins} Moedas`, "error");
    };

    const runSynthesis = async () => {
        if ((userProfileData.crystals || 0) < 5) { showToast("Cristais insuficientes (Custa 5).", "error"); return; }
        setSynthesizing(true);
        setTimeout(async () => {
          const res = await synthesizeCrystal();
          setSynthesizing(false);
          if (res && res.success) showToast(`Síntese Concluída! +${res.wonCoins} Moedas | +${res.wonXp} XP`, 'success');
          else showToast(`Falha na Síntese! Os cristais foram destruídos.`, 'error');
        }, 1500);
    };

    const RANK_CARDS = [
        { id: 'Rank E', color: 'text-cyan-400', border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/60', btn: 'bg-cyan-600 hover:bg-cyan-500 text-white', rxp: 30, rcoin: 15, success: '95%', time: '~ 15 min' },
        { id: 'Rank C', color: 'text-emerald-400', border: 'border-emerald-500/30', hover: 'hover:border-emerald-500/60', btn: 'bg-emerald-600 hover:bg-emerald-500 text-white', rxp: 100, rcoin: 50, success: '80%', time: '~ 30 min' },
        { id: 'Rank B', color: 'text-violet-400', border: 'border-violet-500/30', hover: 'hover:border-violet-500/60', btn: 'bg-violet-600 hover:bg-violet-500 text-white', rxp: 150, rcoin: 80, success: '65%', time: '~ 1 Hora' },
        { id: 'Rank A', color: 'text-fuchsia-400', border: 'border-fuchsia-500/30', hover: 'hover:border-fuchsia-500/60', btn: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white', rxp: 300, rcoin: 150, success: '40%', time: '~ 3 Horas' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 animate-in fade-in duration-500 relative">
            
            {/* ANIMAÇÃO SURREAL DE FORJA NOVA */}
            {isForgingMission && (
                <div className="fixed inset-0 z-[3000] bg-[#020205]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300 w-full">
                    <style>{`
                        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                    `}</style>
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-emerald-500 to-fuchsia-500 rounded-full blur-[40px] animate-pulse opacity-60"></div>
                        <div className="absolute inset-4 border-[2px] border-white/20 border-dashed rounded-full animate-[spin_4s_linear_infinite]"></div>
                        <div className="absolute inset-8 border-[3px] border-t-cyan-400 border-b-fuchsia-400 border-l-transparent border-r-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                        <div className="absolute inset-12 bg-black/60 backdrop-blur-md rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center">
                            <Zap className="w-10 h-10 text-white drop-shadow-[0_0_15px_#fff] animate-pulse" />
                        </div>
                    </div>
                    <h2 className="mt-12 text-lg md:text-xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 tracking-[0.4em] md:tracking-[0.6em] animate-pulse">
                        FORJANDO NEXO...
                    </h2>
                </div>
            )}

            {/* MODAL DE CONFIRMAÇÃO */}
            {confirmModal && (
                <div className="fixed inset-0 z-[2000] bg-[#030407]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setConfirmModal(null)}>
                    <div className="bg-[#0d0d12] border border-white/10 p-6 rounded-xl shadow-[0_0_40px_rgba(217,70,239,0.2)] max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white mb-2">Confirmar Contrato?</h3>
                        <p className="text-sm text-gray-400/60 mb-6">Ao aceitar uma missão <b>{confirmModal}</b>, você estará sujeito às penalidades caso o tempo esgote ou suas vidas acabem.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmModal(null)} className="flex-1 bg-[#050508] border border-white/10 text-gray-300/80 font-bold py-3 rounded-lg hover:text-white transition-colors text-sm duration-300">Recusar</button>
                            <button onClick={() => triggerForgeMission(confirmModal)} className="flex-1 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black py-3 rounded-lg hover:scale-105 transition-transform shadow-md text-sm duration-300">Assinar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TABS DO NEXO */}
            <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide pb-2">
                <button onClick={() => setActiveTab("Missões")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-2 text-sm duration-300 ${activeTab === "Missões" ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'text-gray-400/60 hover:text-white border border-transparent'}`}><Target className="w-4 h-4"/> Missões</button>
                <button onClick={() => setActiveTab("Forja")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-2 text-sm duration-300 ${activeTab === "Forja" ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400/60 hover:text-white border border-transparent'}`}><Hexagon className="w-4 h-4"/> Forja Cósmica</button>
                <button onClick={() => setActiveTab("Loja")} className={`px-4 py-2 rounded-md font-bold transition-all whitespace-nowrap flex items-center gap-2 text-sm duration-300 ${activeTab === "Loja" ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'text-gray-400/60 hover:text-white border border-transparent'}`}><ShoppingCart className="w-4 h-4"/> Loja Infinity</button>
            </div>

            {/* CONTEÚDO MISSÕES */}
            {activeTab === "Missões" && (
                <div className="animate-in fade-in duration-300">
                    {userProfileData.activeMission ? (
                        <div className="bg-[#0d0d12] border border-fuchsia-500/40 p-4 rounded-xl shadow-[0_0_30px_rgba(217,70,239,0.1)] mb-6 animate-in zoom-in-95 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-600"></div>
                            <div className="mb-4">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${userProfileData.activeMission.difficulty.includes('S') ? 'bg-red-950/80 text-red-500 border-red-500/50' : userProfileData.activeMission.difficulty === 'Rank A' || userProfileData.activeMission.difficulty === 'Rank B' ? 'bg-[#1a0033] text-fuchsia-400 border-fuchsia-500/50' : 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50'}`}>
                                    {userProfileData.activeMission.difficulty}
                                </span>
                                <h3 className="text-lg font-black text-white mt-1.5 leading-tight">{userProfileData.activeMission.title}</h3>
                            </div>
                            <div className="mb-4">
                                {userProfileData.activeMission.type === 'enigma' ? (
                                    <div className="bg-[#050508]/60 p-4 md:p-5 rounded-md border border-white/10 relative">
                                        <p className="text-sm font-medium text-gray-200 mb-5 leading-relaxed whitespace-pre-wrap border-l-2 border-fuchsia-500/50 pl-3">
                                            {userProfileData.activeMission.question}
                                        </p>
                                        <form onSubmit={handleEnigmaSubmit} className="flex flex-col gap-2 relative z-10">
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                                                <input type="text" value={enigmaAnswer} onChange={e=>setEnigmaAnswer(e.target.value)} placeholder="Sua resposta..." className="w-full bg-[#050508] border border-white/10 rounded-md pl-9 pr-3 py-2.5 text-white outline-none focus:border-cyan-500 transition-colors duration-300 font-bold text-xs shadow-inner" />
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black px-3 py-2.5 rounded-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 text-xs shadow-md duration-300">Validar <Check className="w-3.5 h-3.5"/></button>
                                                <div className="bg-[#050508] px-3 py-2.5 rounded-md border border-white/10 text-xs font-bold text-gray-400/60 flex items-center justify-center gap-1.5 shadow-inner">
                                                    Vidas: <span className={userProfileData.activeMission.attemptsLeft === 1 ? 'text-red-500 font-black' : 'text-cyan-400 font-black'}>{userProfileData.activeMission.attemptsLeft}</span>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="bg-[#050508]/60 p-4 rounded-md border border-white/10">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-cyan-400"/> Progresso</span>
                                            <span className="text-base font-black text-white">{userProfileData.activeMission.currentCount} <span className="text-gray-400/60 text-xs">/ {userProfileData.activeMission.targetCount}</span></span>
                                        </div>
                                        <div className="w-full bg-[#050508] rounded-full h-1.5 overflow-hidden border border-white/10">
                                            <div className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-full rounded-full transition-all duration-500" style={{width: `${(userProfileData.activeMission.currentCount / userProfileData.activeMission.targetCount) * 100}%`}}></div>
                                        </div>
                                        <p className="mt-2.5 text-xs text-gray-400/60 font-medium text-center">{userProfileData.activeMission.desc}</p>
                                        <button onClick={() => { const m = mangas.find(mg => mg.id === userProfileData.activeMission.targetManga); if(m) onNavigate('details', m); }} className="mt-3 w-full bg-cyan-100 text-black py-2 rounded-md font-black transition-colors hover:bg-white flex justify-center items-center gap-1.5 text-xs shadow duration-300">
                                            <BookOpen className="w-3.5 h-3.5"/> Abrir Obra Local
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#050508] p-3 rounded-md border border-white/10">
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] text-gray-400/60 font-bold uppercase tracking-widest hidden sm:block">Recompensas:</span>
                                        <span className="text-xs font-black text-white bg-fuchsia-500/20 px-2 py-0.5 rounded border border-fuchsia-500/30">+{userProfileData.activeMission.rewardXp} XP</span>
                                        <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+{userProfileData.activeMission.rewardCoins} M</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                        <Timer className="w-3 h-3 animate-pulse"/>
                                        <span className="font-black text-[10px] tracking-wide">{timeLeft}</span>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-gray-400/60 font-medium">Punição: -{userProfileData.activeMission.penaltyXp}XP</span>
                                    <button onClick={cancelMission} className="text-[9px] font-bold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 px-2.5 py-1 rounded transition-colors border border-red-500/20 duration-300">Quebrar Contrato</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {RANK_CARDS.map(rank => (
                                    <div key={rank.id} className={`bg-[#0d0d12] border ${rank.border} ${rank.hover} transition-colors duration-300 p-4 rounded-xl flex flex-col group shadow-sm`}>
                                        <div className="flex justify-between items-center mb-3">
                                           <div className={`${rank.color} font-black text-lg group-hover:scale-105 transition-transform origin-left`}>{rank.id}</div>
                                           <div className="text-[9px] font-bold text-gray-400/60 text-right">+{rank.rxp}XP | +{rank.rcoin}M</div>
                                        </div>
                                        <div className="flex flex-col gap-1 mb-4 mt-2">
                                            <div className="flex justify-between text-[9px] text-gray-400/60"><span className="flex items-center gap-1"><Target className="w-3 h-3"/> Sucesso Est.</span><span className="font-bold text-gray-300/80">{rank.success}</span></div>
                                            <div className="flex justify-between text-[9px] text-gray-400/60"><span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Tempo Est.</span><span className="font-bold text-gray-300/80">{rank.time}</span></div>
                                        </div>
                                        <button onClick={() => setConfirmModal(rank.id)} className={`w-full ${rank.btn} text-xs font-bold py-2.5 rounded-md transition-colors mt-auto flex items-center justify-center gap-2 duration-300`}>
                                           Assinar Contrato
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-amber-950/20 border border-amber-900/50 hover:border-amber-500/80 transition-colors duration-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 shadow-sm">
                                <div>
                                   <div className="text-amber-500 font-black text-lg flex items-center gap-1.5 mb-1">Rank S <Star className="w-3.5 h-3.5 fill-current"/></div>
                                   <div className="text-[9px] font-bold text-gray-400/60 flex gap-2"><span className="text-amber-400">+800XP / +400M</span> <span>• Alta dificuldade</span></div>
                                </div>
                                <button onClick={() => setConfirmModal('Rank S')} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-6 py-2.5 rounded-md transition-colors duration-300 flex items-center justify-center min-w-[120px]">Aceitar Nexo</button>
                            </div>
                            <div className="bg-red-950/20 border border-red-900/80 hover:border-red-500/80 transition-colors duration-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-[30px] rounded-full pointer-events-none"></div>
                                <div className="relative z-10">
                                   <div className="text-red-500 font-black text-xl flex items-center gap-1.5 mb-1">Rank SSS <Skull className="w-4 h-4"/></div>
                                   <div className="text-[9px] font-bold text-gray-400/60 flex gap-2"><span className="text-red-400">+2000XP / +1000M</span> <span>• Risco de Morte</span></div>
                                </div>
                                <button onClick={() => setConfirmModal('Rank SSS')} className="w-full sm:w-auto bg-red-800 hover:bg-red-600 text-white text-xs font-black px-6 py-2.5 rounded-md transition-colors duration-300 shadow-lg relative z-10 flex items-center justify-center min-w-[120px]">Desafiar Nexo</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONTEÚDO FORJA */}
            {activeTab === "Forja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-gradient-to-br from-[#0d0d12] to-[#030407] border border-white/10 p-5 md:p-6 rounded-xl shadow-md">
                       <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-6 relative z-10">
                         <div className="text-center md:text-left">
                           <h3 className="text-xl font-black text-emerald-400 mb-1.5 flex items-center gap-2 justify-center md:justify-start"><Hexagon className="w-5 h-5"/> Fornalha de Síntese</h3>
                           <p className="text-gray-400/60 text-xs font-medium max-w-sm">Leitura e Missões geram Cristais. Sintetize-os aqui para obter Moedas Infinity e XP extra.</p>
                         </div>
                         <div className="flex gap-2">
                            <div className="bg-[#050508] border border-white/10 p-3 rounded-lg text-center min-w-[80px] shadow-inner">
                              <p className="text-lg font-black text-cyan-400">{userProfileData.crystals || 0}</p>
                              <p className="text-[8px] text-gray-400/60 uppercase font-bold mt-0.5">Cristais</p>
                            </div>
                            <div className="bg-[#050508] border border-white/10 p-3 rounded-lg text-center min-w-[80px] shadow-inner">
                              <p className="text-lg font-black text-amber-500">{userProfileData.coins || 0}</p>
                              <p className="text-[8px] text-gray-400/60 uppercase font-bold mt-0.5">Moedas</p>
                            </div>
                         </div>
                       </div>

                       <div className="bg-[#050508] border border-white/10 p-5 rounded-lg relative overflow-hidden flex flex-col items-center justify-center text-center shadow-inner">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 relative transition-all duration-1000 ${synthesizing ? 'scale-125' : ''}`}>
                             <div className={`absolute inset-0 rounded-full border-2 border-t-cyan-500 border-r-emerald-500 border-b-transparent border-l-transparent ${synthesizing ? 'animate-[spin_0.5s_linear_infinite] opacity-100' : 'opacity-20'}`}></div>
                             <Flame className={`w-6 h-6 ${synthesizing ? 'text-white animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-emerald-400'}`} />
                          </div>
                          <p className="text-[10px] text-gray-400/60 font-medium mb-4 max-w-[200px]">Custo: 5 Cristais (40% chance de falhar).</p>
                          <button onClick={runSynthesis} disabled={synthesizing || (userProfileData.crystals || 0) < 5} className="w-full sm:w-48 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black py-2.5 rounded-md flex items-center justify-center gap-1.5 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 text-xs shadow-md duration-300">
                             {synthesizing ? 'SINTETIZANDO...' : 'SINTETIZAR (-5)'}
                          </button>
                       </div>
                    </div>
                </div>
            )}

            {/* CONTEÚDO LOJA */}
            {activeTab === "Loja" && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl shadow-md">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                        <div>
                          <h3 className="text-lg font-black text-amber-500 mb-0.5 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4"/> Loja Infinity</h3>
                          <p className="text-gray-400/60 text-[10px]">Utilize suas moedas para personalizar seu Perfil.</p>
                        </div>
                        <div className="bg-amber-500/20 border border-amber-500/50 text-amber-500 font-black px-3 py-1.5 rounded-md flex items-center gap-1 w-full sm:w-auto justify-center text-xs">
                           {userProfileData.coins || 0} M
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {shopItems.map(item => {
                          const hasItem = userProfileData.inventory?.includes(item.id);
                          const isEquipped = userProfileData.activeFrame === item.cssClass || userProfileData.activeCover === item.preview || userProfileData.avatarUrl === item.preview || userProfileData.activeEffect === item.cssClass || userProfileData.activeFont === item.cssClass;
                          return (
                            <div key={item.id} className={`bg-[#050508] border p-3 rounded-lg flex flex-col items-center text-center transition-colors duration-300 ${isEquipped ? 'border-amber-500/50' : 'border-white/10'}`}>
                              <div className={`w-14 h-14 rounded-md mb-2 bg-[#0d0d12] flex items-center justify-center overflow-hidden shadow-inner ${item.categoria === 'moldura' || item.categoria === 'efeito' ? item.cssClass : ''}`}>
                                {item.preview ? <img src={item.preview} className={`w-full h-full object-cover ${item.cssClass || ''}`} /> : <Sparkles className="w-5 h-5 text-cyan-400"/>}
                              </div>
                              <h4 className="text-white font-bold mb-0.5 text-[10px] line-clamp-1">{item.nome || item.name}</h4>
                              <p className={`text-[8px] uppercase tracking-widest font-bold mb-3 ${getRarityColor(item.raridade)}`}>{item.categoria || item.type}</p>
                              {hasItem ? (
                                <button onClick={() => equipItem(item)} className={`w-full py-1.5 rounded text-[10px] font-bold transition-all duration-300 ${isEquipped ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30' : 'bg-[#0d0d12] text-white hover:bg-white/5 border border-white/10'}`}>
                                  {isEquipped ? 'Desequipar' : 'Equipar'}
                                </button>
                              ) : (
                                <button onClick={() => buyItem(item)} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-1.5 rounded transition-all duration-300 text-[10px] shadow-sm">
                                  {item.preco || item.price} M
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileView({ user, userProfileData, historyData, libraryData, dataLoaded, userSettings, updateSettings, onLogout, onUpdateData, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("Estatisticas"); 
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [coverBase64, setCoverBase64] = useState('');

  useEffect(() => {
    setName(user.displayName || '');
    setBio(userProfileData.bio || '');
    setAvatarBase64(userProfileData.avatarUrl || user.photoURL || '');
    setCoverBase64(userProfileData.coverUrl || '');
  }, [user, userProfileData]);
  
  const [loading, setLoading] = useState(false);

  const avatarInputRef = useRef(null); const coverInputRef = useRef(null);

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const compressedBase64 = await compressImage(file, type === 'cover' ? 400 : 150, 0.4);
      if (type === 'avatar') setAvatarBase64(compressedBase64); else setCoverBase64(compressedBase64);
    } catch (err) { showToast("Erro na imagem.", "error"); }
  };

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      const docData = { coverUrl: coverBase64, avatarUrl: avatarBase64, bio: bio };
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), docData, { merge: true });
      onUpdateData(docData);
      showToast('Perfil salvo com sucesso!', 'success'); setIsEditing(false);
    } catch (error) { showToast(`Erro: Falha na conexão.`, 'error'); } finally { setLoading(false); }
  };

  const level = userProfileData.level || 1;
  const currentXp = userProfileData.xp || 0;
  const xpNeeded = getLevelRequirement(level);
  const progressPercent = Math.min(100, (currentXp / xpNeeded) * 100);

  return (
    <div className="animate-in fade-in duration-500 w-full pb-20">
      <div className="h-40 md:h-64 w-full bg-[#0d0d12] relative group border-b border-white/10 overflow-hidden">
        {userProfileData.activeCover ? (
           <img src={userProfileData.activeCover} className="w-full h-full object-cover" />
        ) : coverBase64 ? (
           <img src={coverBase64} className="w-full h-full object-cover" />
        ) : (
           <div className="w-full h-full bg-gradient-to-r from-[#0d0d12] to-[#030407]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-transparent to-transparent" />
        {isEditing && <button onClick={() => coverInputRef.current.click()} className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold z-10 transition-colors hover:bg-black/80 duration-300"><Camera className="w-3.5 h-3.5" /> Capa</button>}
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 md:-mt-20 z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-8">
          <div className="relative group">
            <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-[#030407] bg-[#0d0d12] flex items-center justify-center relative flex-shrink-0 ${userProfileData.activeFrame || ''}`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                {avatarBase64 ? <img src={avatarBase64} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-400/60 bg-[#0d0d12]" />}
              </div>
            </div>
            {isEditing && <button onClick={() => avatarInputRef.current.click()} className="absolute bottom-0 right-0 bg-fuchsia-600 p-2.5 rounded-full text-white z-10 shadow-lg hover:bg-fuchsia-500 transition-colors duration-300"><Camera className="w-4 h-4" /></button>}
            <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black text-white">{name || 'Sem Nome'}</h1>
            <p className="text-cyan-400 font-medium mb-2 text-sm">{user.email}</p>
            <div className="w-full max-w-sm mx-auto md:mx-0 bg-[#0d0d12] p-2.5 rounded-md border border-white/10 shadow-inner">
              <div className="flex justify-between text-[10px] font-black uppercase mb-1.5 tracking-widest">
                <span className="text-fuchsia-400">Nível {level} - <span className="text-gray-300/80">{getLevelTitle(level)}</span></span>
                <span className="text-gray-400/60">{currentXp} / {xpNeeded} XP</span>
              </div>
              <div className="w-full bg-[#050508] rounded-full h-1.5 overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 relative" style={{width: `${progressPercent}%`}}></div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="bg-[#0d0d12] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-1.5 transition-colors duration-300 hover:bg-white/5 border border-white/10"><Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Cancelar' : 'Editar'}</button>
            <button onClick={onLogout} className="bg-red-500/10 text-red-500 p-2 rounded-md transition-colors duration-300 hover:bg-red-500 hover:text-white border border-red-500/20"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="bg-[#0d0d12]/50 border border-white/10 rounded-xl p-5 animate-in slide-in-from-bottom-4 shadow-xl">
            <div className="space-y-3">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#050508] border border-white/10 rounded-md px-3 py-2.5 text-white text-sm font-bold outline-none focus:border-cyan-500 transition-colors duration-300" placeholder="Seu Nome"/>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-[#050508] border border-white/10 rounded-md px-3 py-2.5 text-white text-sm resize-none outline-none focus:border-cyan-500 transition-colors duration-300" placeholder="Fale um pouco sobre você..."></textarea>
            </div>
            <button type="submit" disabled={loading} className="mt-4 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white text-sm font-black px-6 py-3 rounded-md w-full flex justify-center hover:scale-[1.02] transition-transform duration-300 shadow-md">{loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Salvar Informações'}</button>
          </form>
        ) : (
          <div>
            <div className="flex gap-2 border-b border-white/10 mb-5 overflow-x-auto scrollbar-hide pb-2">
              <button onClick={() => setActiveTab("Estatisticas")} className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap text-xs md:text-sm duration-300 ${activeTab === "Estatisticas" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-300/80 hover:text-white border border-transparent'}`}>Estatísticas</button>
              <button onClick={() => setActiveTab("Sobre")} className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap text-xs md:text-sm duration-300 ${activeTab === "Sobre" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-300/80 hover:text-white border border-transparent'}`}>Sobre</button>
              <button onClick={() => setActiveTab("Configuracoes")} className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap text-xs md:text-sm duration-300 ${activeTab === "Configuracoes" ? 'bg-[#0d0d12] text-white border border-white/10' : 'text-gray-300/80 hover:text-white border border-transparent'}`}>Configurações</button>
            </div>
            
            {activeTab === "Sobre" && <div className="bg-[#0d0d12] border border-white/10 p-5 rounded-xl animate-in fade-in duration-300 shadow-sm"><p className="text-gray-300 whitespace-pre-wrap leading-relaxed font-medium text-xs md:text-sm">{bio || "Nenhuma biografia registrada. Que tipo de leitor é você?"}</p></div>}
            
            {activeTab === "Estatisticas" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0d0d12] border border-white/10 p-4 rounded-xl text-center shadow-sm"><div className="text-2xl font-black text-white mb-0.5">{!dataLoaded ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-cyan-500"/> : Object.keys(libraryData).length}</div><div className="text-[9px] text-gray-400/60 uppercase font-black tracking-widest">Na Biblioteca</div></div>
                  <div className="bg-[#0d0d12] border border-white/10 p-4 rounded-xl text-center shadow-sm"><div className="text-2xl font-black text-fuchsia-400 mb-0.5">{!dataLoaded ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-fuchsia-500"/> : historyData.length}</div><div className="text-[9px] text-gray-400/60 uppercase font-black tracking-widest">Capítulos Lidos</div></div>
                  <div className="bg-[#0d0d12] border border-white/10 p-4 rounded-xl text-center shadow-sm"><div className="text-2xl font-black text-emerald-400 mb-0.5">{!dataLoaded ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-500"/> : Object.values(libraryData).filter(s=>s==='Finalizado').length}</div><div className="text-[9px] text-gray-400/60 uppercase font-black tracking-widest">Finalizadas</div></div>
                  <div className="bg-[#0d0d12] border border-white/10 p-4 rounded-xl text-center shadow-sm"><div className="text-2xl font-black text-yellow-400 mb-0.5">{!dataLoaded ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-yellow-500"/> : Object.values(libraryData).filter(s=>s==='Favoritos').length}</div><div className="text-[9px] text-gray-400/60 uppercase font-black tracking-widest">Favoritos</div></div>
                </div>
              </div>
            )}
            
            {activeTab === "Configuracoes" && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="bg-[#0d0d12] border border-white/10 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">{userSettings.theme === 'Claro' ? <Sun className="w-3.5 h-3.5 text-yellow-500"/> : <Moon className="w-3.5 h-3.5 text-fuchsia-500"/>} Tema</h4>
                  <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
                    <button onClick={() => updateSettings({ theme: 'Escuro' })} className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all duration-300 ${userSettings.theme === 'Escuro' ? 'bg-[#0d0d12] text-white' : 'text-gray-400/60 hover:text-white'}`}>Escuro</button>
                    <button onClick={() => updateSettings({ theme: 'Claro' })} className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all duration-300 ${userSettings.theme === 'Claro' ? 'bg-white text-black' : 'text-gray-400/60 hover:text-white'}`}>Claro</button>
                  </div>
                </div>

                <div className="bg-[#0d0d12] border border-white/10 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-xs"><BookOpen className="w-3.5 h-3.5 text-cyan-400"/> Leitor</h4>
                  <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
                    <button onClick={() => updateSettings({ readMode: 'Cascata' })} className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all duration-300 ${userSettings.readMode === 'Cascata' ? 'bg-[#0d0d12] text-white' : 'text-gray-400/60 hover:text-white'}`}>Cascata</button>
                    <button onClick={() => updateSettings({ readMode: 'Páginas' })} className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-all duration-300 ${userSettings.readMode === 'Páginas' ? 'bg-[#0d0d12] text-white' : 'text-gray-400/60 hover:text-white'}`}>Páginas</button>
                  </div>
                </div>

                <div className="bg-[#0d0d12] border border-white/10 rounded-lg p-3 flex justify-between items-center">
                  <div><h4 className="font-bold text-white flex items-center gap-1.5 text-xs"><Smartphone className="w-3.5 h-3.5 text-blue-500"/> Modo Leve</h4></div>
                  <button onClick={() => updateSettings({ dataSaver: !userSettings.dataSaver })} className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${userSettings.dataSaver ? 'bg-cyan-500' : 'bg-[#050508] border border-white/10'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300 ${userSettings.dataSaver ? 'left-6' : 'left-1'}`}></div></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailsView({ manga, libraryData, historyData, user, userProfileData, onBack, onChapterClick, onRequireLogin, showToast, db }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const currentStatus = libraryData[manga.id] || "Adicionar";
  const [userRating, setUserRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [chapterSortOrder, setChapterSortOrder] = useState('desc'); 

  // CONTAGEM DE VIEW POR SESSÃO (EVITA INFLAR NÚMEROS)
  useEffect(() => { 
      const sessionKey = `viewed_${manga.id}`;
      if (!sessionStorage.getItem(sessionKey)) {
          try { 
              updateDoc(doc(db, "obras", manga.id), { views: increment(1) }).catch(()=>{}); 
              sessionStorage.setItem(sessionKey, 'true');
          } catch(e){} 
      }
  }, [manga.id, db]);

  useEffect(() => {
    if (user) { getDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'ratings', manga.id)).then(snap => { if (snap.exists()) setUserRating(snap.data().score); }); }
  }, [user, manga.id]);

  const handleLibraryChange = async (status) => {
    if (!user) return onRequireLogin();
    setShowStatusMenu(false);
    try {
      const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'library', manga.id.toString());
      if (status === "Remover") await deleteDoc(ref); else await setDoc(ref, { mangaId: manga.id, status: status, updatedAt: Date.now() });
    } catch(error) { showToast('Erro.', 'error'); }
  };

  const handleRate = async (score) => {
    if (!user) return onRequireLogin();
    if (ratingLoading) return;
    setRatingLoading(true);
    try {
      setUserRating(score);
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'ratings', manga.id), { score });
      const prevRatingCount = manga.ratingCount || 0;
      const prevRating = manga.rating || 0;
      const newCount = prevRatingCount + 1;
      const currentTotal = prevRating * prevRatingCount; 
      const newAvg = (currentTotal + score) / newCount;
      await updateDoc(doc(db, "obras", manga.id), { rating: newAvg, ratingCount: newCount });
    } catch(e) {} finally { setRatingLoading(false); }
  };

  const sortedChapters = [...(manga.chapters || [])].sort((a, b) => chapterSortOrder === 'desc' ? b.number - a.number : a.number - b.number);
  const hasChapters = sortedChapters.length > 0;
  const firstChapterToRead = hasChapters ? [...manga.chapters].sort((a,b) => a.number - b.number)[0] : null;

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500">
      <div className="relative h-48 md:h-64 w-full overflow-hidden bg-[#030407]">
        <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30" style={{ backgroundImage: `url(${manga.coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/80 to-transparent" />
        <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-1 text-white/80 hover:text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-md text-xs font-bold z-20 border border-white/10 transition-colors duration-300"><ChevronLeft className="w-4 h-4" /> Voltar</button>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24 md:-mt-32 z-10">
        <div className="flex flex-col md:flex-row gap-5 md:gap-8">
          <div className="w-32 md:w-56 mx-auto md:mx-0 rounded-lg overflow-hidden shadow-xl border border-white/10 shrink-0"><img src={manga.coverUrl} className="w-full h-full object-cover aspect-[2/3]" /></div>
          <div className="flex-1 pt-2 md:pt-8 text-center md:text-left">
            <h1 className="text-xl md:text-3xl font-black text-white mb-1 tracking-tight line-clamp-2">{manga.title}</h1>
            <p className="text-sm md:text-base text-cyan-400 font-bold mb-3">{manga.author || 'Autor Desconhecido'}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-[#0d0d12]/80 border border-white/10 px-3 py-1.5 rounded-md shadow-inner">
                 <Star className={`w-3.5 h-3.5 ${manga.ratingCount > 0 ? 'text-yellow-500 fill-current' : 'text-gray-400/60'}`} />
                 <span className="font-black text-white text-xs ml-0.5">{manga.ratingCount > 0 ? Number(manga.rating).toFixed(1) : "N/A"}</span>
                 {manga.ratingCount > 0 && <span className="text-[9px] text-gray-300/80 ml-1 font-bold">({manga.ratingCount})</span>}
              </div>
              <div className="flex items-center gap-1 bg-[#0d0d12]/80 border border-white/10 px-3 py-1.5 rounded-md text-gray-300 font-bold text-[10px] shadow-inner">
                <Eye className="w-3.5 h-3.5 text-fuchsia-400" /> {(manga.views || 0)}
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-5">
              {manga.genres && manga.genres.length > 0 ? (
                manga.genres.map(g => <span key={g} className="text-[9px] bg-cyan-900/20 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded font-bold">{g}</span>)
              ) : <span className="text-[9px] text-gray-400/60 bg-[#0d0d12] px-2 py-1 rounded">Nenhum</span>}
            </div>

            <div className="mb-6 text-left bg-[#0d0d12]/30 p-4 rounded-lg border border-white/10">
               <h3 className="text-xs font-black text-white mb-1.5 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-cyan-400" /> Sinopse</h3>
               <p className="text-gray-300 leading-relaxed text-xs font-medium">{manga.synopsis || "Nenhuma sinopse disponível para esta obra."}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start relative">
               {firstChapterToRead && <button onClick={() => onChapterClick(manga, firstChapterToRead)} className="bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-black px-5 py-2.5 rounded-md flex items-center gap-1.5 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-xs hover:scale-105 transition-transform duration-300"><BookOpen className="w-3.5 h-3.5" /> Ler Cap. {firstChapterToRead.number}</button>}
               <div className="relative flex-1 sm:flex-none">
                 <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`w-full flex items-center justify-center gap-1.5 bg-[#0d0d12] hover:bg-white/5 text-white font-bold px-5 py-2.5 rounded-md border transition-colors text-xs duration-300 ${currentStatus !== "Adicionar" ? 'border-fuchsia-500 text-fuchsia-400' : 'border-white/10'}`}><Library className="w-3.5 h-3.5" /> {currentStatus === "Adicionar" ? "Na Biblioteca" : currentStatus}</button>
                 {showStatusMenu && (
                   <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0d0d12] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-top-2">
                     {LIBRARY_STATUS.map(s => <button key={s} onClick={() => handleLibraryChange(s)} className={`px-3 py-2 text-left font-bold text-white hover:bg-white/5 border-b border-white/5 text-[10px] duration-300 transition-colors ${currentStatus === s ? 'text-fuchsia-400 bg-[#050508]' : ''}`}>{s}</button>)}
                     {currentStatus !== "Adicionar" && <button onClick={() => handleLibraryChange("Remover")} className="px-3 py-2 text-left font-bold text-red-400 hover:bg-red-500/10 text-[10px] transition-colors duration-300">Remover</button>}
                   </div>
                 )}
               </div>
            </div>

            <div className="mt-5 flex flex-col items-center md:items-start bg-[#0d0d12]/50 p-3 rounded-lg border border-white/10 w-full sm:w-fit">
               <p className="text-[9px] font-black text-gray-400/60 uppercase tracking-widest mb-1.5">Sua Avaliação</p>
               <div className="flex gap-1">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button key={star} onClick={() => handleRate(star)} disabled={ratingLoading} className="transition-transform hover:scale-110 focus:outline-none duration-300">
                     <Star className={`w-5 h-5 transition-colors duration-300 ${userRating >= star ? 'text-yellow-500 fill-current' : 'text-white/10 hover:text-fuchsia-500/50'}`} />
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-[#0d0d12]/40 border border-white/10 rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <h2 className="text-xl font-black text-white flex items-center gap-1.5"><List className="w-5 h-5 text-cyan-400" /> Capítulos</h2>
            <div className="flex bg-[#050508] border border-white/10 rounded-md p-1 w-full sm:w-auto">
              <button onClick={() => setChapterSortOrder('desc')} className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-colors duration-300 ${chapterSortOrder === 'desc' ? 'bg-white/5 text-white' : 'text-gray-400/60'}`}>Recentes</button>
              <button onClick={() => setChapterSortOrder('asc')} className={`flex-1 px-3 py-1 rounded text-[10px] font-bold transition-colors duration-300 ${chapterSortOrder === 'asc' ? 'bg-white/5 text-white' : 'text-gray-400/60'}`}>Antigos</button>
            </div>
          </div>

          {hasChapters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sortedChapters.map((cap) => {
                const isRead = historyData.some(h => h.id === `${manga.id}_${cap.id}`);
                const dateVal = cap.createdAt || cap.timestamp || cap.date || Date.now();
                return (
                  <div key={cap.id} onClick={() => onChapterClick(manga, cap)} className={`flex justify-between items-center p-3 rounded-md bg-[#050508] border transition-all hover:bg-[#0d0d12] group cursor-pointer duration-300 ${isRead ? 'border-emerald-500/30' : 'border-white/10 hover:border-cyan-500/50'}`}>
                    <div>
                      <h4 className={`font-black text-xs md:text-sm transition-colors flex items-center gap-1.5 ${isRead ? 'text-emerald-400' : 'text-gray-200 group-hover:text-cyan-400'}`}>
                        Capítulo {cap.number} {isRead && <CheckCircle className="w-3 h-3"/>}
                      </h4>
                      {timeAgo(dateVal) === 'NOVO' ? (
                           <span className="text-[8px] font-black bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(34,211,238,0.5)] mt-1 inline-block">NOVO</span>
                      ) : (
                           <p className="text-[9px] text-gray-400/60 mt-0.5 font-medium">{cap.title ? cap.title : timeAgo(dateVal)}</p>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors duration-300 ${isRead ? 'bg-emerald-500/10' : 'bg-[#0d0d12] group-hover:bg-fuchsia-600'}`}>
                      <Play className={`w-2.5 h-2.5 ml-0.5 ${isRead ? 'text-emerald-400' : 'text-gray-300/80 group-hover:text-white'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="py-10 text-center bg-[#050508] rounded-lg border border-white/10 border-dashed"><BookOpen className="w-8 h-8 text-white/10 mx-auto mb-2"/><p className="text-gray-400/60 font-bold text-xs">Sem capítulos.</p></div>}
        </div>

        <div className="mt-6">
           <CommentsSection mangaId={manga.id} chapterId={null} user={user} userProfileData={userProfileData} onRequireLogin={onRequireLogin} showToast={showToast} />
        </div>

      </div>
    </div>
  );
}

function ReaderView({ manga, chapter, user, userProfileData, onBack, onChapterClick, triggerRandomDrop, onMarkAsRead, readMode, onRequireLogin, showToast, libraryData, onToggleLibrary }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showUI, setShowUI] = useState(false); 
  const [showChapterList, setShowChapterList] = useState(false); 
  const [drawerSort, setDrawerSort] = useState('desc');
  const [zoom, setZoom] = useState(100); 

  const viewedPages = useRef(new Set()); 
  const dropRolled = useRef(false);
  const chapterStartTime = useRef(Date.now()); 
  
  if (!chapter) {
      return (
          <div className="min-h-screen bg-[#030407] flex flex-col items-center justify-center text-white">
              <ShieldAlert className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold mb-6 text-gray-400/60">Capítulo não encontrado.</h2>
              <button onClick={onBack} className="bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors px-6 py-2.5 rounded-md font-bold text-sm">Retornar à Obra</button>
          </div>
      );
  }

  const pages = chapter.pages || []; 
  const currentIndex = manga.chapters.findIndex(c => c.id === chapter.id);
  const nextChapter = manga.chapters[currentIndex - 1]; 
  const prevChapter = manga.chapters[currentIndex + 1];

  const drawerChapters = [...(manga.chapters || [])].sort((a, b) => drawerSort === 'desc' ? b.number - a.number : a.number - b.number);

  useEffect(() => { 
    setCurrentPage(0); 
    viewedPages.current.clear();
    dropRolled.current = false;
    chapterStartTime.current = Date.now(); 
    window.scrollTo(0,0);
  }, [chapter, manga]);

  const handlePageInView = (index) => {
    if (!viewedPages.current.has(index)) viewedPages.current.add(index);
  };

  const handleReachEnd = () => {
    const timeSpentSeconds = (Date.now() - chapterStartTime.current) / 1000;
    const isValidReading = timeSpentSeconds >= 45; 

    onMarkAsRead(manga, chapter, isValidReading);
    
    if (!dropRolled.current) {
        dropRolled.current = true;
        if (Math.random() < 0.30) { triggerRandomDrop(); }
    }
  };

  useEffect(() => {
    if (readMode === 'Páginas' && pages.length > 0) {
      handlePageInView(currentPage);
      if (currentPage === pages.length - 1) handleReachEnd();
    }
  }, [currentPage, readMode, pages.length]);

  const endRef = useRef(null);
  useEffect(() => {
    if (readMode !== 'Cascata' || pages.length === 0) return;
    const imgObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) handlePageInView(Number(entry.target.getAttribute('data-index'))); });
    }, { threshold: 0.3 }); 

    const imgs = document.querySelectorAll('.cascata-page');
    imgs.forEach(img => imgObs.observe(img));

    const endObs = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) handleReachEnd(); }, { threshold: 0.1 });
    if (endRef.current) endObs.observe(endRef.current);

    return () => { endObs.disconnect(); imgObs.disconnect(); };
  }, [readMode, pages, chapter]);

  const isFavorite = libraryData && libraryData[manga.id] === 'Favoritos';

  return (
    <div className="min-h-screen bg-[#030407] relative animate-in fade-in duration-300">
      
      {showChapterList && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-300" onClick={() => setShowChapterList(false)}>
          <div className="pt-10 pb-3 px-5 flex justify-between items-center border-b border-white/10" onClick={e=>e.stopPropagation()}>
            <h3 className="font-black text-white text-lg">Capítulos</h3>
            <button onClick={() => setShowChapterList(false)} className="p-1.5 rounded-md text-gray-400/60 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
          </div>
          <div className="py-2 flex justify-center border-b border-white/5" onClick={e=>e.stopPropagation()}>
             <button onClick={() => setDrawerSort(p => p === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-1.5 text-gray-400/60 hover:text-white text-xs font-bold transition-colors">
               <ArrowDownUp className="w-3.5 h-3.5" /> {drawerSort === 'desc' ? 'Decrescente' : 'Crescente'}
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-2 content-start" onClick={e=>e.stopPropagation()}>
            {drawerChapters.map(c => (
              <button key={c.id} onClick={() => { setShowChapterList(false); onChapterClick(manga, c); }} className={`p-2.5 rounded-md font-bold transition-colors text-center text-[10px] duration-300 ${c.id === chapter.id ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white' : 'bg-[#0d0d12] text-gray-400/60 hover:bg-white/5 border border-white/10'}`}>
                Cap. {c.number}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className={`fixed top-3 left-3 z-50 transition-transform duration-300 ease-out ${showUI ? 'translate-y-0' : '-translate-y-24'}`}>
        <div className="flex items-center gap-2 bg-[#050508]/80 backdrop-blur-xl border border-white/10 p-1.5 pr-3 rounded-md shadow-md">
            <button onClick={onBack} className="bg-[#0d0d12] hover:bg-fuchsia-600 text-gray-400/60 hover:text-white p-1.5 rounded transition-colors duration-300" title="Voltar">
               <ChevronLeft className="w-4 h-4"/>
            </button>
            <span className="text-white font-black text-[10px]">Cap. {chapter.number}</span>
        </div>
      </div>

      <div className={`fixed top-3 right-3 z-50 transition-transform duration-300 ease-out delay-75 ${showUI ? 'translate-y-0' : '-translate-y-24'}`}>
        <button onClick={(e) => { e.stopPropagation(); if(onToggleLibrary) onToggleLibrary(manga.id, isFavorite ? 'Remover' : 'Favoritos'); }} className={`bg-[#050508]/80 backdrop-blur-xl border border-white/10 p-2 rounded-md transition-colors duration-300 shadow-md ${isFavorite ? 'text-yellow-500 hover:bg-[#0d0d12]' : 'text-gray-400/60 hover:text-white hover:bg-[#0d0d12]'}`}>
            <BookmarkPlus className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-transform duration-300 ease-out ${showUI ? 'translate-y-0' : 'translate-y-32'}`}>
        <div className="flex items-center gap-1 bg-[#050508]/90 backdrop-blur-2xl border border-cyan-500/30 p-1 rounded-md shadow-md">
            <button onClick={() => { if(prevChapter) onChapterClick(manga, prevChapter); }} disabled={!prevChapter} className="p-2 text-gray-400/60 hover:text-white hover:bg-white/5 rounded disabled:opacity-30 transition-colors duration-300">
                <ChevronLeft className="w-4 h-4"/>
            </button>

            <button onClick={() => setShowChapterList(true)} className="p-2 text-fuchsia-400 hover:text-cyan-400 hover:bg-white/5 rounded transition-colors duration-300 flex items-center gap-1.5 px-3 font-black text-[10px] border-l border-r border-white/10">
                <List className="w-3.5 h-3.5"/> Capítulos
            </button>

            <button onClick={() => setZoom(z => z === 100 ? 75 : z === 75 ? 50 : 100)} className="hidden sm:flex p-2 text-gray-400/60 hover:text-white hover:bg-white/5 rounded transition-colors duration-300 border-r border-white/10">
                {zoom === 100 ? <ZoomOut className="w-4 h-4"/> : <ZoomIn className="w-4 h-4"/>}
            </button>

            <button onClick={() => { if(nextChapter) onChapterClick(manga, nextChapter); }} disabled={!nextChapter} className="p-2 text-gray-400/60 hover:text-white hover:bg-white/5 rounded disabled:opacity-30 transition-colors duration-300">
                <ChevronRight className="w-4 h-4"/>
            </button>
        </div>
      </div>

      {/* ÁREA DE LEITURA */}
      <div className="w-full min-h-screen flex flex-col items-center select-none bg-[#030407]" onClick={() => setShowUI(!showUI)}>
        <div className="w-full h-8"></div>

        {pages.length === 0 ? (
          <div className="py-32 text-gray-400/60 font-bold text-sm flex items-center justify-center h-[calc(100vh-2rem)]">Sem imagens neste capítulo.</div>
        ) : readMode === 'Cascata' ? (
          <div className="w-full flex flex-col items-center bg-[#030407] mx-auto pb-8">
             {pages.map((pageUrl, index) => (
               <img key={index} data-index={index} src={pageUrl} className="h-auto cascata-page transition-all duration-300 ease-out mx-auto" style={{ width: `${zoom}%`, maxWidth: '1000px' }} loading="lazy" />
             ))}
             <div ref={endRef} className="w-full h-10"></div>
          </div>
        ) : (
          <div className="relative w-full h-[calc(100vh-2rem)] flex flex-col items-center justify-center overflow-hidden">
            <img src={pages[currentPage]} className="h-full object-contain animate-in fade-in duration-300 mx-auto" style={{ width: `${zoom}%` }} alt="Página" />
            <div className="absolute top-0 left-0 w-1/3 h-full cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }} />
            <div className="absolute top-0 right-0 w-1/3 h-full cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(pages.length - 1, p + 1)); }} />
            {!showUI && (
              <div className="fixed bottom-5 bg-[#050508]/80 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 animate-in slide-in-from-bottom-10 pointer-events-none shadow-md">
                 <span className="text-white text-[9px] font-black tracking-widest">{currentPage + 1} / {pages.length}</span>
              </div>
            )}
          </div>
        )}

        {(readMode === 'Cascata' || currentPage === pages.length - 1) && pages.length > 0 && (
          <div className="w-full max-w-2xl mx-auto pt-6 pb-20 px-4 flex flex-col items-center" onClick={e=>e.stopPropagation()}>
             <div className="w-full max-w-sm bg-[#050508]/80 border border-white/10 rounded-lg p-1.5 flex gap-1.5 mb-10 shadow-inner">
                <button onClick={(e) => { e.stopPropagation(); if(prevChapter) onChapterClick(manga, prevChapter); }} disabled={!prevChapter} className="flex-1 flex items-center justify-center gap-1.5 bg-[#0d0d12] text-gray-400/60 py-2.5 rounded-md font-bold transition-colors duration-300 disabled:opacity-30 hover:bg-white/5 hover:text-white border border-white/10 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5"/> Anterior
                </button>
                <button onClick={(e) => { e.stopPropagation(); if(nextChapter) onChapterClick(manga, nextChapter); }} disabled={!nextChapter} className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white py-2.5 rounded-md font-black transition-all duration-300 shadow-md hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100 text-xs">
                    Próximo <ChevronRight className="w-3.5 h-3.5"/>
                </button>
             </div>
             <div className="w-full" onClick={e=>e.stopPropagation()}>
               <CommentsSection mangaId={manga.id} chapterId={chapter.id} user={user} userProfileData={userProfileData} onRequireLogin={onRequireLogin} showToast={showToast} />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MangaInfinityApp />
    </ErrorBoundary>
  );
}