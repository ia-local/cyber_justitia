const Chatbot = {
    apiEndpoint: '/api/chat',
    
    dom: {
        messages: null,
        input: null,
        roleSelect: null,
        btnSend: null
    },

    init: function() {
        // Sélection des nouveaux éléments du panneau latéral
        this.dom.messages = document.getElementById('chat-messages');
        this.dom.input = document.getElementById('chat-input');
        this.dom.roleSelect = document.getElementById('chat-role');
        this.dom.btnSend = document.getElementById('chat-send-btn');

        if (!this.dom.btnSend) return;

        this.dom.btnSend.addEventListener('click', () => this.sendMessage());
        this.dom.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    },

    // Nouvelle fonction pour nettoyer le chat
    clearChat: function() {
        this.dom.messages.innerHTML = `
            <div class="c-chat-bubble c-chat-bubble--ai">
                <div class="c-chat-role">Système</div>
                Mémoire effacée. Prêt pour une nouvelle requête.
            </div>
        `;
    },

    appendMessage: function(text, sender, roleTitle = null) {
        const div = document.createElement('div');
        div.classList.add('c-chat-bubble', sender === 'user' ? 'c-chat-bubble--user' : 'c-chat-bubble--ai');
        
        let html = '';
        if (sender === 'ai' && roleTitle) {
            html += `<div class="c-chat-role">${roleTitle}</div>`;
        }
        html += `<div>${text.replace(/\n/g, '<br>')}</div>`;
        
        div.innerHTML = html;
        this.dom.messages.appendChild(div);
        this.dom.messages.scrollTop = this.dom.messages.scrollHeight;
    },

    setLoading: function(isLoading) {
        if (isLoading) {
            const loader = document.createElement('div');
            loader.id = 'chat-loader';
            loader.className = 'c-chat-bubble c-chat-bubble--ai';
            loader.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> ...';
            this.dom.messages.appendChild(loader);
            this.dom.messages.scrollTop = this.dom.messages.scrollHeight;
            this.dom.input.disabled = true;
        } else {
            const loader = document.getElementById('chat-loader');
            if (loader) loader.remove();
            this.dom.input.disabled = false;
            this.dom.input.focus();
        }
    },

    sendMessage: async function() {
        const message = this.dom.input.value.trim();
        const roleId = this.dom.roleSelect.value;

        if (!message) return;

        this.appendMessage(message, 'user');
        this.dom.input.value = '';
        this.setLoading(true);

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, roleId })
            });

            const data = await response.json();
            this.setLoading(false);
            
            if (data.reply) {
                this.appendMessage(data.reply, 'ai', data.roleName);
            } else {
                this.appendMessage("Pas de réponse.", 'ai', 'Système');
            }

        } catch (error) {
            this.setLoading(false);
            this.appendMessage("Erreur de connexion.", 'ai', 'Système');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Chatbot.init());