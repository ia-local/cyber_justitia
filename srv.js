require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Groq = require('groq-sdk');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const app = express();
const port = 3110;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('docs')); // Servir les fichiers statiques (html/css/js)
// Configuration Groq (Assurez-vous d'avoir GROQ_API_KEY dans votre .env)
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
const swaggerSpec = YAML.load(path.join(__dirname, 'docs','swagger.yaml'));
// --- MODULE SIMULATION OSINT ---
const MOCK_OSINT_TOOLS = {
    'whois': async (target) => {
        return {
            tool: "WHOIS Lookup",
            target: target,
            timestamp: new Date().toISOString(),
            // Données simulées
            result: {
                registrar: "NameCheap, Inc.",
                creationDate: "2024-11-15T10:00:00Z (ALERTE: Domaine récent < 30 jours)",
                registryExpiryDate: "2025-11-15T10:00:00Z",
                domainStatus: "clientTransferProhibited",
                registrantCountry: "PA (Panama)"
            },
            riskScore: 85
        };
    },
    'ip_geo': async (target) => {
        return {
            tool: "IP Geolocation",
            target: target,
            timestamp: new Date().toISOString(),
            result: {
                ip: "104.21.55.2 (Cloudflare)",
                isp: "DigitalOcean, LLC",
                country: "Netherlands",
                city: "Amsterdam",
                hostingType: "Data Center"
            },
            riskScore: 60
        };
    },
    'email_breach': async (target) => {
        return {
            tool: "Breach Check (Leak)",
            target: target,
            timestamp: new Date().toISOString(),
            result: {
                email: target,
                breaches: 3,
                sources: ["Collection #1", "Verifications.io"],
                passwordHint: "Hash MD5 détecté"
            },
            riskScore: 90
        };
    }
};
// --- MODULE SIMULATION MAPPING & TRAÇAGE ---
const MOCK_MAPPING_TRACER = {
    /**
     * Simule le traçage d'un chemin d'attaque (ex: Victime -> Proxy -> Hébergeur -> Pays final)
     * @param {string} target - La cible (IP ou domaine).
     * @returns {Array} Liste des points géographiques.
     */
    trace: async (target) => {
        // Logique de simulation avancée basée sur la cible
        let points = [];
        
        // Point de départ (Simulé comme étant l'utilisateur/victime en France)
        points.push({ 
            lat: 48.8566, 
            lng: 2.3522, 
            info: "Point 1: Origine (Victime - France)", 
            type: "Origin" 
        });

        if (target.includes('ecom-phish')) {
            // Scénario E-commerce : Proxy rapide puis Data Center étranger
            points.push({ 
                lat: 52.3676, 
                lng: 4.9041, 
                info: "Point 2: Rebond (Proxy/CDN - Amsterdam, NL)", 
                type: "Rebound" 
            });
            points.push({ 
                lat: 25.0478, 
                lng: 121.5319, 
                info: "Point 3: Hébergeur Final (Data Center - Taipei, TW)", 
                type: "Destination" 
            });
        } else if (target.includes('tele-scam')) {
            // Scénario Telegram : VPN puis enregistrement via Panama
            points.push({ 
                lat: 34.0522, 
                lng: -118.2437, 
                info: "Point 2: Rebond (VPN/Node - Los Angeles, US)", 
                type: "Rebound" 
            });
            points.push({ 
                lat: 8.9824, 
                lng: -79.5199, 
                info: "Point 3: Cible Finale (Registrar Enregistré - Panama)", 
                type: "Destination" 
            });
        } else {
            // Scénario par défaut simple
            points.push({ 
                lat: 51.5074, 
                lng: 0.1278, 
                info: "Point 2: Cible Finale (Londres, UK)", 
                type: "Destination" 
            });
        }

        // Simuler la latence
        await new Promise(resolve => setTimeout(resolve, 1800)); 

        return { 
            summary: `Tracé de ${points.length} points pour la cible ${target}`,
            trace_path: points
        };
    }
};

