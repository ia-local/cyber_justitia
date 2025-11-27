// script.js - Version Complète Corrigée

// --- 1. CORE & NAVIGATION ---
const app = {
    // FUSION : Ajout de la propriété 'threats'
    state: { currentView: 'dashboard', threats: [],academia: [],activeModuleId: null }, 
    
    init: function() {
        // La navigation est maintenant appelée APRÈS l'attente du DOM (voir bas du fichier)
        this.loadThreats(); // Charge la base de menaces au démarrage
        this.loadAcademia();
        this.navigate('dashboard')
        
        console.log("Cyber-Justitia OS chargé.");
        this.initFormListeners();
        this.initOsintListeners(); 
    },

    navigate: function(viewId) {
        // UI Updates
        document.querySelectorAll('.c-view').forEach(el => el.classList.remove('c-view--active'));
        document.querySelectorAll('.c-nav__item').forEach(el => el.classList.remove('c-nav__item--active'));
        
        // Active View
        const targetView = document.getElementById(`view-${viewId}`);
        if(targetView) targetView.classList.add('c-view--active');

        // Active Menu Item (ATTENTION: l'index 3 est 'Rapporteur' qui est désactivé)
        const btns = document.querySelectorAll('.c-nav__item');
        if(viewId === 'dashboard') btns[0].classList.add('c-nav__item--active');
        if(viewId === 'greffe') btns[1].classList.add('c-nav__item--active');
        if(viewId === 'osint') btns[2].classList.add('c-nav__item--active');
        if(viewId === 'mapping') btns[3].classList.add('c-nav__item--active');
        if(viewId === 'academie') btns[4].classList.add('c-nav__item--active'); 

        // Update Title (Cette ligne est désormais sûre car appelée après DOMContentLoaded)
        const titles = {
            'dashboard': "Vue d'ensemble",
            'greffe': 'Procédure & Qualification Pénale',
            'osint': 'Laboratoire OSINT',
            'mapping': 'Cartographie des Flux (Tracking)', 
            'academie': 'Académie des Menaces (Cyber-Justitia)'
        };
        const pageTitleEl = document.getElementById('page-title');
        if (pageTitleEl) {
             pageTitleEl.textContent = titles[viewId] || 'Cyber-Justitia';
        }
        if(viewId === 'mapping') {
        app.mapping.initMap();
        }
        // Si on navigue vers l'académie, on rafraîchit la liste
        if(viewId === 'academie' && this.state.threats.length > 0) {
            this.renderThreatList();
        }
    },
            
    // LOGIQUE : Chargement de la Base de Menaces (Académie)
    loadThreats: async function() {
        try {
            const response = await fetch('./threats.json');
            if (!response.ok) throw new Error('Impossible de charger threats.json');
            this.state.threats = await response.json();
            console.log(`[LOG] ${this.state.threats.length} fiches de menaces chargées.`);
        } catch (error) {
            console.error(error);
            const threatListEl = document.getElementById('threat-list');
            if (threatListEl) {
                 threatListEl.innerHTML = `<li style="color:var(--danger);">Erreur de chargement: ${error.message}</li>`;
            }
        }
    },

    // LOGIQUE : Rendu de la Liste de Menaces (Académie)
    renderThreatList: function() {
        const listContainer = document.getElementById('threat-list');
        if (!listContainer || this.state.threats.length === 0) return;
        
        listContainer.innerHTML = '';
        
        this.state.threats.forEach(threat => {
            const li = document.createElement('li');
            li.textContent = threat.title;
            li.dataset.id = threat.id;
            li.onclick = () => app.renderThreatDetail(threat);
            listContainer.appendChild(li);
        });
        
        // Affiche la première menace par défaut
        this.renderThreatDetail(this.state.threats[0]);
    },

    // LOGIQUE : Rendu de la Fiche Détaillée (Académie)
    renderThreatDetail: function(threat) {
        const detailContainer = document.getElementById('threat-detail-container');
        if (!detailContainer) return;
        
        // Mettre à jour la classe active dans la liste
        document.querySelectorAll('.c-threat-list li').forEach(li => li.classList.remove('is-active'));
        const activeLi = document.querySelector(`li[data-id="${threat.id}"]`);
        if(activeLi) activeLi.classList.add('is-active');

        // Création du contenu HTML de la fiche
        detailContainer.innerHTML = `
            <div class="c-threat-card">
                <h2>${threat.title}</h2>
                <span class="c-status-badge c-badge-law" style="background:${threat.category === 'Social Engineering' ? '#d97706' : '#94a3b8'};">${threat.category} (${threat.platform})</span>

                <h4>Description et Mécanisme</h4>
                <p>${threat.description_courte}</p>
                <p><strong>Mécanisme clé:</strong> ${threat.mecanisme_cle}</p>
                
                <h4>Qualification Légal & Facteur Humain</h4>
                <p><strong>Articles Pénaux Potentiels:</strong> ${threat.art_penal_potentielles.join(', ')}</p>
                <p><strong>Facteur Humain Exploité:</strong> ${threat.facteur_humain}</p>

                <h4>Indicateurs d'Alerte (Frontend & OSINT)</h4>
                <ul class="c-feature-list">
                    ${threat.indicators_tech.map(i => `<li><i class="fa-solid fa-bell"></i> ${i}</li>`).join('')}
                </ul>
                <p><strong>Focus OSINT Recommandé:</strong> ${threat.osint_focus.join(', ')}</p>

                <h4>Conseils de Prévention et Remédiation</h4>
                <ul class="c-feature-list">
                    ${threat.conseils_prevention.map(c => `<li style="border-left-color:var(--success);"><i class="fa-solid fa-shield-halved"></i> ${c}</li>`).join('')}
                </ul>
            </div>
        `;
    },
    
    // Initialisation des écouteurs du formulaire juridique (Appelé dans app.init)
    initFormListeners: function() {
         // Gestionnaire Formulaire Juridique
        const incidentTypeEl = document.getElementById('incident-type');
        const qualificationFormEl = document.getElementById('qualification-form');
        
        if (incidentTypeEl) {
            incidentTypeEl.addEventListener('change', (e) => {
                const type = e.target.value;
                const container = document.getElementById('dynamic-questions');
                const btn = document.getElementById('btn-qualify');
                
                container.innerHTML = '';
                
                if(type && formConfig[type]) {
                    formConfig[type].forEach(q => {
                        container.innerHTML += `
                            <label class="c-checkbox-item">
                                <input type="checkbox" name="criteria" value="${q.id}">
                                <span>${q.label}</span>
                            </label>`;
                    });
                    btn.style.display = 'inline-flex';
                } else {
                    container.innerHTML = '<div style="color:#94a3b8; text-align:center; margin-top:40px;">Sélectionnez une nature d\'incident...</div>';
                    btn.style.display = 'none';
                }
            });
        }
        
        if (qualificationFormEl) {
            qualificationFormEl.addEventListener('submit', (e) => {
                e.preventDefault();
                const type = document.getElementById('incident-type').value;
                const checks = document.querySelectorAll('input[name="criteria"]:checked').length;
                let resultKey = null;
    
                if(type === 'finance' && checks >= 2) resultKey = 'escroquerie_313';
                else if(type === 'intrusion' && checks >= 1) resultKey = 'stad_323';
                else if(type === 'identity' && checks >= 2) resultKey = 'usurpation_226';
    
                renderLegalResult(resultKey);
            });
        }
    },
    
    // Initialisation des écouteurs OSINT (Appelé dans app.init)
    initOsintListeners: function() {
        const btnTraceMapEl = document.getElementById('btn-trace-map');
        if (btnTraceMapEl) {
            btnTraceMapEl.addEventListener('click', () => {
                const target = document.getElementById('osint-target').value;
                if (!target) {
                    terminal.log("Erreur: Cible manquante pour le traçage.", "error");
                    return;
                }
                // Appel de la nouvelle fonction de traçage
                app.navigate('mapping'); // Navigue vers la carte
                app.traceMap(target);    // Déclenche l'appel API et le tracé
            });
        }
        const btnScanEl = document.getElementById('btn-scan');
        if (!btnScanEl) return;
        
        btnScanEl.addEventListener('click', async () => {
            const tool = document.getElementById('osint-tool').value;
            const target = document.getElementById('osint-target').value;

            if(!target) {
                terminal.log("Erreur: Cible manquante.", "error");
                return;
            }

            terminal.clear(); // Nettoyer l'écran précédent
            terminal.log(`Initialisation module: ${tool.toUpperCase()}...`, "info");
            terminal.log(`Cible: ${target}`);
            terminal.log("Connexion au serveur Cyber-Justitia...", "warn");
            
            terminal.log("[Connecté] Envoi de la requête API...");

            try {
                const mockResult = await API_CLIENT.scan(tool, target);
                
                terminal.log("Réponse reçue du serveur.", "info");
                terminal.log("-----------------------------------");
                terminal.printJSON(mockResult.result || mockResult); 
                terminal.log("Fin de transmission.");

            } catch (err) {
                terminal.log(`Erreur Critique: ${err.message}`, "error");
            }
        }
    );
    },
    mapping: {
    map: null,
    
    initMap: function() {
        if (this.map) {
            // La carte est déjà initialisée, on s'assure qu'elle est bien redimensionnée
            this.map.invalidateSize();
            return;
        }

        // 1. Initialisation de la carte Leaflet
        this.map = L.map('leaflet-map-container').setView([48.8566, 2.3522], 3); // Centré sur Paris, Zoom 3

        // 2. Ajout des tuiles (OpenStreetMap par défaut)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            maxZoom: 18,
        }).addTo(this.map);
        
        console.log("Carte Leaflet initialisée.");

        // Exemple de tracé initial
        // this.drawTrace([ { lat: 34.0522, lng: -118.2437, info: 'Point A (Victime)' }, ... ]);
    },

    /**
     * Dessine les marqueurs et relie les points sur la carte.
     * @param {Array} points - Tableau d'objets { lat, lng, info, isOrigin }
     */
    drawTrace: function(points) {
        if (!this.map) {
            this.initMap();
        }
        
        // Nettoyer les anciens tracés et marqueurs
        this.map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                this.map.removeLayer(layer);
            }
        });

        const coordinates = [];
        points.forEach((point, index) => {
            coordinates.push([point.lat, point.lng]);

            // Définition de l'icône
            let iconColor = 'blue';
            if (index === 0) iconColor = 'green'; // Origine
            if (index === points.length - 1) iconColor = 'red'; // Destination

            const marker = L.marker([point.lat, point.lng], {
                // Utiliser une icône FontAwesome stylisée (via la bibliothèque Leaflet.AwesomeMarkers ou custom CSS)
                // Pour simplifier, nous utilisons le marqueur par défaut avec popup.
            }).addTo(this.map)
              .bindPopup(`<b>Point ${index + 1}</b><br>${point.info}`).openPopup();
        });

        // Relier les points par une ligne
        if (coordinates.length > 1) {
            L.polyline(coordinates, { color: 'red', weight: 3, opacity: 0.7 }).addTo(this.map);
        }
        
        // Centrer et zoomer la carte pour englober tous les points
        if (coordinates.length > 0) {
            const bounds = L.latLngBounds(coordinates);
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Mettre à jour le résumé
        const summary = document.getElementById('trace-info-summary');
        if(summary) {
            summary.textContent = `Tracé effectué: ${points.length} rebonds identifiés (Origin: ${points[0].info} | Destination: ${points[points.length - 1].info})`;
        }
    }
    },
    // NOUVELLE LOGIQUE : Chargement de la Base Academia
    loadAcademia: async function() {
    try {
        const response = await fetch('./academia.json');
        if (!response.ok) throw new Error('Impossible de charger academia.json');
        this.state.academia = await response.json();
        console.log(`[LOG] ${this.state.academia.length} modules Académie chargés.`);
        this.renderAcademiaGrid(); // Afficher après le chargement
    } catch (error) {
        console.error('Erreur de chargement Academia:', error);
        const gridEl = document.getElementById('academie-grid');
        if (gridEl) {
             gridEl.innerHTML = `<div style="color:var(--danger);">Erreur: Impossible de charger les modules de formation.</div>`;
        }
    }
    },
    // NOUVELLE LOGIQUE : Rendu de la Grille de Cartes
    renderAcademiaGrid: function() {
        const gridContainer = document.getElementById('academie-grid');
        if (!gridContainer || this.state.academia.length === 0) return;

        gridContainer.innerHTML = '';

        this.state.academia.forEach(item => {
            // Utilise la fonction renderCard du nouveau composant card.js
            gridContainer.innerHTML += renderCard(item, 'app.openAcademiaModal'); 
        });
    },
    // LOGIQUE D'OUVERTURE ET D'INITIALISATION DU MODAL (Remplacer l'ancien)
    openAcademiaModal: function(e, itemId) {
        e.stopPropagation(); 
        
        const item = this.state.academia.find(i => i.id === itemId);
        if (!item) return;
    
        this.state.activeModuleId = itemId;
        
        // Initialisation : On charge la section 0 par défaut
        this.updateModalContent(itemId, 0, true); 
    },
    // LOGIQUE DE MISE À JOUR DU CONTENU ET DE PAGINATION
    updateModalContent: function(itemId, sectionIndex, initialLoad = false) {
        const item = this.state.academia.find(i => i.id === itemId);
        if (!item || item.type !== 'MODULE') {
            // Pour les METHOD (OSINT), on affiche tout sans pagination
            const contentHTML = item.steps ? `<h4>Étapes:</h4><ol>${item.steps.map(s => `<li>${s}</li>`).join('')}</ol>` : '';
            this.renderModal('detail-modal', item.title, contentHTML);
            return;
        }

        // --- LOGIQUE POUR MODULES (Paginés) ---
        const totalSections = item.content.length;
        const currentSection = item.content[sectionIndex];

        let modalContentHTML = `<div class="c-module-content-wrapper">`;

        // 1. Contenu de la Section
        modalContentHTML += `
            <div class="c-module-section">
                <h3>${currentSection.sectionTitle}</h3>
                <p>${currentSection.text}</p>
            </div>
        `;

        // 2. Bouton d'Assistance IA (Fixé en bas)
        modalContentHTML += `
            <button class="c-btn c-btn--ai-assist" 
                    onclick="app.assistWithModule('${item.title}', '${currentSection.sectionTitle}')">
                <i class="fa-solid fa-robot"></i> Poser une question sur cette section à l'IA
            </button>
        `;

        // 3. Pagination (Générée dynamiquement)
        modalContentHTML += this.renderPaginator(itemId, totalSections, sectionIndex);

        modalContentHTML += `</div>`;

        if (initialLoad) {
                // Si c'est le chargement initial, on crée le modal
                this.renderModal('academia-modal', item.title, modalContentHTML, true); // Le 4ème argument indique que c'est un module
        } else {
            // Sinon, on met à jour seulement le corps (pour éviter de recréer l'en-tête)
            document.getElementById(`academia-modal-body`).innerHTML = modalContentHTML;
        }
    },
    // LOGIQUE DE DÉCLENCHEMENT DE L'ASSISTANT IA CIBLÉ
    assistWithModule: function(moduleTitle, sectionTitle) {
        toggleRightPanel(); // Ouvre la barre latérale du chatbot
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            // Prépare le prompt utilisateur pour l'Assistant IA
            const prefilledMessage = `En tant que Consultant Juridique, explique-moi plus en détail la section : "${sectionTitle}" du module "${moduleTitle}" et les risques légaux associés.`;
            chatInput.value = prefilledMessage;
            // Sélectionne le rôle Juridique par défaut pour cette action
            const roleSelect = document.getElementById('chat-role');
            if (roleSelect) roleSelect.value = 'legal';
            chatInput.focus();
        }
    },
    // LOGIQUE GÉNÉRIQUE POUR OUVRIR UN MODAL (Réimplémentation/Utilisation de modalSystem.js)
    renderModal: function(modalId, title, content) {
        // Cette fonction dépend de la réintégration du HTML de modalSystem
        let modalEl = document.getElementById(modalId);
        if (!modalEl) {
            // Si la modal n'existe pas, on la crée (pour la démo)
            modalEl = document.createElement('div');
            modalEl.className = 'c-modal-overlay'; 
            modalEl.id = modalId;
            modalEl.innerHTML = `
                <div class="c-modal-box" style="height: auto; max-height: 85vh;">
                    <div class="c-modal-header">
                        <div class="c-modal-title" id="${modalId}-title">${title}</div>
                        <button class="c-modal-close" onclick="ModalSystem.close('${modalId}')">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="c-modal-body" id="${modalId}-body">
                        ${content}
                    </div>
                </div>
            `;
            document.body.appendChild(modalEl);
            ModalSystem.init(); // Ré-initialiser les écouteurs si créé dynamiquement
        } else {
            document.getElementById(`${modalId}-title`).textContent = title;
            document.getElementById(`${modalId}-body`).innerHTML = content;
        }

        // Appel à la fonction globale d'ouverture du modal
        ModalSystem.open(modalId); 
    },
    // NOUVELLE FONCTION : Gestion complète du traçage
    traceMap: async function(target) {
    if (!target) {
        console.error("Cible de traçage non définie.");
        return;
    }
    
    // Mettre à jour l'interface utilisateur pour indiquer le chargement
    const summaryEl = document.getElementById('trace-info-summary');
    if (summaryEl) summaryEl.textContent = `Analyse en cours... Tracé de la cible ${target}.`;
    
    try {
        const response = await fetch('/api/mapping/trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target })
        });

        const jsonResult = await response.json();

        if (!jsonResult.success) {
            throw new Error(jsonResult.error);
        }

        const points = jsonResult.data.trace_path;
        
        // Appel de la logique de Leaflet pour dessiner le tracé
        app.mapping.drawTrace(points); 
        
    } catch (error) {
        console.error("Erreur de traçage cartographique:", error);
        if (summaryEl) summaryEl.textContent = `Échec de l'analyse : ${error.message}`;
    }
    },
    // LOGIQUE DE PAGINATION POUR LES MODULES
    renderPaginator: function(itemId, totalSections, currentSection) {
        let paginationHTML = '<div class="c-pagination">';

        for (let i = 0; i < totalSections; i++) {
            const isActive = (i === currentSection) ? 'c-page-link--active' : '';
            // L'action onclick est liée à la mise à jour du contenu du modal
            paginationHTML += `
                <button class="c-page-link ${isActive}" 
                        onclick="app.updateModalContent('${itemId}', ${i})">
                    ${i + 1}
                </button>
            `;
        }

        paginationHTML += '</div>';
        return paginationHTML;
    },
};

