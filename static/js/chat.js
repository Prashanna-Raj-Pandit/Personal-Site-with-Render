/* ============================================================
   RAG CHAT WIDGET — chat.js
   Connects to FastAPI /chat and /transcribe endpoints.
   Drop-in widget for the portfolio — no external dependencies.
   ============================================================ */

(function () {
    'use strict';

    // ── Config ────────────────────────────────────────────────
    const API_BASE   = '';          // same origin — FastAPI serves everything
    const CHAT_URL   = API_BASE + '/chat';
    const TRANSCRIBE_URL = API_BASE + '/transcribe';

    const SUGGESTIONS = [
        'Tell me about yourself',
        'What projects have you built?',
        'What are your skills?',
        'What is your experience?',
        'How can I contact you?',
    ];

    // ── State ─────────────────────────────────────────────────
    let widgetOpen    = false;
    let currentMode   = 'text';   // 'text' | 'voice'
    let loading       = false;
    let mediaRecorder = null;
    let audioChunks   = [];
    let isListening   = false;

    // ── DOM refs (populated after init) ──────────────────────
    let trigger, widget, procBar,
        chatPanel, voicePanel,
        messagesEl, inputEl, sendBtn,
        evidenceEl,
        modeBtnText, modeBtnVoice,
        orbEl, voiceHint, voiceTranscript, voiceAnswer,
        suggestionsEl;

    // ── Boot ──────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        injectHTML();
        cacheDOM();
        bindEvents();
        renderSuggestions();
        addWelcomeMessage();
    }

    // ── Inject widget HTML into page ──────────────────────────
    function injectHTML() {
        const html = `
        <!-- RAG trigger button -->
        <button id="rag-trigger" title="Ask me anything" aria-label="Open AI assistant">
            <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>

        <!-- RAG widget -->
        <div id="rag-widget" role="dialog" aria-label="AI Portfolio Assistant">

            <!-- Processing bar -->
            <div id="rag-proc-bar"></div>

            <!-- Header -->
            <div id="rag-header">
                <div class="rag-header-left">
                    <div class="rag-avatar">🤖</div>
                    <div>
                        <div class="rag-title">Portfolio Assistant</div>
                        <div class="rag-subtitle">Powered by RAG · Ask anything</div>
                    </div>
                </div>
                <div class="rag-header-right">
                    <div class="rag-mode-toggle">
                        <button class="rag-mode-btn active" id="rag-mode-text" title="Text mode">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </button>
                        <button class="rag-mode-btn" id="rag-mode-voice" title="Voice mode">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div id="rag-body">

                <!-- TEXT CHAT PANEL -->
                <div id="rag-chat-panel">
                    <div id="rag-messages"></div>

                    <!-- Suggestion chips -->
                    <div class="rag-suggestions" id="rag-suggestions"></div>

                    <!-- Evidence strip -->
                    <div id="rag-evidence">
                        <div class="rag-ev-label">Sources retrieved</div>
                        <div id="rag-ev-items"></div>
                    </div>

                    <!-- Input -->
                    <div id="rag-input-area">
                        <div id="rag-input-wrap">
                            <textarea id="rag-input" rows="1"
                                placeholder="Ask about my experience, projects, skills..."></textarea>
                            <button id="rag-send" aria-label="Send">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- VOICE PANEL -->
                <div id="rag-voice-panel">
                    <div class="rag-voice-orb" id="rag-orb">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                    </div>
                    <div class="rag-voice-hint" id="rag-voice-hint">CLICK ORB TO SPEAK</div>
                    <div class="rag-voice-transcript" id="rag-voice-transcript"></div>
                    <div class="rag-voice-answer" id="rag-voice-answer"></div>
                </div>

            </div><!-- end body -->
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ── Cache DOM refs ────────────────────────────────────────
    function cacheDOM() {
        trigger          = document.getElementById('rag-trigger');
        widget           = document.getElementById('rag-widget');
        procBar          = document.getElementById('rag-proc-bar');
        chatPanel        = document.getElementById('rag-chat-panel');
        voicePanel       = document.getElementById('rag-voice-panel');
        messagesEl       = document.getElementById('rag-messages');
        inputEl          = document.getElementById('rag-input');
        sendBtn          = document.getElementById('rag-send');
        evidenceEl       = document.getElementById('rag-evidence');
        modeBtnText      = document.getElementById('rag-mode-text');
        modeBtnVoice     = document.getElementById('rag-mode-voice');
        orbEl            = document.getElementById('rag-orb');
        voiceHint        = document.getElementById('rag-voice-hint');
        voiceTranscript  = document.getElementById('rag-voice-transcript');
        voiceAnswer      = document.getElementById('rag-voice-answer');
        suggestionsEl    = document.getElementById('rag-suggestions');
    }

    // ── Bind events ───────────────────────────────────────────
    function bindEvents() {
        // Toggle widget open/close
        trigger.addEventListener('click', toggleWidget);

        // Mode buttons
        modeBtnText.addEventListener('click',  () => setMode('text'));
        modeBtnVoice.addEventListener('click', () => setMode('voice'));

        // Text input
        inputEl.addEventListener('input', () => {
            inputEl.style.height = 'auto';
            inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
        });
        inputEl.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTextMessage();
            }
        });

        // Send button
        sendBtn.addEventListener('click', sendTextMessage);

        // Voice orb
        orbEl.addEventListener('click', toggleVoice);

        // Close on Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && widgetOpen) closeWidget();
        });
    }

    // ── Suggestion chips ──────────────────────────────────────
    function renderSuggestions() {
        suggestionsEl.innerHTML = SUGGESTIONS.map(s =>
            `<button class="rag-chip">${s}</button>`
        ).join('');

        suggestionsEl.querySelectorAll('.rag-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                inputEl.value = chip.textContent;
                sendTextMessage();
                // hide suggestions after first use
                suggestionsEl.style.display = 'none';
            });
        });
    }

    // ── Welcome message ───────────────────────────────────────
    function addWelcomeMessage() {
        addMessage('bot',
            "Hi! 👋 I'm an AI assistant trained on this portfolio. " +
            "Ask me about projects, skills, experience, or anything else about Prashanna."
        );
    }

    // ── Open / Close ──────────────────────────────────────────
    function toggleWidget() {
        widgetOpen ? closeWidget() : openWidget();
    }

    function openWidget() {
        widgetOpen = true;
        widget.classList.add('open');
        trigger.classList.add('open');
        // focus input if text mode
        if (currentMode === 'text') {
            setTimeout(() => inputEl.focus(), 350);
        }
    }

    function closeWidget() {
        widgetOpen = false;
        widget.classList.remove('open');
        trigger.classList.remove('open');
        stopVoice();
    }

    // ── Mode switching ────────────────────────────────────────
    function setMode(mode) {
        currentMode = mode;
        modeBtnText.classList.toggle('active',  mode === 'text');
        modeBtnVoice.classList.toggle('active', mode === 'voice');

        if (mode === 'text') {
            chatPanel.classList.remove('hidden');
            voicePanel.classList.remove('active');
            stopVoice();
            setTimeout(() => inputEl.focus(), 100);
        } else {
            chatPanel.classList.add('hidden');
            voicePanel.classList.add('active');
        }
    }

    // ── Processing state ──────────────────────────────────────
    function setProc(on) {
        loading = on;
        procBar.classList.toggle('on', on);
        sendBtn.disabled = on;
    }

    // ══════════════════════════════════════════════════════════
    // TEXT CHAT
    // ══════════════════════════════════════════════════════════
    function addMessage(role, text) {
        const d = document.createElement('div');
        d.className = `rag-msg ${role}`;
        d.innerHTML = `
            <div class="rag-msg-who">${role === 'user' ? 'You' : 'Assistant'}</div>
            <div class="rag-msg-bubble">${escapeHTML(text)}</div>
        `;
        messagesEl.appendChild(d);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return d;
    }

    function addTyping() {
        const d = document.createElement('div');
        d.className = 'rag-msg bot';
        d.id = 'rag-typing';
        d.innerHTML = `
            <div class="rag-msg-who">Assistant</div>
            <div class="rag-typing">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesEl.appendChild(d);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('rag-typing');
        if (el) el.remove();
    }

    function renderEvidence(items) {
        if (!items || !items.length) {
            evidenceEl.classList.remove('has-items');
            return;
        }
        evidenceEl.classList.add('has-items');
        document.getElementById('rag-ev-items').innerHTML = items.map(it => `
            <div class="rag-ev-item">
                <span class="rag-ev-score">${it.score ? Math.round(it.score * 100) + '%' : '—'}</span>
                <span class="rag-ev-text">${escapeHTML((it.text || '').slice(0, 70))}…</span>
                <span class="rag-ev-src">${escapeHTML(it.source || '')}</span>
            </div>
        `).join('');
    }

    async function sendTextMessage() {
        const text = inputEl.value.trim();
        if (!text || loading) return;

        // clear input
        inputEl.value = '';
        inputEl.style.height = 'auto';
        suggestionsEl.style.display = 'none';

        addMessage('user', text);
        addTyping();
        setProc(true);

        try {
            const res  = await fetch(CHAT_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ message: text })
            });
            if (!res.ok) {
                removeTyping();
                if (res.status === 504) {
                    addMessage('bot', '⏱ The response took too long. Please try again — it should be faster now that the server is warm.');
                } else {
                    addMessage('bot', `⚠ Server error (${res.status}). Please try again.`);
                }
                setProc(false);
                return;
            }
            const data = await res.json();
            removeTyping();
            addMessage('bot', data.answer || 'Sorry, I could not find an answer.');
            if (data.evidence) renderEvidence(data.evidence);
        } catch {
            removeTyping();
            addMessage('bot', '⚠ Could not reach the server. Please try again in a moment.');
        }

        setProc(false);
    }

    // ══════════════════════════════════════════════════════════
    // VOICE (MediaRecorder → /transcribe → /chat → TTS)
    // ══════════════════════════════════════════════════════════
    async function toggleVoice() {
        if (isListening) {
            // stop recording → triggers onstop
            mediaRecorder.stop();
            isListening = false;
            orbEl.classList.remove('listening');
            voiceHint.textContent = 'PROCESSING…';
            return;
        }

        // request mic
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            voiceHint.textContent = 'MIC ACCESS DENIED';
            return;
        }

        audioChunks   = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());     // release mic

            const blob     = new Blob(audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');

            voiceHint.textContent = 'TRANSCRIBING…';
            setProc(true);

            try {
                // 1. Transcribe audio → text via Whisper
                const tRes  = await fetch(TRANSCRIBE_URL, { method: 'POST', body: formData });
                const tData = await tRes.json();
                const text  = tData.transcript?.trim();

                if (!text) {
                    voiceHint.textContent = 'NOTHING HEARD — TRY AGAIN';
                    setProc(false);
                    return;
                }

                voiceTranscript.textContent = text;

                // 2. Send transcript to /chat
                voiceHint.textContent = 'THINKING…';
                const cRes  = await fetch(CHAT_URL, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ message: text })
                });
                if (!cRes.ok) {
                    voiceHint.textContent = cRes.status === 504 ? 'TIMEOUT — TRY AGAIN' : 'SERVER ERROR — TRY AGAIN';
                    voiceAnswer.textContent = cRes.status === 504
                        ? '⏱ Took too long. Try again — server should be warmer now.'
                        : `⚠ Server error (${cRes.status}).`;
                    setProc(false);
                    return;
                }
                const cData = await cRes.json();
                const answer = cData.answer || 'I could not find an answer.';

                voiceAnswer.textContent  = answer;
                voiceHint.textContent   = 'CLICK ORB TO SPEAK AGAIN';

                // 3. Text-to-speech — browser reads answer aloud
                if ('speechSynthesis' in window) {
                    const u   = new SpeechSynthesisUtterance(answer);
                    u.rate    = 0.95;
                    u.pitch   = 1.02;
                    window.speechSynthesis.speak(u);
                }

            } catch {
                voiceHint.textContent   = 'ERROR — TRY AGAIN';
                voiceAnswer.textContent = '⚠ Backend connection failed.';
            }

            setProc(false);
        };

        // start recording
        mediaRecorder.start();
        isListening = true;
        orbEl.classList.add('listening');
        voiceHint.textContent       = 'LISTENING… CLICK TO STOP';
        voiceTranscript.textContent = '';
        voiceAnswer.textContent     = '';
    }

    function stopVoice() {
        if (mediaRecorder && isListening) {
            mediaRecorder.stop();
            isListening = false;
        }
        if (orbEl) orbEl.classList.remove('listening');
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    // ── Utility ───────────────────────────────────────────────
    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})();
