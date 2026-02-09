
import React, { useState, useEffect, useRef } from 'react';
import { 
  AppView, 
  TaskType, 
  Question, 
  EvaluationResult, 
  ExamState 
} from './types';
import { TASK_1_QUESTIONS, TASK_2_QUESTIONS } from './constants';
import { GeminiService } from './services/geminiService';

// --- Components ---

const Header: React.FC<{ onHome: () => void }> = ({ onHome }) => (
  <header className="py-4 px-4 md:py-6 md:mb-8">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">C</div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">CelWrite</h1>
      </button>
      <nav className="flex gap-4">
        <span className="text-indigo-400 text-[10px] md:text-xs font-bold tracking-widest uppercase py-1.5 px-3 md:py-2 md:px-4 border border-indigo-500/30 rounded-full bg-indigo-500/5">Pro Simulator</span>
      </nav>
    </div>
  </header>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`glass-card rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

const Timer: React.FC<{ seconds: number }> = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const isUrgent = seconds < 120; // less than 2 mins
  
  return (
    <div className={`sticky top-2 z-50 flex flex-col items-center justify-center glass-card rounded-xl md:rounded-2xl py-2 px-4 md:py-3 md:px-8 shadow-2xl transition-all duration-500 ${isUrgent ? 'border-red-500/50 bg-red-500/10 scale-105' : 'border-white/10'}`}>
      <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-0.5 md:mb-1 text-center">Time Left</span>
      <span className={`text-xl md:text-3xl font-mono font-bold ${isUrgent ? 'text-red-500' : 'text-indigo-400'}`}>
        {minutes.toString().padStart(2, '0')}:{remainingSeconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [customTaskInput, setCustomTaskInput] = useState({
    type: TaskType.EMAIL,
    title: '',
    prompt: ''
  });
  const [examState, setExamState] = useState<ExamState>({
    currentQuestion: null,
    userResponse: '',
    timeLeft: 0,
    isActive: false,
    isFinished: false,
    isEvaluating: false,
    feedback: null
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save logic
  useEffect(() => {
    if (examState.isActive && examState.currentQuestion) {
      const key = `celwrite_draft_${examState.currentQuestion.id}`;
      localStorage.setItem(key, examState.userResponse);
    }
  }, [examState.userResponse, examState.isActive, examState.currentQuestion]);

  // Timer logic
  useEffect(() => {
    if (examState.isActive && examState.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setExamState(prev => {
          if (prev.timeLeft <= 1) {
            clearInterval(timerRef.current!);
            return { ...prev, timeLeft: 0, isActive: false, isFinished: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examState.isActive, examState.timeLeft]);

  const startExam = (question: Question) => {
    const savedDraft = localStorage.getItem(`celwrite_draft_${question.id}`);
    setExamState({
      currentQuestion: question,
      userResponse: savedDraft || '',
      timeLeft: question.timeLimit * 60,
      isActive: true,
      isFinished: false,
      isEvaluating: false,
      feedback: null
    });
    setView(AppView.EXAM);
  };

  const startCustomExam = () => {
    if (!customTaskInput.title.trim() || !customTaskInput.prompt.trim()) {
      alert("Please enter a title and prompt for your session.");
      return;
    }

    const customQuestion: Question = {
      id: `custom-${Date.now()}`,
      type: customTaskInput.type,
      title: customTaskInput.title,
      prompt: customTaskInput.prompt,
      wordCount: { min: 150, max: 200 },
      timeLimit: customTaskInput.type === TaskType.EMAIL ? 27 : 26,
      guidelines: customTaskInput.type === TaskType.EMAIL 
        ? ['Proper Salutation', 'Clear Opening', 'Contextual Content', 'Polite Conclusion', 'Closing']
        : ['Clear Preference', 'Detailed Argument 1', 'Detailed Argument 2', 'Comparative View', 'Closing']
    };

    startExam(customQuestion);
  };

  const endExam = async () => {
    if (window.confirm("Complete test and start AI Evaluation?")) {
      const currentQuestion = examState.currentQuestion;
      const currentResponse = examState.userResponse;

      if (!currentQuestion) {
        alert("Session error: No active question.");
        return;
      }

      // Update state to start evaluating
      setExamState(prev => ({ ...prev, isActive: false, isFinished: true, isEvaluating: true }));
      setView(AppView.EVALUATION);
      
      try {
        const result = await GeminiService.evaluateResponse(currentQuestion, currentResponse);
        setExamState(prev => ({ ...prev, isEvaluating: false, feedback: result }));
      } catch (err) {
        console.error("Evaluation Error:", err);
        alert(err instanceof Error ? err.message : "Failed to generate evaluation report.");
        setExamState(prev => ({ ...prev, isEvaluating: false }));
      }
    }
  };

  const wordCount = examState.userResponse.trim() ? examState.userResponse.trim().split(/\s+/).length : 0;
  const isWordCountInvalid = examState.currentQuestion && (wordCount < examState.currentQuestion.wordCount.min || wordCount > examState.currentQuestion.wordCount.max);

  const renderLanding = () => (
    <div className="max-w-4xl mx-auto text-center py-20 md:py-32 px-4">
      <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 md:mb-8 animate-pulse">
        Gemini 3 Pro Assessment
      </div>
      <h2 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
        Master CELPIP <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Writing.</span>
      </h2>
      <p className="text-lg md:text-xl text-gray-400 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
        Experience a high-precision simulator with robust AI assessment designed for serious candidates.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
        <button 
          onClick={() => setView(AppView.TASK_SELECTOR)}
          className="px-8 py-4 md:px-10 md:py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-95"
        >
          Practice Mode
        </button>
        <button 
          onClick={() => setView(AppView.CUSTOM_CREATOR)}
          className="px-8 py-4 md:px-10 md:py-5 glass-button text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95"
        >
          Custom Challenge
        </button>
      </div>
    </div>
  );

  const renderTaskSelector = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <button onClick={() => setView(AppView.LANDING)} className="text-indigo-400 font-bold flex items-center gap-2 hover:text-indigo-300 transition-colors text-sm md:text-base">
          ← Dashboard
        </button>
        <h2 className="text-xl md:text-3xl font-bold text-white">Select Task</h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <section>
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2 md:p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">📧</div>
            <h3 className="text-lg md:text-2xl font-bold text-white">Task 1: Email</h3>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 md:pr-4">
            {TASK_1_QUESTIONS.map(q => (
              <GlassCard key={q.id} className="cursor-pointer hover:border-indigo-500/50 transition-all group hover:bg-white/[0.05]">
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{q.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{q.timeLimit} Min • {q.wordCount.min}-{q.wordCount.max} Words</p>
                  </div>
                  <button 
                    onClick={() => startExam(q)}
                    className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all text-xs font-bold"
                  >
                    Start
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2 md:p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">📊</div>
            <h3 className="text-lg md:text-2xl font-bold text-white">Task 2: Survey</h3>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 md:pr-4">
            {TASK_2_QUESTIONS.map(q => (
              <GlassCard key={q.id} className="cursor-pointer hover:border-indigo-500/50 transition-all group hover:bg-white/[0.05]">
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{q.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{q.timeLimit} Min • {q.wordCount.min}-{q.wordCount.max} Words</p>
                  </div>
                  <button 
                    onClick={() => startExam(q)}
                    className="flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all text-xs font-bold"
                  >
                    Start
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderExam = () => {
    if (!examState.currentQuestion) return null;
    
    return (
      <div className="max-w-7xl mx-auto px-2 md:px-4 pb-12 md:pb-20">
        <div className="flex flex-col items-center mb-6 md:mb-10">
          <Timer seconds={examState.timeLeft} />
        </div>
        
        <div className="grid grid-cols-5 gap-2 md:gap-8 min-h-[500px]">
          {/* Question Panel - 2/5 width */}
          <div className="col-span-2">
            <GlassCard className="sticky top-20 md:top-32 h-[80vh] md:h-fit md:max-h-[70vh] overflow-y-auto border-l-2 md:border-l-4 border-indigo-600 bg-black/40 !p-2 md:!p-6">
              <span className="inline-block px-1.5 py-0.5 md:px-3 md:py-1 bg-indigo-500/20 text-indigo-300 text-[7px] md:text-[10px] font-black tracking-widest rounded-full mb-2 md:mb-6 border border-indigo-500/30 uppercase">
                {examState.currentQuestion.type === TaskType.EMAIL ? 'T1: EMAIL' : 'T2: SURVEY'}
              </span>
              <h2 className="text-[10px] md:text-2xl font-bold text-white mb-2 md:mb-6 leading-tight truncate md:whitespace-normal">{examState.currentQuestion.title}</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-[9px] md:text-sm border-b border-white/5 pb-2 md:pb-8 mb-2 md:mb-8">
                {examState.currentQuestion.prompt}
              </div>
              
              {examState.currentQuestion.guidelines && (
                <div className="mb-2 md:mb-8 p-1.5 md:p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg md:rounded-2xl">
                   <h4 className="text-[7px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 md:mb-2">Assessment Goals</h4>
                   <ul className="space-y-1 md:space-y-2">
                      {examState.currentQuestion.guidelines.map((g, i) => (
                        <li key={i} className="flex gap-1 items-start text-[8px] md:text-xs text-gray-400">
                          <span className="text-indigo-500 font-bold">•</span>
                          {g}
                        </li>
                      ))}
                   </ul>
                </div>
              )}
              
              {examState.currentQuestion.options && (
                <div className="mt-2 md:mt-6 space-y-1 md:space-y-4">
                  <h4 className="text-[7px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5 md:mb-2">Options</h4>
                  {examState.currentQuestion.options.map((opt, i) => (
                    <div key={i} className="p-1.5 md:p-4 bg-white/5 border border-white/10 rounded-md md:rounded-2xl text-[8px] md:text-sm text-gray-300 leading-tight md:leading-relaxed">
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Editor Panel - 3/5 width */}
          <div className="col-span-3">
            <GlassCard className="h-[80vh] md:h-full flex flex-col !p-0 overflow-hidden bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-h-[400px] md:min-h-[600px] border border-white/10">
              <div className="px-2 py-2 md:px-8 md:py-5 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex items-center gap-2 md:gap-6">
                  <div className="flex flex-col">
                    <span className="text-[7px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest">Words</span>
                    <span className={`text-xs md:text-xl font-mono font-bold ${isWordCountInvalid ? 'text-red-500' : 'text-green-500'}`}>
                      {wordCount}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={endExam}
                  className="w-full sm:w-auto px-4 py-2 md:px-8 md:py-3 bg-indigo-600 text-white rounded-md md:rounded-2xl font-bold text-xs md:text-base shadow-xl hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                >
                  Evaluate
                </button>
              </div>
              <textarea 
                className="flex-1 p-2 md:p-10 text-[10px] md:text-xl text-gray-200 focus:outline-none resize-none leading-normal md:leading-relaxed bg-transparent selection:bg-indigo-500/30"
                placeholder="Compose your response..."
                autoFocus
                value={examState.userResponse}
                onChange={(e) => setExamState(prev => ({ ...prev, userResponse: e.target.value }))}
              />
            </GlassCard>
          </div>
        </div>
      </div>
    );
  };

  const renderEvaluation = () => {
    if (examState.isEvaluating) {
      return (
        <div className="max-w-2xl mx-auto py-32 px-4 text-center">
          <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto mb-8 md:mb-12">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 md:mb-6 tracking-tight">AI Assessment in Progress</h2>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed px-4">Our AI examiner is generating a robust and honest CELPIP report...</p>
        </div>
      );
    }

    if (!examState.feedback) {
      return (
        <div className="max-w-2xl mx-auto py-32 px-4 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-6">Evaluation Connection Error</h2>
          <p className="text-gray-400 mb-8">We could not connect to the evaluation service. Please verify your API key configuration.</p>
          <button onClick={() => setView(AppView.TASK_SELECTOR)} className="px-8 py-3 bg-white/10 text-white rounded-xl font-bold border border-white/10">Back to Tasks</button>
        </div>
      );
    }

    const { feedback } = examState;

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-32">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center mb-12 md:mb-16">
          <GlassCard className="text-center min-w-[200px] md:min-w-[280px] border-indigo-500/40 py-8 md:py-12 bg-indigo-500/5">
            <span className="text-[8px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-2 md:mb-4">Honest Band Score</span>
            <span className="text-6xl md:text-9xl font-black text-white tracking-tighter">{feedback.bandScore}</span>
            <span className="text-[10px] md:text-xs text-indigo-300 font-bold block mt-4 md:mt-6 tracking-widest uppercase">Expert Assessment</span>
          </GlassCard>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 tracking-tight">Performance Summary</h2>
            <p className="text-gray-400 text-sm md:text-lg mb-6 md:mb-8">Assessment of {examState.currentQuestion?.title}</p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
               <button onClick={() => setView(AppView.TASK_SELECTOR)} className="px-6 py-2.5 md:px-8 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-bold hover:bg-indigo-700 transition-all text-xs md:text-base">Start New Task</button>
               <button onClick={() => window.print()} className="px-6 py-2.5 md:px-8 md:py-3 glass-button text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-base">Download Report</button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {[
            { label: 'Task Achievement', icon: '🎯', text: feedback.sections.taskAchievement, color: 'blue' },
            { label: 'Coherence & Cohesion', icon: '🔗', text: feedback.sections.coherenceAndCohesion, color: 'purple' },
            { label: 'Vocabulary Range', icon: '📖', text: feedback.sections.vocabularyRange, color: 'emerald' },
            { label: 'Grammar & Accuracy', icon: '⚖️', text: `${feedback.sections.grammarAccuracy}`, color: 'orange' },
            { label: 'Tone & Formality', icon: '🎭', text: `${feedback.sections.toneAndFormality}`, color: 'rose' }
          ].map((item, idx) => (
            <GlassCard key={idx} className="flex flex-col gap-4 border-white/5">
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-3">
                <span className={`w-8 h-8 md:w-10 md:h-10 bg-white/5 flex items-center justify-center rounded-lg border border-white/10`}>{item.icon}</span>
                {item.label}
              </h3>
              <p className="text-gray-400 leading-relaxed text-[11px] md:text-sm whitespace-pre-wrap">{item.text}</p>
            </GlassCard>
          ))}
        </div>

        <div className="space-y-8">
          <GlassCard className="bg-indigo-500/[0.03] border-indigo-500/20">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 flex items-center gap-4">
               <span className="w-1.5 h-8 bg-indigo-500 rounded-full"></span>
               How to Improve Your Score
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
              {feedback.suggestions.map((s, i) => (
                <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="w-8 h-8 flex-shrink-0 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full flex items-center justify-center text-xs font-black">{i+1}</span>
                  <p className="text-gray-300 text-xs md:text-sm leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-emerald-500/[0.03] border-emerald-500/20">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 flex items-center gap-4">
               <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
               Vocabulary Replacements (CLB 9+)
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feedback.vocabularyReplacements.map((v, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400/80 line-through text-xs font-mono">{v.original}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-emerald-400 font-bold">{v.replacement}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 italic leading-snug">{v.reason}</div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-black/40 border-indigo-500/30">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-3">
               <span className="px-2 py-0.5 bg-indigo-600 text-[10px] rounded text-white uppercase font-black">Expert Solution</span>
               Perfect Band 12 Sample
            </h3>
            <div className="p-4 md:p-8 bg-indigo-500/5 rounded-xl md:rounded-2xl text-indigo-100/90 leading-relaxed md:leading-loose whitespace-pre-wrap font-serif text-sm md:text-lg italic selection:bg-indigo-500/30 border border-indigo-500/10 shadow-inner">
              {feedback.sampleModelResponse}
            </div>
          </GlassCard>

          {feedback.annotatedResponse && (
            <GlassCard className="bg-black/40 border-white/5">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Annotated Feedback</h3>
              <div className="p-4 md:p-8 bg-white/5 rounded-xl md:rounded-2xl text-gray-300 leading-relaxed md:leading-loose whitespace-pre-wrap font-serif text-sm md:text-lg selection:bg-indigo-500/30">
                {feedback.annotatedResponse}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    );
  };

  const renderCustomCreator = () => {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
         <button onClick={() => setView(AppView.LANDING)} className="text-indigo-400 font-bold mb-6 md:mb-8 flex items-center gap-2 hover:opacity-80 transition-opacity">← Dashboard</button>
         <GlassCard className="bg-black/40 border-white/10">
           <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Custom Practice Session</h2>
           <p className="text-gray-400 mb-8 md:mb-10 text-sm md:text-base leading-relaxed">Design your own scenario and get robust AI feedback.</p>
           <div className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3">Session Type</label>
                <select 
                  className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl appearance-none cursor-pointer font-medium text-sm bg-black border border-white/10 text-white"
                  value={customTaskInput.type}
                  onChange={(e) => setCustomTaskInput(prev => ({ ...prev, type: e.target.value as TaskType }))}
                >
                  <option value={TaskType.EMAIL}>Email Writing (Task 1)</option>
                  <option value={TaskType.SURVEY}>Survey Response (Task 2)</option>
                </select>
              </div>
              <div>
                <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3">Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Refund Request for Flight" 
                  className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl font-medium text-sm bg-black border border-white/10 text-white focus:border-indigo-500 outline-none transition-colors"
                  value={customTaskInput.title}
                  onChange={(e) => setCustomTaskInput(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3">Scenario Detail</label>
                <textarea 
                  rows={6} 
                  placeholder="Paste or write the prompt details here..." 
                  className="w-full p-3 md:p-4 rounded-xl md:rounded-2xl font-medium resize-none text-sm bg-black border border-white/10 text-white focus:border-indigo-500 outline-none transition-colors"
                  value={customTaskInput.prompt}
                  onChange={(e) => setCustomTaskInput(prev => ({ ...prev, prompt: e.target.value }))}
                />
              </div>
              <button 
                onClick={startCustomExam}
                className="w-full py-4 md:py-5 bg-indigo-600 text-white font-black rounded-xl md:rounded-2xl shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all text-base md:text-lg active:scale-95 uppercase tracking-widest"
              >
                Start Session
              </button>
           </div>
         </GlassCard>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative selection:bg-indigo-500/30">
      <Header onHome={() => setView(AppView.LANDING)} />
      <main className="relative z-10">
        {view === AppView.LANDING && renderLanding()}
        {view === AppView.TASK_SELECTOR && renderTaskSelector()}
        {view === AppView.EXAM && renderExam()}
        {view === AppView.EVALUATION && renderEvaluation()}
        {view === AppView.CUSTOM_CREATOR && renderCustomCreator()}
      </main>
      <footer className="py-12 md:py-20 px-4 border-t border-white/5 mt-10 md:mt-20 opacity-40">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-[8px] md:text-[10px] font-bold tracking-widest uppercase">
          <p>&copy; 2024 CELWRITE LABS. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
