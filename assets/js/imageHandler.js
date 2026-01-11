import { $ } from './utils.js';

export function initImageHandler() {
    const fileInput = $('#pet-image');
    const startBtn = $('#start-camera-btn');
    const stopBtn = $('#stop-camera-btn');
    const captureBtn = $('#capture-btn');
    const video = $('#camera-preview');
    const canvas = $('#camera-canvas');
    const container = $('#camera-container');

    let previewUrl = null;
    let stream = null;

    // 1. File Input Handling (Existing)
    fileInput.addEventListener('change', (e) => handleFileObject(e.target.files[0]));

    // 2. Start Camera
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            // Security Check for Insecure Contexts (HTTP)
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Camera access is restricted by your browser.\n\nReason: Live camera requires a secure connection (HTTPS) or Localhost.\n\nPlease use the 'Photo' file upload button instead.");
                return;
            }

            try {
                // Explicit Permission Request
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }, 
                    audio: false 
                });
                
                video.srcObject = stream;
                container.hidden = false;
                startBtn.parentElement.hidden = true; // Hide "Use Camera" button
                video.play();
            } catch (err) {
                console.warn("Camera Access Denied/Error:", err);
                alert("Camera access denied or unavailable. Please use the 'Photo' upload button instead.");
                stopCamera();
            }
        });
    }

    // 3. Stop/Cancel Camera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        video.srcObject = null;
        container.hidden = true;
        
        if (startBtn) startBtn.parentElement.hidden = false;
    }

    if (stopBtn) stopBtn.addEventListener('click', stopCamera);

    // 4. Capture Photo
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            if (!stream) return;

            // Draw video frame to canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to Blob/File
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "camera-capture.png", { type: "image/png" });
                    
                    // Manually assign to input if possible (DataTransfer) for form submission compatibility
                    // Note: Programmatically setting input files is allowed in modern browsers
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;

                    handleFileObject(file);
                    stopCamera();
                }
            }, 'image/png');
        });
    }

    function handleFileObject(file) {
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewUrl = URL.createObjectURL(file);
        }
    }

    return {
        getImageUrl: () => previewUrl
    };
}
