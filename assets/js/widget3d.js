/**
 * Lightweight Vanilla JS 3D Widget
 * Renders a rotating 3D geometry using HTML5 Canvas 2D.
 * Performance optimized: only renders when visible, no heavy libraries.
 */
export class Pet3DWidget {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width = 160;
        this.height = this.canvas.height = 160;
        
        // Cube Vertices
        this.vertices = [
            {x: -1, y: -1, z: -1}, {x: 1, y: -1, z: -1}, {x: 1, y: 1, z: -1}, {x: -1, y: 1, z: -1},
            {x: -1, y: -1, z: 1}, {x: 1, y: -1, z: 1}, {x: 1, y: 1, z: 1}, {x: -1, y: 1, z: 1}
        ];
        
        // Connectivity (Edges)
        this.edges = [
            [0,1], [1,2], [2,3], [3,0], // Back face
            [4,5], [5,6], [6,7], [7,4], // Front face
            [0,4], [1,5], [2,6], [3,7]  // Connecting lines
        ];

        this.angleX = 0;
        this.angleY = 0;
        this.isVisible = true;

        this.initObserver();
        this.animate();
    }

    initObserver() {
        // Only animate when visible on screen
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (this.isVisible) this.animate();
            });
        });
        observer.observe(this.canvas);
    }

    project(x, y, z) {
        const fov = 150;
        const scale = fov / (fov + z * 30); // Perspective projection
        return {
            x: x * scale * 50 + this.width / 2,
            y: y * scale * 50 + this.height / 2
        };
    }

    rotateX(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const y = point.y * cos - point.z * sin;
        const z = point.y * sin + point.z * cos;
        return {x: point.x, y: y, z: z};
    }

    rotateY(point, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = point.x * cos - point.z * sin;
        const z = point.x * sin + point.z * cos;
        return {x: x, y: point.y, z: z};
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Style
        this.ctx.strokeStyle = '#6366f1'; // Primary Color
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';

        // Draw Edges
        this.edges.forEach(edge => {
            let p1 = this.vertices[edge[0]];
            let p2 = this.vertices[edge[1]];

            p1 = this.rotateX(p1, this.angleX);
            p1 = this.rotateY(p1, this.angleY);
            
            p2 = this.rotateX(p2, this.angleX);
            p2 = this.rotateY(p2, this.angleY);

            const proj1 = this.project(p1.x, p1.y, p1.z);
            const proj2 = this.project(p2.x, p2.y, p2.z);

            this.ctx.beginPath();
            this.ctx.moveTo(proj1.x, proj1.y);
            this.ctx.lineTo(proj2.x, proj2.y);
            this.ctx.stroke();
        });
        
        // Draw decorative "Paw" center hint (circle)
        this.ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(this.width/2, this.height/2, 20 + Math.sin(this.angleY)*5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    animate() {
        if (!this.isVisible) return;

        this.angleX += 0.01;
        this.angleY += 0.02;

        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}
