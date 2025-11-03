class AIAssistantApp {
    static DEBUG_MODE = false; // Debug mode (true to enable alerts)
    static STORAGE_KEY = 'com.mostnonameuser.aiassistant.settings';
    constructor(protocolId = "com.mostnonameuser.aiassistant", pingInterval = 15000) {
        
        this.globalClickHandler = this.handleGlobalClick.bind(this);

        this.protocolId = protocolId;
        this.pingInterval = pingInterval;
        this.pingTimer = null;
        this.isWaitingForResponse = false;
        this.currentRequestId = null;
        this.messageElements = new Map();
        this.STORAGE_KEYS = { SETTINGS: 'app_settings' };
        this.state = {
            messages: [],
            balance: 0.00,
            isReady: false,
            currentTheme: 'light',
            currentLanguage: 'en'
        };
        this.chatContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.backBtn = null;
        this.inputFooter = null;
        this.loadingScreen = null;
        this.settingsModal = null;
        this.feedbackModal = null;

        this.commandsMenu = null;
        this.messageContextMenu = null;

        this.settingsBtn = null;
        this.feedbackBtn = null;
        this.commandsBtn = null;
    }

    initElements = () => {
        this.chatContainer = document.getElementById("chatContainer");
        this.messageInput = document.getElementById("messageInput");
        this.sendButton = document.getElementById("sendButton");
        this.backBtn = document.getElementById("backBtn");
        this.inputFooter = document.getElementById("inputFooter");
        this.loadingScreen = document.getElementById("loadingScreen");
        this.settingsModal = document.getElementById("settingsModal");
        this.feedbackModal = document.getElementById("feedbackModal");

        this.messageContextMenu = document.getElementById("messageContextMenu"); 
        this.commandsMenu = document.getElementById("commandsMenu");
        if (this.commandsMenu) {
            this.commandsMenu.classList.add('hidden');
        }
        
        this.settingsBtn = document.getElementById("settingsBtn");
        this.feedbackBtn = document.getElementById("feedbackBtn");
        this.commandsBtn = document.getElementById("commandsBtn");
       
        this.translations = {
            ru: {
                copy: "Копировать",
                delete: "Удалить",
                settings: "Настройки",
                theme: "Тема:",
                language: "Язык:",
                close: "Закрыть",
                feedback: "Обратная связь",
                enterFeedback: "Опишите вашу проблему или предложение...",
                cancel: "Отмена",
                send: "Отправить",
                theme_light: "Светлая",
                theme_dark: "Тёмная",
                language_ru: "Русский",
                language_en: "English"
            },
            en: {
                copy: "Copy",
                delete: "Delete",
                settings: "Settings",
                theme: "Theme:",
                language: "Language:",
                close: "Close",
                feedback: "Feedback",
                enterFeedback: "Describe your problem or suggestion...",
                cancel: "Cancel",
                send: "Send",
                theme_light: "Light",
                theme_dark: "Dark",
                language_ru: "Русский",
                language_en: "English"
            }
        };
    };

    handleGlobalClick = (e) => {
        if (this._justOpenedMessageMenu) {
            return;
        }

        if (!e.target.closest('#messageContextMenu') && !e.target.closest('.message-bubble')) {
            this.hideMessageContextMenu();
        }

        const isOutsideSettings = 
            this.settingsModal && !this.settingsModal.contains(e.target) && 
            this.settingsBtn && !this.settingsBtn.contains(e.target);
        
        const isOutsideFeedback = 
            this.feedbackModal && !this.feedbackModal.contains(e.target) && 
            this.feedbackBtn && !this.feedbackBtn.contains(e.target);
        
        const isOutsideCommands = 
            this.commandsMenu && !this.commandsMenu.contains(e.target) && 
            this.commandsBtn && !this.commandsBtn.contains(e.target);

        if (isOutsideSettings) this.hideSettingsModal();
        if (isOutsideFeedback) this.hideFeedbackModal();
        if (isOutsideCommands) this.hideCommandsMenu();
    };

setupCommandItems = () => {
    const menu = this.commandsMenu;
    if (!menu) return;

    const items = menu.querySelectorAll('.command-item');
    items.forEach(item => {
        const clone = item.cloneNode(true);
        item.replaceWith(clone);
        clone.addEventListener('click', (e) => {
            e.stopPropagation();
            const cmd = clone.textContent.trim();
            if (cmd === "Help" || cmd === "Clear chat") {
                this.handleCommandSelect(cmd);
                this.hideCommandsMenu();
            }
        });
    });
};

    setupControls = () => {
        document.addEventListener('click', this.globalClickHandler);
        this.sendButton?.addEventListener("click", () => {
            if (AIAssistantApp.DEBUG_MODE) {
                alert("Send button pressed");
            }
            this.handleSendClick();
        });
        this.messageInput?.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !this.isWaitingForResponse) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.backBtn?.addEventListener("click", () => SpixiAppSdk.back());
        this.settingsBtn?.addEventListener("click", () => this.showSettingsModal());
        this.feedbackBtn?.addEventListener("click", () => this.showFeedbackModal());
        this.commandsBtn?.addEventListener("click", () => {
            if (AIAssistantApp.DEBUG_MODE) {
                alert("Command button pressed");
            }
            this.toggleCommandsMenu();
        });
        this.setupCommandItems();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSettingsModal();
                this.hideFeedbackModal();
                this.hideCommandsMenu();
            }
        });

        document.getElementById("closeSettingsBtn")?.addEventListener("click", () => this.hideSettingsModal());
        document.getElementById("cancelFeedbackBtn")?.addEventListener("click", () => this.hideFeedbackModal());
        document.getElementById("sendFeedbackBtn")?.addEventListener("click", () => this.sendFeedback());

        document.getElementById("themeSelect")?.addEventListener("change", (e) => {
            this.state.currentTheme = e.target.value;
            this.applyTheme();
            this.updateSelectOptions();
            saveSettings(this.state.currentTheme, this.state.currentLanguage);
        });

        document.getElementById("languageSelect")?.addEventListener("change", (e) => {
            this.state.currentLanguage = e.target.value;
            this.updateTranslations();
            this.updateSelectOptions();
            saveSettings(this.state.currentTheme, this.state.currentLanguage);
        });

        this.messageInput?.addEventListener("input", () => {
            this.autoResizeTextarea();
        });

    };

    applyTheme = () => {
        if (this.state.currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    handleCommandSelect = (commandText) => {
        switch (commandText) {
            case 'Help':
                SpixiAppSdk.sendNetworkProtocolData(this.protocolId, JSON.stringify({ action: "help" }));
                break;
            case 'Clear chat':
                let earliestTimestamp = null;
                const firstMessageElement = this.chatContainer.querySelector('.message-bubble');
                if (firstMessageElement) {
                    const messageId = firstMessageElement.dataset.messageId;
                    if (messageId) {
                        earliestTimestamp = messageId;
                    }
                }
                SpixiAppSdk.sendNetworkProtocolData(this.protocolId, JSON.stringify({ action: "wipe", ts: earliestTimestamp }));
                this.clearChat();
                break;
        }
    };

    updateTranslations = () => {
        const t = this.translations[this.state.currentLanguage];
        if (!t) return;

        const settingsTitle = this.settingsModal?.querySelector('.modal-content h3');
        if (settingsTitle) settingsTitle.textContent = t.settings;

        const themeSelect = document.getElementById("themeSelect");
        if (themeSelect) {
            const themeLabel = themeSelect.previousElementSibling;
            if (themeLabel) themeLabel.textContent = t.theme;
        }

        const languageSelect = document.getElementById("languageSelect");
        if (languageSelect) {
            const languageLabel = languageSelect.previousElementSibling;
            if (languageLabel) languageLabel.textContent = t.language;
        }

        const closeBtn = document.getElementById("closeSettingsBtn");
        if (closeBtn) closeBtn.textContent = t.close;

        const feedbackTitle = this.feedbackModal?.querySelector('.modal-content h3');
        if (feedbackTitle) feedbackTitle.textContent = t.feedback;

        const feedbackInput = document.getElementById("feedbackText");
        if (feedbackInput) feedbackInput.placeholder = t.enterFeedback;

        const cancelBtn = document.getElementById("cancelFeedbackBtn");
        if (cancelBtn) cancelBtn.textContent = t.cancel;

        const sendBtn = document.getElementById("sendFeedbackBtn");
        if (sendBtn) sendBtn.textContent = t.send;

        const msgMenu = document.getElementById('messageContextMenu');
        if (msgMenu) {
            const copyBtn = msgMenu.querySelector('.copy');
            const delBtn = msgMenu.querySelector('.delete');
            if (copyBtn) copyBtn.textContent = t.copy;
            if (delBtn) delBtn.textContent = t.delete;
        }
    };

    handleSendClick = () => {
        if (this.isWaitingForResponse) this.cancelRequest();
        else this.sendMessage();
    };

    sendMessage = () => {
        const message = this.messageInput.value.trim();
        if (!message || !this.state.isReady || this.isWaitingForResponse) return;
        const messageId =  Date.now().toString(); 
        this.addMessage(message, "user", messageId);
        this.messageInput.value = "";
        this.setWaitingState(true);
        this.currentRequestId = messageId;
        SpixiAppSdk.sendNetworkProtocolData(
            this.protocolId,
            JSON.stringify({ action: "sendMessage", text: message, messageId: messageId })
        );
    };

    cancelRequest = () => {
        if (this.isWaitingForResponse && this.currentRequestId) {
            SpixiAppSdk.sendNetworkProtocolData(
                this.protocolId,
                JSON.stringify({ action: "cancelRequest", messageId: this.currentRequestId })
            );
            this.setWaitingState(false);
        }
    };

    setWaitingState = (waiting) => {
        this.isWaitingForResponse = waiting;
        if (waiting) {
            this.inputFooter.classList.add("waiting");
            this.messageInput.disabled = true;
            this.sendButton.innerHTML = "❌";
            this.sendButton.title = "Отменить запрос";
        } else {
            this.inputFooter.classList.remove("waiting");
            this.messageInput.disabled = false;
            this.messageInput.focus();
            this.sendButton.innerHTML = "✉️";
            this.sendButton.title = "Отправить сообщение";
        }
    };

    addMessage = (text, sender, messageId = null) => {
        if (!messageId) {
            messageId = SpixiTools.getTimestamp();
        }

        const messageDate = new Date(Number(messageId));
        const timeString = messageDate.toLocaleTimeString(
            this.state.currentLanguage === 'ru' ? 'ru-RU' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
        );
        const messageDiv = document.createElement("div");
        messageDiv.className = `message-bubble message-${sender}`;
        messageDiv.dataset.sender = sender;
        messageDiv.dataset.messageId = messageId; 
        if (sender === 'system') {
            messageDiv.style.backgroundColor = "#92ba96ff";
            messageDiv.style.color = "#666";
        }
        const formattedText = this.processMarkdown(text);
        messageDiv.innerHTML = `
            <div>${formattedText}</div>
            <div class="message-time">${timeString}</div>
        `;
        messageDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageContextMenu(e, messageDiv);
        });
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        if (typeof Prism !== 'undefined') {
            setTimeout(() => {
                Prism.highlightElement(messageDiv.querySelector('code'));
            }, 0);
        }
        this.messageElements.set(messageId, messageDiv);
    };

    processMarkdown = (text) => {
        const codeBlocks = [];
        let placeholderIndex = 0;

        let processedText = text.replace(/```(\w+)?\s*([\s\S]*?)\s*```/g, (match, lang, code) => {
            const placeholder = `__CODE_BLOCK_${placeholderIndex}__`;
            const escapedCode = this.escapeHtml(code.trim());
            const langAttr = lang ? ` class="language-${lang}"` : '';
            codeBlocks[placeholderIndex] = `<pre><code${langAttr}>${escapedCode}</code></pre>`;
            placeholderIndex++;
            return placeholder;
        });

        const parts = processedText.split(/(__CODE_BLOCK_\d+__)/g);
        processedText = parts.map(part => {
            if (part.startsWith('__CODE_BLOCK_') && part.endsWith('__')) {
                return part; 
            }
            return this.escapeHtml(part);
        }).join('');

        processedText = processedText
            .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>');

        processedText = processedText.replace(/^> (.*)(\n> .*)*/gm, (match, firstLine, rest = '') => {
            const lines = [firstLine, ...rest.split('\n> ').filter(l => l.trim())];
            return `<blockquote>${lines.join('<br>')}</blockquote>`;
        });

        processedText = processedText.replace(/^---+$/gm, '<hr>');

        processedText = processedText
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        const finalParts = processedText.split(/(__CODE_BLOCK_\d+__)/g);
        processedText = finalParts.map(part => {
            if (part.startsWith('__CODE_BLOCK_') && part.endsWith('__')) {
                return part;
            }
            return part.replace(/\n/g, '<br>');
        }).join('');

        codeBlocks.forEach((block, i) => {
            const placeholder = `__CODE_BLOCK_${i}__`;
            processedText = processedText.replace(placeholder, block);
        });

        return processedText;
    };

    escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    scrollToBottom = () => {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    };

    clearChat = () => {
        this.state.messages = [];
        this.chatContainer.innerHTML = "";
    };

    updateBalance = (balance) => {
        const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
        
        if (isNaN(numBalance)) {
            console.warn("Invalid balance value:", balance);
            return;
        }

        this.state.balance = numBalance;

        const el = document.getElementById('balanceDisplay');
        if (el) {
            el.textContent = `${numBalance.toFixed(2)} IXI`;
        }
    };

    setReadyState = () => {
        this.state.isReady = true;
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 200);
        }
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
    };

    addSystemMessage = (text) => {
        const timestamp = new Date();
        const timeString = timestamp.toLocaleTimeString(
            this.state.currentLanguage === 'ru' ? 'ru-RU' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
        );

        const messageDiv = document.createElement("div");
        messageDiv.className = "message-bubble message-ai";
        messageDiv.style.backgroundColor = "#f0f8ff";
        messageDiv.style.color = "#666";
        messageDiv.innerHTML = `
            <div><em>${text}</em></div>
            <div class="message-time">${timeString}</div>
        `;
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    };

    deleteMessage = (messageId) => {
        const messageElement = this.messageElements.get(messageId);
        if (!messageElement) return;

        let current = messageElement;
        while (current) {
            if (current.classList && current.classList.contains('message-bubble')) {
                const id = current.dataset.messageId;
                if (id) this.messageElements.delete(id);
                current.remove();
            }
            current = current.nextSibling;
        }

        SpixiAppSdk.sendNetworkProtocolData(
            this.protocolId,
            JSON.stringify({ action: "deleteMessage", messageId: messageId })
        );
    };
    deleteMessageLocally = (messageId) => {
        const messageElement = this.messageElements.get(messageId);
        if (!messageElement) return;

        let current = messageElement;
        while (current) {
            if (current.classList && current.classList.contains('message-bubble')) {
                const id = current.dataset.messageId;
                if (id) this.messageElements.delete(id);
                current.remove();
                break; 
            }
            current = current.nextSibling;
        }
    };
    toggleCommandsMenu = () => {
        const menu = this.commandsMenu;
        if (!menu) return;

        if (!menu.classList.contains('hidden')) {
            this.hideCommandsMenu();
        } else {
            this.hideSettingsModal();
            this.hideFeedbackModal();
            this.hideMessageContextMenu();

            menu.classList.remove('hidden');
        }
    };

    hideCommandsMenu = () => {
        if (this.commandsMenu) {
            this.commandsMenu.classList.add('hidden');
        }
    };

    showSettingsModal = () => {
        this.hideFeedbackModal();
        this.hideCommandsMenu();
        const themeSelect = document.getElementById("themeSelect");
        const languageSelect = document.getElementById("languageSelect");
        if (themeSelect) themeSelect.value = this.state.currentTheme;
        if (languageSelect) languageSelect.value = this.state.currentLanguage;
        this.settingsModal.classList.remove('hidden');
    };

    hideSettingsModal = () => {
        this.settingsModal.classList.add('hidden');
    };

    showFeedbackModal = () => {
        this.hideSettingsModal();
        this.hideCommandsMenu();
        document.getElementById("feedbackText").value = "";
        this.feedbackModal.classList.remove('hidden');
    };

    hideFeedbackModal = () => {
        this.feedbackModal.classList.add('hidden');
    };

    sendFeedback = () => {
        const feedbackText = document.getElementById("feedbackText").value.trim();
        if (!feedbackText) return;
        SpixiAppSdk.sendNetworkProtocolData(
            this.protocolId,
            JSON.stringify({ action: "feedback", text: feedbackText })
        );
        this.hideFeedbackModal();
    };

    setupMessageListener = () => {
        SpixiAppSdk.onNetworkProtocolData = (senderAddress, receivedProtocolId, data) => {
            if (AIAssistantApp.DEBUG_MODE) {
                    const out = JSON.parse(data);
                    alert(`[ERROR] ` + JSON.stringify(out));
                }
            if (receivedProtocolId !== this.protocolId) return;
            try {
                const msg = JSON.parse(data);
                switch(msg.action) {
                    case "ready":
                        if (msg.messages && typeof msg.messages === 'string') {
                            try {
                                const messagesArray = JSON.parse(msg.messages);
                                if (Array.isArray(messagesArray)) {
                                    messagesArray.forEach(item => {
                                        if (item && typeof item === 'object' && item.message && item.message_id && item.sender) {
                                            this.addMessage(
                                                item.message,
                                                item.sender === 'ai' ? 'ai' : 'user',
                                                item.message_id
                                            );
                                        }
                                    });
                                }
                            } catch (err) {
                                if (AIAssistantApp.DEBUG_MODE) {
                                    alert("[ERROR] Error text to ready: " + err.message);
                                }
                            }
                        }
                        if (msg.balance) {
                            this.updateBalance(msg.balance);
                        }
                        this.setReadyState();
                        break;
                    case "system": 
                        this.addMessage(msg.text, "system", msg.messageId);
                        this.updateBalance(msg.balance);
                        break;
                    case "balanceUpdate": this.updateBalance(msg.balance); break;
                    case "aiResponse":
                        if (msg.messageId === this.currentRequestId) {
                            this.addMessage(msg.text, "ai", msg.messageId);
                            this.setWaitingState(false);
                        }
                        if (msg.balance) {
                            this.updateBalance(msg.balance);
                        }
                        break;
                    case "responseCancelled":
                        if (msg.messageId === this.currentRequestId) {
                            this.deleteMessageLocally(this.currentRequestId); 
                            this.setWaitingState(false);
                            this.addSystemMessage("Cancelled");
                            this.currentRequestId = null; 
                        }
                        break;
                    case "clean": this.clearChat(); break;
                }
            } catch (err) {
                if (AIAssistantApp.DEBUG_MODE) {
                    alert(`[ERROR] Parsing message:\n${err.message}\nData: ${data}`);
                }
            }
        };
    };

    pingQuIXI = () => {
        const timestamp = SpixiTools.getTimestamp();
        SpixiAppSdk.sendNetworkProtocolData(
            this.protocolId,
            JSON.stringify({ action: "ping", ts: timestamp })
        );
    };

    startPinging = () => {
        if (!this.pingTimer) {
            this.pingQuIXI();
            this.pingTimer = setInterval(this.pingQuIXI, this.pingInterval);
        }
    };

    stopPinging = () => {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    };

    handleVisibilityChange = () => {
        document.hidden ? this.stopPinging() : this.startPinging();
    };

    updateSelectOptions = () => {
        const t = this.translations[this.state.currentLanguage];
        if (!t) return;
        const themeSelect = document.getElementById("themeSelect");
        if (themeSelect) {
            const options = themeSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === 'light') options[i].text = t.theme_light || 'Light';
                else if (options[i].value === 'dark') options[i].text = t.theme_dark || 'Dark';
            }
        }
        const languageSelect = document.getElementById("languageSelect");
        if (languageSelect) {
            const options = languageSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === 'ru') options[i].text = t.language_ru || 'Русский';
                else if (options[i].value === 'en') options[i].text = t.language_en || 'English';
            }
        }
    };

    loadSavedSettings = () => {
        loadSettings((theme, lang) => {
            this.state.currentTheme = theme;
            this.state.currentLanguage = lang;
            this.applyTheme();
            this.updateTranslations();
            this.updateSelectOptions();
            const ts = document.getElementById("themeSelect");
            const ls = document.getElementById("languageSelect");
            if (ts) ts.value = this.state.currentTheme;
            if (ls) ls.value = this.state.currentLanguage;
        });
    };

    showMessageContextMenu = (event, element) => {
        event.preventDefault();
        event.stopPropagation();

        const menu = document.getElementById('messageContextMenu');
        if (!menu) return;

        const sender = element.dataset.sender;
        const messageId = element.dataset.messageId;
        const text = element.querySelector('div:first-child')?.textContent || '';

        this.hideSettingsModal();
        this.hideFeedbackModal();
        this.hideCommandsMenu();

        menu.innerHTML = '';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'context-item copy';
        copyBtn.textContent = this.translations[this.state.currentLanguage]?.copy || 'Copy';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(text)
                .then(() => {
                })
                .catch(err => {
                    console.warn('Copy failed:', err);
                })
                .finally(() => {
                    this.hideMessageContextMenu();
                });
        });
        menu.appendChild(copyBtn);

        if (sender !== 'ai') {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'context-item delete';
            deleteBtn.textContent = this.translations[this.state.currentLanguage]?.delete || 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (messageId) {
                    this.handleDeleteMessage(sender, messageId, element);
                }
                this.hideMessageContextMenu();
            });
            menu.appendChild(deleteBtn);
        }

        menu.classList.remove('hidden');

        const x = event.clientX || 10;
        const y = event.clientY || 10;

        const mw = menu.offsetWidth;
        const mh = menu.offsetHeight;

        const finalX = Math.max(5, Math.min(x, window.innerWidth - mw - 5));
        const finalY = Math.max(5, Math.min(y, window.innerHeight - mh - 5));

        menu.style.left = `${finalX}px`;
        menu.style.top = `${finalY}px`;
    };
    handleDeleteMessage = (sender, messageId, messageElement) => {
        if (sender === 'user') {
            this.deleteFromMessageOnwards(messageElement);
            SpixiAppSdk.sendNetworkProtocolData(
                this.protocolId,
                JSON.stringify({ action: "deleteMessage", messageId: messageId })
            );
        } else if (sender === 'system') {
            messageElement.remove();
            this.messageElements.delete(messageId);
            SpixiAppSdk.sendNetworkProtocolData(
                this.protocolId,
                JSON.stringify({ action: "deleteSystemMessage", messageId: messageId })
            );
        }
    };
    deleteFromMessageOnwards = (startElement) => {
        let current = startElement;
        while (current) {
            if (current.classList && current.classList.contains('message-bubble')) {
                const id = current.dataset.messageId;
                if (id) {
                    this.messageElements.delete(id);
                }
                const next = current.nextSibling;
                current.remove();
                current = next;
            } else {
                current = current.nextSibling;
            }
        }
    };
    hideMessageContextMenu = () => {
        const menu = document.getElementById('messageContextMenu');
        if (menu) menu.classList.add('hidden');
    };
    autoResizeTextarea = () => {
        const textarea = this.messageInput;
        if (!textarea) return;
        textarea.style.height = 'auto';
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * 5;
        let newHeight = Math.min(textarea.scrollHeight, maxHeight);
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }

        textarea.style.height = `${newHeight}px`;
    };
    onInit = (sessionId, userAddresses) => {
        this.initElements();
        this.autoResizeTextarea();
        this.setupControls();
        this.setupMessageListener();
        this.startPinging();
        if (this.loadingScreen) this.loadingScreen.style.display = 'flex';
        this.loadSavedSettings();
        
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    };

    destroy = () => {
        this.stopPinging();
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        document.removeEventListener("click", this.globalClickHandler); 
    };
}

