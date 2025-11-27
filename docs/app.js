/**
 * CYBER-JUSTITIA - CORE LOGIC
 * Module : Le Greffe (Qualification Assistant)
 * Author : Cyber-Justitia System
 */

// --- BASE DE CONNAISSANCES JURIDIQUE (SIMULATION JSON) ---
const CODE_PENAL_DB = {
    'escroquerie_313': {
        code: "Art. 313-1 CP",
        titre: "Escroquerie",
        description: "Le fait, soit par l'usage d'un faux nom ou d'une fausse qualité, soit par l'abus d'une qualité vraie, soit par l'emploi de manœuvres frauduleuses, de tromper une personne physique ou morale.",
        peine: "5 ans d'emprisonnement et 375 000 € d'amende.",
        actions_osint: [
            "Vérification Whois/DNS du site frauduleux",
            "Recherche inversée des images (profil vendeur)",
            "Analyse de la réputation de l'IBAN/Email"
        ]
    },
    'stad_323': {
        code: "Art. 323-1 CP",
        titre: "Intrusion dans un STAD",
        description: "Le fait d'accéder ou de se maintenir, frauduleusement, dans tout ou partie d'un système de traitement automatisé de données (STAD).",
        peine: "2 ans d'emprisonnement et 60 000 € d'amende.",
        actions_osint: [
            "Analyse des logs de connexion (IP)",
            "Recherche de leaks (Credential Stuffing)",
            "Scan passif de l'infrastructure"
        ]
    },
    'usurpation_226': {
        code: "Art. 226-4-1 CP",
        titre: "Usurpation d'identité numérique",
        description: "Le fait d'usurper l'identité d'un tiers ou de faire usage d'une ou plusieurs données de toute nature permettant de l'identifier en vue de troubler sa tranquillité ou celle d'autrui.",
        peine: "1 an d'emprisonnement et 15 000 € d'amende.",
        actions_osint: [
            "Enumeration de compte (SOCMINT)",
            "Archivage web des faux profils",
            "Recherche de liens croisés"
        ]
    }
};

// --- LOGIQUE DE NAVIGATION ---
function switchView(viewName) {
    // Masquer toutes les vues
    document.querySelectorAll('.c-view').forEach(el => el.classList.remove('c-view--active'));
    // Désactiver tous les boutons nav
    document.querySelectorAll('.c-nav__item').forEach(el => el.classList.remove('c-nav__item--active'));
    
    // Activer la vue cible
    document.getElementById(`view-${viewName}`).classList.add('c-view--active');
    
    // Mettre à jour le titre
    const titles = {
        'dashboard': 'Tableau de Bord',
        'greffe': 'Procédure & Qualification'
    };
    document.getElementById('page-title').textContent = titles[viewName];
}

// --- LOGIQUE DU GREFFE (FORMULAIRE DYNAMIQUE) ---

const formConfig = {
    'finance': [
        { id: 'q_fake_name', label: "L'auteur a-t-il utilisé un faux nom ou une fausse qualité ?" },
        { id: 'q_maneuver', label: "Y a-t-il eu une mise en scène (faux site, faux documents) ?" },
        { id: 'q_prejudice', label: "La victime a-t-elle remis des fonds ou un bien ?" }
    ],
    'intrusion': [
        { id: 'q_access', label: "L'accès au compte/système était-il non autorisé ?" },
        { id: 'q_maintain', label: "L'auteur s'est-il maintenu dans le système après découverte ?" },
        { id: 'q_data_change', label: "Des données ont-elles été modifiées ou supprimées ?" }
    ],
    'identity': [
        { id: 'q_impersonate', label: "L'auteur utilise-t-il le nom/image de la victime ?" },
        { id: 'q_public', label: "L'usurpation est-elle publique (Réseaux Sociaux, Web) ?" },
        { id: 'q_harm', label: "Cela porte-t-il atteinte à l'honneur ou la tranquillité de la victime ?" }
    ]
};

// Écouteur sur le type d'incident
document.getElementById('incident-type').addEventListener('change', function(e) {
    const type = e.target.value;
    const container = document.getElementById('dynamic-questions');
    const btn = document.getElementById('btn-qualify');

    container.innerHTML = ''; // Reset

    if (type && formConfig[type]) {
        // Générer les cases à cocher
        formConfig[type].forEach(q => {
            const div = document.createElement('div');
            div.className = 'c-checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="${q.id}" name="criteria" value="${q.id}">
                <label for="${q.id}">${q.label}</label>
            `;
            container.appendChild(div);
        });
        btn.style.display = 'block';
    } else {
        container.innerHTML = '<div class="c-placeholder-text">Veuillez sélectionner une nature d\'incident...</div>';
        btn.style.display = 'none';
    }
});

// Gestion de la soumission (Qualification)
document.getElementById('qualification-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Récupération sommaire des choix (Logique simplifiée pour la démo)
    const type = document.getElementById('incident-type').value;
    const checkedBoxes = document.querySelectorAll('input[name="criteria"]:checked');
    
    let resultKey = null;

    // Moteur de règles basique
    if (type === 'finance' && checkedBoxes.length >= 2) resultKey = 'escroquerie_313';
    else if (type === 'intrusion' && checkedBoxes.length >= 1) resultKey = 'stad_323';
    else if (type === 'identity' && checkedBoxes.length >= 2) resultKey = 'usurpation_226';
    
    displayResult(resultKey);
});

function displayResult(key) {
    const container = document.getElementById('legal-result');
    
    if (!key) {
        container.innerHTML = `
            <div class="c-alert-box" style="margin-top:0;">
                <i class="fa-solid fa-circle-exclamation"></i>
                <div>Critères insuffisants pour une qualification pénale automatique. Une analyse humaine approfondie est requise.</div>
            </div>`;
        return;
    }

    const data = CODE_PENAL_DB[key];

    container.innerHTML = `
        <div class="c-legal-card">
            <div class="c-legal-header">
                <h3>Qualification Retenue</h3>
                <span class="c-badge-law">${data.code}</span>
            </div>
            <div class="c-legal-body">
                <h4>${data.titre}</h4>
                <p>${data.description}</p>
                
                <h4>Peines Encourues (Max)</h4>
                <p><strong>${data.peine}</strong></p>
                
                <h4>Prochaines Étapes (OSINT)</h4>
                <ul>
                    ${data.actions_osint.map(action => `<li>${action}</li>`).join('')}
                </ul>

                <button class="c-btn c-btn--primary" style="margin-top:20px;">
                    <i class="fa-solid fa-file-export"></i> Générer Rapport Préliminaire
                </button>
            </div>
        </div>
    `;
}