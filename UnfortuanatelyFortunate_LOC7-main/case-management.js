import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot, where, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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
const auth = getAuth(app);

// Function to fetch and display cases
async function fetchAndDisplayCases() {
    const casesGrid = document.querySelector(".cases-grid");
    if (!casesGrid) {
        console.error("Cases grid element not found");
        return;
    }

    try {
        // Create a query to order cases by creation date
        const casesRef = collection(db, "cases");
        const q = query(casesRef, orderBy("createdAt", "desc"));

        // Set up real-time listener
        onSnapshot(q, (snapshot) => {
            casesGrid.innerHTML = ''; // Clear existing cases

            if (snapshot.empty) {
                casesGrid.innerHTML = '<p class="no-cases">No cases available.</p>';
                return;
            }

            snapshot.forEach((doc) => {
                const caseData = doc.data();
                const caseElement = createCaseCard(doc.id, caseData);
                casesGrid.appendChild(caseElement);
            });
        });

    } catch (error) {
        console.error("Error fetching cases:", error);
        casesGrid.innerHTML = '<p class="error-message">Error loading cases. Please try again later.</p>';
    }
}

// Function to create a case card
function createCaseCard(caseId, caseData) {
    const card = document.createElement('div');
    card.className = 'case-card';
    
    // Format date
    const createdAt = caseData.createdAt?.toDate() || new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(createdAt);

    card.innerHTML = `
        <div class="case-header">
            <span class="case-id">#${caseId.slice(-6)}</span>
            <span class="priority-badge ${caseData.priority.toLowerCase()}">${caseData.priority}</span>
        </div>
        <h3>${caseData.title}</h3>
        <div class="case-details">
            <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <span>${formattedDate}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${caseData.incidentLocation || 'Location not specified'}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-user"></i>
                <span>${caseData.complainant?.name || 'Complainant not specified'}</span>
            </div>
        </div>
        <p class="case-description">${caseData.description}</p>
        <div class="case-status">
            <span class="status-badge ${caseData.status.toLowerCase()}">${caseData.status}</span>
        </div>
        <div class="action-buttons">
            <button class="view-case-btn" onclick="viewCaseDetails('${caseId}')">
                <i class="fas fa-eye"></i> View Details
            </button>
            <button class="update-btn" onclick="updateCaseStatus('${caseId}')">
                <i class="fas fa-edit"></i> Update
            </button>
        </div>
    `;

    return card;
}

// Function to handle case status updates
window.updateCaseStatus = async function(caseId) {
    try {
        const caseDoc = await getDoc(doc(db, "cases", caseId));
        if (caseDoc.exists()) {
            const caseData = caseDoc.data();
            
            // Populate the update form
            document.getElementById('updateCaseTitle').value = caseData.title;
            document.getElementById('updateCaseDescription').value = caseData.description;
            document.getElementById('updateCasePriority').value = caseData.priority;
            document.getElementById('updateCaseStatus').value = caseData.status;
            document.getElementById('updateCaseId').value = caseId;
            
            document.getElementById('updateCaseModal').style.display = 'block';
        } else {
            showNotification("Case not found", "error");
        }
    } catch (error) {
        console.error("Error fetching case for update:", error);
        showNotification("Error loading case", "error");
    }
};

// Function to view case details
window.viewCaseDetails = async function(caseId) {
    try {
        const caseDoc = await getDoc(doc(db, "cases", caseId));
        if (caseDoc.exists()) {
            const caseData = caseDoc.data();
            const createdAt = caseData.createdAt?.toDate() || new Date();
            const formattedDate = new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(createdAt);

            const detailsContent = document.getElementById('caseDetailsContent');
            detailsContent.innerHTML = `
                <div class="case-details-view">
                    <div class="detail-row">
                        <strong>Case ID:</strong> #${caseId.slice(-6)}
                    </div>
                    <div class="detail-row">
                        <strong>Title:</strong> ${caseData.title}
                    </div>
                    <div class="detail-row">
                        <strong>Description:</strong> ${caseData.description}
                    </div>
                    <div class="detail-row">
                        <strong>Priority:</strong> 
                        <span class="priority-badge ${caseData.priority.toLowerCase()}">${caseData.priority}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong> 
                        <span class="status-badge ${caseData.status.toLowerCase()}">${caseData.status}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Created:</strong> ${formattedDate}
                    </div>
                    <div class="detail-row">
                        <strong>Assigned Officer:</strong> ${caseData.assignedOfficer?.name || 'Not assigned'}
                    </div>
                </div>
            `;
            
            document.getElementById('viewCaseModal').style.display = 'block';
        } else {
            showNotification("Case not found", "error");
        }
    } catch (error) {
        console.error("Error fetching case details:", error);
        showNotification("Error loading case details", "error");
    }
};

