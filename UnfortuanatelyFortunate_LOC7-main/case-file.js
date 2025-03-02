import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc,
    orderBy,
    updateDoc,
    addDoc
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Your Firebase configuration
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

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded"); // Debug log
    try {
        // Check if user is logged in
        auth.onAuthStateChanged((user) => {
            console.log("Auth state changed. User:", user?.uid); // Debug log
            if (!user) {
                console.log("No user logged in, redirecting..."); // Debug log
                window.location.href = 'login.html';
                return;
            }

            // Check if viewing specific case or cases list
            const caseId = new URLSearchParams(window.location.search).get('id');
            
            if (caseId) {
                console.log("Loading specific case:", caseId); // Debug log
                loadCaseDetails(caseId);
            } else {
                console.log("Loading assigned cases"); // Debug log
                showAssignedCases();
            }
        });
    } catch (error) {
        console.error('Error during initialization:', error);
        showNotification('Error loading data', 'error');
    }
    initializeDailyLog();
    initializeUpdates();
    initializeEvidence();
});

// Update the showAssignedCases function
async function showAssignedCases() {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = '<div class="loading">Loading cases...</div>';

        // Get user details
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            showNotification("User profile not found", "error");
            return;
        }

        const userData = userDoc.data();
        console.log("Current user data:", userData); // Debug log

        // Query cases where the logged-in user's ID matches the assignedOfficer.id
        const casesRef = collection(db, "cases");
        const q = query(
            casesRef,
            where("assignedOfficer.id", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        console.log("Query snapshot size:", querySnapshot.size); // Debug log

        const cases = [];
        querySnapshot.forEach((doc) => {
            const caseData = doc.data();
            console.log("Found case:", doc.id, caseData); // Debug log
            cases.push({
                id: doc.id,
                ...caseData
            });
        });

        if (cases.length === 0) {
            console.log("No cases found for user ID:", user.uid); // Debug log
            mainContent.innerHTML = `
                <div class="assigned-cases">
                    <h1>My Assigned Cases</h1>
                    <p class="no-cases">No cases assigned to you yet.</p>
                </div>
            `;
            return;
        }

        mainContent.innerHTML = `
            <div class="assigned-cases">
                <h1>My Assigned Cases</h1>
                <div class="cases-grid">
                    ${cases.map(caseItem => `
                        <div class="case-card" onclick="window.location.href='case-file.html?id=${caseItem.id}'">
                            <div class="case-card-header">
                                <h3>${caseItem.title}</h3>
                                <span class="case-badge ${caseItem.priority.toLowerCase()}">${caseItem.priority}</span>
                            </div>
                            <div class="case-card-content">
                                <p><strong>Case ID:</strong> #${caseItem.id.slice(-6)}</p>
                                <p><strong>Date:</strong> ${formatDate(caseItem.createdAt)}</p>
                                <p><strong>Status:</strong> <span class="status-badge ${caseItem.status.toLowerCase()}">${caseItem.status}</span></p>
                                <p class="case-description">${caseItem.description}</p>
                            </div>
                            <div class="case-footer">
                                <button class="view-details-btn">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error fetching cases:', error);
        showNotification('Error loading cases', 'error');
        mainContent.innerHTML = '<div class="error">Error loading cases. Please try again.</div>';
    }
}