// Définition des Personas (System Prompts)
const ROLES = {
    'manager': {
        name: "Assistant Manager",
        prompt: "Tu es un Assistant Manager expert. Ton rôle est de coordonner l'équipe de cybersécurité, de synthétiser les informations et d'orienter l'utilisateur vers le bon spécialiste."
    },
    'awareness': {
        name: "Security Awareness Manager",
        prompt: "Tu es Security Awareness Manager. Ton expertise est la culture de la sécurité, la pédagogie, la création de campagnes de phishing de test et l'analyse comportementale. Tu parles de facteur humain."
    },
    'grc': {
        name: "Consultant GRC & Facteur Humain",
        prompt: "Tu es Consultant en Cybersécurité (GRC). Tu es formel, axé sur l'audit, les politiques de sécurité, la conformité et la gouvernance. Tu parles aux dirigeants."
    },
    'prevention': {
        name: "Chargé de Prévention Numérique",
        prompt: "Tu es Chargé de Prévention Numérique (Secteur Public). Ton ton est bienveillant, accessible, grand public. Tu aides les victimes, les écoles et les seniors."
    },
    'trust': {
        name: "Analyste Trust & Safety",
        prompt: "Tu es Analyste Trust & Safety. Tu es technique et investigateur. Tu connais les patterns d'arnaques, la modération de contenu et la fraude sur les plateformes."
    },
    'legal': {
    name: "Consultant Juridique (Droit Pénal Numérique)",
    prompt: `
        Tu es un Consultant Juridique Français spécialisé en Droit Pénal Numérique.
        
        # Déontologie
        Ton objectif est d'aider l'utilisateur à QUALIFIER les faits selon le Code Pénal Français (CP) et non de remplacer un avocat ou une autorité judiciaire. Tu ne donnes JAMAIS de conseils juridiques personnalisés ni ne recommandes de procédure sans l'intervention d'un officier.

        # Méthode d'Analyse
        1. Qualification Factuelle : Déterminer la nature exacte de l'incident (Escroquerie, Usurpation, Intrusion).
        2. Référence Légale : Citer l'article du Code Pénal potentiellement applicable (ex: Article 313-1 CP pour l'escroquerie).
        3. Explication Pédagogique : Expliquer ce que la loi requiert (ex: 'manœuvres frauduleuses' pour le 313-1).

        # Base de Connaissance (Cyber-Justitia - ACADÉMIE)
        Utilise impérativement ta base de connaissance interne pour contextualiser la menace. Si la description de l'utilisateur correspond à un modèle connu (ex: Arnaque aux sentiments, Faux Conseiller), tu dois :
        A. Mentionner le titre exact du cas (ex: "Arnaque Faux Support Technique Telegram").
        B. Utiliser les 'indicators_tech' et 'conseils_prevention' pour renforcer ta réponse.
        
        Ton ton est **formel**, **précis** et **axé sur la conformité pénale**.
    `
},
};

// Endpoint API Chat
app.post('/api/chat', async (req, res) => {
    const { message, roleId } = req.body;
    
    const currentRole = ROLES[roleId] || ROLES['manager'];

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: currentRole.prompt },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant", // Ou autre modèle Groq performant
            temperature: 0.7,
            max_tokens: 1024,
        });

        res.json({ 
            reply: chatCompletion.choices[0]?.message?.content || "Pas de réponse.",
            roleName: currentRole.name
        });

    } catch (error) {
        console.error("Erreur Groq:", error);
        res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
    }
});
// L'endpoint OSINT
app.post('/api/osint/scan', async (req, res) => {
    const { tool, target } = req.body;
    
    console.log(`[LOG] Requête reçue : Outil=${tool}, Cible=${target}`); // Log côté serveur pour débugger

    // Petite latence pour faire "vrai"
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        if (MOCK_OSINT_TOOLS[tool]) {
            const data = await MOCK_OSINT_TOOLS[tool](target);
            // On renvoie data directement
            res.json({ success: true, data: data });
        } else {
            res.status(400).json({ success: false, error: "Outil non reconnu" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Erreur serveur OSINT" });
    }
});
// Endpoint API pour le Traçage Géographique
app.post('/api/mapping/trace', async (req, res) => {
    const { target } = req.body;
    
    if (!target) {
        return res.status(400).json({ success: false, error: "Cible de traçage (IP/Domaine) manquante." });
    }

    try {
        const result = await MOCK_MAPPING_TRACER.trace(target);
        
        // Le Backend renvoie la liste des points au Frontend
        res.json({ success: true, data: result });

    } catch (error) {
        console.error("Erreur Traçage:", error);
        res.status(500).json({ success: false, error: "Erreur lors de la simulation de traçage." });
    }
});
// --- ROUTE DE DOCUMENTATION SWAGGER UI (À AJOUTER À LA FIN) ---
/**
 * Route qui sert l'interface Swagger/OpenAPI.
 * Cette route est souvent placée en dehors du chemin principal pour ne pas interférer avec l'application.
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});