// --- 2. MODULE JURIDIQUE (DATA & LOGIC) ---
const LEGAL_DB = {
    'escroquerie_313': {
        code: "Art. 313-1 CP",
        titre: "Escroquerie",
        desc: "Le fait, soit par l'usage d'un faux nom ou d'une fausse qualité, soit par l'abus d'une qualité vraie, soit par l'emploi de manœuvres frauduleuses, de tromper une personne physique ou morale.",
        peine: "5 ans d'emprisonnement et 375 000 € d'amende.",
        actions: ["Whois Domaine", "Reverse Image Search", "Signalement Pharos"]
    },
    'stad_323': {
        code: "Art. 323-1 CP",
        titre: "Intrusion dans un STAD",
        desc: "Le fait d'accéder ou de se maintenir, frauduleusement, dans tout ou partie d'un système de traitement automatisé de données (STAD).",
        peine: "2 ans d'emprisonnement et 60 000 € d'amende.",
        actions: ["Logs IP Analysis", "Shodan Scan", "Leak Check"]
    },
    'usurpation_226': {
        code: "Art. 226-4-1 CP",
        titre: "Usurpation d'identité numérique",
        desc: "Le fait d'usurper l'identité d'un tiers ou de faire usage d'une ou plusieurs données de toute nature permettant de l'identifier en vue de troubler sa tranquillité.",
        peine: "1 an d'emprisonnement et 15 000 € d'amende.",
        actions: ["Social Graph Analysis", "Archivage Web (Wayback)", "Réquisition IP"]
    }
};

