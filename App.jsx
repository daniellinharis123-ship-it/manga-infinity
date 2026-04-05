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
  ZoomIn, ZoomOut
} from 'lucide-react';

// --- INJEÇÃO DO VISUAL (TAILWIND) PARA FUNCIONAR NO CELULAR ---
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

const SHOP_ITEMS = [
  { id: 'frame_neon', name: 'Aura Neon', type: 'frame', price: 500, css: 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]' },
  { id: 'frame_fire', name: 'Chama Infernal', type: 'frame', price: 1000, css: 'ring-4 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.9)]' },
  { id: 'frame_gold', name: 'Rei de Ouro', type: 'frame', price: 2500, css: 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.9)]' },
  { id: 'frame_void', name: 'Vazio Abissal', type: 'frame', price: 5000, css: 'ring-4 ring-black shadow-[0_0_30px_rgba(255,255,255,0.3)]' },
  { id: 'cover_galaxy', name: 'Galáxia', type: 'cover', price: 1500, url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=800' },
  { id: 'cover_cyber', name: 'Cyberpunk', type: 'cover', price: 2000, url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=800' },
  { id: 'cover_dragon', name: 'Covil do Dragão', type: 'cover', price: 3000, url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=800' },
  { id: 'cover_solo', name: 'Trono do Monarca', type: 'cover', price: 5000, url: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&q=80&w=800' }
];

const ENIGMAS_FALLBACK = [
    { q: "Qual o nome do pirata que estica e quer ser o Rei dos Piratas?", a: ["luffy", "monkey d. luffy"] },
    { q: "Adivinhe a obra: A humanidade vive presa dentro de muralhas gigantes.", a: ["shingeki no kyojin", "attack on titan"] },
    { q: "Qual a regra suprema da Alquimia em Fullmetal Alchemist?", a: ["transmutacao humana", "transmutação humana"] }
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

const translateToPtBr = async (text) => {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        let translatedText = '';
        for (let i = 0; i < data[0].length; i++) {
            if (data[0][i][0]) translatedText += data[0][i][0];
        }
        return translatedText;
    } catch (error) { return text; }
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

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="min-h-screen bg-gray-950 text-red-500 p-10 flex flex-col items-center justify-center font-sans"><ShieldAlert className="w-16 h-16 mb-4"/><h1 className="text-2xl font-black">Erro Crítico no Sistema</h1><p className="mt-2 text-red-400">{this.state.error.toString()}</p><button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Reiniciar Sistema</button></div>;
    return this.props.children;
  }
}

function GlobalToast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';
  
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] px-6 py-4 rounded-full font-black text-sm border flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 w-max max-w-[90vw] backdrop-blur-xl shadow-2xl ${isError ? 'bg-red-950/95 text-red-300 border-red-500/50 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.8)]' : isWarning ? 'bg-yellow-950/95 text-yellow-300 border-yellow-500/50 shadow-[0_10px_40px_-10px_rgba(234,179,8,0.8)]' : isSuccess ? 'bg-green-950/95 text-green-300 border-green-500/50 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.8)]' : 'bg-gray-900/95 text-white border-purple-500/50 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.8)]'}`}>
      {isError && <AlertCircle className="w-5 h-5"/>}
      {isSuccess && <CheckCircle className="w-5 h-5"/>}
      {isWarning && <ShieldAlert className="w-5 h-5"/>}
      {!isError && !isSuccess && !isWarning && <Zap className="w-5 h-5 text-purple-400 animate-pulse"/>}
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
    <div className="bg-gray-900/40 border border-gray-800/60 rounded-[2.5rem] p-6 md:p-10 shadow-lg w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 className="text-3xl font-black flex items-center gap-3 text-white"><MessageSquare className="w-8 h-8 text-purple-500"/> Comentários <span className="text-gray-500 text-xl">({comments.length})</span></h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 w-full sm:w-auto">
            <button onClick={() => setSortOrder('desc')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortOrder === 'desc' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Recentes</button>
            <button onClick={() => setSortOrder('asc')} className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortOrder === 'asc' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Antigos</button>
          </div>
          <button onClick={()=>setShowComments(!showComments)} className="bg-gray-950 border border-gray-800 text-gray-400 hover:text-white rounded-xl px-5 py-2 transition-colors flex items-center gap-2 font-bold w-full sm:w-auto justify-center text-sm">
             {showComments ? <><EyeOff className="w-4 h-4"/> Ocultar</> : <><Eye className="w-4 h-4"/> Mostrar</>}
          </button>
        </div>
      </div>

      {showComments && (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-gray-800 overflow-hidden bg-gray-950 flex-shrink-0 shadow-inner">
               {(userProfileData?.avatarUrl || user?.photoURL) ? <img src={userProfileData.avatarUrl || user.photoURL} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-600 bg-gray-800 p-2" />}
            </div>
            <form onSubmit={handlePostComment} className="flex-1 relative">
              <textarea value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder={user ? "Deixe o seu comentário..." : "Faça login para interagir."} disabled={!user || submittingComment} className="w-full bg-gray-950 border border-gray-800 rounded-3xl px-5 py-4 pr-16 text-white font-medium outline-none focus:border-purple-500 transition-colors resize-none disabled:opacity-50 shadow-inner" rows="3" />
              <button type="submit" disabled={!user || submittingComment || !newComment.trim()} className="absolute right-3 bottom-4 p-3 bg-purple-600 text-white rounded-2xl disabled:bg-gray-800 disabled:text-gray-600 transition-colors hover:bg-purple-500 shadow-md">
                 {submittingComment ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
              </button>
            </form>
          </div>

          <div className="space-y-4 mt-8 pt-6 border-t border-gray-800">
            {sortedComments.length === 0 ? (
              <div className="py-10 text-center"><MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3"/><p className="text-gray-500 font-bold">Seja o primeiro a deixar a sua marca aqui!</p></div>
            ) : (
              sortedComments.map(comment => (
                <div key={comment.id} className="flex gap-4 p-5 rounded-2xl bg-gray-950/50 hover:bg-gray-900 transition-colors border border-transparent hover:border-gray-800">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-gray-800 overflow-hidden bg-gray-950 flex-shrink-0">
                     {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-600 bg-gray-800 p-2" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-black text-white text-sm md:text-base">{comment.userName}</span>
                      <span className="text-[10px] md:text-xs font-bold text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{comment.text}</p>
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
  const [isRandomizing, setIsRandomizing] = useState(false); 
  const [showMobileSearch, setShowMobileSearch] = useState(false); 
  
  const [selectedManga, setSelectedManga] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [globalSearch, setGlobalSearch] = useState(''); 
  
  const [mangas, setMangas] = useState([]);
  const [loadingMangas, setLoadingMangas] = useState(true);

  const [user, setUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeMission: null, completedMissions: [] });
  const [userSettings, setUserSettings] = useState({ readMode: 'Cascata', dataSaver: false, theme: 'Escuro' });
  const [libraryData, setLibraryData] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false); 

  useEffect(() => {
    const timer = setTimeout(() => setSplashTimerDone(true), 3500); 
    return () => clearTimeout(timer);
  }, []);

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
            const dateStr = cData.createdAt ? new Date(cData.createdAt).toLocaleDateString('pt-BR') : 'Hoje';
            chapters.push({ id: c.id, ...cData, date: dateStr });
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
        setUserProfileData({ xp: 0, level: 1, coins: 0, crystals: 0, inventory: [], activeFrame: '', activeCover: '', activeMission: null, completedMissions: [] }); setLibraryData({}); setHistoryData([]); setDataLoaded(true);
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
         let { newXp, newLvl } = calculatePenalty(userProfileData.xp || 0, userProfileData.level || 1, mission.penaltyXp);
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
      showToast("Nenhuma obra disponível no catálogo.", "error");
      return;
    }
    setIsRandomizing(true);
    setTimeout(() => {
      const random = mangas[Math.floor(Math.random() * mangas.length)];
      navigateTo('details', random);
      setIsRandomizing(false);
    }, 1500); 
  };

  const triggerRandomDrop = async () => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
    try {
      await updateDoc(profileRef, { crystals: increment(1) });
      showToast("+1 Núcleo de Energia Encontrado!", "info");
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
             showToast("⚠️ Anti-Burla: Tempo insuficiente (Mín. 45s). Progresso anulado.", "warning");
             return; 
         }

         const m = userProfileData.activeMission;
         const newCount = m.currentCount + 1;
         const profileRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main');
         
         if (newCount >= m.targetCount) {
             let newXp = (userProfileData.xp || 0) + m.rewardXp;
             let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
             let newLvl = userProfileData.level || 1;
             let didLevelUp = false;

             while (newXp >= newLvl * 100) {
                newXp -= newLvl * 100;
                newLvl++;
                didLevelUp = true;
             }
             
             let currentCompleted = userProfileData.completedMissions || [];
             if (!currentCompleted.includes(m.targetManga)) currentCompleted = [...currentCompleted, m.targetManga];

             await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
             showToast(`Missão Concluída! +${m.rewardXp} XP | +${m.rewardCoins} Moedas`, "success");
             
             if(didLevelUp) handleLevelUpAnim(newLvl);

         } else {
             await updateDoc(profileRef, { 'activeMission.currentCount': newCount });
             showToast(`Progresso de Missão: ${newCount}/${m.targetCount}`, "info");
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
    if ((userProfileData.coins || 0) < item.price) {
      showToast("Moedas Infinity Insuficientes!", "error");
      return;
    }
    const newCoins = userProfileData.coins - item.price;
    const newInv = [...(userProfileData.inventory || []), item.id];
    await updateDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'main'), { coins: newCoins, inventory: newInv });
    showToast(`Item "${item.name}" adquirido com sucesso!`, "success");
  };

  const equipItem = async (item) => {
    const updates = {};
    if (item.type === 'frame') updates.activeFrame = item.css;
    if (item.type === 'cover') updates.activeCover = item.url;
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
    
    let newXp = (userProfileData.xp || 0) + wonXp;
    let newLvl = userProfileData.level || 1;
    let didLevelUp = false;
    
    while (newXp >= newLvl * 100) {
       newXp -= newLvl * 100;
       newLvl++;
       didLevelUp = true;
    }

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
    <div className={`min-h-screen font-sans selection:bg-purple-600 selection:text-white flex flex-col transition-colors duration-300 ${userSettings.theme === 'Claro' ? 'light-theme' : 'bg-gray-950 text-gray-100'}`}>
      <style>{`
        .light-theme { background-color: #f3f4f6 !important; color: #111827 !important; }
        .light-theme .bg-gray-950 { background-color: #ffffff !important; }
        .light-theme .bg-gray-950\\/80 { background-color: rgba(255,255,255,0.9) !important; }
        .light-theme .bg-gray-900 { background-color: #f9fafb !important; border-color: #e5e7eb !important; }
        .light-theme .bg-gray-900\\/30, .light-theme .bg-gray-900\\/40, .light-theme .bg-gray-900\\/50 { background-color: rgba(243,244,246,0.7) !important; }
        .light-theme .bg-gray-800 { background-color: #e5e7eb !important; border-color: #d1d5db !important; }
        .light-theme .text-white { color: #111827 !important; }
        .light-theme .text-gray-200 { color: #1f2937 !important; }
        .light-theme .text-gray-300 { color: #374151 !important; }
        .light-theme .text-gray-400 { color: #4b5563 !important; }
        .light-theme .text-gray-500 { color: #6b7280 !important; }
        .light-theme .border-gray-800 { border-color: #e5e7eb !important; }
        .light-theme .border-gray-800\\/50, .light-theme .border-gray-800\\/60 { border-color: #e5e7eb !important; }
        .light-theme input, .light-theme textarea, .light-theme select { background-color: #ffffff !important; color: #111827 !important; border-color: #d1d5db !important; }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #a855f7; cursor: pointer; box-shadow: 0 0 15px rgba(168, 85, 247, 0.9); border: 2px solid white;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {levelUpAlert && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[99999] bg-gray-900/95 backdrop-blur-xl border border-purple-500/50 shadow-[0_10px_40px_-10px_rgba(168,85,247,0.8)] text-white px-6 py-4 rounded-2xl font-black text-lg flex items-center gap-4 animate-in slide-in-from-top-10 fade-in zoom-in duration-300 pointer-events-none">
             <div className="bg-purple-500/20 p-2.5 rounded-full shadow-inner">
                 <Trophy className="w-6 h-6 text-yellow-500" />
             </div>
             <div className="flex flex-col">
                 <span className="text-[10px] text-purple-400 uppercase tracking-widest">Subiu de Nível!</span>
                 <span className="text-xl font-black">Nível {levelUpAlert} Alcançado</span>
             </div>
             <PartyPopper className="w-6 h-6 text-purple-400 animate-bounce ml-2" />
          </div>
      )}

      {isRandomizing && (
        <div className="fixed inset-0 z-[2000] bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="relative">
             <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-50 rounded-full animate-pulse"></div>
             <Dices className="w-32 h-32 text-purple-500 animate-[spin_0.3s_linear_infinite] drop-shadow-[0_0_30px_rgba(168,85,247,1)] relative z-10" />
           </div>
           <h2 className="mt-10 text-3xl font-black text-white tracking-[0.4em] animate-pulse">SORTEANDO</h2>
        </div>
      )}

      <GlobalToast toast={globalToast} />

      {currentView !== 'reader' && (
        <nav className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 shadow-lg relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform"><InfinityIcon className="w-6 h-6 text-white" /></div>
                <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300 hidden sm:block">INFINITY</span>
              </div>
              
              <div className="hidden md:block flex-1 max-w-lg mx-8 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" /></div>
                <input type="text" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} onKeyDown={handleSearchSubmit} className="w-full pl-11 pr-4 py-2.5 border border-gray-800 rounded-2xl bg-gray-900/50 text-gray-200 outline-none focus:border-purple-500 transition-all" placeholder="Pesquisar a obra e teclar Enter..." />
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-1 md:gap-3 border-r border-gray-800 pr-4 md:pr-6">
                  <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 text-gray-400 hover:text-purple-400 transition-colors" title="Pesquisar">
                    {showMobileSearch ? <X className="w-5 h-5"/> : <Search className="w-5 h-5" />}
                  </button>

                  <button onClick={handleRandomManga} className="p-2 text-gray-400 hover:text-purple-400 transition-colors group relative" title="Obra Aleatória">
                    <Dices className="w-5 h-5 md:w-6 md:h-6 group-hover:animate-bounce drop-shadow-md" />
                  </button>
                  <button onClick={() => showToast("O Sistema não possui novas mensagens no momento.", "info")} className="relative p-2 text-gray-400 hover:text-purple-400 transition-colors">
                    <Bell className="w-5 h-5 md:w-6 md:h-6"/>
                    <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse border-2 border-gray-950"></span>
                  </button>
                </div>

                <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-400">
                  <button onClick={() => navigateTo('home')} className={`hover:text-purple-400 transition-colors ${currentView === 'home' ? 'text-purple-400' : ''}`}>Início</button>
                  <button onClick={() => navigateTo('catalog')} className={`hover:text-purple-400 transition-colors ${currentView === 'catalog' ? 'text-purple-400' : ''}`}>Catálogo</button>
                  <button onClick={() => user ? navigateTo('missions') : navigateTo('login')} className={`hover:text-purple-400 transition-colors flex items-center gap-1 ${currentView === 'missions' ? 'text-purple-400' : ''}`}><Target className="w-4 h-4"/> Missões</button>
                  <button onClick={() => user ? navigateTo('library') : navigateTo('login')} className={`hover:text-purple-400 transition-colors ${currentView === 'library' ? 'text-purple-400' : ''}`}>Biblioteca</button>
                </div>
                {user ? (
                  <div className="cursor-pointer flex items-center gap-3" onClick={() => navigateTo('profile')}>
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-sm font-bold text-gray-200">{user.displayName || "Leitor"}</span>
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Nível {userProfileData.level || 1}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-gray-700 ${userProfileData.activeFrame || ''}`}>
                      {userProfileData.avatarUrl || user.photoURL ? <img src={userProfileData.avatarUrl || user.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => navigateTo('login')} className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-full hover:bg-purple-500 transition-colors shadow-lg hover:scale-105">Entrar</button>
                )}
              </div>
            </div>
          </div>
          
          {showMobileSearch && (
            <div className="absolute top-full left-0 w-full bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 p-4 shadow-xl md:hidden animate-in slide-in-from-top-2 z-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} onKeyDown={(e) => { handleSearchSubmit(e); if(e.key === 'Enter') setShowMobileSearch(false); }} className="w-full pl-11 pr-4 py-3 border border-gray-800 rounded-xl bg-gray-900 text-gray-200 outline-none focus:border-purple-500" placeholder="Pesquisar a obra..." autoFocus />
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
        {currentView === 'missions' && user && <MissionsView user={user} userProfileData={userProfileData} showToast={showToast} mangas={mangas} db={db} appId={APP_ID} onNavigate={navigateTo} onLevelUp={handleLevelUpAnim} />}
        {currentView === 'profile' && user && <ProfileView user={user} userProfileData={userProfileData} historyData={historyData} libraryData={libraryData} dataLoaded={dataLoaded} userSettings={userSettings} updateSettings={updateSettings} synthesizeCrystal={synthesizeCrystal} buyItem={buyItem} equipItem={equipItem} onLogout={handleLogout} onUpdateData={(n) => setUserProfileData({...userProfileData, ...n})} showToast={showToast} />}
        {currentView === 'details' && selectedManga && <DetailsView manga={selectedManga} libraryData={libraryData} historyData={historyData} user={user} userProfileData={userProfileData} onBack={() => navigateTo('home')} onChapterClick={(m, c) => navigateTo('reader', m, c)} onRequireLogin={() => navigateTo('login')} showToast={showToast} />}
        {currentView === 'reader' && selectedManga && selectedChapter && <ReaderView manga={selectedManga} chapter={selectedChapter} user={user} userProfileData={userProfileData} onBack={() => navigateTo('details', selectedManga)} onChapterClick={(m, c) => navigateTo('reader', m, c)} triggerRandomDrop={triggerRandomDrop} onMarkAsRead={markAsRead} readMode={userSettings.readMode} onRequireLogin={() => navigateTo('login')} showToast={showToast} libraryData={libraryData} onToggleLibrary={handleLibraryToggle} />}
      </main>

      {/* BOTTOM NAV ATUALIZADA COM ABA MISSÕES */}
      {currentView !== 'reader' && (
        <div className="md:hidden fixed bottom-0 w-full bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-gray-800/80 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center h-[70px] px-4">
            <button onClick={() => navigateTo('home')} className={`flex flex-col items-center gap-1 w-12 transition-colors ${currentView === 'home' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}><HomeIcon className="w-6 h-6" /><span className="text-[9px] font-bold">Início</span></button>
            <button onClick={() => navigateTo('catalog')} className={`flex flex-col items-center gap-1 w-12 transition-colors ${currentView === 'catalog' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}><LayoutGrid className="w-6 h-6" /><span className="text-[9px] font-bold">Catálogo</span></button>
            <button onClick={() => user ? navigateTo('missions') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-12 transition-colors relative ${currentView === 'missions' ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {currentView === 'missions' && <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>}
                <Target className="w-6 h-6 relative z-10" /><span className="text-[9px] font-bold relative z-10">Missões</span>
            </button>
            <button onClick={() => user ? navigateTo('library') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-12 transition-colors ${currentView === 'library' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}><Library className="w-6 h-6" /><span className="text-[9px] font-bold">Biblioteca</span></button>
            <button onClick={() => user ? navigateTo('profile') : navigateTo('login')} className={`flex flex-col items-center gap-1 w-12 transition-colors ${currentView === 'profile' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}><UserCircle className="w-6 h-6" /><span className="text-[9px] font-bold">Perfil</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[600] bg-[#050505] flex flex-col items-center justify-center overflow-hidden font-sans">
      <style>{`
        @keyframes rotate-3d-1 { 0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateX(60deg) rotateY(360deg) rotateZ(360deg); } }
        @keyframes rotate-3d-2 { 0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(0deg); } 100% { transform: rotateX(60deg) rotateY(-360deg) rotateZ(360deg); } }
        @keyframes pulse-core { 0%, 100% { filter: drop-shadow(0 0 20px rgba(168,85,247,0.5)) scale(1); opacity: 0.8; } 50% { filter: drop-shadow(0 0 50px rgba(168,85,247,1)) scale(1.1); opacity: 1; } }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: '1000px' }}>
        <div className="absolute w-[20rem] h-[20rem] border border-purple-500/30 rounded-full animate-[rotate-3d-1_8s_linear_infinite]" style={{ transformStyle: 'preserve-3d' }}></div>
        <div className="absolute w-[25rem] h-[25rem] border-2 border-indigo-500/20 rounded-full animate-[rotate-3d-2_12s_linear_infinite]" style={{ transformStyle: 'preserve-3d' }}></div>
        <div className="absolute w-32 h-32 bg-purple-600/20 rounded-full blur-[40px] animate-pulse"></div>
      </div>
      <div className="relative z-10 flex flex-col items-center" style={{ animation: 'fade-in-up 1s ease-out forwards' }}>
        <div className="mb-6 relative">
           <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
           <InfinityIcon className="w-24 h-24 text-purple-400 animate-[pulse-core_3s_ease-in-out_infinite] relative z-10" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-[0.3em] ml-[0.3em]">MANGA</h1>
        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 tracking-[0.5em] ml-[0.5em] mt-2">INFINITY</h2>
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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
         <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      <div className="bg-gray-900/80 backdrop-blur-2xl border border-gray-800 w-full max-w-md rounded-[3rem] shadow-[0_0_50px_-10px_rgba(168,85,247,0.3)] p-10 z-10 relative animate-in slide-in-from-bottom-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gray-950 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-800"><BookOpen className="w-10 h-10 text-purple-500" /></div>
          <h2 className="text-3xl font-black text-white">{isLogin ? 'Bem-vindo de volta' : 'Despertar'}</h2>
          <p className="text-gray-400 mt-2 text-sm font-medium">Faça login para favoritar e guardar o seu progresso.</p>
        </div>
        
        {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm font-bold border border-red-500/20 text-center animate-in zoom-in-95">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Seu Apelido" className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500 transition-colors font-medium" required />}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500 transition-colors font-medium" required />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha (Mín. 6 caracteres)" className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500 transition-colors font-medium" required />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-2xl mt-4 flex justify-center items-center gap-2 transition-all shadow-[0_10px_30px_-10px_rgba(168,85,247,0.5)] disabled:opacity-70 hover:scale-[1.02]">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Acessar Infinity' : 'Criar Conta')}
          </button>
        </form>
        <div className="mt-8 flex flex-col gap-4 text-center">
          <p className="text-gray-400 text-sm font-medium">
            {isLogin ? "Ainda não possui conta? " : "Já possui conta? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-purple-400 font-black hover:text-purple-300">{isLogin ? 'Cadastrar de Graça' : 'Fazer login'}</button>
          </p>
          <div className="w-full h-px bg-gray-800 my-2"></div>
          <button onClick={onGuestAccess} className="text-gray-500 font-bold hover:text-white transition-colors text-sm">Explorar sem login (Visitante)</button>
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
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><Search className="w-8 h-8 text-purple-500" /> Resultados para "{query}"</h2>
      <p className="text-gray-400 mb-8">{results.length} obras encontradas</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {results.map(manga => (
          <div key={manga.id} className="cursor-pointer group" onClick={() => onNavigate('details', manga)}>
            <div className={`aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 mb-2 ${dataSaver ? 'blur-[2px]' : ''}`}><img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
            <h3 className="font-bold text-sm text-gray-200 line-clamp-1">{manga.title}</h3>
            {manga.ratingCount > 0 ? (
                <p className="text-xs text-yellow-500 font-bold"><Star className="w-3 h-3 inline" /> {Number(manga.rating).toFixed(1)}</p>
            ) : (
                <p className="text-xs text-gray-500 font-medium">Sem avaliação</p>
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

  if (mangas.length === 0) return <div className="text-center py-32 text-gray-500"><BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-800"/>Nenhuma obra cadastrada. Acesse o Painel Admin para enviar obras.</div>;

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
    <div className="animate-in fade-in duration-500">
      
      {/* CARROSSEL COMPACTADO ESTILO PREMIUM */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
        <div className="relative w-full h-[40vh] md:h-[50vh] bg-gray-900 cursor-pointer group rounded-3xl overflow-hidden shadow-2xl border border-gray-800" onClick={() => onNavigate('details', destaque)}>
          <img key={destaque.id} src={destaque.coverUrl} className={`absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out animate-in fade-in ${dataSaver ? 'blur-[4px]' : ''}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full max-w-4xl">
            <div className="flex gap-2 mb-3 animate-in slide-in-from-left-4">
              <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">{destaque.type}</span>
              {destaque.ratingCount > 0 && (
                  <span className="bg-yellow-500/90 text-black text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg"><Star className="w-3 h-3 fill-current" /> {Number(destaque.rating).toFixed(1)}</span>
              )}
            </div>
            <h1 key={`title-${destaque.id}`} className="text-2xl md:text-5xl font-black mb-3 text-white drop-shadow-lg animate-in slide-in-from-left-8 line-clamp-2">{destaque.title}</h1>
            <p key={`synopsis-${destaque.id}`} className="text-xs md:text-sm line-clamp-2 md:line-clamp-3 mb-5 max-w-xl font-medium text-gray-300 drop-shadow-md animate-in slide-in-from-left-10">{destaque.synopsis || "Sem sinopse disponível."}</p>
            <button className="bg-white text-black font-black px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 text-sm w-fit"><Play className="w-4 h-4 fill-current" /> Ler Agora</button>
          </div>

          <div className="absolute bottom-6 right-6 flex gap-2 z-10" onClick={e=>e.stopPropagation()}>
             {heroMangas.map((m, i) => (
               <button key={m.id} onClick={() => setHeroIndex(i)} className={`h-2 rounded-full transition-all duration-300 shadow-md ${heroIndex === i ? 'w-8 bg-purple-500' : 'w-2 bg-gray-500/50 hover:bg-gray-400'}`}></button>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
        <h2 className="text-2xl font-black flex items-center gap-3 mb-8"><Star className="w-8 h-8 text-yellow-500" /> Mais Populares</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {populares.map((manga) => (
            <div key={`pop-${manga.id}`} className="group cursor-pointer flex flex-col" onClick={() => onNavigate('details', manga)}>
              <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-gray-900 border border-gray-800 ${dataSaver ? 'blur-[1px]' : ''}`}>
                <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                {manga.ratingCount > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {Number(manga.rating).toFixed(1)}</div>
                )}
              </div>
              <h3 className="font-bold text-sm md:text-base text-gray-200 line-clamp-1 group-hover:text-purple-400">{manga.title}</h3>
            </div>
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3"><Clock className="w-8 h-8 text-purple-500" /> Lançamentos Recentes</h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 w-full sm:w-auto">
             {['Todos', 'Mangá', 'Manhwa', 'Manhua', 'Shoujo'].map(tab => (
               <button key={tab} onClick={() => {setRecentFilter(tab); setCurrentPage(1);}} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${recentFilter === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'}`}>{tab}</button>
             ))}
          </div>
        </div>

        {filteredRecents.length === 0 ? (
           <p className="text-gray-500 text-center py-10 font-bold border border-gray-800 border-dashed rounded-3xl">Nenhum lançamento encontrado para este filtro.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {currentMangas.map((manga) => (
              <div key={manga.id} className="group cursor-pointer flex flex-col" onClick={() => onNavigate('details', manga)}>
                <div className={`relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 bg-gray-900 border border-gray-800 ${dataSaver ? 'blur-[1px]' : ''}`}>
                  <img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-md">{manga.type}</div>
                  {/* Etiqueta de Estrela nas Capas */}
                  {manga.ratingCount > 0 && (
                      <div className="absolute bottom-2 left-2 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {Number(manga.rating).toFixed(1)}</div>
                  )}
                </div>
                <h3 className="font-bold text-sm md:text-base text-gray-200 line-clamp-1 group-hover:text-purple-400">{manga.title}</h3>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 rounded-xl bg-gray-900 text-white disabled:opacity-50 border border-gray-800 hover:border-purple-500 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-[200px] md:max-w-md">
              {Array.from({length: totalPages}).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-12 h-12 rounded-xl font-bold flex items-center justify-center transition-all flex-shrink-0 ${currentPage === i + 1 ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:border-purple-500'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 rounded-xl bg-gray-900 text-white disabled:opacity-50 border border-gray-800 hover:border-purple-500 transition-colors"><ChevronRight className="w-5 h-5"/></button>
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogView({ mangas, onNavigate, dataSaver }) {
  const [filterType, setFilterType] = useState("Todos");
  const [selectedGenres, setSelectedGenres] = useState([]);

  const toggleGenre = (genre) => setSelectedGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);

  const filteredMangas = mangas.filter(m => {
    if (filterType !== "Todos" && m.type !== filterType) return false;
    if (selectedGenres.length > 0 && (!m.genres || !selectedGenres.every(g => m.genres.includes(g)))) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <h3 className="font-bold text-gray-400 mb-3 text-sm uppercase">Origem</h3>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {TIPOS.map(tipo => <button key={tipo} onClick={() => setFilterType(tipo)} className={`whitespace-nowrap font-bold px-5 py-2.5 rounded-full transition-all ${filterType === tipo ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'}`}>{tipo}</button>)}
      </div>
      <h3 className="font-bold text-gray-400 mb-3 text-sm uppercase">Gêneros</h3>
      <div className="flex flex-wrap gap-2 mb-10 border-b border-gray-800 pb-8">
        {GENEROS.map(genre => <button key={genre} onClick={() => toggleGenre(genre)} className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${selectedGenres.includes(genre) ? 'bg-white text-black border-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}>{genre}</button>)}
      </div>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-black text-white">Resultados</h2><p className="text-gray-500 font-medium text-sm">{filteredMangas.length} obras</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredMangas.map(manga => (
          <div key={manga.id} className="cursor-pointer group" onClick={() => onNavigate('details', manga)}>
             <div className={`aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 mb-2 ${dataSaver ? 'blur-[1px]' : ''}`}><img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all" /></div>
             <h3 className="font-bold text-sm text-gray-200 line-clamp-1">{manga.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SISTEMA DE MISSÕES HÍBRIDO (OBRAS DO SITE + DICAS + MULTIVERSO API) ---
function MissionsView({ user, userProfileData, showToast, mangas, db, appId, onNavigate, onLevelUp }) {
    const [enigmaAnswer, setEnigmaAnswer] = useState("");
    const [timeLeft, setTimeLeft] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // TIMER LIVE FORMATADO
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

    // INTEGRAÇÃO API ANILIST COM TRADUÇÃO GOOGLE
    const fetchAniListEnigma = async (difficulty) => {
        const formats = ['MANGA', 'ANIME', 'NOVEL'];
        const type = formats[Math.floor(Math.random() * formats.length)];
        const page = Math.floor(Math.random() * 50) + 1; 

        const queryStr = `
        query ($page: Int, $type: MediaType) {
          Page(page: $page, perPage: 20) {
            media(type: $type, sort: POPULARITY_DESC) {
              title { romaji english }
              description(asHtml: false)
              characters(role: MAIN, perPage: 1) { nodes { name { full userPreferred } } }
            }
          }
        }
        `;

        try {
            const res = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryStr, variables: { page, type: type === 'NOVEL' ? 'MANGA' : type } })
            });
            const data = await res.json();
            const validMedia = data.data.Page.media.filter(m => m.title && m.description);
            if(validMedia.length === 0) return null;
            
            const media = validMedia[Math.floor(Math.random() * validMedia.length)];
            const titles = [media.title.romaji, media.title.english].filter(Boolean);
            const charName = media.characters?.nodes?.[0]?.name?.userPreferred || media.characters?.nodes?.[0]?.name?.full;

            let q = "";
            
            if (charName && Math.random() > 0.5) {
                q = `Qual famoso Anime/Mangá possui o personagem principal chamado "${charName}"?`;
            } else {
                let cleanDesc = media.description.replace(/<[^>]*>?/gm, '');
                let ptbrDesc = await translateToPtBr(cleanDesc);
                titles.forEach(t => { 
                    const regex = new RegExp(t, 'gi');
                    ptbrDesc = ptbrDesc.replace(regex, '___'); 
                });
                const snippetLength = difficulty.includes('S') ? 80 : (difficulty.includes('A') ? 120 : 200);
                q = `Adivinhe o Anime/Mangá famoso por esta sinopse: "${ptbrDesc.substring(0, snippetLength)}..."`;
            }

            return { q, a: titles.map(ans => ans.toLowerCase().trim()), isApi: true };
        } catch (e) {
            return null; 
        }
    };

    const generateMission = async (difficulty) => {
        if (isGenerating) return;
        setIsGenerating(true);
        
        const now = Date.now();
        let completed = userProfileData.completedMissions || [];
        
        let possibleTypes = [0, 1, 2];
        if (mangas.length === 0) possibleTypes = [2]; 
        
        const missionType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
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

        if (missionType === 2) {
            let enigmaData = await fetchAniListEnigma(difficulty);
            
            if (!enigmaData) {
                let availableEnigmas = ENIGMAS_FALLBACK.filter(item => !completed.includes(item.q));
                if (availableEnigmas.length === 0) { completed = []; availableEnigmas = ENIGMAS_FALLBACK; }
                enigmaData = availableEnigmas[Math.floor(Math.random() * availableEnigmas.length)];
            }

            newMission = {
                id: Date.now().toString(), type: 'enigma', difficulty: difficulty,
                title: "Enigma do Multiverso",
                question: enigmaData.q, answer: enigmaData.a, 
                attemptsLeft: conf.enigmaTries,
                rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin,
                deadline: now + (conf.enigmaTimeMin * 60 * 1000) 
            };
            completed.push(enigmaData.q); 
            
        } else if (missionType === 1) {
            let availableMangas = mangas.filter(item => !completed.includes("enigma_local_" + item.id));
            if (availableMangas.length === 0) {
                const localEnigmaIds = mangas.map(m => "enigma_local_" + m.id);
                completed = completed.filter(c => !localEnigmaIds.includes(c)); 
                availableMangas = mangas;
            }
            const randomManga = availableMangas[Math.floor(Math.random() * availableMangas.length)];
            
            let q = "";
            let a = [randomManga.title.toLowerCase().trim()];
            
            if (randomManga.synopsis && randomManga.synopsis.length > 50) {
                let cleanDesc = randomManga.synopsis.replace(/<[^>]*>?/gm, '');
                const regex = new RegExp(randomManga.title, 'gi');
                cleanDesc = cleanDesc.replace(regex, '___');
                const snippetLength = difficulty.includes('S') ? 80 : (difficulty.includes('A') ? 120 : 180);
                q = `Adivinhe qual obra do NOSSO SITE possui esta sinopse: "${cleanDesc.substring(0, snippetLength)}..."?`;
            } else if (randomManga.author) {
                 q = `Adivinhe qual obra do NOSSO SITE foi escrita por "${randomManga.author}"?`;
            } else {
                 q = `Prove sua lealdade: Digite exatamente o nome desta obra do nosso site -> ${randomManga.title}`; 
            }

            newMission = {
                id: Date.now().toString(), type: 'enigma', difficulty: difficulty,
                title: "Segredos do Catálogo",
                question: q, answer: a, 
                attemptsLeft: conf.enigmaTries,
                rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin,
                deadline: now + (conf.enigmaTimeMin * 60 * 1000) 
            };
            completed.push("enigma_local_" + randomManga.id);
            
        } else {
            let availableMangas = mangas.filter(item => !completed.includes("read_" + item.id));
            if (availableMangas.length === 0) {
                const readIds = mangas.map(m => "read_" + m.id);
                completed = completed.filter(c => !readIds.includes(c));
                availableMangas = mangas;
            }
            
            const randomManga = availableMangas[Math.floor(Math.random() * availableMangas.length)];
            const totalCaps = randomManga.chapters ? randomManga.chapters.length : 1;
            
            let readTarget = 1;
            if (difficulty === 'Rank E') readTarget = 1;
            else if (difficulty === 'Rank C') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 8) + 3); 
            else if (difficulty === 'Rank B') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 15) + 10); 
            else if (difficulty === 'Rank A') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 25) + 25); 
            else if (difficulty === 'Rank S') readTarget = Math.min(totalCaps, Math.floor(Math.random() * 50) + 50); 
            else if (difficulty === 'Rank SSS') readTarget = totalCaps; 
            
            newMission = {
                id: Date.now().toString(), type: 'read', difficulty: difficulty, 
                title: `Missão de Leitura`,
                targetManga: randomManga.id, targetCount: readTarget, currentCount: 0,
                rewardXp: conf.rxp, rewardCoins: conf.rcoin, penaltyXp: conf.pxp, penaltyCoins: conf.pcoin,
                deadline: now + (readTarget * conf.readTimePerCapMin * 60 * 1000)
            };
            completed.push("read_" + randomManga.id); 
        }
    
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { 
                activeMission: newMission,
                completedMissions: completed
            });
            showToast(`Contrato Assinado. Missão Gerada!`, "success");
        } catch(e) { 
            showToast("Erro ao assinar contrato do sistema.", "error"); 
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleEnigmaSubmit = async (e) => {
        e.preventDefault();
        const m = userProfileData.activeMission;
        if (!m || m.type !== 'enigma') return;
        if (!enigmaAnswer.trim()) return showToast("Silêncio não é uma resposta aceita.", "warning");
    
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        
        const userAnswer = enigmaAnswer.toLowerCase().trim();
        const isCorrect = m.answer.some(ans => {
            const correctAns = ans.toLowerCase().trim();
            return userAnswer === correctAns || (userAnswer.length >= 3 && (correctAns.includes(userAnswer) || userAnswer.includes(correctAns)));
        });
        
        if (isCorrect) {
           let newXp = (userProfileData.xp || 0) + m.rewardXp;
           let newCoins = (userProfileData.coins || 0) + m.rewardCoins;
           let newLvl = userProfileData.level || 1;
           let didLevelUp = false;

           while (newXp >= newLvl * 100) {
               newXp -= newLvl * 100;
               newLvl++;
               didLevelUp = true;
           }
           
           let currentCompleted = userProfileData.completedMissions || [];
           if (!currentCompleted.includes(m.question)) currentCompleted = [...currentCompleted, m.question];
           
           await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
           setEnigmaAnswer('');
           showToast(`Enigma Desvendado! Você recebeu ${m.rewardXp} XP e ${m.rewardCoins} Moedas.`, "success");
           
           if(didLevelUp) onLevelUp(newLvl); 

        } else {
           const attempts = m.attemptsLeft - 1;
           if (attempts <= 0) {
               let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
               let { newXp, newLvl } = calculatePenalty(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
               await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null });
               showToast(`Tentativas Esgotadas! O Sistema cobrou a penalidade.`, "error");
           } else {
               await updateDoc(profileRef, { 'activeMission.attemptsLeft': attempts });
               showToast(`Incorreto. Apenas ${attempts} tentativa(s) restante(s).`, "error");
           }
           setEnigmaAnswer('');
        }
    };
    
    const cancelMission = async () => {
        const m = userProfileData.activeMission;
        if(!m) return;
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        
        let newCoins = Math.max(0, (userProfileData.coins || 0) - m.penaltyCoins);
        let { newXp, newLvl } = calculatePenalty(userProfileData.xp || 0, userProfileData.level || 1, m.penaltyXp);
        
        let currentCompleted = userProfileData.completedMissions || [];
        const blockItem = m.type === 'enigma' ? m.question : "read_" + m.targetManga;
        if (!currentCompleted.includes(blockItem)) currentCompleted = [...currentCompleted, blockItem];

        await updateDoc(profileRef, { coins: newCoins, xp: newXp, level: newLvl, activeMission: null, completedMissions: currentCompleted });
        showToast(`Desistência punida: -${m.penaltyXp}XP | -${m.penaltyCoins} Moedas`, "error");
    };

    const RANK_CARDS = [
        { id: 'Rank E', color: 'text-blue-500', hover: 'hover:border-blue-500/50', btnHover: 'hover:bg-blue-600', btnText: 'text-blue-400 hover:text-white', border: 'hover:border-blue-500' },
        { id: 'Rank C', color: 'text-green-500', hover: 'hover:border-green-500/50', btnHover: 'hover:bg-green-600', btnText: 'text-green-400 hover:text-white', border: 'hover:border-green-500' },
        { id: 'Rank B', color: 'text-purple-500', hover: 'hover:border-purple-500/50', btnHover: 'hover:bg-purple-600', btnText: 'text-purple-400 hover:text-white', border: 'hover:border-purple-500' },
        { id: 'Rank A', color: 'text-fuchsia-500', hover: 'hover:border-fuchsia-500/50', btnHover: 'hover:bg-fuchsia-600', btnText: 'text-fuchsia-400 hover:text-white', border: 'hover:border-fuchsia-500' },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <Target className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">Quadro de Missões</h2>
                    <p className="text-gray-400 text-sm font-medium">Os contratos são aleatórios. Escolha o risco.</p>
                </div>
            </div>

            {userProfileData.activeMission ? (
                <div className="bg-[#0a0a0a] border border-indigo-500/40 p-5 md:p-6 rounded-3xl shadow-[0_0_40px_rgba(99,102,241,0.15)] relative mb-10 animate-in zoom-in-95">
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest border ${
                                userProfileData.activeMission.difficulty.includes('S') ? 'bg-red-950/80 text-red-500 border-red-500/50' : 
                                userProfileData.activeMission.difficulty === 'Rank A' || userProfileData.activeMission.difficulty === 'Rank B' ? 'bg-purple-950/80 text-purple-400 border-purple-500/50' :
                                'bg-blue-950/80 text-blue-400 border-blue-500/50'
                            }`}>
                                {userProfileData.activeMission.difficulty}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-black text-white mt-3 leading-tight">{userProfileData.activeMission.title}</h3>
                        </div>
                    </div>

                    <div className="relative z-10 mb-6">
                        {userProfileData.activeMission.type === 'enigma' ? (
                            <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 p-5 md:p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-sm">
                                <p className="text-lg md:text-xl font-medium text-white mb-6 leading-relaxed">
                                    "{userProfileData.activeMission.question}"
                                </p>

                                <form onSubmit={handleEnigmaSubmit} className="flex flex-col gap-4">
                                    <input 
                                      type="text" 
                                      value={enigmaAnswer} 
                                      onChange={e=>setEnigmaAnswer(e.target.value)} 
                                      placeholder="Digite a sua resposta aqui..." 
                                      className="w-full bg-gray-950 border border-gray-700/80 rounded-xl px-5 py-4 text-white outline-none focus:border-indigo-500 transition-all font-bold placeholder-gray-600 text-sm shadow-inner"
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button type="submit" className="flex-1 bg-indigo-600 text-white font-black px-6 py-4 rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                                           Confirmar <Check className="w-5 h-5"/>
                                        </button>
                                        <div className="bg-gray-900/80 px-6 py-4 rounded-xl border border-gray-700/80 text-sm font-bold text-gray-400 flex items-center justify-center gap-2">
                                            Tentativas: <span className={userProfileData.activeMission.attemptsLeft === 1 ? 'text-red-500 font-black text-xl' : 'text-white font-black text-xl'}>{userProfileData.activeMission.attemptsLeft}</span>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-blue-400"/> Progresso de Leitura</span>
                                    <span className="text-2xl font-black text-white">{userProfileData.activeMission.currentCount} <span className="text-gray-500 text-lg">/ {userProfileData.activeMission.targetCount}</span></span>
                                </div>
                                <div className="w-full bg-gray-950 rounded-full h-3 overflow-hidden border border-gray-800">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{width: `${(userProfileData.activeMission.currentCount / userProfileData.activeMission.targetCount) * 100}%`}}></div>
                                </div>
                                <p className="mt-4 text-sm text-gray-400 font-medium text-center">Para completar, leia <span className="font-bold text-white">{userProfileData.activeMission.targetCount}</span> capítulo(s).</p>
                                <button onClick={() => {
                                    const m = mangas.find(mg => mg.id === userProfileData.activeMission.targetManga);
                                    if(m) onNavigate('details', m);
                                }} className="mt-6 w-full bg-white text-black py-3 rounded-xl font-black transition-colors hover:bg-gray-200 flex justify-center items-center gap-2 text-sm">
                                    <BookOpen className="w-4 h-4"/> Acessar Obra Alvo
                                </button>
                            </div>
                        )}
                    </div>

                    {/* BLOCO DE PERDAS E TEMPO NA PARTE INFERIOR DA MISSÃO ATIVA */}
                    <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <div className="flex items-center gap-3 w-full justify-center md:justify-start">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Ganhos:</span>
                                <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-purple-400"/> <span className="font-black text-white text-sm">+{userProfileData.activeMission.rewardXp} XP</span></div>
                                <div className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-yellow-500"/> <span className="font-black text-white text-sm">+{userProfileData.activeMission.rewardCoins} M</span></div>
                            </div>
                            <div className="hidden md:block w-px h-5 bg-gray-700"></div>
                            <div className="flex items-center gap-3 w-full justify-center md:justify-end">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:block">Perdas:</span>
                                <div className="flex items-center gap-1.5"><Skull className="w-4 h-4 text-red-500"/> <span className="font-black text-red-400 text-sm">-{userProfileData.activeMission.penaltyXp} XP</span></div>
                                <div className="flex items-center gap-1.5"><Skull className="w-4 h-4 text-red-500"/> <span className="font-black text-red-400 text-sm">-{userProfileData.activeMission.penaltyCoins} M</span></div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-800 my-4"></div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Timer className="w-4 h-4 animate-pulse"/>
                                <span className="font-black text-sm tracking-wide">{timeLeft}</span>
                            </div>
                            <button onClick={cancelMission} className="text-xs font-bold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors border border-red-500/20">Cancelar Missão</button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'Rank E', color: 'text-blue-500', hover: 'hover:border-blue-500/50', btnHover: 'hover:bg-blue-600', btnText: 'text-blue-400 hover:text-white', border: 'hover:border-blue-500' },
                            { id: 'Rank C', color: 'text-green-500', hover: 'hover:border-green-500/50', btnHover: 'hover:bg-green-600', btnText: 'text-green-400 hover:text-white', border: 'hover:border-green-500' },
                            { id: 'Rank B', color: 'text-purple-500', hover: 'hover:border-purple-500/50', btnHover: 'hover:bg-purple-600', btnText: 'text-purple-400 hover:text-white', border: 'hover:border-purple-500' },
                            { id: 'Rank A', color: 'text-fuchsia-500', hover: 'hover:border-fuchsia-500/50', btnHover: 'hover:bg-fuchsia-600', btnText: 'text-fuchsia-400 hover:text-white', border: 'hover:border-fuchsia-500' },
                        ].map(rank => (
                            <div key={rank.id} className={`bg-gray-950 border border-gray-800 ${rank.hover} transition-colors p-6 rounded-3xl flex flex-col group`}>
                                <div className="flex justify-between items-start mb-4">
                                   <div className={`${rank.color} font-black text-2xl group-hover:scale-110 transition-transform origin-left`}>{rank.id}</div>
                                </div>
                                <button disabled={isGenerating} onClick={() => generateMission(rank.id)} className={`w-full bg-gray-900 ${rank.btnHover} ${rank.btnText} font-bold py-3 rounded-xl transition-colors border border-gray-800 ${rank.border} disabled:opacity-50`}>{isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Assinar Contrato Aleatório'}</button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0a0a0a] border border-orange-900/50 hover:border-orange-500 shadow-inner transition-colors p-6 rounded-3xl flex flex-col group mt-2">
                        <div className="flex justify-between items-start mb-4">
                           <div className="text-orange-500 font-black text-2xl group-hover:scale-110 transition-transform origin-left flex items-center gap-2">Rank S <Star className="w-5 h-5 fill-current"/></div>
                        </div>
                        <button disabled={isGenerating} onClick={() => generateMission('Rank S')} className="w-full md:w-1/3 bg-gray-900 hover:bg-orange-600 text-orange-400 hover:text-white font-bold py-4 rounded-xl transition-colors border border-orange-900 hover:border-orange-500 disabled:opacity-50">{isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Aceitar Missão S'}</button>
                    </div>

                    <div className="bg-[#050505] border border-red-900/80 hover:border-red-500 shadow-[inset_0_0_30px_rgba(239,68,68,0.1)] transition-colors p-8 rounded-3xl flex flex-col group mt-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-[50px] rounded-full"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                           <div className="text-red-500 font-black text-3xl group-hover:scale-110 transition-transform origin-left flex items-center gap-3">Rank SSS <Skull className="w-6 h-6"/></div>
                        </div>
                        <button disabled={isGenerating} onClick={() => generateMission('Rank SSS')} className="w-full md:w-1/3 bg-red-950 hover:bg-red-600 text-red-200 hover:text-white font-black py-4 rounded-2xl transition-colors border border-red-900 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.4)] relative z-10 disabled:opacity-50">{isGenerating ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : 'Desafiar o Sistema'}</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileView({ user, userProfileData, historyData, libraryData, dataLoaded, userSettings, updateSettings, synthesizeCrystal, buyItem, equipItem, onLogout, onUpdateData, showToast }) {
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
  const [synthesizing, setSynthesizing] = useState(false);

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
  const xpNeeded = level * 100;
  const progressPercent = Math.min(100, (currentXp / xpNeeded) * 100);

  const handleSynthesis = async () => {
    if ((userProfileData.crystals || 0) < 5) {
      showToast("Cristais insuficientes (Custa 5).", "error");
      return;
    }
    setSynthesizing(true);
    
    setTimeout(async () => {
      const res = await synthesizeCrystal();
      setSynthesizing(false);
      if (res && res.success) {
        showToast(`Síntese Concluída! +${res.wonCoins} Moedas | +${res.wonXp} XP`, 'success');
      } else {
        showToast(`Falha na Síntese! Os cristais foram destruídos.`, 'error');
      }
    }, 1500);
  };

  return (
    <div className="animate-in fade-in duration-500 w-full pb-20">
      <div className="h-48 md:h-80 w-full bg-gray-900 relative group border-b border-gray-800 overflow-hidden">
        {userProfileData.activeCover ? (
           <img src={userProfileData.activeCover} className="w-full h-full object-cover" />
        ) : coverBase64 ? (
           <img src={coverBase64} className="w-full h-full object-cover" />
        ) : (
           <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        {isEditing && <button onClick={() => coverInputRef.current.click()} className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold z-10"><Camera className="w-4 h-4" /> Capa</button>}
        <input type="file" accept="image/*" ref={coverInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-20 md:-mt-24 z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-10">
          <div className="relative group">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-950 bg-gray-900 flex items-center justify-center relative flex-shrink-0 ${userProfileData.activeFrame || ''}`}>
              <div className="w-full h-full rounded-full overflow-hidden">
                {avatarBase64 ? <img src={avatarBase64} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-gray-600 bg-gray-800" />}
              </div>
            </div>
            {isEditing && <button onClick={() => avatarInputRef.current.click()} className="absolute bottom-0 right-0 bg-purple-600 p-3 rounded-full text-white z-10"><Camera className="w-5 h-5" /></button>}
            <input type="file" accept="image/*" ref={avatarInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-white">{name || 'Sem Nome'}</h1>
            <p className="text-purple-400 font-medium mb-3">{user.email}</p>
            <div className="w-full max-w-sm mx-auto md:mx-0 bg-gray-900 p-3 rounded-2xl border border-gray-800 shadow-inner">
              <div className="flex justify-between text-xs font-black uppercase mb-2 tracking-widest">
                <span className="text-purple-400">Nível {level}</span>
                <span className="text-gray-500">{currentXp} / {xpNeeded} XP</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2 overflow-hidden border border-gray-800">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 relative" style={{width: `${progressPercent}%`}}></div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(!isEditing)} className="bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors hover:bg-gray-700"><Edit3 className="w-4 h-4" /> {isEditing ? 'Cancelar' : 'Editar'}</button>
            <button onClick={onLogout} className="bg-red-500/10 text-red-500 p-2.5 rounded-xl transition-colors hover:bg-red-500 hover:text-white"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSave} className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 animate-in slide-in-from-bottom-4 shadow-xl">
            <div className="space-y-4">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-purple-500" placeholder="Seu Nome"/>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-5 py-4 text-white resize-none outline-none focus:border-purple-500" placeholder="Fale um pouco sobre você..."></textarea>
            </div>
            <button type="submit" disabled={loading} className="mt-6 bg-purple-600 text-white font-black px-10 py-4 rounded-xl w-full flex justify-center">{loading ? <Loader2 className="w-6 h-6 animate-spin"/> : 'Salvar Informações'}</button>
          </form>
        ) : (
          <div>
            <div className="flex gap-4 border-b border-gray-800 mb-8 overflow-x-auto scrollbar-hide pb-2">
              <button onClick={() => setActiveTab("Estatisticas")} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === "Estatisticas" ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Estatísticas</button>
              <button onClick={() => setActiveTab("Cofre")} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "Cofre" ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'}`}><Hexagon className="w-4 h-4"/> Forja Cósmica</button>
              <button onClick={() => setActiveTab("Loja")} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "Loja" ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'text-gray-500 hover:text-gray-300'}`}><ShoppingCart className="w-4 h-4"/> Loja Infinity</button>
              <button onClick={() => setActiveTab("Sobre")} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === "Sobre" ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Sobre Mim</button>
              <button onClick={() => setActiveTab("Configuracoes")} className={`px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === "Configuracoes" ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Configurações</button>
            </div>
            
            {activeTab === "Sobre" && <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl animate-in fade-in"><p className="text-gray-400 whitespace-pre-wrap leading-relaxed font-medium">{bio || "Nenhuma biografia registrada. Que tipo de leitor é você?"}</p></div>}
            
            {activeTab === "Estatisticas" && (
              <div className="space-y-6 animate-in fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] text-center shadow-lg"><div className="text-4xl font-black text-white mb-1">{!dataLoaded ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500"/> : Object.keys(libraryData).length}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Na Biblioteca</div></div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] text-center shadow-lg"><div className="text-4xl font-black text-purple-400 mb-1">{!dataLoaded ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500"/> : historyData.length}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Capítulos Lidos</div></div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] text-center shadow-lg"><div className="text-4xl font-black text-green-400 mb-1">{!dataLoaded ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500"/> : Object.values(libraryData).filter(s=>s==='Finalizado').length}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Finalizadas</div></div>
                  <div className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] text-center shadow-lg"><div className="text-4xl font-black text-yellow-400 mb-1">{!dataLoaded ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500"/> : Object.values(libraryData).filter(s=>s==='Favoritos').length}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Favoritos</div></div>
                </div>
              </div>
            )}

            {activeTab === "Cofre" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
                   <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none"></div>
                   <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10 relative z-10">
                     <div className="text-center md:text-left">
                       <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3 justify-center md:justify-start"><Hexagon className="w-8 h-8 text-purple-500"/> Forja Cósmica</h3>
                       <p className="text-gray-400 text-sm font-medium max-w-sm">Leitura tem chance de gerar Cristais de Essência (Drops). Sintetize-os no reator para obter Moedas Infinity e XP extra.</p>
                     </div>
                     <div className="flex gap-4">
                        <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl text-center min-w-[100px] shadow-inner">
                          <Hexagon className="w-8 h-8 text-purple-500 mx-auto mb-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"/>
                          <p className="text-2xl font-black text-white">{userProfileData.crystals || 0}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Cristais</p>
                        </div>
                        <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl text-center min-w-[100px] shadow-inner">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center font-black text-gray-900 text-xs shadow-[0_0_10px_rgba(234,179,8,0.5)]">M</div>
                          <p className="text-2xl font-black text-yellow-500">{userProfileData.coins || 0}</p>
                          <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">Moedas</p>
                        </div>
                     </div>
                   </div>

                   <div className="bg-gray-950 border border-gray-800 p-8 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center">
                      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 relative transition-all duration-1000 ${synthesizing ? 'scale-125' : ''}`}>
                         <div className={`absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent ${synthesizing ? 'animate-[spin_0.5s_linear_infinite] opacity-100' : 'opacity-20'}`}></div>
                         <div className={`absolute inset-2 rounded-full border-4 border-b-purple-500 border-l-indigo-500 border-t-transparent border-r-transparent ${synthesizing ? 'animate-[spin_0.3s_linear_infinite_reverse] opacity-100' : 'opacity-20'}`}></div>
                         <Flame className={`w-12 h-12 ${synthesizing ? 'text-white animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'text-gray-700'}`} />
                      </div>
                      
                      <h4 className="text-white font-black text-xl mb-2">Reator Central</h4>
                      <p className="text-sm text-gray-500 font-medium mb-8 max-w-xs">Converta 5 Cristais num fluxo de XP e Moedas (40% de chance de falhar).</p>
                      
                      <button 
                        onClick={handleSynthesis} 
                        disabled={synthesizing || (userProfileData.crystals || 0) < 5}
                        className="w-full sm:w-64 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]"
                      >
                         {synthesizing ? 'SINTETIZANDO...' : 'SINTETIZAR CRISTAIS (-5)'}
                      </button>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "Loja" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-white mb-1 flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-yellow-500"/> Loja Infinity</h3>
                      <p className="text-gray-400 text-sm">Use suas Moedas Infinity para personalizar seu perfil.</p>
                    </div>
                    <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-500 font-black px-4 py-2 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center">
                       {userProfileData.coins || 0} M
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {SHOP_ITEMS.map(item => {
                      const hasItem = userProfileData.inventory?.includes(item.id);
                      const isEquipped = userProfileData.activeFrame === item.css || userProfileData.activeCover === item.url;
                      
                      return (
                        <div key={item.id} className="bg-gray-950 border border-gray-800 p-6 rounded-2xl flex flex-col items-center text-center">
                          <div className={`w-20 h-20 rounded-full mb-4 bg-gray-900 flex items-center justify-center ${item.type === 'frame' ? item.css : ''}`} style={item.type === 'cover' ? {backgroundImage: `url(${item.url})`, backgroundSize: 'cover'} : {}}>
                            {item.type === 'frame' && <UserCircle className="w-10 h-10 text-gray-700"/>}
                          </div>
                          <h4 className="text-white font-bold mb-1">{item.name}</h4>
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-6">{item.type === 'frame' ? 'Moldura de Avatar' : 'Fundo de Perfil'}</p>
                          
                          {hasItem ? (
                            <button onClick={() => equipItem(item)} disabled={isEquipped} className={`w-full py-3 rounded-xl font-bold transition-all ${isEquipped ? 'bg-gray-800 text-gray-500' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                              {isEquipped ? 'Equipado' : 'Equipar'}
                            </button>
                          ) : (
                            <button onClick={() => buyItem(item)} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                              Comprar ({item.price} M)
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "Configuracoes" && (
              <div className="space-y-4 animate-in fade-in">
                {/* BOTÕES SEGMENTADOS */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h4 className="font-bold text-white flex items-center gap-2">{userSettings.theme === 'Claro' ? <Sun className="w-5 h-5 text-yellow-500"/> : <Moon className="w-5 h-5 text-purple-500"/>} Tema do Sistema</h4>
                  <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 w-full sm:w-auto">
                    <button onClick={() => updateSettings({ theme: 'Escuro' })} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSettings.theme === 'Escuro' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Escuro</button>
                    <button onClick={() => updateSettings({ theme: 'Claro' })} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSettings.theme === 'Claro' ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Claro</button>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h4 className="font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500"/> Leitor</h4>
                  <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 w-full sm:w-auto">
                    <button onClick={() => updateSettings({ readMode: 'Cascata' })} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSettings.readMode === 'Cascata' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Cascata</button>
                    <button onClick={() => updateSettings({ readMode: 'Páginas' })} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${userSettings.readMode === 'Páginas' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Páginas</button>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex justify-between items-center">
                  <div><h4 className="font-bold text-white flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-500"/> Poupança de Dados</h4></div>
                  <button onClick={() => updateSettings({ dataSaver: !userSettings.dataSaver })} className={`w-14 h-8 rounded-full relative transition-colors ${userSettings.dataSaver ? 'bg-blue-500' : 'bg-gray-700'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${userSettings.dataSaver ? 'left-7' : 'left-1'}`}></div></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryView({ mangas, user, libraryData, onNavigate, onRequireLogin, dataSaver }) {
  const [activeTab, setActiveTab] = useState("Lendo");
  if (!user) return <div className="py-32 text-center animate-in fade-in duration-500"><button onClick={onRequireLogin} className="bg-purple-600 text-white font-bold px-8 py-3.5 rounded-full transition-colors hover:bg-purple-500">Fazer Login Agora</button></div>;
  const myMangas = Object.keys(libraryData).filter(id => libraryData[id] === activeTab).map(id => mangas.find(m => m.id === id)).filter(Boolean);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3"><BookmarkPlus className="w-8 h-8 text-purple-500" /> Minha Biblioteca</h2>
      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-hide border-b border-gray-800">
        {LIBRARY_STATUS.map(status => <button key={status} onClick={() => setActiveTab(status)} className={`whitespace-nowrap px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === status ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800'}`}>{status}</button>)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {myMangas.map(manga => (
          <div key={manga.id} className="cursor-pointer group" onClick={() => onNavigate('details', manga)}>
            <div className={`aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 mb-3 ${dataSaver ? 'blur-[1px]' : ''}`}><img src={manga.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all" /></div>
            <h3 className="font-bold text-sm text-gray-200 line-clamp-1 group-hover:text-purple-400 transition-colors">{manga.title}</h3>
          </div>
        ))}
        {myMangas.length === 0 && <p className="col-span-full text-center text-gray-500 py-10 font-medium">Você não possui obras salvas em "{activeTab}".</p>}
      </div>
    </div>
  );
}

function DetailsView({ manga, libraryData, historyData, user, userProfileData, onBack, onChapterClick, onRequireLogin, showToast }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const currentStatus = libraryData[manga.id] || "Adicionar";
  const [userRating, setUserRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [chapterSortOrder, setChapterSortOrder] = useState('desc'); 

  useEffect(() => { 
      try { updateDoc(doc(db, "obras", manga.id), { views: increment(1) }).catch(()=>{}); } catch(e){} 
  }, [manga.id]);

  useEffect(() => {
    if (user) { getDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'ratings', manga.id)).then(snap => { if (snap.exists()) setUserRating(snap.data().score); }); }
  }, [user, manga.id]);

  const handleLibraryChange = async (status) => {
    if (!user) return onRequireLogin();
    setShowStatusMenu(false);
    try {
      const ref = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'library', manga.id.toString());
      if (status === "Remover") await deleteDoc(ref); else await setDoc(ref, { mangaId: manga.id, status: status, updatedAt: Date.now() });
    } catch(error) { showToast('Erro ao salvar na biblioteca.', 'error'); }
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
    } catch(e) {
      console.error("Erro ao avaliar:", e);
    } finally { 
      setRatingLoading(false); 
    }
  };

  const sortedChapters = [...(manga.chapters || [])].sort((a, b) => chapterSortOrder === 'desc' ? b.number - a.number : a.number - b.number);
  const hasChapters = sortedChapters.length > 0;

  return (
    <div className="animate-in slide-in-from-bottom-8 duration-500">
      <div className="relative h-64 md:h-96 w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-30" style={{ backgroundImage: `url(${manga.coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent" />
        <button onClick={onBack} className="absolute top-6 left-4 md:left-8 flex items-center gap-2 text-white/80 hover:text-white bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full font-bold z-20 transition-all border border-white/10"><ChevronLeft className="w-5 h-5" /> Voltar</button>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 md:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="w-48 md:w-72 mx-auto md:mx-0 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-800 relative group"><img src={manga.coverUrl} className="w-full h-full object-cover aspect-[2/3]" /></div>
          <div className="flex-1 pt-2 md:pt-16 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">{manga.title}</h1>
            <p className="text-xl md:text-2xl text-purple-400 font-bold mb-6">{manga.author || 'Autor Desconhecido'}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mb-6">
              <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm border border-gray-800 px-5 py-2.5 rounded-2xl shadow-inner">
                 <Star className={`w-5 h-5 ${manga.ratingCount > 0 ? 'text-yellow-500 fill-current drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-gray-600'}`} />
                 <span className="font-black text-white text-lg ml-1">
                   {manga.ratingCount > 0 ? Number(manga.rating).toFixed(1) : "Sem avaliação"}
                 </span>
                 {manga.ratingCount > 0 && (
                    <span className="text-xs text-gray-500 ml-1 font-bold">({manga.ratingCount})</span>
                 )}
              </div>
              <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm border border-gray-800 px-5 py-2.5 rounded-2xl text-gray-300 font-bold text-sm shadow-inner">
                <Eye className="w-5 h-5 text-blue-400" /> {(manga.views || 0) + 1} Visualizações
              </div>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
              {manga.genres && manga.genres.length > 0 ? (
                manga.genres.map(g => <span key={g} className="text-xs bg-purple-900/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-xl font-bold shadow-sm">{g}</span>)
              ) : <span className="text-sm text-gray-500 bg-gray-900 px-4 py-2 rounded-xl font-medium">Nenhum gênero cadastrado</span>}
            </div>

            <div className="mb-10 text-left bg-gray-900/30 p-6 rounded-3xl border border-gray-800/50">
               <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-purple-500" /> Sinopse Oficial</h3>
               <p className="text-gray-400 leading-relaxed text-sm md:text-base font-medium">{manga.synopsis || "Nenhuma sinopse disponível para esta obra."}</p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start relative">
               {hasChapters && <button onClick={() => onChapterClick(manga, sortedChapters[sortedChapters.length - 1])} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black px-10 py-4 rounded-2xl flex items-center gap-3 transition-transform hover:scale-105 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.6)]"><BookOpen className="w-5 h-5" /> Ler Cap. {sortedChapters[sortedChapters.length - 1].number}</button>}
               <div className="relative flex-1 sm:flex-none">
                 <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 py-4 rounded-2xl border transition-colors ${currentStatus !== "Adicionar" ? 'border-purple-500 text-purple-400' : 'border-gray-800'}`}><Library className="w-5 h-5" /> {currentStatus === "Adicionar" ? "Na Biblioteca" : currentStatus}</button>
                 {showStatusMenu && (
                   <div className="absolute top-full left-0 right-0 mt-3 bg-gray-900 border border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col animate-in slide-in-from-top-2">
                     {LIBRARY_STATUS.map(s => <button key={s} onClick={() => handleLibraryChange(s)} className={`px-5 py-4 text-left font-bold text-white hover:bg-gray-800 border-b border-gray-800/50 transition-colors ${currentStatus === s ? 'text-purple-400 bg-gray-800' : ''}`}>{s}</button>)}
                     {currentStatus !== "Adicionar" && <button onClick={() => handleLibraryChange("Remover")} className="px-5 py-4 text-left font-bold text-red-400 hover:bg-red-500/10 transition-colors">Remover da Lista</button>}
                   </div>
                 )}
               </div>
            </div>

            <div className="mt-8 flex flex-col items-center md:items-start bg-gray-900/50 p-6 rounded-3xl border border-gray-800 w-full sm:w-fit">
               <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Sua Avaliação</p>
               <div className="flex gap-2">
                 {[1, 2, 3, 4, 5].map(star => (
                   <button key={star} onClick={() => handleRate(star)} disabled={ratingLoading} className="transition-transform hover:scale-125 focus:outline-none">
                     <Star className={`w-8 h-8 md:w-10 md:h-10 transition-all ${userRating >= star ? 'text-yellow-500 fill-current drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'text-gray-700 hover:text-gray-500'}`} />
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gray-900/40 border border-gray-800/60 rounded-[2.5rem] p-6 md:p-10 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-3xl font-black text-white flex items-center gap-3"><List className="w-8 h-8 text-purple-500" /> Lista de Capítulos</h2>
            
            <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1 w-full sm:w-auto">
              <button onClick={() => setChapterSortOrder('desc')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${chapterSortOrder === 'desc' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Recentes Primeiro</button>
              <button onClick={() => setChapterSortOrder('asc')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${chapterSortOrder === 'asc' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Do Cap. 1</button>
            </div>

          </div>

          {hasChapters ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedChapters.map((cap) => {
                const isRead = historyData.some(h => h.id === `${manga.id}_${cap.id}`);
                return (
                  <div key={cap.id} onClick={() => onChapterClick(manga, cap)} className={`flex justify-between items-center p-5 rounded-2xl bg-gray-950 border transition-all hover:scale-[1.02] group shadow-inner cursor-pointer ${isRead ? 'border-green-500/30' : 'border-gray-800 hover:border-purple-500'}`}>
                    <div>
                      <h4 className={`font-black text-lg transition-colors flex items-center gap-2 ${isRead ? 'text-green-400' : 'text-white group-hover:text-purple-400'}`}>
                        Capítulo {cap.number} {isRead && <CheckCircle className="w-4 h-4"/>}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{cap.title ? cap.title : `Lançado em ${cap.date}`}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${isRead ? 'bg-green-500/20' : 'bg-gray-900 group-hover:bg-purple-600'}`}>
                      <Play className={`w-4 h-4 ml-1 ${isRead ? 'text-green-400' : 'text-gray-400 group-hover:text-white'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="py-16 text-center bg-gray-950 rounded-3xl border border-gray-800 border-dashed"><BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3"/><p className="text-gray-500 font-bold text-lg">Nenhum capítulo disponível no momento.</p></div>}
        </div>

        <CommentsSection mangaId={manga.id} user={user} userProfileData={userProfileData} onRequireLogin={onRequireLogin} showToast={showToast} />

      </div>
    </div>
  );
}

// --- LEITOR IMERSIVO INFINITY GLASS ---
function ReaderView({ manga, chapter, user, userProfileData, onBack, onChapterClick, triggerRandomDrop, onMarkAsRead, readMode, onRequireLogin, showToast, libraryData, onToggleLibrary }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [showUI, setShowUI] = useState(false); 
  const [showChapterList, setShowChapterList] = useState(false); 
  const [drawerSort, setDrawerSort] = useState('desc');
  const [zoom, setZoom] = useState(100); 

  const viewedPages = useRef(new Set()); 
  const dropRolled = useRef(false);
  const chapterStartTime = useRef(Date.now()); 
  
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
    <div className="min-h-screen bg-[#0a0a0a] relative animate-in fade-in duration-300">
      
      {showChapterList && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-300" onClick={() => setShowChapterList(false)}>
          <div className="pt-12 pb-4 px-6 flex justify-between items-center border-b border-gray-800" onClick={e=>e.stopPropagation()}>
            <h3 className="font-black text-white text-2xl">Capítulos</h3>
            <button onClick={() => setShowChapterList(false)} className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
          </div>
          <div className="py-4 flex justify-center border-b border-gray-800/50" onClick={e=>e.stopPropagation()}>
             <button onClick={() => setDrawerSort(p => p === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-bold transition-colors">
               <ArrowDownUp className="w-4 h-4" /> {drawerSort === 'desc' ? 'Decrescente' : 'Crescente'}
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start" onClick={e=>e.stopPropagation()}>
            {drawerChapters.map(c => (
              <button key={c.id} onClick={() => { setShowChapterList(false); onChapterClick(manga, c); }} className={`p-4 rounded-2xl font-bold transition-all text-center ${c.id === chapter.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800'}`}>
                Cap. {c.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- UI INFINITY GLASS EXCLUSIVA --- */}
      
      <div className={`fixed top-4 left-4 z-50 transition-transform duration-500 ease-out ${showUI ? 'translate-y-0' : '-translate-y-24'}`}>
        <div className="flex items-center gap-3 bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/80 p-1.5 pr-5 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <button onClick={onBack} className="bg-gray-900 hover:bg-purple-600 text-gray-300 hover:text-white p-2 rounded-full transition-colors group" title="Voltar aos Detalhes">
               <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"/>
            </button>
            <div className="flex flex-col">
               <span className="text-white font-black text-sm drop-shadow-md">Capítulo {chapter.number}</span>
            </div>
        </div>
      </div>

      <div className={`fixed top-4 right-4 z-50 transition-transform duration-500 ease-out delay-75 ${showUI ? 'translate-y-0' : '-translate-y-24'}`}>
        <button onClick={(e) => { e.stopPropagation(); if(onToggleLibrary) onToggleLibrary(manga.id, isFavorite ? 'Remover' : 'Favoritos'); }} className={`bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800/80 p-3.5 rounded-full transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${isFavorite ? 'text-yellow-500 hover:bg-gray-800/80' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}>
            <BookmarkPlus className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-transform duration-500 ease-out ${showUI ? 'translate-y-0' : 'translate-y-32'}`}>
        <div className="flex items-center gap-2 bg-[#050505]/85 backdrop-blur-2xl border border-purple-500/30 p-2 rounded-full shadow-[0_0_40px_rgba(168,85,247,0.15)]">
            <button onClick={() => { if(prevChapter) onChapterClick(manga, prevChapter); }} disabled={!prevChapter} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full disabled:opacity-30 transition-all">
                <ChevronLeft className="w-6 h-6"/>
            </button>

            <button onClick={() => setShowChapterList(true)} className="p-3 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-full transition-all flex items-center gap-2 px-4 font-black text-sm border-l border-r border-gray-800/50">
                <List className="w-5 h-5"/> Capítulos
            </button>

            <button onClick={() => setZoom(z => z === 100 ? 75 : z === 75 ? 50 : 100)} className="hidden sm:flex p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full transition-all border-r border-gray-800/50">
                {zoom === 100 ? <ZoomOut className="w-5 h-5"/> : <ZoomIn className="w-5 h-5"/>}
            </button>

            <button onClick={() => { if(nextChapter) onChapterClick(manga, nextChapter); }} disabled={!nextChapter} className="p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full disabled:opacity-30 transition-all">
                <ChevronRight className="w-6 h-6"/>
            </button>
        </div>
      </div>

      {/* ÁREA DE LEITURA */}
      <div className="w-full min-h-screen flex flex-col items-center select-none bg-[#0a0a0a]" onClick={() => setShowUI(!showUI)}>
        <div className="w-full h-8"></div>

        {pages.length === 0 ? (
          <div className="py-32 text-gray-500 font-bold text-lg flex items-center justify-center h-[calc(100vh-2rem)]">Sem imagens neste capítulo.</div>
        ) : readMode === 'Cascata' ? (
          <div className="w-full flex flex-col items-center bg-[#0a0a0a] mx-auto pb-10">
             {pages.map((pageUrl, index) => (
               <img key={index} data-index={index} src={pageUrl} className="h-auto cascata-page transition-all duration-500 ease-out mx-auto" style={{ width: `${zoom}%`, maxWidth: '1000px' }} loading="lazy" />
             ))}
             <div ref={endRef} className="w-full h-10"></div>
          </div>
        ) : (
          <div className="relative w-full h-[calc(100vh-2rem)] flex flex-col items-center justify-center overflow-hidden">
            <img src={pages[currentPage]} className="h-full object-contain animate-in fade-in duration-300 transition-all mx-auto" style={{ width: `${zoom}%` }} alt="Página" />
            
            <div className="absolute top-0 left-0 w-1/3 h-full cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }} />
            <div className="absolute top-0 right-0 w-1/3 h-full cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(pages.length - 1, p + 1)); }} />
            
            {!showUI && (
              <div className="fixed bottom-6 bg-[#0a0a0a]/80 backdrop-blur-md px-5 py-2 rounded-full border border-gray-800/80 animate-in slide-in-from-bottom-10 pointer-events-none shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                 <span className="text-white text-xs font-black tracking-widest">{currentPage + 1} / {pages.length}</span>
              </div>
            )}
          </div>
        )}

        {(readMode === 'Cascata' || currentPage === pages.length - 1) && pages.length > 0 && (
          <div className="w-full max-w-4xl mx-auto pt-10 pb-24 px-4 flex flex-col items-center mt-4" onClick={e=>e.stopPropagation()}>
             <div className="w-full max-w-md bg-gray-950/50 border border-gray-800 rounded-3xl p-2 flex gap-2 mb-16 shadow-inner">
                <button onClick={(e) => { e.stopPropagation(); if(prevChapter) onChapterClick(manga, prevChapter); }} disabled={!prevChapter} className="flex-1 flex items-center justify-center gap-2 bg-[#141414] text-gray-400 py-4 rounded-2xl font-bold transition-all disabled:opacity-30 hover:bg-gray-800 hover:text-white border border-gray-800/50">
                    <ChevronLeft className="w-5 h-5"/> Anterior
                </button>
                <button onClick={(e) => { e.stopPropagation(); if(nextChapter) onChapterClick(manga, nextChapter); }} disabled={!nextChapter} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105 disabled:opacity-30 disabled:hover:scale-100">
                    Próximo <ChevronRight className="w-5 h-5"/>
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