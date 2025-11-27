require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Groq = require('groq-sdk');

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
// --- MODULE SIMULATION OSINT ---
const MOCK_OSINT_TOOLS = {
    'whois': async (target) => {
        // Simulation d'une requête WHOIS (dans la réalité, utiliserait un package comme 'whois-json')
        return {
            tool: "WHOIS Lookup",
            target: target,
            timestamp: new Date().toISOString(),
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
                ip: target,
                isp: "DigitalOcean, LLC",
                country: "Netherlands",
                city: "Amsterdam",
                hostingType: "Data Center (Suspect pour un site e-commerce)"
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
                sources: ["Collection #1 (2019)", "Verifications.io (2019)", "Exploit.in"],
                passwordHint: "Passeport haché détecté"
            },
            riskScore: 90
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
    }
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
// NOUVEL ENDPOINT : Labo OSINT
app.post('/api/osint/scan', async (req, res) => {
    const { tool, target } = req.body;
    
    // Simulation de latence réseau (effet réaliste)
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
        if (MOCK_OSINT_TOOLS[tool]) {
            const data = await MOCK_OSINT_TOOLS[tool](target);
            res.json({ success: true, data: data });
        } else {
            res.status(400).json({ success: false, error: "Outil non reconnu" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Erreur serveur OSINT" });
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});