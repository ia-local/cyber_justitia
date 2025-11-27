// modalSystem.js (À créer ou vérifier)
const ModalSystem = {
    init: function() {
        document.querySelectorAll('.c-modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay.id);
                }
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModal = document.querySelector('.c-modal-overlay.is-visible');
                if (visibleModal) this.close(visibleModal.id);
            }
        });
    },

    open: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('is-visible');
        }
    },

    close: function(modalId) {
        const id = typeof modalId === 'string' ? modalId : modalId.id; 
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('is-visible');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ModalSystem.init());