function loadSettings(callback) {
    SpixiAppSdk.onStorageData = function(key, value) {
        if (key === 'aiassistant_settings') {
            let theme = 'light';
            let lang = 'ru';
            if (value && value !== 'null') {
                try {
                    const decoded = atob(value);
                    const [t, l] = decoded.split('|');
                    if (t === 'light' || t === 'dark') theme = t;
                    if (l === 'ru' || l === 'en') lang = l;
                } catch(e) {}
            }
            callback(theme, lang);
        }
    };
    SpixiAppSdk.getStorageData(AIAssistantApp.STORAGE_KEY);
}
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(() => {
            return fallbackCopyText(text);
        });
    } else {
        return fallbackCopyText(text);
    }
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success ? Promise.resolve() : Promise.reject(new Error('execCommand failed'));
    } catch (err) {
        document.body.removeChild(textarea);
        return Promise.reject(err);
    }
}
function saveSettings(theme, lang) {
    const data = theme + '|' + lang;
    const encoded = btoa(data);
    SpixiAppSdk.setStorageData(AIAssistantApp.STORAGE_KEY, encoded);
}

SpixiAppSdk.onInit = (sessionId, userAddresses) => {
    const aiAssistantApp = new AIAssistantApp();
    aiAssistantApp.onInit(sessionId, userAddresses);
};

window.onload = SpixiAppSdk.fireOnLoad;