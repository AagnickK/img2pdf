// Mouse tracking and cursor effects
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    gsap.to(cursorGlow, {
        x: mouseX - 10,
        y: mouseY - 10,
        duration: 0.1,
        ease: "power2.out"
    });
});

// Parallax background particles
function createParticles() {
    const container = document.getElementById('bgParticles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 215, 0, 0.3);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
        `;
        container.appendChild(particle);
        
        gsap.to(particle, {
            y: "+=100vh",
            duration: Math.random() * 20 + 10,
            repeat: -1,
            ease: "none"
        });
    }
}

// Animated title letters
function animateTitle() {
    const letters = document.querySelectorAll('.letter');
    gsap.fromTo(letters, 
        { opacity: 0, y: 50, rotationX: 90 },
        { 
            opacity: 1, 
            y: 0, 
            rotationX: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: "back.out(1.7)"
        }
    );
    
    gsap.fromTo('.subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1 }
    );
}

// Hover effects for interactive elements
function setupHoverEffects() {
    const cards = document.querySelectorAll('.glass-card, .file-item, .premium-btn');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            gsap.to(card, {
                rotationX: 5,
                rotationY: 5,
                scale: 1.02,
                duration: 0.3,
                ease: "power2.out"
            });
        });
        
        card.addEventListener('mouseleave', (e) => {
            gsap.to(card, {
                rotationX: 0,
                rotationY: 0,
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            });
        });
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                duration: 0.1,
                ease: "power2.out"
            });
        });
    });
}

// File upload functionality
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const convertBtn = document.getElementById('convertBtn');
const progress = document.getElementById('progress');
const error = document.getElementById('error');
const qualitySelector = document.getElementById('qualitySelector');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const estimatedSize = document.getElementById('estimatedSize');
let selectedFiles = [];
let selectedQuality = 75;
let sizeEstimateTimeout;

// Drag & drop handlers
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    selectedFiles = Array.from(files).filter(file => 
        ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)
    );
    
    if (selectedFiles.length === 0) {
        showError('Please select valid image files (JPG, JPEG, PNG)');
        return;
    }
    
    displayFiles();
    convertBtn.disabled = false;
    hideError();
}

function displayFiles() {
    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item" style="opacity: 0; transform: translateY(20px);">
            <div style="font-weight: 600; margin-bottom: 0.5rem;">${file.name}</div>
            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">
                ${(file.size/1024/1024).toFixed(1)}MB
            </div>
        </div>
    `).join('');
    
    // Show quality selector
    qualitySelector.style.display = 'block';
    
    // Animate file items and quality selector
    gsap.fromTo('.file-item', 
        { opacity: 0, y: 20 },
        { 
            opacity: 1, 
            y: 0, 
            duration: 0.5, 
            stagger: 0.1,
            ease: "power2.out"
        }
    );
    
    gsap.fromTo(qualitySelector,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3 }
    );
    
    // Initial size estimate
    setTimeout(updateSizeEstimate, 800);
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    gsap.fromTo(error, 
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3 }
    );
}

function hideError() {
    gsap.to(error, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        onComplete: () => error.style.display = 'none'
    });
}

// File size estimation
async function updateSizeEstimate() {
    if (selectedFiles.length === 0) return;
    
    const filesData = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
    }));
    
    try {
        const response = await fetch('/estimate-size', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: filesData,
                quality: selectedQuality
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            estimatedSize.textContent = `Estimated size: ${data.formatted_size}`;
        } else {
            estimatedSize.textContent = 'Size estimation unavailable';
        }
    } catch (err) {
        estimatedSize.textContent = 'Size estimation unavailable';
    }
}

// Quality selector functionality
qualityRange.addEventListener('input', (e) => {
    selectedQuality = parseInt(e.target.value);
    qualityValue.textContent = selectedQuality;
    
    // Update active quality option
    document.querySelectorAll('.quality-option').forEach(option => {
        option.classList.remove('active');
    });
    
    // Debounced size estimation
    clearTimeout(sizeEstimateTimeout);
    estimatedSize.textContent = 'Calculating...';
    sizeEstimateTimeout = setTimeout(updateSizeEstimate, 500);
});

document.querySelectorAll('.quality-option').forEach(option => {
    option.addEventListener('click', () => {
        const quality = parseInt(option.dataset.quality);
        selectedQuality = quality;
        qualityRange.value = quality;
        qualityValue.textContent = quality;
        
        document.querySelectorAll('.quality-option').forEach(opt => {
            opt.classList.remove('active');
        });
        option.classList.add('active');
        
        // Update size estimate
        estimatedSize.textContent = 'Calculating...';
        clearTimeout(sizeEstimateTimeout);
        sizeEstimateTimeout = setTimeout(updateSizeEstimate, 300);
    });
});

convertBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    formData.append('quality', selectedQuality);
    
    convertBtn.disabled = true;
    progress.style.display = 'flex';
    hideError();
    
    gsap.fromTo(progress,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3 }
    );
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_images.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Success animation
            gsap.to(convertBtn, {
                backgroundColor: '#4ade80',
                duration: 0.3,
                yoyo: true,
                repeat: 1
            });
        } else {
            const errorData = await response.json();
            showError(errorData.error || 'Failed to convert images');
        }
    } catch (err) {
        showError('Network error occurred');
    } finally {
        convertBtn.disabled = false;
        gsap.to(progress, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            onComplete: () => progress.style.display = 'none'
        });
    }
});

// Navigation functionality
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const creditPage = document.getElementById('creditPage');
    const closeBtn = document.getElementById('closeCredit');
    
    // Creator nav click
    navItems[1].addEventListener('click', () => {
        creditPage.style.display = 'flex';
        gsap.fromTo(creditPage, 
            { opacity: 0, scale: 0.8 }, 
            { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
        );
    });
    
    // Close popup
    function closePopup() {
        gsap.to(creditPage, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            onComplete: () => creditPage.style.display = 'none'
        });
    }
    
    closeBtn.addEventListener('click', closePopup);
    creditPage.addEventListener('click', (e) => {
        if (e.target === creditPage) closePopup();
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    animateTitle();
    setupHoverEffects();
    setupNavigation();
    
    // Floating nav animation
    gsap.fromTo('.floating-nav',
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.5 }
    );
    
    // Container entrance
    gsap.fromTo('.container',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.3 }
    );
});