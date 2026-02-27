/**
 * AI Assistant Component
 * Features: AI Chat, Model Selector, Smart Router
 */

const AI_CONFIG = {
    // API KEY is provided by the user
    API_KEY: "",
    MODELS: {
        "flash": { gemini: "gemini-1.5-flash", anthropic: "claude-3-haiku-20240307" },
        "pro": { gemini: "gemini-1.5-pro", anthropic: "claude-3-5-sonnet-20240620" },
        "flash-2": { gemini: "gemini-2.0-flash-exp", anthropic: "claude-3-haiku-20240307" },
        "gemini-2.5": { gemini: "gemini-1.5-pro", anthropic: "claude-3-5-sonnet-20240620" }
    },
    DEFAULT_MODEL: "flash"
};

class AISmartBuddy {
    constructor() {
        this.activeModel = AI_CONFIG.DEFAULT_MODEL;
        this.chatHistory = [];
        this.isProcessing = false;

        this.init();
    }

    init() {
        this.createElements();
        this.bindEvents();
        this.makeDraggable();
        this.addWelcomeMessage();
    }

    createElements() {
        // Create AI Panel HTML
        const panelHtml = `
            <div class="ai-panel" id="aiPanel">
                <div class="ai-header" id="aiHeader">
                    <div class="ai-header-info">
                        <div class="ai-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                        </div>
                        <div>
                            <div class="ai-title">JMC Smart Assistant</div>
                            <div class="ai-status">Online</div>
                        </div>
                    </div>
                    <button class="ai-close" id="aiClose">✕</button>
                </div>
                
                <div class="ai-model-selector" id="aiModelSelector">
                    <div class="ai-model-chip active" data-model="flash">Flash 1.5</div>
                    <div class="ai-model-chip" data-model="flash-2">Flash 2.0</div>
                    <div class="ai-model-chip" data-model="pro">Pro 1.5</div>
                    <div class="ai-model-chip" data-model="gemini-2.5">Gemini 2.5</div>
                </div>

                <div class="ai-chat-area" id="aiChatArea"></div>

                <div class="ai-input-area">
                    <form id="aiChatForm" class="ai-input-wrapper">
                        <input type="text" class="ai-input" id="aiInput" placeholder="Ask me anything..." autocomplete="off">
                        <button type="submit" class="ai-send" id="aiSend">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHtml);

        // References
        this.panel = document.getElementById('aiPanel');
        this.header = document.getElementById('aiHeader');
        this.chatArea = document.getElementById('aiChatArea');
        this.form = document.getElementById('aiChatForm');
        this.input = document.getElementById('aiInput');
        this.closeBtn = document.getElementById('aiClose');
        this.modelChips = document.querySelectorAll('.ai-model-chip');
    }

    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserQuery();
        });

        // Toggle panel from sidebar buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.ai-buddy-btn');
            if (btn) {
                this.togglePanel(!this.panel.classList.contains('active'));
            }
        });

        // Close button
        this.closeBtn.addEventListener('click', () => this.togglePanel(false));

        // Model selection
        this.modelChips.forEach(chip => {
            chip.addEventListener('click', () => {
                this.modelChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeModel = chip.dataset.model;
            });
        });
    }

    makeDraggable() {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        this.header.onmousedown = (e) => {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        };

        const elementDrag = (e) => {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Set the element's new position:
            this.panel.style.top = (this.panel.offsetTop - pos2) + "px";
            this.panel.style.left = (this.panel.offsetLeft - pos1) + "px";
            this.panel.style.bottom = 'auto';
            this.panel.style.right = 'auto';
        };

        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    togglePanel(show) {
        if (show) {
            this.panel.classList.add('active');
            this.input.focus();
        } else {
            this.panel.classList.remove('active');
        }
    }

    addMessage(text, role) {
        const msgDiv = document.createElement('div');
        // UI always uses 'bot' or 'user' classes
        const displayRole = (role === 'bot' || role === 'model' || role === 'assistant') ? 'bot' : 'user';
        msgDiv.className = `ai-message ${displayRole}`;

        // Simple formatting for code blocks or multi-line text
        if (text.includes('```')) {
            const formatted = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            msgDiv.innerHTML = formatted.replace(/\n/g, '<br>');
        } else {
            msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        }

