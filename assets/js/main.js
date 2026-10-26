import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Show/Hide Section Logic ---
window.showSection = function(sectionId) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) targetSection.classList.add('active');
};

// --- Role Selection ---
window.selectPortal = function(role) {
    localStorage.setItem('sv_role', role);
    if (role === 'school') {
        showSection('school-login');
    } else {
        // Parent (తర్వాత link-child సెక్షన్ యాడ్ చేయండి)
        alert("Parent Portal logic coming soon!");
    }
};

// --- School Login (Firestore) ---
window.handleSchoolLogin = async function(event) {
    event.preventDefault();
    
    const phone = document.getElementById('login-phone').value;
    const pin = document.getElementById('login-pin').value;
    
    try {
        const userDocRef = doc(db, "users", phone);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.pin === pin) {
                alert(`Welcome ${userData.name}!`);
                localStorage.setItem('sv_user', JSON.stringify(userData));
                
                if (userData.role === 'principal' || userData.role === 'admin') {
                    showSection('principal-dashboard');
                } else if (userData.role === 'incharge') {
                    // showSection('attendance'); // తర్వాత
                    alert("Incharge dashboard coming soon!");
                }
            } else {
                alert("Incorrect PIN!");
            }
        } else {
            alert("User not found!");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Something went wrong. Check console.");
    }
};

// --- Startup ---
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('global-splash').classList.add('hidden');
    }, 1500);
});

// --- Footer Logic (Single Click vs Long Press) ---
let pressTimer;
let isLongPress = false;

const footerText = document.getElementById('gi-footer-text');

const startPress = (e) => {
    e.preventDefault();
    isLongPress = false;
    pressTimer = setTimeout(() => {
        isLongPress = true;
        alert("GI Super Admin Login (Phase 3)");
        pressTimer = null;
    }, 3000);
};

const cancelPress = () => {
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (!isLongPress) {
            document.getElementById('gi-popup').classList.add('active');
        }
    }
};

if (footerText) {
    footerText.addEventListener('mousedown', startPress);
    footerText.addEventListener('mouseup', cancelPress);
    footerText.addEventListener('mouseleave', () => { 
        if(pressTimer) clearTimeout(pressTimer); 
    });
    footerText.addEventListener('touchstart', startPress, {passive: false});
    footerText.addEventListener('touchend', cancelPress);
}

// --- GI Popup Logic ---
window.openGiPopup = () => document.getElementById('gi-popup').classList.add('active');
window.closeGiPopup = () => document.getElementById('gi-popup').classList.remove('active');

// --- Dark Mode Toggle ---
window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('sv_dark_mode', isDark);
    
    const icon = document.getElementById('dark-mode-toggle-icon');
    if (icon) {
        if (isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('sv_dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('dark-mode-toggle-icon');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
});

// --- PWA Install Logic ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('show');
});

document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response: ${outcome}`);
                deferredPrompt = null;
                const banner = document.getElementById('install-banner');
                if (banner) banner.classList.remove('show');
            }
        });
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('show');
    deferredPrompt = null;
});
