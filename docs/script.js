
        // --- 1. CORE & NAVIGATION ---
        const app = {
            state: { currentView: 'dashboard' },
            
            init: function() {
                // Ecouteurs globaux si nécessaire
                console.log("Cyber-Justitia OS chargé.");
            },

            navigate: function(viewId) {
                // UI Updates
                document.querySelectorAll('.c-view').forEach(el => el.classList.remove('c-view--active'));
                document.querySelectorAll('.c-nav__item').forEach(el => el.classList.remove('c-nav__item--active'));
                
                // Active View
                const targetView = document.getElementById(`view-${viewId}`);
                if(targetView) targetView.classList.add('c-view--active');

                // Active Menu Item
                const btns = document.querySelectorAll('.c-nav__item');
                if(viewId === 'dashboard') btns[0].classList.add('c-nav__item--active');
                if(viewId === 'greffe') btns[1].classList.add('c-nav__item--active');
                if(viewId === 'osint') btns[2].classList.add('c-nav__item--active');

                // Update Title
                const titles = {
                    'dashboard': "Vue d'ensemble",
                    'greffe': 'Procédure & Qualification Pénale',
                    'osint': 'Laboratoire OSINT'
                };
                document.getElementById('page-title').textContent = titles[viewId] || 'Cyber-Justitia';
            }
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

        // Gestionnaire Formulaire Juridique
        document.getElementById('incident-type').addEventListener('change', (e) => {
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

        document.getElementById('qualification-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('incident-type').value;
            const checks = document.querySelectorAll('input[name="criteria"]:checked').length;
            let resultKey = null;

            if(type === 'finance' && checks >= 2) resultKey = 'escroquerie_313';
            else if(type === 'intrusion' && checks >= 1) resultKey = 'stad_323';
            else if(type === 'identity' && checks >= 2) resultKey = 'usurpation_226';

            renderLegalResult(resultKey);
        });

        function renderLegalResult(key) {
            const container = document.getElementById('legal-result');
            if(!key) {
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

        // --- 3. MODULE OSINT (SIMULATION ASYNCHRONE) ---
        
        // Mock Server Database
        const MOCK_SERVER = {
            async scan(tool, target) {
                // Simulation Latence Réseau (1.5s à 3s)
                const latency = 1500 + Math.random() * 1500;
                await new Promise(r => setTimeout(r, latency));

                if (!target.includes('.')) throw new Error("Format de cible invalide.");

                if (tool === 'whois') {
                    return {
                        registrar: "Bad-Domains LLC (Panama)",
                        creation_date: "2024-11-20 (Critique: < 7 jours)",
                        status: "clientTransferProhibited",
                        registrant_country: "PA"
                    };
                }
                if (tool === 'ip_geo') {
                    return {
                        ip: "192.168.X.X (Simulé)",
                        isp: "Bulletproof Hosting Ltd",
                        country: "Seychelles",
                        hosting_type: "VPN/Proxy Detected"
                    };
                }
                if (tool === 'email_breach') {
                    return {
                        target: target,
                        breaches_found: 4,
                        sources: ["Collection #1", "Exploit.in", "BreachCompilation"],
                        risk_level: "HIGH"
                    };
                }
            }
        };

        const terminal = {
            el: document.getElementById('osint-output'),
            log: function(text, type = 'normal') {
                const div = document.createElement('div');
                div.className = `line ${type === 'error' ? 'line--error' : type === 'info' ? 'line--info' : type === 'warn' ? 'line--warn' : ''}`;
                div.textContent = `> ${text}`;
                this.el.appendChild(div);
                this.el.scrollTop = this.el.scrollHeight;
            },
            printJSON: function(obj) {
                const str = JSON.stringify(obj, null, 2);
                const pre = document.createElement('pre');
                pre.innerHTML = str.replace(/"(.*?)":/g, '<span class="json-key">"$1":</span>')
                                   .replace(/: "(.*?)"/g, ': <span class="json-str">"$1"</span>');
                pre.style.margin = "10px 0";
                this.el.appendChild(pre);
                this.el.scrollTop = this.el.scrollHeight;
            }
        };

        document.getElementById('btn-scan').addEventListener('click', async () => {
            const tool = document.getElementById('osint-tool').value;
            const target = document.getElementById('osint-target').value;

            if(!target) {
                terminal.log("Erreur: Cible manquante.", "error");
                return;
            }

            terminal.el.innerHTML = ''; // Clear
            terminal.log(`Initialisation module: ${tool.toUpperCase()}...`, "info");
            terminal.log(`Cible: ${target}`);
            terminal.log("Connexion au serveur distant chiffré...", "warn");
            terminal.log("[....................] 0%");

            try {
                // Appel au Mock Server (Simulation du Backend)
                const data = await MOCK_SERVER.scan(tool, target);
                
                terminal.log("[####################] 100%");
                terminal.log("Données récupérées avec succès.", "info");
                terminal.log("-----------------------------------");
                terminal.printJSON(data);
                terminal.log("Fin de transmission.");

            } catch (err) {
                terminal.log(`Erreur Serveur: ${err.message}`, "error");
            }
        });

        // Init App
        app.init();
