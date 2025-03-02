// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuQJVZZ0w65mrl2A-swnrcD8JUz7XrmHc",
    authDomain: "loc70-eaf4d.firebaseapp.com",
    projectId: "loc70-eaf4d",
    storageBucket: "loc70-eaf4d.appspot.com",
    messagingSenderId: "962983024035",
    appId: "1:962983024035:web:18689d6ca85b05c8a13616",
    measurementId: "G-5Y73CMW04G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Officer code patterns and validation
const OFFICER_CODES = {
    city: {
        CP: { pattern: /^CP\d+$/, role: 'Commissioner of Police' },
        JCP: { pattern: /^JCP\d+$/, role: 'Joint Commissioner of Police' },
        DCP: { pattern: /^DCP\d+$/, role: 'Deputy Commissioner of Police' },
        ACP: { pattern: /^ACP\d+$/, role: 'Assistant Commissioner of Police' }
    },
    station: {
        SHO: { pattern: /^SHO\d+$/, role: 'Station House Officer' },
        SI: { pattern: /^SI\d+$/, role: 'Sub-Inspector' },
        ASI: { pattern: /^ASI\d+$/, role: 'Assistant Sub-Inspector' },
        IO: { pattern: /^IO\d+$/, role: 'Investigation Officer' }
    }
};

class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.loginTypeToggle = document.getElementById('loginTypeToggle');
        this.cityLevelLabel = document.querySelector('.city-level');
        this.stationLevelLabel = document.querySelector('.station-level');
        this.emailInput = document.getElementById('loginEmail');
        this.passwordInput = document.getElementById('loginPassword');
        this.officerCodeInput = document.getElementById('officerCode');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Toggle switch event listener
        this.loginTypeToggle.addEventListener('change', (e) => this.handleLoginTypeToggle(e));

        // Form submission event listener
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Officer code input validation
        this.officerCodeInput.addEventListener('input', (e) => this.validateOfficerCodeFormat(e));
    }

    handleLoginTypeToggle(event) {
        if (event.target.checked) {
            this.cityLevelLabel.classList.remove('active');
            this.stationLevelLabel.classList.add('active');
            this.officerCodeInput.placeholder = 'Station Level Code (SHO/SI/ASI/IO)';
        } else {
            this.cityLevelLabel.classList.add('active');
            this.stationLevelLabel.classList.remove('active');
            this.officerCodeInput.placeholder = 'City Level Code (CP/JCP/DCP/ACP)';
        }
        // Clear the officer code input when switching types
        this.officerCodeInput.value = '';
    }

    validateOfficerCodeFormat(event) {
        const code = event.target.value.toUpperCase();
        event.target.value = code; // Force uppercase

        const isStationLevel = this.loginTypeToggle.checked;
        const validCodes = isStationLevel ? OFFICER_CODES.station : OFFICER_CODES.city;
        
        let isValid = false;
        for (const [prefix, details] of Object.entries(validCodes)) {
            if (code.startsWith(prefix)) {
                isValid = details.pattern.test(code);
                break;
            }
        }

        // Visual feedback
        if (code) {
            event.target.style.borderColor = isValid ? 'green' : 'red';
        } else {
            event.target.style.borderColor = ''; // Reset to default
        }
    }

    validateOfficerCode(code) {
        const isStationLevel = this.loginTypeToggle.checked;
        const validCodes = isStationLevel ? OFFICER_CODES.station : OFFICER_CODES.city;
        
        for (const [prefix, details] of Object.entries(validCodes)) {
            if (code.startsWith(prefix) && details.pattern.test(code)) {
                return {
                    valid: true,
                    role: details.role,
                    level: isStationLevel ? 'station' : 'city'
                };
            }
        }
        
        return { valid: false };
    }

    async handleLogin(event) {
        event.preventDefault();

        const loginData = {
            email: this.emailInput.value,
            password: this.passwordInput.value,
            officerCode: this.officerCodeInput.value.toUpperCase(),
            isStationLevel: this.loginTypeToggle.checked
        };

        // Validate officer code
        const codeValidation = this.validateOfficerCode(loginData.officerCode);
        if (!codeValidation.valid) {
            this.showError('Invalid officer code format');
            return;
        }

        try {
            // Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
            
            // Store role in localStorage with exact role name
            localStorage.setItem('userRole', codeValidation.role);
            console.log('Setting user role:', codeValidation.role); // Debug log
            
            // Redirect based on officer level
            const redirectPath = codeValidation.level === 'city' ? 'dashboard.html' : 'index.html';
            window.location.href = redirectPath;
        } catch (error) {
            this.showError('Invalid email or password');
            console.error('Login error:', error);
        }
    }

    showError(message) {
        // You can implement a more sophisticated error display mechanism
        alert(message);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});