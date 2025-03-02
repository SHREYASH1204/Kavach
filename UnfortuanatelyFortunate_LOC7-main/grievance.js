import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

// Function to fetch and display grievances
async function fetchGrievances() {
    const grievanceItems = document.querySelector('.grievance-items');
    if (!grievanceItems) {
        console.error("No element with class 'grievance-items' found.");
        return;
    }
    grievanceItems.innerHTML = "";  // Clear existing grievances

    try {
        const querySnapshot = await getDocs(collection(db, "grievances"));
        if (querySnapshot.empty) {
            console.log("No grievances found.");
            grievanceItems.innerHTML = '<p>No grievances available.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const grievanceData = doc.data();
            console.log("Fetched grievance:", doc.id, grievanceData);

            const item = createGrievanceItem(grievanceData);
            grievanceItems.appendChild(item);
        });
    } catch (e) {
        console.error("Error fetching grievances: ", e);
        alert("Error fetching grievances: " + e.message);
    }
}

function createGrievanceItem(grievance) {
    const div = document.createElement('div');
    div.className = 'grievance-item';
    div.innerHTML = `
        <div class="grievance-header">
            <span class="grievance-id">${grievance.id || 'N/A'}</span>
            <span class="grievance-priority priority-${grievance.priority || 'low'}">${(grievance.priority || 'low').toUpperCase()}</span>
        </div>
        <h4>${grievance.title || 'No Title'}</h4>
        <p class="grievance-category">${grievance.category || 'Uncategorized'}</p>
        <div class="grievance-meta">
            <span><i class="fas fa-map-marker-alt"></i> ${grievance.location || 'Unknown Location'}</span>
            <span><i class="fas fa-clock"></i> ${grievance.submittedDate || 'Unknown Date'}</span>
        </div>
    `;
    
    div.addEventListener('click', () => showGrievanceDetails(grievance));
    return div;
}

function showGrievanceDetails(grievance) {
    const detailsContent = document.querySelector('.details-content');
    detailsContent.innerHTML = `
        <div class="details-section">
            <h4>${grievance.title || 'No Title'}</h4>
            <div class="meta-info">
                <span class="status ${grievance.status || 'unknown'}">${grievance.status || 'Unknown'}</span>
                <span class="priority priority-${grievance.priority || 'low'}">${(grievance.priority || 'low').toUpperCase()}</span>
            </div>
            <p class="description">${grievance.description || 'No Description'}</p>
            
            <div class="info-grid">
                <div class="info-item">
                    <label>Category</label>
                    <span>${grievance.category || 'Uncategorized'}</span>
                </div>
                <div class="info-item">
                    <label>Location</label>
                    <span>${grievance.location || 'Unknown Location'}</span>
                </div>
                <div class="info-item">
                    <label>Submitted By</label>
                    <span>${grievance.submittedBy || 'Anonymous'}</span>
                </div>
                <div class="info-item">
                    <label>Submitted Date</label>
                    <span>${grievance.submittedDate || 'Unknown Date'}</span>
                </div>
            </div>

            <div class="timeline">
                ${(grievance.timeline || []).map(event => `
                    <div class="timeline-item">
                        <h5>${event.action || 'No Action'}</h5>
                        <p>${event.date || 'Unknown Date'}</p>
                        <span>By: ${event.by || 'Unknown'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Handle filter changes
document.querySelectorAll('.filter-group select').forEach(select => {
    select.addEventListener('change', (e) => {
        // Add your filtering logic here
        console.log('Filter changed:', e.target.value);
    });
});

// Initialize the interface
document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
        if (user) {
            fetchUserData(user.uid);
        } else {
            window.location.href = 'login.html';
        }
    });
    
    fetchGrievances();
    // Show first grievance details by default if any
    const grievanceItems = document.querySelector('.grievance-items');
    if (grievanceItems && grievanceItems.firstChild) {
        grievanceItems.firstChild.click();
    }
});

// Handle new grievance button
document.querySelector('.new-grievance-btn').addEventListener('click', () => {
    // Add your new grievance creation logic here
    console.log('New grievance button clicked');
});

// Handle status update button
document.querySelector('.status-update-btn').addEventListener('click', () => {
    // Add your status update logic here
    console.log('Status update button clicked');
});

// Handle assign button
document.querySelector('.assign-btn').addEventListener('click', () => {
    // Add your assignment logic here
    console.log('Assign button clicked');
});

// Add these functions at the top of your file
async function fetchUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update the navigation user info
            document.getElementById('navUserName').textContent = userData.fullName || 'User';
            document.getElementById('navUserRank').textContent = userData.rank || 'Role';
            
            if (!localStorage.getItem('userRole')) {
                renderNavigation(userData.rank);
                sessionStorage.setItem('userRole', userData.rank);
            }
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

function renderNavigation(userRole) {
    const normalizedRole = userRole ? userRole.trim().toUpperCase() : '';
    const navList = document.querySelector('#main-nav');
    
    if (!navList) {
        console.error('Navigation list element not found');
        return;
    }
    
    let navItems = [
        {
            href: 'index.html',
            icon: 'fa-home',
            text: 'Dashboard'
        }
    ];

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
                href: 'communication.html',
                icon: 'fa-comments',
                text: 'Communication'
            }
        ]);
    } else if (normalizedRole === 'STATION HOUSE OFFICER' || normalizedRole === 'SHO') {
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

    navItems.push({
        href: 'settings.html',
        icon: 'fa-cog',
        text: 'Settings'
    });

    // Clear existing navigation
    navList.innerHTML = '';

    // Add new navigation items
    navItems.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="${item.href}">
                <i class="fas ${item.icon}"></i>
                <span>${item.text}</span>
            </a>
        `;
        navList.appendChild(li);
    });
}