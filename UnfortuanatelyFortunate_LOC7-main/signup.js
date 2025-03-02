// Import necessary Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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
const db = getFirestore(app);

class SignupManager {
    constructor() {
        this.loginTypeToggle = document.getElementById('loginTypeToggle');
        this.cityLevelForm = document.getElementById('signupForm');
        this.stationLevelForm = document.getElementById('stationLevelForm');
        this.cityLevelLabel = document.querySelector('.city-level');
        this.stationLevelLabel = document.querySelector('.station-level');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Toggle switch event listener
        this.loginTypeToggle.addEventListener('change', (e) => this.handleFormToggle(e));

        // City level form submission
        this.cityLevelForm.addEventListener('submit', (e) => this.handleSignup(e, 'city'));

        // Station level form submission
        this.stationLevelForm.addEventListener('submit', (e) => this.handleSignup(e, 'station'));
    }

    handleFormToggle(event) {
        if (event.target.checked) {
            // Show station level form
            this.cityLevelForm.style.display = 'none';
            this.stationLevelForm.style.display = 'block';
            this.cityLevelLabel.classList.remove('active');
            this.stationLevelLabel.classList.add('active');
        } else {
            // Show city level form
            this.cityLevelForm.style.display = 'block';
            this.stationLevelForm.style.display = 'none';
            this.cityLevelLabel.classList.add('active');
            this.stationLevelLabel.classList.remove('active');
        }
    }

    validateOfficerCode(rank, code, level) {
        const cityLevelPatterns = {
            'CP': /^CP\d{3}$/,
            'JCP': /^JCP\d{3}$/,
            'DCP': /^DCP\d{3}$/,
            'ACP': /^ACP\d{3}$/
        };

        const stationLevelPatterns = {
            'sho': /^SHO\d{3}$/,
            'si': /^SI\d{3}$/,
            'asi': /^ASI\d{3}$/,
            'io': /^IO\d{3}$/
        };

        const patterns = level === 'city' ? cityLevelPatterns : stationLevelPatterns;
        return patterns[rank]?.test(code);
    }

    async handleSignup(event, level) {
        event.preventDefault();
        const form = event.target;

        try {
            let formData;
            if (level === 'city') {
                formData = {
                    fullName: document.getElementById('fullName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    badgeNumber: document.getElementById('badgeNumber').value,
                    password: document.getElementById('password').value,
                    confirmPassword: document.getElementById('confirmPassword').value,
                    officerCode: document.getElementById('officerCode').value,
                    rank: document.getElementById('rank').value,
                    zone: document.getElementById('policeStation').value,
                    level: 'city'
                };
            } else {
                // For station level form
                const stationForm = document.getElementById('stationLevelForm');
                formData = {
                    fullName: stationForm.querySelector('input[placeholder="Full Name"]').value,
                    email: stationForm.querySelector('input[type="email"]').value,
                    phone: stationForm.querySelector('input[type="tel"]').value,
                    badgeNumber: stationForm.querySelector('input[placeholder="Badge Number"]').value,
                    password: stationForm.querySelector('input[type="password"]').value,
                    confirmPassword: stationForm.querySelectorAll('input[type="password"]')[1].value,
                    officerCode: stationForm.querySelector('input[placeholder="Station Level Officer Code"]').value,
                    rank: document.getElementById('stationRank').value,
                    policeStation: stationForm.querySelector('select').value,
                    level: 'station'
                };
            }

            // Validate passwords match
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            // Validate officer code format
            if (!this.validateOfficerCode(formData.rank, formData.officerCode, level)) {
                throw new Error(`Invalid officer code format for ${formData.rank} rank. 
                    Please use format: ${formData.rank}123`);
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );

            // Store additional user data in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                badgeNumber: formData.badgeNumber,
                rank: formData.rank,
                level: formData.level,
                location: level === 'city' ? formData.zone : formData.policeStation,
                officerCode: formData.officerCode,
                status: 'pending', // For verification by higher authorities
                createdAt: new Date().toISOString()
            });

            alert('Registration successful! Please wait for verification.');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Error signing up:', error);
            alert(error.message);
        }
    }
}

// Initialize signup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SignupManager();
});