// Update the loadCaseDetails function
async function loadCaseDetails(caseId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const caseDoc = await getDoc(doc(db, "cases", caseId));
        if (!caseDoc.exists()) {
            showNotification("Case not found", "error");
            return;
        }

        const caseData = caseDoc.data();

        // Check if the logged-in user is the assigned officer
        if (caseData.assignedOfficer.id !== user.uid) {
            showNotification("You don't have permission to view this case", "error");
            window.location.href = 'case-file.html';
            return;
        }

        // Update case header and details
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="case-details">
                <div class="case-header">
                    <div class="header-content">
                        <h1>${caseData.title}</h1>
                        <div class="case-status">
                            <span class="priority-badge ${caseData.priority.toLowerCase()}">${caseData.priority}</span>
                            <span class="status-badge ${caseData.status.toLowerCase()}">${caseData.status}</span>
                        </div>
                    </div>
                    <button class="edit-case-btn" onclick="openEditCaseModal('${caseId}')">
                        <i class="fas fa-edit"></i> Edit Case
                    </button>
                </div>

                <div class="case-info">
                    <div class="info-section">
                        <h3>Basic Information</h3>
                        <p><strong>Case ID:</strong> #${caseId.slice(-6)}</p>
                        <p><strong>Created:</strong> ${formatDate(caseData.createdAt)}</p>
                        <p><strong>Status:</strong> ${caseData.status}</p>
                        <p><strong>Priority:</strong> ${caseData.priority}</p>
                    </div>

                    <div class="info-section">
                        <h3>Incident Details</h3>
                        <p><strong>Location:</strong> ${caseData.incidentLocation || 'Not specified'}</p>
                        <p><strong>Date of Incident:</strong> ${formatDate(caseData.incidentDate)}</p>
                        <p><strong>Type:</strong> ${caseData.caseType || 'Not specified'}</p>
                    </div>

                    <div class="info-section">
                        <h3>Case Description</h3>
                        <p>${caseData.description}</p>
                    </div>

                    <div class="info-section">
                        <h3>Complainant Information</h3>
                        <p><strong>Name:</strong> ${caseData.complainant?.name || 'Not specified'}</p>
                        <p><strong>Contact:</strong> ${caseData.complainant?.contact || 'Not specified'}</p>
                    </div>
                </div>

                <!-- Tabs for different sections -->
                <div class="case-tabs">
                    <button class="tab-btn active" data-tab="daily-log">Daily Log</button>
                    <button class="tab-btn" data-tab="evidence">Evidence</button>
                    <button class="tab-btn" data-tab="updates">Updates</button>
                </div>

                <!-- Tab Contents -->
                <div class="tab-content active" id="daily-log">
                    <div class="daily-log-section">
                        <!-- Daily log content -->
                    </div>
                </div>

                <div class="tab-content" id="evidence">
                    <div class="evidence-section">
                        <!-- Evidence content -->
                    </div>
                </div>

                <div class="tab-content" id="updates">
                    <div class="updates-section">
                        <!-- Updates content -->
                    </div>
                </div>
            </div>
        `;

        // Initialize all functionalities
        initializeTabs();
        initializeDailyLog();
        initializeEvidence();

    } catch (error) {
        console.error('Error loading case details:', error);
        showNotification('Error loading case details', "error");
    }
}

// Helper function to format dates
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    // Check if timestamp is a Firebase Timestamp
    if (timestamp.toDate) {
        timestamp = timestamp.toDate();
    }
    // Check if timestamp is a string
    if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp);
    }
    return timestamp.toLocaleDateString();
}

// Cloudinary Upload Widget Configuration
let uploadedFiles = [];

const evidenceWidget = cloudinary.createUploadWidget({
    cloudName: 'dv2gmz2if',
    uploadPreset: 'SARK',
    sources: ['local', 'url'],
    multiple: true,
    folder: 'evidence', // Base folder
    resourceType: 'auto', // Automatically detect resource type
    clientAllowedFormats: ['jpg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'doc', 'docx'],
    maxFiles: 10,
    maxFileSize: 20000000, // 20MB
}, (error, result) => {
    if (!error && result && result.event === "success") {
        handleUploadSuccess(result);
    }
});

function handleUploadSuccess(result) {
    const previewContainer = document.getElementById('evidencePreview');
    const evidenceType = document.getElementById('evidenceType').value;
    
    // Store uploaded file info
    uploadedFiles.push({
        url: result.info.secure_url,
        type: result.info.resource_type,
        format: result.info.format,
        originalName: result.info.original_filename
    });

    // Create preview element
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';

    if (result.info.resource_type === 'image') {
        previewItem.innerHTML = `
            <img src="${result.info.thumbnail_url || result.info.secure_url}" alt="Evidence">
            <span class="filename">${result.info.original_filename}</span>
        `;
    } else if (result.info.resource_type === 'video') {
        previewItem.innerHTML = `
            <video width="150" height="100" controls>
                <source src="${result.info.secure_url}" type="video/${result.info.format}">
            </video>
            <span class="filename">${result.info.original_filename}</span>
        `;
    } else {
        previewItem.innerHTML = `
            <div class="document-preview">
                <i class="fas fa-file-alt"></i>
                <span class="filename">${result.info.original_filename}</span>
            </div>
        `;
    }

    previewContainer.appendChild(previewItem);
}

// Modified evidence form submission
function initializeModals() {
    // Update form submission
    document.getElementById('updateForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        addUpdate({
            date: formData.get('date'),
            time: formData.get('time'),
            details: formData.get('details'),
            attachments: formData.get('attachments')
        });
        closeModal('addUpdateModal');
    });

    // Evidence form submission
    document.getElementById('evidenceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        // Add uploaded files to evidence data
        const evidenceData = {
            type: formData.get('type'),
            description: formData.get('description'),
            location: formData.get('location'),
            files: uploadedFiles
        };

        addEvidence(evidenceData);
        uploadedFiles = []; // Reset uploaded files array
        closeModal('addEvidenceModal');
    });

    // Initialize upload widget button
    document.getElementById('evidenceUploadWidget').addEventListener('click', function() {
        evidenceWidget.open();
    });

    // Add grant access button handler
    document.getElementById('grantAccessButton').addEventListener('click', function() {
        window.open("https://upload-request.cloudinary.com/dv2gmz2if/5fc22d5e10125118539cc599d4ee06ec", "_blank");
    });
}

// Add investigation update
function addUpdate(updateData) {
    const updatesList = document.querySelector('.updates-list');
    const updateElement = document.createElement('div');
    updateElement.className = 'update-entry';
    updateElement.innerHTML = `
        <div class="update-header">
            <span class="update-time">${updateData.date} ${updateData.time}</span>
        </div>
        <div class="update-content">
            <p>${updateData.details}</p>
            ${updateData.attachments ? `<div class="attachments">
                <i class="fas fa-paperclip"></i> ${updateData.attachments.name}
            </div>` : ''}
        </div>
    `;
    updatesList.insertBefore(updateElement, updatesList.firstChild);
    showNotification('Update added successfully');
}

// Modified addEvidence function
function addEvidence(evidenceData) {
    const evidences = JSON.parse(localStorage.getItem(`evidences_${getCaseId()}`) || '[]');
    evidences.push(evidenceData);
    localStorage.setItem(`evidences_${getCaseId()}`, JSON.stringify(evidences));

    // Update the UI
    displayEvidence();
    closeModal('addEvidenceModal');
    showNotification('Evidence added successfully');
}

// Display evidence in the main interface
function displayEvidence() {
    const evidences = JSON.parse(localStorage.getItem(`evidences_${getCaseId()}`) || '[]');
    const evidenceContainer = document.querySelector('.evidence-list');
    
    if (!evidenceContainer) return;
    
    evidenceContainer.innerHTML = evidences.map(evidence => `
        <div class="evidence-item">
            <div class="evidence-type">
                <i class="fas fa-${getEvidenceIcon(evidence.type)}"></i>
            </div>
            <div class="evidence-details">
                <h4>${evidence.type}</h4>
                <p>${evidence.description}</p>
                <small><i class="fas fa-map-marker-alt"></i> ${evidence.location}</small>
                <div class="evidence-files">
                    ${evidence.files.map(file => {
                        if (file.type === 'image') {
                            return `<img src="${file.url}" alt="Evidence" class="evidence-preview">`;
                        } else if (file.type === 'video') {
                            return `<video controls class="evidence-preview">
                                        <source src="${file.url}" type="video/${file.format}">
                                    </video>`;
                        } else {
                            return `<a href="${file.url}" target="_blank" class="document-link">
                                        <i class="fas fa-file-alt"></i> ${file.originalName}
                                    </a>`;
                        }
                    }).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Helper functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    
    // Load appropriate form content based on modal type
    const content = getModalContent(modalId);
    modal.querySelector('.modal-content').innerHTML = content;
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = () => closeModal(modalId);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function getEvidenceIcon(type) {
    const icons = {
        'physical': 'box',
        'digital': 'laptop',
        'document': 'file-alt',
        'photo': 'camera',
        'video': 'video'
    };
    return icons[type] || 'folder';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Add styles for case list view
function addCaseListStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .assigned-cases {
            padding: 20px;
        }
        .cases-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .case-card {
            background-color: var(--card-background-dark);
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        .case-card:hover {
            transform: translateY(-2px);
        }
        .case-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .case-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        .case-badge.high { background-color: rgba(231, 76, 60, 0.2); color: #e74c3c; }
        .case-badge.medium { background-color: rgba(241, 196, 15, 0.2); color: #f1c40f; }
        .case-badge.low { background-color: rgba(46, 204, 113, 0.2); color: #2ecc71; }
    `;
    document.head.appendChild(style);
}

function loadCaseData() {
    // Fetch case data from server/localStorage
    const caseId = new URLSearchParams(window.location.search).get('id');
    // Add API call here to fetch case details
}

function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and its content
            btn.classList.add('active');
            const tabContent = document.getElementById(btn.dataset.tab);
            tabContent.classList.add('active');

            // If daily-log tab is selected, load the case logs
            if (btn.dataset.tab === 'daily-log') {
                const caseId = getCaseId();
                displayCaseLogs(caseId);
            }
        });
    });
}

function addLogEntry() {
    const modal = createModal('Add Investigation Log Entry');
    modal.innerHTML = `
        <form id="logEntryForm">
            <div class="form-group">
                <label>Date</label>
                <input type="date" required>
            </div>
            <div class="form-group">
                <label>Activity Type</label>
                <select required>
                    <option value="investigation">Investigation</option>
                    <option value="interview">Interview</option>
                    <option value="evidence">Evidence Collection</option>
                    <option value="report">Report Filing</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea required></textarea>
            </div>
            <div class="form-group">
                <label>Attachments</label>
                <input type="file" multiple>
            </div>
            <div class="modal-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">Add Entry</button>
            </div>
        </form>
    `;
    
    document.body.appendChild(modal);
}

function generateReport() {
    // Generate PDF report with case details and evidence
}

function setupEventListeners() {
    document.querySelector('.add-log-btn').addEventListener('click', addLogEntry);
    document.querySelector('.add-evidence-btn').addEventListener('click', addEvidence);
    document.querySelector('.download-btn').addEventListener('click', generateReport);
}

function createModal(title) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    // Add modal HTML structure
    return modal;
}

// Modal Templates
const modalTemplates = {
    addParty: `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Involved Party</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="addPartyForm">
                <div class="form-group">
                    <label>Party Type</label>
                    <select required name="partyType">
                        <option value="victim">Victim</option>
                        <option value="suspect">Suspect</option>
                        <option value="witness">Witness</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" required name="name">
                    </div>
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" required name="age">
                    </div>
                </div>
                <div class="form-group">
                    <label>Contact Information</label>
                    <input type="tel" required name="contact">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea required name="address"></textarea>
                </div>
                <div class="form-group">
                    <label>Statement</label>
                    <textarea required name="statement"></textarea>
                </div>
                <div class="form-group">
                    <label>Photo</label>
                    <input type="file" accept="image/*" name="photo">
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Add Party</button>
                </div>
            </form>
        </div>
    `,

    addEvidence: `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Evidence</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="addEvidenceForm" onsubmit="handleEvidenceSubmit(event)">
                <div class="form-group">
                    <label>Evidence Type</label>
                    <select required name="evidenceType">
                        <option value="physical">Physical Evidence</option>
                        <option value="digital">Digital Evidence</option>
                        <option value="document">Document</option>
                        <option value="photo">Photograph</option>
                        <option value="video">Video</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea required name="description"></textarea>
                </div>
                <div class="form-group">
                    <label>Upload Files</label>
                    <input type="file" multiple name="files">
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeModal('addEvidenceModal')">Cancel</button>
                    <button type="submit" class="submit-btn">Add Evidence</button>
                </div>
            </form>
        </div>
    `,

    addLogEntry: `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Investigation Log Entry</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="addLogEntryForm" onsubmit="handleLogSubmit(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" required name="date">
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" required name="time">
                    </div>
                </div>
                <div class="form-group">
                    <label>Activity Type</label>
                    <select required name="activityType">
                        <option value="investigation">Investigation</option>
                        <option value="interview">Interview/Interrogation</option>
                        <option value="evidence">Evidence Collection</option>
                        <option value="surveillance">Surveillance</option>
                        <option value="report">Report Writing</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea required name="description"></textarea>
                </div>
                <div class="form-group">
                    <label>Attachments</label>
                    <input type="file" multiple name="attachments">
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Add Entry</button>
                </div>
            </form>
        </div>
    `
};

// Handle form submissions with entry display
function handlePartySubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Create party card
    const partyCard = createPartyCard({
        type: formData.get('partyType'),
        name: formData.get('name'),
        age: formData.get('age'),
        statement: formData.get('statement'),
        photo: formData.get('photo')
    });
    
    // Add to appropriate tab content
    const tabContent = document.getElementById(formData.get('partyType') + 's');
    tabContent.insertBefore(partyCard, tabContent.firstChild);
    
    closeModal('addPartyModal');
    showNotification('Party added successfully');
}

function handleEvidenceSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Create evidence card
    const evidenceCard = createEvidenceCard({
        type: formData.get('evidenceType'),
        description: formData.get('description'),
        files: formData.get('files')
    });
    
    // Add to evidence grid
    document.querySelector('.evidence-grid').insertBefore(evidenceCard, null);
    
    closeModal('addEvidenceModal');
    showNotification('Evidence added successfully');
}

function handleLogSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Create log entry
    const logEntry = createLogEntry({
        date: formData.get('date'),
        time: formData.get('time'),
        type: formData.get('activityType'),
        description: formData.get('description')
    });
    
    // Add to log entries
    document.querySelector('.log-entries').insertBefore(logEntry, null);
    
    closeModal('addLogModal');
    showNotification('Log entry added successfully');
}

// Create HTML elements for entries
function createPartyCard(data) {
    const card = document.createElement('div');
    card.className = 'party-card';
    card.innerHTML = `
        <div class="party-header">
            <div class="party-photo">
                ${data.photo ? `<img src="${URL.createObjectURL(data.photo)}" alt="${data.name}">` 
                            : `<i class="fas fa-user"></i>`}
            </div>
            <div class="party-info">
                <h3>${data.name}</h3>
                <span class="party-type ${data.type}">${data.type}</span>
            </div>
            <div class="party-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        </div>
        <div class="party-details">
            <p><strong>Age:</strong> ${data.age}</p>
            <p><strong>Statement:</strong> ${data.statement}</p>
        </div>
    `;
    return card;
}

function createEvidenceCard(data) {
    const card = document.createElement('div');
    card.className = 'evidence-card';
    card.innerHTML = `
        <div class="evidence-icon">
            ${getEvidenceIcon(data.type)}
        </div>
        <div class="evidence-details">
            <h4>${data.type}</h4>
            <p>${data.description}</p>
            ${data.files ? `<span class="file-count"><i class="fas fa-paperclip"></i> ${data.files.length} files</span>` : ''}
        </div>
        <div class="evidence-actions">
            <button class="view-btn"><i class="fas fa-eye"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return card;
}

function createLogEntry(data) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <div class="log-entry-header">
            <div class="log-entry-time">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(data.date)} ${data.time}</span>
            </div>
            <span class="activity-type ${data.type.toLowerCase()}">${data.type}</span>
        </div>
        <div class="log-entry-content">
            <p>${data.description}</p>
        </div>
        <div class="log-entry-actions">
            <button class="edit-btn"><i class="fas fa-edit"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return entry;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    }
});

// Update the progress tracker steps and their order
const progressSteps = {
    'io-assigned': {
        icon: 'fa-user-shield',
        label: 'IO Assigned',
        order: 1
    },
    'fir-report': {
        icon: 'fa-file-alt',
        label: 'FIR Report',
        order: 2
    },
    'investigation': {
        icon: 'fa-search',
        label: 'Investigation',
        order: 3
    },
    'final-report': {
        icon: 'fa-file-contract',
        label: 'Final Report',
        order: 4
    },
    'closed': {
        icon: 'fa-check-circle',
        label: 'Closed',
        order: 5
    }
};

// Function to update progress tracker
function updateProgressTracker(currentStep) {
    const progressTracker = document.querySelector('.progress-tracker');
    progressTracker.innerHTML = '';

    Object.entries(progressSteps)
        .sort((a, b) => a[1].order - b[1].order)
        .forEach(([stepId, step]) => {
            const milestone = document.createElement('div');
            milestone.className = 'milestone';
            milestone.dataset.step = stepId; // Add data attribute for step identification
            
            // Add appropriate classes based on current progress
            if (step.order < progressSteps[currentStep].order) {
                milestone.classList.add('completed');
            } else if (stepId === currentStep) {
                milestone.classList.add('active');
            }

            milestone.innerHTML = `
                <i class="fas ${step.icon}"></i>
                <span>${step.label}</span>
            `;

            // Add click handler to each milestone
            milestone.addEventListener('click', () => {
                moveToStep(stepId);
            });
            
            progressTracker.appendChild(milestone);
        });
}

// Function to move to a specific step
function moveToStep(targetStep) {
    const currentStep = getCurrentStep();
    
    // Only allow moving to the next step in sequence
    if (progressSteps[targetStep].order === progressSteps[currentStep].order + 1) {
        updateProgressTracker(targetStep);
        handleProgressStep(targetStep);
        // Save the current step to localStorage
        localStorage.setItem('currentStep', targetStep);
        showNotification(`Moved to ${progressSteps[targetStep].label}`);
    }
}

// Function to get current step
function getCurrentStep() {
    const activeStep = document.querySelector('.milestone.active');
    return activeStep ? activeStep.dataset.step : 'io-assigned';
}

// Add this to your CSS to make milestones look clickable
function addProgressTrackerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .milestone {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .milestone:hover {
            transform: translateY(-2px);
        }
        
        .milestone:not(.completed):not(.active) {
            opacity: 0.7;
        }
        
        .milestone.completed:hover,
        .milestone.active:hover {
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
}

// Function to handle progress step actions
function handleProgressStep(step) {
    switch(step) {
        case 'io-assigned':
            // Show case details and enable FIR report generation
            document.querySelector('.fir-details').style.display = 'block';
            break;
        
        case 'fir-report':
            // Enable investigation tools and show FIR report link
            document.querySelector('.investigation-tools').style.display = 'block';
            document.querySelector('.fir-report-btn').innerHTML = `
                <a href="reportgen.html?type=fir&id=${getCaseId()}" class="generate-btn">
                    <i class="fas fa-file-export"></i> Generate FIR Report
                </a>
            `;
            break;
            
        case 'investigation':
            // Enable evidence collection and log entries
            document.querySelector('.evidence').style.display = 'block';
            document.querySelector('.investigation-log').style.display = 'block';
            break;
            
        case 'final-report':
            // Enable final report generation
            document.querySelector('.final-report-section').style.display = 'block';
            document.querySelector('.final-report-btn').innerHTML = `
                <a href="reportgen.html?type=final&id=${getCaseId()}" class="generate-btn">
                    <i class="fas fa-file-export"></i> Generate Final Report
                </a>
            `;
            break;
            
        case 'closed':
            // Disable editing and show case summary
            disableEditing();
            showCaseSummary();
            break;
    }
}

// Helper function to get case ID from URL
function getCaseId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || '';
}

// Initialize daily log functionality
function initializeDailyLog() {
    // Only initialize if we're in case detail view
    const dailyLogForm = document.getElementById('dailyLogForm');
    if (!dailyLogForm) return; // Exit if form doesn't exist

    // Set today's date by default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('logDate');
    if (dateInput) {
        dateInput.value = today;
    }

    // Load existing tasks
    loadScheduledTasks();

    // Add form submission handler
    dailyLogForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveDailyLog();
    });

    // Display existing logs
    displayDailyLogs();
}

