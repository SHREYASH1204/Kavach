import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth();

// Function to fetch and display cases
async function fetchCases() {
    const casesGrid = document.querySelector(".case-list");
    if (!casesGrid) {
        console.log("Using existing cases display");
        return;
    }
    
    try {
        const querySnapshot = await getDocs(collection(db, "cases"));
        if (querySnapshot.empty) {
            console.log("No cases found.");
            casesGrid.innerHTML = '<p>No cases available.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const caseData = doc.data();
            console.log("Fetched case:", doc.id, caseData);

            const caseElement = document.createElement("div");
            caseElement.classList.add("case-card");
            caseElement.innerHTML = `
                <h3>${caseData.title}</h3>
                <p>${caseData.description}</p>
                <p><strong>Priority:</strong> ${caseData.priority}</p>
                <p><strong>Status:</strong> ${caseData.status}</p>
            `;
            casesGrid.appendChild(caseElement);
        });
    } catch (e) {
        console.error("Error fetching cases: ", e);
    }
}

// Theme Toggle
const themeToggle = document.getElementById('toggle-theme');
if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = this.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
        }
    });
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Always fetch user data to update the UI
        fetchUserData(user.uid);
        
        const userRole = localStorage.getItem('userRole');
        console.log('User role from localStorage:', userRole);
        
        if (userRole) {
            sessionStorage.setItem('userRole', userRole);
            renderNavigation(userRole);
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Function to check page access based on user role
function checkPageAccess() {
    const userRole = sessionStorage.getItem('userRole');
    const currentPage = window.location.pathname;
    
    const ioPages = ['case-file.html', 'reportgen.html', 'websocket/websocket/secure-messaging-mvp/public/index.html'];
    const shoPages = ['case-management.html', 'grievance.html', 'office-management.html'];
    
    if (userRole) {
        if (userRole === 'Investigation Officer' || userRole === 'IO') {
            if (shoPages.some(page => currentPage.includes(page))) {
                window.location.href = 'index.html';
            }
        } else if (userRole === 'Station House Officer' || userRole === 'SHO') {
            if (ioPages.some(page => currentPage.includes(page))) {
                window.location.href = 'index.html';
            }
        }
    }
}

// Logout handler
window.handleLogout = async function() {
    try {
        await signOut(auth);
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            checkPageAccess();
        }
    });
});

// Function to fetch and display user data
async function fetchUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update the navigation user info
            document.getElementById('navUserName').textContent = userData.fullName || 'User';
            document.getElementById('navUserRank').textContent = userData.rank || 'Role';
            
            // Don't re-render navigation if we already have a role in localStorage
            if (!localStorage.getItem('userRole')) {
                renderNavigation(userData.rank);
                sessionStorage.setItem('userRole', userData.rank);
            }
        } else {
            console.error("No user data found");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Function to render navigation based on user role
function renderNavigation(userRole) {
    console.log('Debug - User Role:', userRole);
    console.log('Debug - localStorage Role:', localStorage.getItem('userRole'));
    console.log('Debug - sessionStorage Role:', sessionStorage.getItem('userRole'));
    
    const normalizedRole = userRole ? userRole.trim().toUpperCase() : '';
    const navList = document.querySelector('#main-nav');
    
    if (!navList) {
        console.error('Navigation list element not found');
        return;
    }
    
    // Base navigation items (common for all roles)
    let navItems = [
        {
            href: 'index.html',
            icon: 'fa-home',
            text: 'Dashboard'
        }
    ];

    // Role-specific navigation items
    if (normalizedRole === 'INVESTIGATION OFFICER' || normalizedRole === 'IO') {
        navItems = navItems.concat([
            {
                href: 'case-file.html',
                icon: 'fa-folder',
                text: 'Case Files'
            },
            {
                href: 'reportgen.html',
                icon: 'fa-file-alt',
                text: 'Reports'
            },
            {
                href: 'websocket/websocket/secure-messaging-mvp/public/index.html',
                icon: 'fa-comments',
                text: 'Communication'
            }
        ]);
    } else if (normalizedRole === 'STATION HOUSE OFFICER' || normalizedRole === 'SHO' || normalizedRole === 'STATION HOUSE OFFICER' || normalizedRole === 'SHO') {
        navItems = navItems.concat([
            {
                href: 'case-management.html',
                icon: 'fa-tasks',
                text: 'Case Management'
            },
            {
                href: 'office-management.html',
                icon: 'fa-users',
                text: 'Officer Management'
            },
            {
                href: 'grievance.html',
                icon: 'fa-exclamation-circle',
                text: 'Grievance'
            }
        ]);
    }

    // Add settings for all roles
    navItems.push({
        href: 'settings.html',
        icon: 'fa-cog',
        text: 'Settings'
    });

    // Generate navigation HTML
    navList.innerHTML = navItems.map(item => `
        <li class="${window.location.pathname.includes(item.href) ? 'active' : ''}">
            <a href="${item.href}">
                <i class="fas ${item.icon}"></i>
                <span>${item.text}</span>
            </a>
        </li>
    `).join('');
}