const formConfig = {
    'finance': [
        { id: 'q_fake', label: "Usage d'un faux nom ou fausse qualité ?" },
        { id: 'q_mise_scene', label: "Mise en scène (faux site, faux email) ?" },
        { id: 'q_perte', label: "Remise de fonds (préjudice) ?" }
    ],
    'intrusion': [
        { id: 'q_acces', label: "Accès non autorisé à un compte/serveur ?" },
        { id: 'q_maintien', label: "Maintien dans le système après découverte ?" },
        { id: 'q_modif', label: "Altération de données ?" }
    ],
    'identity': [
        { id: 'q_name', label: "Usage du nom/image de la victime ?" },
        { id: 'q_public', label: "Diffusion publique ?" },
        { id: 'q_trouble', label: "Atteinte à l'honneur ou tranquillité ?" }
    ]
};

function renderLegalResult(key) {
    const container = document.getElementById('legal-result');
    if(!key || !container) {
        container.innerHTML = `<div class="c-alert-box"><i class="fa-solid fa-circle-info"></i> Éléments insuffisants pour une qualification automatique.</div>`;
        return;
    }
    const d = LEGAL_DB[key];
    container.innerHTML = `
        <div class="c-legal-card">
            <div class="c-legal-header">
                <h3>Qualification Retenue</h3>
                <span class="c-badge-law">${d.code}</span>
            </div>
            <div class="c-legal-body">
                <h4>Incrustation</h4>
                <p>${d.desc}</p>
                <h4>Peine Maximale</h4>
                <p><strong>${d.peine}</strong></p>
                <h4>Actions OSINT Recommandées</h4>
                <ul>${d.actions.map(a => `<li><i class="fa-solid fa-check"></i> ${a}</li>`).join('')}</ul>
                <button class="c-btn c-btn--primary" style="margin-top:15px;" onclick="app.navigate('osint')">
                    Aller au Labo OSINT
                </button>
            </div>
        </div>`;
}