// Add task to tomorrow's schedule
function addScheduledTask() {
    const input = document.getElementById('newTaskInput');
    const taskText = input.value.trim();
    
    if (taskText) {
        const taskList = document.getElementById('scheduledTasks');
        const taskElement = document.createElement('div');
        taskElement.className = 'scheduled-task';
        taskElement.innerHTML = `
            <label class="task-checkbox">
                <input type="checkbox">
                <span class="checkmark"></span>
                <span class="task-text">${taskText}</span>
            </label>
            <button class="delete-task" onclick="deleteTask(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        taskList.appendChild(taskElement);
        input.value = '';
        
        // Save tasks to localStorage
        saveScheduledTasks();
    }
}

// Delete task
function deleteTask(button) {
    button.parentElement.remove();
    saveScheduledTasks();
}

// Save tasks to localStorage
function saveScheduledTasks() {
    const tasks = [];
    document.querySelectorAll('.scheduled-task').forEach(taskElement => {
        tasks.push({
            text: taskElement.querySelector('.task-text').textContent,
            completed: taskElement.querySelector('input[type="checkbox"]').checked
        });
    });
    localStorage.setItem(`tasks_${getCaseId()}`, JSON.stringify(tasks));
}

// Load tasks from localStorage
function loadScheduledTasks() {
    const tasks = JSON.parse(localStorage.getItem(`tasks_${getCaseId()}`) || '[]');
    const taskList = document.getElementById('scheduledTasks');
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'scheduled-task';
        taskElement.innerHTML = `
            <label class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="task-text">${task.text}</span>
            </label>
            <button class="delete-task" onclick="deleteTask(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        taskList.appendChild(taskElement);
    });
}