        this.chatArea.appendChild(msgDiv);
        this.chatArea.scrollTop = this.chatArea.scrollHeight;

        // Store role as 'user' or 'assistant' (Anthropic style) or 'model' (Gemini style)
        // We'll normalize to 'user'/'assistant' here and map later
        const normalizedRole = displayRole === 'bot' ? 'assistant' : 'user';

        // Interleaving guard: if last message has same role, append text
        if (this.chatHistory.length > 0 && this.chatHistory[this.chatHistory.length - 1].role === normalizedRole) {
            this.chatHistory[this.chatHistory.length - 1].parts[0].text += "\n" + text;
        } else {
            this.chatHistory.push({ role: normalizedRole, parts: [{ text }] });
        }
    }

    addWelcomeMessage() {
        const isStaff = window.location.pathname.includes('staff');
        const role = isStaff ? 'Staff' : 'Student';
        this.addMessage(`Hello ${role}! I am your JMC Smart Assistant. I can help you find information or navigate to different sections of the portal. Try saying "Take me to analytics" or "How do I create a test?".`, 'bot');
    }

    async handleUserQuery() {
        const query = this.input.value.trim();
        if (!query || this.isProcessing) return;

        this.input.value = '';
        this.addMessage(query, 'user');

        // 1. SMART OFFLINE ROUTER (Zero Latency Fallback)
        // This ensures the workflow is "Perfect" even without internet/API connection
        if (this.handleNavigationLocally(query)) return;

        this.setProcessing(true);

        try {
            const response = await this.callAI(query);
            this.processAIResponse(response);
        } catch (error) {
            console.error("AI Error:", error);
            // If API fails, notify but don't break the experience
            this.addMessage(`⚠️ Intelligence System Offline. I'm currently using my local routing logic. You can still navigate using keywords like "analytics", "tests", "reports", etc.`, 'bot');
        } finally {
            this.setProcessing(false);
        }
    }

    handleNavigationLocally(query) {
        const q = query.toLowerCase();

        // Comprehensive Keyword Map for smart navigation
        const routes = {
            'analytics': ['chart', 'stat', 'analytics', 'performance', 'graph', 'progress'],
            'create-test': ['create', 'new test', 'add test', 'build test', 'generate'],
            'manage-tests': ['manage', 'list', 'edit', 'all tests', 'history'],
            'students': ['student list', 'view students', 'all students', 'database'],
            'student-lookup': ['lookup', 'find', 'search', 'get student', 'registration'],
            'availability': ['take test', 'available', 'current', 'exams'],
            'tests': ['my tests', 'attended', 'results', 'past'],
            'reports': ['download', 'certificate', 'transcript', 'merit', 'report']
        };

        for (const [sectionId, keywords] of Object.entries(routes)) {
            if (keywords.some(k => q.includes(k))) {
                this.addMessage(`Switching to **${sectionId.replace('-', ' ')}** section...`, 'bot');
                this.navigateToSection(sectionId);
                return true;
            }
        }
        return false;
    }

    setProcessing(processing) {
        this.isProcessing = processing;
        const sendBtn = document.getElementById('aiSend');
        if (processing) {
            sendBtn.style.opacity = '0.5';
            sendBtn.innerHTML = '<span class="spinner-sm"></span>';
        } else {
            sendBtn.style.opacity = '1';
            sendBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
            `;
        }
    }

    async callAI(userInput) {
        if (AI_CONFIG.API_KEY.startsWith('sk-ant')) {
            return this.callAnthropic(userInput);
        }
        return this.callGemini(userInput);
    }

    async callAnthropic(userInput) {
        const modelId = AI_CONFIG.MODELS[this.activeModel].anthropic || "claude-3-haiku-20240307";
        const isStaff = window.location.pathname.includes('staff');

        const systemPrompt = this.getSystemPrompt(isStaff);

        // Note: Anthropic strictly blocks direct browser requests due to CORS.
        // This will only work if running through a local server or proxy.
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            mode: 'cors', // Ensure CORS mode
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AI_CONFIG.API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: modelId,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [
                    ...this.chatHistory.map(m => ({
                        role: m.role, // already normalized to user/assistant
                        content: m.parts[0].text
                    })).slice(-10),
                    { role: "user", content: userInput }
                ]
            })
        });

        if (!response.ok) throw new Error(`Anthropic API Error: ${response.status}`);
        const data = await response.json();
        return data.content[0].text;
    }

    getSystemPrompt(isStaff) {
        return `
            You are JMC Smart Assistant for a Placement Portal. 
            User Role: ${isStaff ? 'Staff Member' : 'Student'}.
            Available Sections:
            ${isStaff ?
                '- Create Test (id: create-test)\n- Manage Tests (id: manage-tests)\n- Students (id: students)\n- Student Lookup (id: student-lookup)' :
                '- Availability (id: availability)\n- Tests Attended (id: tests)\n- Analytics (id: analytics)\n- Reports (id: reports)'
            }
            
            If the user wants to go to a section, include [NAVIGATE: section-id] at the end of your message.
            Keep responses professional, concise, and helpful.
        `;
    }

    async callGemini(userInput) {
        const modelId = AI_CONFIG.MODELS[this.activeModel].gemini || "gemini-1.5-flash";
        const isStaff = window.location.pathname.includes('staff');
        const systemPrompt = this.getSystemPrompt(isStaff);

        // Sanitize history to ensure interleaved roles (User, Model, User, Model...)
        const sanitizedHistory = [];
        this.chatHistory.forEach((msg) => {
            const role = msg.role === 'user' ? 'user' : 'model';
            // Prevent same role twice in a row
            if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === role) {
                sanitizedHistory[sanitizedHistory.length - 1].parts[0].text += "\n" + msg.parts[0].text;
            } else {
                sanitizedHistory.push({ role, parts: msg.parts });
            }
        });

        const body = {
            contents: [
                ...sanitizedHistory.slice(-10),
                { role: "user", parts: [{ text: userInput }] }
            ],
            system_instruction: {
                parts: [{ text: systemPrompt }]
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${AI_CONFIG.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || !data.candidates[0].content) throw new Error("Invalid response from Gemini");

        return data.candidates[0].content.parts[0].text;
    }

    processAIResponse(responseText) {
        // Check for navigation command
        const navMatch = responseText.match(/\[NAVIGATE: ([\w-]+)\]/);

        // Clean text (remove command)
        let cleanText = responseText.replace(/\[NAVIGATE: ([\w-]+)\]/, '').trim();

        this.addMessage(cleanText, 'bot');

        if (navMatch) {
            const sectionId = navMatch[1];
            this.navigateToSection(sectionId);
        }
    }

    navigateToSection(sectionId) {
        const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (navItem) {
            setTimeout(() => {
                navItem.click();
                this.addMessage(`Redirecting you to ${navItem.querySelector('span').textContent}...`, 'bot');
            }, 1000);
        } else {
            // Check for student subsections or special sections
            const lookup = {
                'create-test': 'create-test',
                'manage': 'manage-tests',
                'students': 'students',
                'lookup': 'student-lookup',
                'available': 'availability',
                'my-tests': 'tests',
                'stats': 'analytics',
                'results': 'reports'
            };

            const mappedId = lookup[sectionId];
            const mappedItem = document.querySelector(`.nav-item[data-section="${mappedId}"]`);
            if (mappedItem) mappedItem.click();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AISmartBuddy();
});