// --- 3. MODULE OSINT (CONNECTÉ AU BACKEND) ---        
const API_CLIENT = {
    async scan(tool, target) {
        const response = await fetch('/api/osint/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: tool, target: target })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || "Erreur inconnue du serveur");
        }
        return result.data;
    }
};

const terminal = {
     el: document.getElementById('osint-output'),
     clear: function() {
        if (this.el) this.el.innerHTML = '';
     },
     log: function(text, type = 'normal') {
         if (!this.el) return;
         const div = document.createElement('div');
         div.className = `line ${type === 'error' ? 'line--error' : type === 'info' ? 'line--info' : type === 'warn' ? 'line--warn' : ''}`;
         div.textContent = `> ${text}`;
         this.el.appendChild(div);
         this.el.scrollTop = this.el.scrollHeight;
     },
     printJSON: function(obj) {
        if (!this.el) return;
        const str = JSON.stringify(obj, null, 2);
        const pre = document.createElement('pre');
        pre.innerHTML = str.replace(/"(.*?)":/g, '<span class="json-key">"$1":</span>')
                           .replace(/: "(.*?)"/g, ': <span class="json-str">"$1"</span>');
        pre.style.margin = "10px 0";
        this.el.appendChild(pre);
        this.el.scrollTop = this.el.scrollHeight;
     }
 };


// 🚨 LIGNE DE DÉCLENCHEMENT CORRIGÉE : Attend que le DOM soit complètement chargé.
document.addEventListener('DOMContentLoaded', () => {
    // Les références aux éléments du DOM (comme page-title, incident-type, etc.) sont garanties d'exister ici.
    // On initialise l'objet terminal ici car son élément (osint-output) est maintenant disponible.
    terminal.el = document.getElementById('osint-output');
    app.init();
});