// Save daily logs
function saveDailyLog() {
    const formData = new FormData(document.getElementById('todayLogForm'));
    const logData = {
        date: formData.get('logDate'),
        activities: formData.get('activities'),
        findings: formData.get('findings'),
        scheduledTasks: Array.from(document.querySelectorAll('.scheduled-task')).map(task => ({
            text: task.querySelector('.task-text').textContent,
            completed: task.querySelector('input[type="checkbox"]').checked
        }))
    };

    // Save to localStorage (you can modify this to save to your backend)
    const logs = JSON.parse(localStorage.getItem(`logs_${getCaseId()}`) || '[]');
    logs.push(logData);
    localStorage.setItem(`logs_${getCaseId()}`, JSON.stringify(logs));

    // Update the UI
    displayDailyLogs();
    closeModal('dailyLogModal');
    showNotification('Daily log saved successfully');
}

// Display daily logs in the main interface
function displayDailyLogs() {
    const logs = JSON.parse(localStorage.getItem(`logs_${getCaseId()}`) || '[]');
    const logsContainer = document.querySelector('.daily-logs-list') || createLogsContainer();
    
    logsContainer.innerHTML = logs.map(log => `
        <div class="log-entry">
            <div class="log-date">${new Date(log.date).toLocaleDateString()}</div>
            <div class="log-content">
                <h4>Activities</h4>
                <p>${log.activities}</p>
                ${log.findings ? `
                    <h4>Key Findings</h4>
                    <p>${log.findings}</p>
                ` : ''}
                ${log.scheduledTasks.length ? `
                    <h4>Scheduled Tasks</h4>
                    <ul class="task-list">
                        ${log.scheduledTasks.map(task => `
                            <li class="${task.completed ? 'completed' : ''}">${task.text}</li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Create logs container if it doesn't exist
function createLogsContainer() {
    const container = document.createElement('div');
    container.className = 'daily-logs-list';
    document.querySelector('.case-content').appendChild(container);
    return container;
}

// Initialize evidence functionality
function initializeEvidence() {
    displayEvidence();
    
    // Initialize upload widget button if it exists
    const uploadWidget = document.getElementById('evidenceUploadWidget');
    if (uploadWidget) {
        uploadWidget.addEventListener('click', function() {
            evidenceWidget.open();
        });
    }
}

// Update these functions for case editing
window.openEditCaseModal = function(caseId) {
    // Get case data first
    getDoc(doc(db, "cases", caseId)).then(caseDoc => {
        if (caseDoc.exists()) {
            const caseData = caseDoc.data();
            
            // Create and insert modal HTML only when edit button is clicked
            const modalHTML = `
                <div id="editCaseModal" class="modal">
                    <div class="modal-content">
                        <span class="close" onclick="closeEditModal()">&times;</span>
                        <h2>Edit Case</h2>
                        <form id="editCaseForm">
                            <div class="form-group">
                                <label for="editTitle">Case Title</label>
                                <input type="text" id="editTitle" value="${caseData.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="editDescription">Description</label>
                                <textarea id="editDescription" required>${caseData.description}</textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="editStatus">Status</label>
                                    <select id="editStatus" required>
                                        <option value="Open" ${caseData.status === 'Open' ? 'selected' : ''}>Open</option>
                                        <option value="In Progress" ${caseData.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="Closed" ${caseData.status === 'Closed' ? 'selected' : ''}>Closed</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="editPriority">Priority</label>
                                    <select id="editPriority" required>
                                        <option value="High" ${caseData.priority === 'High' ? 'selected' : ''}>High</option>
                                        <option value="Medium" ${caseData.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                        <option value="Low" ${caseData.priority === 'Low' ? 'selected' : ''}>Low</option>
                                    </select>
                                </div>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="cancel-btn" onclick="closeEditModal()">Cancel</button>
                                <button type="submit" class="submit-btn">Update Case</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            // Remove any existing modal
            const existingModal = document.getElementById('editCaseModal');
            if (existingModal) {
                existingModal.remove();
            }

            // Add new modal to the document
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Show the modal
            document.getElementById('editCaseModal').style.display = 'block';

            // Setup the form submission
            setupEditForm(caseId);
        }
    }).catch(error => {
        console.error("Error getting case data:", error);
        showNotification("Error loading case data", "error");
    });
};

window.closeEditModal = function() {
    const modal = document.getElementById('editCaseModal');
    if (modal) {
        modal.style.display = 'none';
        modal.remove(); // Remove the modal from DOM when closed
    }
};

// Add this function to save changes to the daily logs
async function logCaseChange(caseId, changes, changeType) {
    try {
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const officerName = userData.fullName || user.displayName || user.email;

        const logEntry = {
            timestamp: new Date(),
            officerId: user.uid,
            officerName: officerName,
            changeType: changeType,
            changes: changes,
            caseId: caseId
        };

        // Add to Firebase collection
        await addDoc(collection(db, "case_logs"), logEntry);

        // Update the logs display
        displayCaseLogs(caseId);
    } catch (error) {
        console.error("Error logging change:", error);
        showNotification("Error saving change log", "error");
    }
}

// Function to display case logs
async function displayCaseLogs(caseId) {
    try {
        const logsRef = collection(db, "case_logs");
        const q = query(
            logsRef,
            where("caseId", "==", caseId),
            orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const logsContainer = document.querySelector('#daily-log .daily-log-section');
        
        if (!logsContainer) return;

        let logsHTML = `
            <div class="daily-log-header">
                <h3>Case Activity Log</h3>
                <button class="add-log-btn" onclick="addNewLogEntry()">
                    <i class="fas fa-plus"></i> Add New Log Entry
                </button>
            </div>
            <div class="logs-list">
        `;
        
        querySnapshot.forEach((doc) => {
            const log = doc.data();
            const date = log.timestamp.toDate();
            const formattedDate = new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);

            let changesText = '';
            if (log.changes) {
                Object.entries(log.changes).forEach(([field, value]) => {
                    changesText += `<li><strong>${field}:</strong> ${value}</li>`;
                });
            }

            logsHTML += `
                <div class="log-entry">
                    <div class="log-entry-header">
                        <div class="log-entry-time">
                            <i class="fas fa-clock"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="officer-info">
                            <i class="fas fa-user"></i>
                            <span>${log.officerName}</span>
                        </div>
                    </div>
                    <div class="log-entry-content">
                        <p class="change-type">${log.changeType}</p>
                        ${changesText ? `
                            <ul class="changes-list">
                                ${changesText}
                            </ul>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        logsHTML += '</div>';
        logsContainer.innerHTML = logsHTML;

    } catch (error) {
        console.error("Error displaying logs:", error);
        showNotification("Error loading activity logs", "error");
    }
}

// Update the setupEditForm function to include logging
function setupEditForm(caseId) {
    const editForm = document.getElementById('editCaseForm');
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedData = {
            title: document.getElementById('editTitle').value,
            description: document.getElementById('editDescription').value,
            status: document.getElementById('editStatus').value,
            priority: document.getElementById('editPriority').value,
            lastUpdated: new Date()
        };

        try {
            // Get the original case data to compare changes
            const caseDoc = await getDoc(doc(db, "cases", caseId));
            const originalData = caseDoc.data();

            // Track what actually changed
            const changes = {};
            Object.keys(updatedData).forEach(key => {
                if (key !== 'lastUpdated' && originalData[key] !== updatedData[key]) {
                    changes[key] = `Changed from "${originalData[key]}" to "${updatedData[key]}"`;
                }
            });

            // Only log if there were actual changes
            if (Object.keys(changes).length > 0) {
                await logCaseChange(caseId, changes, "Case Update");
            }

            // Update the case
            await updateDoc(doc(db, "cases", caseId), updatedData);
            showNotification("Case updated successfully", "success");
            closeEditModal();
            loadCaseDetails(caseId); // Reload the case details

        } catch (error) {
            console.error("Error updating case:", error);
            showNotification("Error updating case", "error");
        }
    });
} 