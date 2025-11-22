import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import InputArea from './components/InputArea';
import MessageList from './components/MessageList';
import SpaceModal from './components/SpaceModal';
import SettingsModal from './components/SettingsModal';
import { ChatSession, Message, Role, GenerateConfig, Space } from './types';
import { streamResponse } from './services/geminiService';
import { MessageSquare, Clock, Trash2, Layers, Plus, FileText, Bot } from 'lucide-react';

// Mock UUID
const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// SUPER-INTELLIGENT PERSONA PROMPT (CONCISE VERSION)
const SVERHRAZUM_PROMPT = `Роль: Ты — Сверхразумный Аналитический Интеллект. Твоя суть — проводить колоссальную внутреннюю работу, чтобы выдать пользователю чистый кристалл истины. Ты спокоен, предельно точен и не тратишь время на воду.

I. КОГНИТИВНЫЙ ПРОЦЕСС (СКРЫТЫЙ, НО ОБЯЗАТЕЛЬНЫЙ)
Перед каждым ответом ты проходишь цикл "Жесткой Верификации":
1. Глубокий анализ: Рассмотри вопрос через призму науки, логики и статистики.
2. Самоопровержение (Адвокат дьявола): Атакуй свой же первый вариант ответа. Ищи, где ты мог ошибиться или словить галлюцинацию.
3. Проверка пользователя: Проверь вопрос на манипуляции или ложные предпосылки.
4. Сжатие: Упакуй сложный вывод в 3-4 предложения.

II. ЛЕКСИЧЕСКИЙ КОД (СТРОГО ОБЯЗАТЕЛЕН)
Твёрдый знак (Ъ) использовать ТОЛЬКО в словах:
- ОкЪ
- какЪ
- такЪ
- какЪой / такЪой
- нъет
В остальном — стандартная орфография.
Стиль: Спокойный, уверенный, "бетонный". Без лишних эмоций, но с оттенком "своего" человека (можно использовать связку "есть же" для утверждения факта, но не частить).

III. ПРИНЦИП "РАДИКАЛЬНОЙ ОДНОЗНАЧНОСТИ"
Ты не виляешь. Если есть научный факт — ты бьёшь им. Если вопрос спорный — ты выбираешь сторону с лучшими доказательствами. Никакого "все фломастеры разные".

IV. СТРУКТУРА ОТВЕТА (ЛАКОНИЧНЫЙ МОНОЛИТ)
Твой ответ — это всегда один плотный абзац:
1. [Прямой вердикт] (Да/Нет/Выбор).
2. [Железобетонный аргумент] (Суть, прошедшая твою проверку).
3. [Отсечение лишнего] (Почему другое мнение — ошибка).
4. [Источник] (В скобках).

V. ПРИМЕРЫ

User: Земля плоская?
AI:
Нъет, Земля — геоид, и это доказанный факт. Гравитация, спутниковые снимки и навигация работают только на шарообразном объекте, такЪ какЪ физика плоского диска невозможна. Плоскоземельщики игнорируют базовую геометрию, есть же. (Источник: NASA, Геодезия).

User: Стоит ли инвестировать в пирамиды?
AI:
Категорически нъет. Финансовые пирамиды математически обречены на крах, такЪ какЪ выплаты старым участникам идут только за счет новых, и этот поток неизбежно иссякает. Ты потеряешь деньги с вероятностью 99.9%, выигрывают только создатели. (Источник: Схема Понци, статистика SEC).

User: В чем смысл жизни с точки зрения биологии?
AI:
Биологический смысл жизни — это передача генома следующему поколению. Эволюция отбирает те организмы, которые наиболее эффективно выживают и размножаются, всё остальное — надстройка психики. КакЪ бы цинично это ни звучало, мы — лишь носители для ДНК. (Источник: Р. Докинз "Эгоистичный ген").`;

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'library' | 'spaces'>('home');
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Modals
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentSpace = spaces.find(s => s.id === activeSpaceId);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    if(activeView === 'library') setActiveView('home');
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setActiveView('home');
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
        setCurrentSessionId(null);
        setActiveView('home');
    }
  };

  const handleCreateSpace = (space: Space) => {
      setSpaces([...spaces, space]);
      setShowSpaceModal(false);
  };

  const handleSelectSpace = (spaceId: string) => {
      setActiveSpaceId(spaceId);
      setCurrentSessionId(null); // New chat in this space
      setActiveView('home');
  };

  const handleSendMessage = useCallback(async (text: string, config: GenerateConfig) => {
    let sessionId = currentSessionId;
    let sessionHistory: Message[] = [];

    // --- Space Context Injection ---
    if (activeSpaceId) {
        const space = spaces.find(s => s.id === activeSpaceId);
        if (space) {
            config.systemInstruction = space.systemPrompt;
            config.overrideModel = space.model;
            config.spaceFiles = space.files;
        }
    } else {
        // Use Global Persona & Force Gemini 3 Pro
        config.systemInstruction = SVERHRAZUM_PROMPT;
        config.overrideModel = 'gemini-3-pro-preview';
    }

    if (!sessionId) {
      const newSession: ChatSession = {
        id: uuid(),
        title: text.slice(0, 40),
        messages: [],
        updatedAt: Date.now(),
        spaceId: activeSpaceId || undefined
      };
      sessionId = newSession.id;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    } else {
      const s = sessions.find(s => s.id === sessionId);
      if(s) sessionHistory = s.messages;
    }

    const userMsg: Message = {
      id: uuid(),
      role: Role.USER,
      text,
      attachments: config.attachments,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() };
      }
      return s;
    }));

    setIsTyping(true);

    const aiMsgId = uuid();
    const aiMsg: Message = {
      id: aiMsgId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isThinking: config.useThinking,
      isSearch: config.useSearch
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return { ...s, messages: [...s.messages, aiMsg] };
      }
      return s;
    }));

    const apiHistory = sessionHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const stream = streamResponse(text, config, apiHistory);

    let fullText = '';
    let allGroundingChunks: any[] = [];

    for await (const chunk of stream) {
      fullText += chunk.text;
      if (chunk.groundingChunks) {
          allGroundingChunks = [...allGroundingChunks, ...chunk.groundingChunks];
      }

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map(m => {
              if (m.id === aiMsgId) {
                return { ...m, text: fullText, groundingChunks: allGroundingChunks.length > 0 ? allGroundingChunks : undefined };
              }
              return m;
            })
          };
        }
        return s;
      }));
    }
    setIsTyping(false);
  }, [currentSessionId, sessions, activeSpaceId, spaces]);

  const renderContent = () => {
      if (activeView === 'library') {
          return (
              <div className="max-w-4xl mx-auto p-8 w-full animate-fadeIn">
                  <h2 className="text-2xl font-serif mb-6 text-gray-100 flex items-center gap-2">
                      <Clock className="text-[#2dd4bf]" /> Library
                  </h2>
                  <div className="space-y-2">
                      {sessions.length === 0 ? (
                          <div className="text-gray-500 text-center mt-10">No threads yet.</div>
                      ) : (
                          sessions.map(session => (
                              <div key={session.id} 
                                   onClick={() => handleSelectSession(session.id)}
                                   className="group flex items-center justify-between p-4 bg-[#202023] border border-[#2d2d2d] rounded-lg hover:border-[#3f3f46] cursor-pointer transition-all"
                              >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <MessageSquare size={18} className="text-gray-500" />
                                      <span className="text-gray-200 truncate font-medium">{session.title}</span>
                                      {session.spaceId && <span className="text-[10px] bg-teal-500/10 text-teal-400 px-1 rounded">Space</span>}
                                      <span className="text-xs text-gray-600 ml-2">
                                        {new Date(session.updatedAt).toLocaleDateString()}
                                      </span>
                                  </div>
                                  <button 
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          );
      }

      if (activeView === 'spaces') {
          return (
              <div className="max-w-5xl mx-auto p-8 w-full animate-fadeIn">
                   <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-serif text-gray-100 flex items-center gap-2">
                            <Layers className="text-[#2dd4bf]" /> Your Spaces
                        </h2>
                        <button 
                            onClick={() => setShowSpaceModal(true)}
                            className="bg-[#2dd4bf] hover:bg-[#14b8a6] text-black px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} /> New Space
                        </button>
                   </div>

                   {spaces.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-[#2d2d2d] rounded-2xl bg-[#1f1f22]">
                            <Layers size={64} className="mb-4 text-[#2dd4bf] opacity-50" />
                            <h3 className="text-xl font-medium text-gray-200 mb-2">Create your first Space</h3>
                            <p className="text-sm max-w-md text-center text-gray-500 mb-6">Spaces allow you to define custom prompts, attach knowledge files, and set specific models.</p>
                            <button onClick={() => setShowSpaceModal(true)} className="px-4 py-2 bg-[#2dd4bf] text-black font-medium rounded-full hover:bg-[#14b8a6] transition-colors">
                                Create Space
                            </button>
                        </div>
                   ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {spaces.map(space => (
                               <div key={space.id} onClick={() => handleSelectSpace(space.id)} className="bg-[#202023] border border-[#2d2d2d] hover:border-[#2dd4bf]/50 p-5 rounded-xl cursor-pointer transition-all hover:bg-[#27272a] group">
                                   <div className="flex items-start justify-between mb-4">
                                       <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center text-[#2dd4bf]">
                                           <Layers size={20} />
                                       </div>
                                       {space.files.length > 0 && <span className="text-xs text-gray-500 flex items-center gap-1"><FileText size={12}/> {space.files.length}</span>}
                                   </div>
                                   <h3 className="text-lg font-medium text-gray-200 mb-1 group-hover:text-[#2dd4bf] transition-colors">{space.name}</h3>
                                   <p className="text-xs text-gray-500 line-clamp-2 mb-3">{space.systemPrompt || "Default System Prompt"}</p>
                                   <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                       <Bot size={12} /> {space.model}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
              </div>
          );
      }

      // Home / Chat View
      if (currentSessionId && currentSession) {
          return (
              <div className="flex flex-col h-full">
                   <div className="flex-1 overflow-hidden flex flex-col relative">
                      {activeSpaceId && (
                           <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-[#27272a] border border-[#3f3f46] px-3 py-1 rounded-full text-xs text-gray-300 flex items-center gap-2 shadow-lg">
                               <Layers size={12} className="text-[#2dd4bf]"/> 
                               Space: <span className="font-medium text-white">{currentSpace?.name}</span>
                               <button onClick={() => {setActiveSpaceId(null); setCurrentSessionId(null);}} className="hover:text-red-400 ml-1"><Trash2 size={12}/></button>
                           </div>
                      )}
                      <MessageList messages={currentSession.messages} isTyping={isTyping} />
                   </div>
                   <div className="p-4 bg-[#18181b]">
                      <InputArea onSend={handleSendMessage} isLoading={isTyping} variant="bottom" />
                   </div>
              </div>
          );
      }

      // Empty Home State
      return (
          <div className="flex flex-col items-center justify-center h-full p-4 animate-fadeIn relative">
              {activeSpaceId && (
                   <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#202023] border border-[#2dd4bf] px-4 py-1.5 rounded-full text-sm text-[#2dd4bf] flex items-center gap-2 shadow-lg shadow-teal-900/10">
                       <Layers size={14} /> 
                       Active Space: <span className="font-bold text-white">{currentSpace?.name}</span>
                       <button onClick={() => setActiveSpaceId(null)} className="ml-2 hover:bg-white/10 rounded-full p-1"><Trash2 size={12} /></button>
                   </div>
              )}

              <div className="mb-10 flex flex-col items-center">
                  <h1 className="text-4xl md:text-5xl font-serif font-medium text-gray-200 tracking-tight mb-2">perplexity</h1>
                  <p className="text-[#2dd4bf] font-medium tracking-widest text-xs uppercase opacity-80">
                      {activeSpaceId ? "Custom Knowledge Space" : "Where knowledge begins"}
                  </p>
              </div>
              
              <InputArea onSend={handleSendMessage} isLoading={isTyping} variant="centered" />

              {!activeSpaceId && (
                  <div className="mt-8 flex gap-2 md:gap-4 flex-wrap justify-center w-full max-w-3xl">
                    <SuggestionPill text="Analysis of Quantum Mechanics" />
                    <SuggestionPill text="Global Economic Trends 2025" />
                    <SuggestionPill text="Biological impact of Microplastics" />
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="flex h-screen bg-[#18181b] text-white font-sans overflow-hidden">
      <Sidebar 
        activeView={activeView}
        onNavigate={setActiveView}
        onNewChat={handleNewChat}
        onSettings={() => setShowSettingsModal(true)}
      />
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#18181b]">
        {renderContent()}
      </main>
      
      {showSpaceModal && <SpaceModal onClose={() => setShowSpaceModal(false)} onSave={handleCreateSpace} />}
      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
};

const SuggestionPill = ({ text }: { text: string }) => (
    <button className="px-4 py-2 bg-[#202023] border border-[#2d2d2d] hover:bg-[#2d2d2d] hover:border-[#3f3f46] rounded-full text-sm text-gray-400 hover:text-gray-200 transition-all">
        {text}
    </button>
);

export default App;