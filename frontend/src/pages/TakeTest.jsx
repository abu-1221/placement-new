import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Send, Award, Activity } from 'lucide-react';

const TakeTest = () => {
    const { testId } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [score, setScore] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [user, setUser] = useState(null);
    const timerRef = useRef(null);
    const particlesRef = useRef(null);

    useEffect(() => {
        const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
        if (!userData) { navigate('/login'); return; }
        setUser(userData);

        const fetchTest = async () => {
            try {
                const tests = await studentService.getAvailableTests(userData.username);
                const t = tests.find(t => String(t.id) === String(testId));

                if (!t) {
                    alert('Test not found or already completed by this user.');
                    navigate('/student-dashboard');
                    return;
                }

                const qs = typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions;
                setTest(t);
                setQuestions(qs);
                setTimeRemaining(t.duration * 60);
                setStartTime(Date.now());
                initParticles();

                timerRef.current = setInterval(() => {
                    setTimeRemaining(prev => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                await studentService.startAttempt(testId, userData.username);

            } catch (err) {
                console.error(err);
                alert('Error loading test parameters. See console.');
                navigate('/student-dashboard');
            }
        };

        fetchTest();

        return () => clearInterval(timerRef.current);
    }, [testId, navigate]);

    useEffect(() => {
        if (timeRemaining === 0 && test && !isCompleted) {
            handleSubmit();
        }
    }, [timeRemaining, test, isCompleted]);

    const initParticles = () => {
        const container = particlesRef.current;
        if (!container) return;
        container.innerHTML = '';
        const particleCount = 20;
        const colors = ["rgba(59,130,246,0.3)", "rgba(139,92,246,0.3)", "rgba(168,85,247,0.3)"];
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.className = "absolute rounded-full pointer-events-none animate-float";
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.width = `${Math.random() * 6 + 2}px`;
            particle.style.height = particle.style.width;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDuration = `${Math.random() * 20 + 15}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(particle);
        }
    };

    const saveAnswer = (index, answer) => {
        setAnswers({ ...answers, [index]: answer });
    };

    const confirmSubmit = () => {
        const answeredItems = Object.keys(answers).length;
        if (answeredItems < questions.length) {
            if (!window.confirm(`Warning: You have only answered ${answeredItems} of ${questions.length} questions. Are you sure you wish to submit early?`)) {
                return;
            }
        }
        handleSubmit();
    };

    const handleSubmit = async () => {
        clearInterval(timerRef.current);

        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.answer) correct++;
        });

        const percentage = Math.round((correct / questions.length) * 100);
        const timeTaken = Math.round((Date.now() - startTime) / 1000 / 60);

        const result = {
            username: user.username,
            testId: parseInt(testId),
            testName: test.name,
            company: test.company,
            score: percentage,
            status: percentage >= 60 ? 'passed' : 'failed',
            answers: JSON.stringify(answers),
            timeTaken: timeTaken
        };

        try {
            await studentService.submitTest(result);
            setScore({ percentage, correct, total: questions.length });
            setIsCompleted(true);
        } catch (err) {
            console.error(err);
            alert('Error submitting test data: ' + err.message);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!test || (questions.length === 0 && !isCompleted)) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="w-20 h-20 relative mb-8 animate-pulse">
                    <div className="absolute inset-0 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-b-2 border-l-2 border-purple-500 rounded-full animate-spin animation-delay-200"></div>
                    <div className="absolute inset-4 border-t-2 border-l-2 border-emerald-500 rounded-full animate-spin animation-delay-500"></div>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">Instantiating Test Environment...</h2>
                <p className="text-gray-400 font-mono text-sm tracking-widest uppercase">Securing connections</p>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-[#0a0f1c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0f1c] to-[#0a0f1c] flex items-center justify-center p-6 text-white font-sans overflow-hidden">
                <div ref={particlesRef} className="absolute inset-0 z-0"></div>
                <div className="flex flex-col items-center max-w-2xl w-full z-10 animate-fade-in-up">
                    <div className={`p-8 md:p-12 bg-white/[0.02] border backdrop-blur-3xl rounded-[2rem] shadow-2xl w-full text-center relative overflow-hidden ${score.percentage >= 60 ? 'border-emerald-500/30 shadow-emerald-500/10' : 'border-red-500/30 shadow-red-500/10'}`}>

                        {/* Background glow for result card */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 rounded-full blur-[100px] pointer-events-none opacity-20 ${score.percentage >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>

                        <Award className={`w-16 h-16 mx-auto mb-6 ${score.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`} />
                        <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tight text-white">Assessment Complete</h1>

                        <div className="relative w-48 h-48 mx-auto mb-10">
                            {/* SVG Donut Chart */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-800" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                                    className={`${score.percentage >= 60 ? 'text-emerald-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                    strokeDasharray={`${(score.percentage / 100) * 283} 283`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-black ${score.percentage >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{score.percentage}%</span>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Final Score</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-4 shadow-inner">
                                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Correct</div>
                                <div className="text-2xl font-bold text-white">{score.correct}</div>
                            </div>
                            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-4 shadow-inner">
                                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center justify-center gap-1"><XCircle className="w-4 h-4 text-red-500" /> Incorrect</div>
                                <div className="text-2xl font-bold text-white">{score.total - score.correct}</div>
                            </div>
                            <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-4 shadow-inner">
                                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 flex items-center justify-center gap-1"><Activity className="w-4 h-4 text-blue-500" /> Total Qs</div>
                                <div className="text-2xl font-bold text-white">{score.total}</div>
                            </div>
                        </div>

                        <button
                            className="w-full py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all shadow-lg flex items-center justify-center gap-2 group"
                            onClick={() => navigate('/student-dashboard')}
                        >
                            Return to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const q = questions[currentIndex];

    // Compute active timer styles
    const totalTimeFloat = test.duration * 60;
    const timePercentage = (timeRemaining / totalTimeFloat) * 100;
    const isCriticalTime = timeRemaining < 120; // less than 2 minutes

    return (
        <div className="min-h-screen relative bg-[#0a0f1c] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0f1c] to-[#0a0f1c] text-white p-4 md:p-8 font-sans overflow-x-hidden">

            {/* Background Animations */}
            <div ref={particlesRef} className="absolute inset-0 z-0 opacity-50"></div>
            <div className="fixed top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none -z-10 bg-shape"></div>
            <div className="fixed bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none -z-10 bg-shape"></div>

            <div className="max-w-4xl mx-auto relative z-10 w-full animate-fade-in-up">

                {/* Header Information Pane */}
                <header className="bg-[#16162d]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-6 shadow-2xl relative overflow-hidden flex flex-col items-start lg:flex-row lg:justify-between lg:items-center">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="mb-6 lg:mb-0">
                        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{test.name}</h1>
                        <p className="text-gray-400 font-medium tracking-wide mt-2">{test.company} • Core Competency Assessment</p>
                    </div>

                    <div className="w-full lg:w-1/3 flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-4 h-4" /> Time Elapsed
                            </div>
                            <div className={`text-2xl font-mono font-bold tracking-wider ${isCriticalTime ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                {formatTime(timeRemaining)}
                            </div>
                        </div>
                        {/* Dynamic Timer Bar */}
                        <div className={`w-full h-2 rounded-full overflow-hidden bg-white/5 border border-white/5`}>
                            <div
                                className={`h-full opacity-90 transition-all duration-1000 ease-linear ${isCriticalTime ? 'bg-red-500' : timePercentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.max(0, timePercentage)}%` }}
                            ></div>
                        </div>
                    </div>
                </header>

                {/* Primary Question Rendering Pane */}
                <main className="bg-[#16162d]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">

                    <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                        <span className="text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full tracking-widest uppercase">
                            Question {currentIndex + 1}
                        </span>
                        <span className="text-sm font-mono text-gray-500">
                            {Object.keys(answers).length} of {questions.length} completed
                        </span>
                    </div>

                    <h2 className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed tracking-wide text-white mb-10">
                        {q.question}
                    </h2>

                    <div className="space-y-4 mb-12">
                        {q.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const isSelected = answers[currentIndex] === letter;
                            return (
                                <label
                                    key={i}
                                    className={`relative flex items-center p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${isSelected ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.01]' : 'bg-[#0f172a]/50 border-white/5 hover:border-white/10 hover:bg-white/[0.03] text-gray-300'}`}
                                >
                                    <input type="radio" name="option" className="hidden" checked={isSelected} onChange={() => saveAnswer(currentIndex, letter)} />

                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4 md:mr-6 transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                                        {letter}
                                    </div>
                                    <div className={`text-base md:text-lg font-medium transition-colors ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                        {opt}
                                    </div>
                                    {isSelected && <div className="absolute right-6 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-6 h-6 text-blue-400 animate-fade-in-up" /></div>}
                                </label>
                            );
                        })}
                    </div>

                    {/* Navigation Bar inside Test Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 mt-4 border-t border-white/10">
                        <div className="flex w-full sm:w-auto self-start sm:self-auto gap-3">
                            <button
                                className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border ${currentIndex > 0 ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-transparent border-transparent text-gray-600 cursor-not-allowed'}`}
                                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                                disabled={currentIndex === 0}
                            >
                                <ArrowLeft className="w-4 h-4" /> Previous
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    className="px-6 py-3 rounded-xl font-bold bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-2"
                                    onClick={() => setCurrentIndex(currentIndex + 1)}
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
                                    onClick={confirmSubmit}
                                >
                                    <Send className="w-4 h-4" /> Final Submit
                                </button>
                            )}
                        </div>

                        {/* Mini map pagination indicators */}
                        <div className="hidden lg:flex items-center gap-1">
                            {questions.map((_, idx) => {
                                let bg = 'bg-white/10';
                                if (idx === currentIndex) bg = 'bg-blue-400 scale-125';
                                else if (answers[idx]) bg = 'bg-blue-600/50';
                                return <div key={idx} className={`w-2 h-2 rounded-full transition-all duration-300 ${bg}`}></div>
                            })}
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
};

export default TakeTest;