// Function to fetch and populate IO officers
async function fetchAndPopulateOfficers() {
    console.log("Starting to fetch officers..."); // Debug log

    const officerSelect = document.getElementById('assignedOfficer');
    if (!officerSelect) {
        console.error("Officer select element not found!");
        return;
    }

    try {
        // Create a query to get all users with rank "Investigation Officer" or "IO"
        const usersRef = collection(db, "users");
        console.log("Created users reference"); // Debug log

        // Query for users with rank either "IO" or "Investigation Officer"
        const q = query(
            usersRef, 
            where('rank', 'in', ['io', 'Investigation Officer'])
        );
        console.log("Created query for IOs"); // Debug log

        const querySnapshot = await getDocs(q);
        console.log("Got query snapshot, size:", querySnapshot.size); // Debug log

        // Clear existing options except the first one
        officerSelect.innerHTML = '<option value="">Select officer</option>';

        if (querySnapshot.empty) {
            console.log("No IOs found in database");
            officerSelect.innerHTML += '<option value="" disabled>No officers available</option>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            console.log("Found officer:", userData); // Debug log

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${userData.fullName} (${userData.rank})`;
            option.dataset.contact = userData.contact || '';
            officerSelect.appendChild(option);
        });

        // Add change event listener to update contact field
        officerSelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const contactField = document.getElementById('officerContact');
            if (contactField) {
                contactField.value = selectedOption.dataset.contact || '';
            }
        });

        console.log("Officers populated successfully"); // Debug log

    } catch (error) {
        console.error("Error fetching officers:", error);
        officerSelect.innerHTML = '<option value="">Error loading officers</option>';
    }
}

// Function to render navigation based on user role
function renderNavigation(userRole) {
    console.log('Rendering navigation for role:', userRole);
    
    const navList = document.querySelector('#main-nav');
    
    if (!navList) {
        console.error('Navigation list element not found');
        return;
    }
    
    const normalizedRole = userRole ? userRole.trim().toUpperCase() : '';
    
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
    
    console.log('Navigation rendered:', navList.innerHTML);
}

// Function to fetch and display user data
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
        } else {
            console.error("No user data found");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Auth state observer with navigation
onAuthStateChanged(auth, (user) => {
    if (user) {
        // First try to get role from localStorage
        let userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
            // If not in localStorage, try sessionStorage
            userRole = sessionStorage.getItem('userRole');
        }
        
        if (userRole) {
            console.log('Rendering navigation with role:', userRole);
            renderNavigation(userRole);
            fetchAndDisplayCases();
            initializeFilters();
            fetchAndPopulateOfficers();
        } else {
            // If no role found, fetch user data
            fetchUserData(user.uid);
        }
    } else {
        console.log("User not authenticated, redirecting..."); 
        window.location.href = 'login.html';
    }
});

// Also fetch officers when the create case button is clicked
document.querySelector('.create-case-btn')?.addEventListener('click', () => {
    console.log("Create case button clicked"); // Debug log
    fetchAndPopulateOfficers(); // Refresh officer list when modal opens
    document.getElementById('createCaseModal').style.display = 'block';
});

// Add this to your existing filter function
async function applyFilters() {
    const department = document.querySelector('select[data-filter="department"]').value;
    const status = document.querySelector('select[data-filter="status"]').value;
    const priority = document.querySelector('select[data-filter="priority"]').value;

    const casesGrid = document.querySelector(".cases-grid");
    casesGrid.innerHTML = '<p class="loading">Loading cases...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "cases"));
        casesGrid.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const caseData = doc.data();
            
            const matchesDepartment = department === "All Departments" || caseData.department === department;
            const matchesStatus = status === "All Status" || caseData.status === status;
            const matchesPriority = priority === "All Priorities" || caseData.priority === priority;

            if (matchesDepartment && matchesStatus && matchesPriority) {
                const caseElement = createCaseCard(doc.id, caseData);
                casesGrid.appendChild(caseElement);
            }
        });

        if (casesGrid.children.length === 0) {
            casesGrid.innerHTML = '<p class="no-cases">No cases match the selected filters.</p>';
        }

    } catch (error) {
        console.error("Error applying filters:", error);
        casesGrid.innerHTML = '<p class="error-message">Error filtering cases. Please try again.</p>';
    }
}

// Initialize filters
function initializeFilters() {
    const filters = document.querySelectorAll('select[data-filter]');
    filters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

// Update the addNewCase function to include the assigned officer
window.addNewCase = async function() {
    const caseTitle = document.getElementById('caseTitle').value;
    const caseDescription = document.getElementById('caseDescription').value;
    const casePriority = document.getElementById('casePriority').value;
    const caseStatus = 'Open'; // Default status for new cases
    const assignedOfficerId = document.getElementById('assignedOfficer').value;
    const assignedOfficerName = document.getElementById('assignedOfficer').options[
        document.getElementById('assignedOfficer').selectedIndex
    ].text;

    if (!assignedOfficerId) {
        alert("Please select an investigating officer");
        return;
    }

    try {
        const docRef = await addDoc(collection(db, "cases"), {
            title: caseTitle,
            description: caseDescription,
            priority: casePriority,
            status: caseStatus,
            createdAt: new Date(),
            assignedOfficer: {
                id: assignedOfficerId,
                name: assignedOfficerName,
                contact: document.getElementById('officerContact').value
            }
        });

        showNotification("Case created successfully", "success");
        document.getElementById('newCaseForm').reset();
        document.getElementById('createCaseModal').style.display = 'none';
        fetchAndDisplayCases();
    } catch (e) {
        console.error("Error adding case: ", e);
        showNotification("Error creating case: " + e.message, "error");
    }
};

// Close modal when clicking cancel or outside
document.querySelector('.cancel-btn').addEventListener('click', () => {
    document.getElementById('createCaseModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('createCaseModal')) {
        document.getElementById('createCaseModal').style.display = 'none';
    }
});

// Generate case number
function generateCaseNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}-${random}`;
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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

// Handle form submission for case updates
document.getElementById('updateCaseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const caseId = document.getElementById('updateCaseId').value;
    const updatedData = {
        title: document.getElementById('updateCaseTitle').value,
        description: document.getElementById('updateCaseDescription').value,
        priority: document.getElementById('updateCasePriority').value,
        status: document.getElementById('updateCaseStatus').value,
        lastUpdated: new Date()
    };

    try {
        await updateDoc(doc(db, "cases", caseId), updatedData);
        showNotification("Case updated successfully", "success");
        document.getElementById('updateCaseModal').style.display = 'none';
        // The real-time listener will automatically update the UI
    } catch (error) {
        console.error("Error updating case:", error);
        showNotification("Error updating case", "error");
    }
});

function setupModal(mode, caseData = null) {
    const modal = document.getElementById('caseModal');
    const form = document.getElementById('caseForm');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('modalSubmitBtn');
    
    // Configure modal based on mode
    switch(mode) {
        case 'create':
            title.textContent = 'Create New Case';
            submitBtn.textContent = 'Create Case';
            form.reset();
            form.onsubmit = (e) => {
                e.preventDefault();
                addNewCase();
            };
            break;
        case 'view':
            title.textContent = 'Case Details';
            submitBtn.style.display = 'none';
            populateForm(caseData, true); // true for readonly
            break;
        case 'update':
            title.textContent = 'Update Case';
            submitBtn.textContent = 'Update Case';
            populateForm(caseData, false);
            form.onsubmit = (e) => {
                e.preventDefault();
                updateCase(caseData.id);
            };
            break;
    }
    
    modal.style.display = 'block';
}

function populateForm(data, readonly = false) {
    const form = document.getElementById('caseForm');
    // Populate form fields with data
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = data[key];
            element.readOnly = readonly;
        }
    });
}