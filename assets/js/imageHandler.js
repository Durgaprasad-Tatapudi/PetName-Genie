import { $ } from './utils.js';

export function initImageHandler() {
    const fileInput = $('#pet-image');
    let previewUrl = null;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = URL.createObjectURL(file);
        }
    });

    return {
        getImageUrl: () => previewUrl
    };
}
