document.addEventListener('DOMContentLoaded', () => {
    
    // État de l'application
    let currentRoleId = 'manager';
    const chatFeed = document.getElementById('chat-feed');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('user-input');
    const roleBtns = document.querySelectorAll('.c-role-btn');
    const roleTitle = document.getElementById('current-role-title');
    const roleDesc = document.getElementById('role-description');

    // Descriptions contextuelles (simples pour l'UI)
    const roleContexts = {
        'manager': "Coordination générale et triage.",
        'awareness': "Pédagogie, Phishing, Culture Sécu.",
        'grc': "Conformité, Audit, Gouvernance.",
        'prevention': "Aide aux victimes, Grand Public.",
        'trust': "Anti-fraude, Modération, Enquêtes."
    };

    // Gestion du changement de rôle
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI
            roleBtns.forEach(b => b.classList.remove('c-role-btn--active'));
            btn.classList.add('c-role-btn--active');
            
            // Update State
            currentRoleId = btn.getAttribute('data-role');
            roleTitle.textContent = btn.innerText.trim();
            roleDesc.textContent = roleContexts[currentRoleId];

            // Feedback visuel dans le chat
            addMessage(`Changement de canal : Connexion établie avec ${btn.innerText.trim()}...`, 'bot');
        });
    });

    // Gestion de l'envoi de message
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = input.value.trim();
        if (!message) return;

        // 1. Afficher message utilisateur
        addMessage(message, 'user');
        input.value = '';

        // 2. Appel API
        try {
            // Indicateur de chargement (optionnel, simple ici)
            const loadingId = addMessage("Écriture en cours...", 'bot');

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: message, 
                    roleId: currentRoleId 
                })
            });

            const data = await response.json();
            
            // Remplacer le message de chargement par la réponse réelle
            const loadingEl = document.querySelector(`[data-id="${loadingId}"]`);
            if(loadingEl) loadingEl.innerText = data.reply;

        } catch (error) {
            console.error(error);
            addMessage("Erreur de connexion au serveur.", 'bot');
        }
    });

    // Utilitaire : Ajouter un message au DOM
    function addMessage(text, sender) {
        const div = document.createElement('div');
        const id = Date.now();
        div.classList.add('c-message', `c-message--${sender}`);
        div.setAttribute('data-id', id);
        div.innerText = text;
        chatFeed.appendChild(div);
        chatFeed.scrollTop = chatFeed.scrollHeight;
        return id;
    }
});