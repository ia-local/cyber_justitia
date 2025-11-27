// card.js

/**
 * Génère le HTML pour une carte d'Académie (Module ou Méthode).
 * @param {object} item - Objet du fichier academia.json
 * @param {function} clickHandler - Fonction à exécuter au clic.
 * @returns {string} Le code HTML de la carte.
 */
function renderCard(item, clickHandler) {
    const iconClass = item.icon || 'fa-solid fa-circle-info';
    
    // Déterminer la couleur de l'icône/fond basée sur le type
    const typeClass = `type-${item.type}`; 
    
    return `
        <div class="c-card-module ${typeClass}" 
             data-id="${item.id}"
             onclick="${clickHandler}(event, '${item.id}')">
            
            <div class="c-card-header">
                <div class="c-card-icon ${typeClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div>
                    <h4 class="c-card-title">${item.title}</h4>
                    <span class="c-card-category">${item.category}</span>
                </div>
            </div>
            
            <p class="c-card-summary">${item.summary}</p>
        </div>
    `;
}