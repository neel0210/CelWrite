import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { BookOpen, PenTool, CheckCircle, AlertCircle, Menu, X, Home, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { QUESTIONS } from './data/questions';
import { Question, TaskType, EvaluationResult } from './types';
import { evaluateWriting } from './services/geminiService';
// --- NEW IMPORT ---
import { supabase } from './supabaseClient';

// --- Components ---

const Header = () => (
  <header className="bg-black border-b border-zinc-800 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <Link to="/" className="flex items-center gap-2 text-decoration-none group">
          <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
            <PenTool className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black text-white tracking-tighter">CelWrite</span>
        </Link>
        <nav className="flex space-x-4">
           <Link to="/" className="text-zinc-400 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
           <Link to="/custom" className="text-zinc-400 hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">Custom Topic</Link>
        </nav>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-black border-t border-zinc-800 mt-auto">
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <p className="text-sm text-zinc-500 mb-2">
        &copy; {new Date().getFullYear()} CelWrite.
      </p>
      <p className="text-xs text-zinc-600 font-medium tracking-wide">
        BY <span className="text-zinc-400">NEEL0210</span>
      </p>
    </div>
  </footer>
);

const QuestionCard = ({ question, onSelect }: { question: Question; onSelect: (q: Question) => void }) => (
  <div 
    onClick={() => onSelect(question)}
    className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800/50 cursor-pointer transition-all duration-300 group"
  >
    <div className="flex justify-between items-start mb-4">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${question.type === TaskType.TASK_1 ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' : 'bg-purple-900/30 text-purple-400 border border-purple-800/50'}`}>
        {question.type === TaskType.TASK_1 ? 'Task 1' : 'Task 2'}
      </span>
      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-400 transition-colors" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{question.title}</h3>
    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{question.prompt}</p>
  </div>
);

// --- Pages ---

const Dashboard = () => {
  const navigate = useNavigate();
  const levels = ['Easy', 'Medium', 'Hard'] as const;

  const renderTaskSection = (title: string, taskType: TaskType) => {
    return (
      <div className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">{title}</h2>
          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>
        
        <div className="space-y-12">
          {levels.map(level => {
            const filtered = QUESTIONS.filter(q => q.type === taskType && q.difficulty === level);
            if (filtered.length === 0) return null;

            return (
              <div key={level}>
                <h3 className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-2 ${
                  level === 'Easy' ? 'text-emerald-500' : 
                  level === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    level === 'Easy' ? 'bg-emerald-500' : 
                    level === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  {level} Level
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map(q => (
                    <QuestionCard key={q.id} question={q} onSelect={(q) => navigate(`/exam/${q.id}`)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-20">
        <h1 className="text-6xl font-black text-white mb-4 tracking-tight">Improve Celpip Writing</h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-light">
          Structure your practice by task type and difficulty level.
        </p>
      </div>

      {renderTaskSection("Task 1: Writing an Email", TaskType.TASK_1)}
      {renderTaskSection("Task 2: Responding to Survey", TaskType.TASK_2)}
    </div>
  );
};

const CustomTopic = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<TaskType>(TaskType.TASK_1);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [bullets, setBullets] = useState(['', '', '']);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');

  const handleStart = () => {
    const customQ: Question = {
      id: 'custom-' + Date.now(),
      title, prompt, type, difficulty,
      bullets: type === TaskType.TASK_1 ? bullets : undefined,
      options: type === TaskType.TASK_2 ? { optionA, optionB } : undefined
    };
    navigate('/exam/custom', { state: { question: customQ } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Custom CelWrite Scenario</h2>
        <div className="space-y-6">
          <div className="flex gap-4 p-1 bg-black rounded-xl border border-zinc-800">
            {[TaskType.TASK_1, TaskType.TASK_2].map((t) => (
              <button 
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {t === TaskType.TASK_1 ? 'Email' : 'Survey'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  difficulty === lvl 
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <input 
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-zinc-600"
            placeholder="Topic Title"
          />

          <textarea 
            value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4}
            className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-zinc-600"
            placeholder="Describe the situation..."
          />

          {type === TaskType.TASK_1 ? (
            <div className="space-y-3">
              {bullets.map((b, i) => (
                <input 
                  key={i} value={b} onChange={(e) => {
                    const n = [...bullets]; n[i] = e.target.value; setBullets(n);
                  }}
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  placeholder={`Instruction Bullet ${i + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <input value={optionA} onChange={(e) => setOptionA(e.target.value)} className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl outline-none text-white" placeholder="Option A (e.g., Build a park)" />
              <input value={optionB} onChange={(e) => setOptionB(e.target.value)} className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl outline-none text-white" placeholder="Option B (e.g., Build a library)" />
            </div>
          )}

          <button 
            onClick={handleStart} disabled={!title || !prompt}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-30 transition-all"
          >
            Launch CelWrite Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Exam Interface ---

const ExamSimulator = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const question = id === 'custom' ? location.state?.question : QUESTIONS.find(q => q.id === id);

  const [response, setResponse] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(question?.type === TaskType.TASK_1 ? 27 * 60 : 26 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!question) return <Navigate to="/" />;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setResponse(text);
    setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await evaluateWriting(question, response);
      
      // --- NEW: SUPABASE INSERT ---
      const { error } = await supabase
        .from('attempts')
        .insert([
          {
            task_title: question.title,
            task_type: question.type,
            user_response: response,
            band_score: result.bandScore,
            content_score: result.contentScore,
            vocab_score: result.vocabularyScore,
            grammar_score: result.grammarScore,
            task_score: result.taskFulfillmentScore,
            feedback: result.feedback,
            model_answer: result.correctedVersion
          }
        ]);
      
      if (error) console.error("Database error:", error);

      navigate('/result', { state: { result, question, userResponse: response } });
    } catch {
      alert("Evaluation failed. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-black">
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="font-bold text-white uppercase tracking-widest text-xs">CelWrite Live Simulator</span>
        </div>
        <div className="flex items-center gap-4 bg-black border border-zinc-800 px-4 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-lg font-bold text-white">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-10 overflow-y-auto border-r border-zinc-800">
          <h2 className="text-2xl font-bold text-white mb-6">{question.title}</h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">{question.prompt}</p>
          
          {question.bullets && (
            <div className="bg-blue-900/10 p-6 rounded-2xl border border-blue-900/30">
              <h3 className="font-bold text-blue-400 mb-4">Requirement Checklist:</h3>
              <ul className="space-y-3">
                {question.bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 text-zinc-300 items-start">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-1/2 flex flex-col bg-zinc-950">
          <textarea
            className="flex-1 p-10 text-xl bg-black text-zinc-200 outline-none resize-none font-serif leading-relaxed placeholder-zinc-800"
            placeholder="Type your response here..."
            value={response}
            onChange={handleTextChange}
            spellCheck={false}
          />
          <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center">
            <span className={`text-sm font-bold ${wordCount < 150 || wordCount > 200 ? 'text-orange-500' : 'text-green-500'}`}>
              WORDS: {wordCount} / 200
            </span>
            <button
              onClick={handleSubmit} disabled={isSubmitting || wordCount < 5}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-black transition-all disabled:opacity-20 shadow-lg shadow-blue-600/20"
            >
              {isSubmitting ? 'CELWRITE ANALYZING...' : 'FINISH TEST'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Result Page ---

const ResultPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  if (!state?.result) return <Navigate to="/" />;
  const { result } = state;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-white">Score Report</h1>
          <p className="text-zinc-500 mt-2">CelWrite Engine: Gemini 2.5 Flash-Lite Analysis</p>
        </div>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg hover:bg-zinc-800 transition-all flex items-center gap-2 font-bold">
          <Home className="w-4 h-4" /> Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 p-10 rounded-3xl border border-zinc-800 text-center shadow-2xl">
            <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4">Estimated Band</h2>
            <div className="text-8xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              {result.bandScore}
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-6">
            {[
              { n: 'Content', s: result.contentScore },
              { n: 'Vocab', s: result.vocabularyScore },
              { n: 'Grammar', s: result.grammarScore },
              { n: 'Task', s: result.taskFulfillmentScore },
            ].map(i => (
              <div key={i.n}>
                <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase">
                  <span>{i.n}</span>
                  <span>{i.s}/12</span>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 shadow-[0_0_10px_#2563eb]" style={{ width: `${(i.s / 12) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="text-blue-500" /> CelWrite Feedback
            </h3>
            <p className="text-zinc-300 leading-relaxed italic">"{result.feedback}"</p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h3 className="text-xl font-bold text-white mb-6">Model Answer (Band 12)</h3>
            <div className="p-6 bg-black rounded-2xl border border-zinc-800 text-blue-100 font-serif leading-loose relative">
              <span className="absolute top-4 right-4 text-[100px] leading-none font-serif opacity-5 select-none pointer-events-none text-white">"</span>
              {result.correctedVersion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <HashRouter>
    <div className="min-h-screen bg-black flex flex-col font-sans text-zinc-200">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/custom" element={<CustomTopic />} />
          <Route path="/exam/:id" element={<ExamSimulator />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </HashRouter>
);

export default App;
