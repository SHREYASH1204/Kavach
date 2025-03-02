import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// Function to fetch and display user data
async function fetchUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Update the navigation user info
            document.getElementById('navUserName').textContent = userData.fullName || 'User';
            document.getElementById('navUserRank').textContent = userData.rank || 'Role';
            
            // Store role in localStorage and sessionStorage
            localStorage.setItem('userRole', userData.rank);
            sessionStorage.setItem('userRole', userData.rank);
            
            // Call renderNavigation from script.js
            window.renderNavigation(userData.rank);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Check authentication and role
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRole = sessionStorage.getItem('userRole');
        if (!userRole) {
            // If no role in session storage, fetch user data
            await fetchUserData(user.uid);
        } else if (userRole === 'Station House Officer' || userRole === 'SHO') {
            // If role exists, just render navigation
            window.renderNavigation(userRole);
        } else {
            // Redirect if not SHO
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Make sure renderNavigation is available globally
if (typeof window.renderNavigation !== 'function') {
    window.renderNavigation = function(userRole) {
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

        // Add SHO-specific navigation items
        if (normalizedRole === 'STATION HOUSE OFFICER' || normalizedRole === 'SHO') {
            navItems = navItems.concat([
                {
                    href: 'case-management.html',
                    icon: 'fa-tasks',
                    text: 'Case Management'
                },
                {
                    href: 'officer-management.html',
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
    };
}

// Your existing office management functionality here
// ... (duty assignment, timetable creation, etc.)

// Add these functions after the existing code

// Function to assign duty to an officer
function assignDuty() {
    const officer = document.getElementById('officerSelect').value;
    const duty = document.getElementById('dutySelect').value;
    
    if (!officer || !duty) {
        alert('Please select both an officer and a duty');
        return;
    }

    const selectedCell = document.querySelector('.selected-cell');
    if (!selectedCell) {
        alert('Please select a time slot first');
        return;
    }

    const dutyElement = document.createElement('div');
    dutyElement.className = 'officer-duty';
    dutyElement.innerHTML = `
        ${officer} - ${duty}
        <span class="delete-duty" onclick="removeDuty(this)">×</span>
    `;
    selectedCell.appendChild(dutyElement);
    updateScheduleStats();
}

// Add officer database
const officerDatabase = [
    { 
        name: 'Officer Johnson',
        rank: 'Sergeant',
        specializations: ['Patrol', 'Investigation'],
        maxNightShifts: 2,
        minRestHours: 12
    },
    { 
        name: 'Officer Chen',
        rank: 'Detective',
        specializations: ['Investigation', 'Evidence'],
        maxNightShifts: 2,
        minRestHours: 12
    },
    { 
        name: 'Officer Rodriguez',
        rank: 'Sergeant',
        specializations: ['Traffic', 'Patrol'],
        maxNightShifts: 3,
        minRestHours: 12
    },
    { 
        name: 'Officer Smith',
        rank: 'Constable',
        specializations: ['Patrol', 'Desk'],
        maxNightShifts: 2,
        minRestHours: 12
    },
    { 
        name: 'Officer Patel',
        rank: 'Detective',
        specializations: ['Investigation', 'Evidence'],
        maxNightShifts: 2,
        minRestHours: 12
    }
];

// Populate officer select dropdown
function populateOfficerSelect() {
    const select = document.getElementById('officerSelect');
    select.innerHTML = '<option value="">Select Officer</option>';
    officerDatabase.forEach(officer => {
        const option = document.createElement('option');
        option.value = officer.name;
        option.textContent = `${officer.name} (${officer.rank})`;
        select.appendChild(option);
    });
}

// Helper functions for auto-assignment
function getRandomDuty(officer) {
    return officer.specializations[Math.floor(Math.random() * officer.specializations.length)];
}

function countOfficerShifts(officerName) {
    let count = 0;
    document.querySelectorAll('.shift-cell').forEach(cell => {
        if (cell.textContent.includes(officerName)) count++;
    });
    return count;
}

// Update the autoCreateTimetable function
function autoCreateTimetable() {
    clearTimetable();
    
    const shifts = ['morning', 'evening', 'night'];
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    // Pre-assign officers based on their specializations
    const assignments = {
        'Officer Johnson': { // Sergeant - Patrol & Investigation
            preferredShifts: ['morning', 'evening'],
            duties: ['Patrol', 'Investigation']
        },
        'Officer Chen': { // Detective - Investigation & Evidence
            preferredShifts: ['morning', 'evening'],
            duties: ['Investigation', 'Evidence']
        },
        'Officer Rodriguez': { // Sergeant - Traffic & Patrol
            preferredShifts: ['morning', 'evening', 'night'],
            duties: ['Traffic', 'Patrol']
        },
        'Officer Smith': { // Constable - Patrol & Desk
            preferredShifts: ['morning', 'evening'],
            duties: ['Patrol', 'Desk']
        },
        'Officer Patel': { // Detective - Investigation & Evidence
            preferredShifts: ['morning', 'evening'],
            duties: ['Investigation', 'Evidence']
        }
    };

    // Track officer assignments to ensure fair distribution
    const officerAssignments = {};
    officerDatabase.forEach(officer => {
        officerAssignments[officer.name] = {
            total: 0,
            nightShifts: 0
        };
    });

    days.forEach(day => {
        shifts.forEach(shift => {
            const cell = document.getElementById(`${day}-${shift}`);
            
            // Find available officers for this shift
            const availableOfficers = officerDatabase.filter(officer => {
                const currentAssignments = officerAssignments[officer.name];
                const isNightShift = shift === 'night';
                
                return currentAssignments.total < 5 && // Max 5 shifts per week
                    (!isNightShift || currentAssignments.nightShifts < officer.maxNightShifts);
            });

            if (availableOfficers.length > 0) {
                // Sort officers by number of assignments (fewer first)
                availableOfficers.sort((a, b) => 
                    officerAssignments[a.name].total - officerAssignments[b.name].total
                );

                const officer = availableOfficers[0];
                const assignment = assignments[officer.name];
                const duty = assignment.duties[Math.floor(Math.random() * assignment.duties.length)];

                const dutyElement = document.createElement('div');
                dutyElement.className = 'officer-duty';
                if (shift === 'night') {
                    dutyElement.classList.add('night-duty');
                    officerAssignments[officer.name].nightShifts++;
                }

                dutyElement.innerHTML = `
                    ${officer.name} (${officer.rank})<br>
                    ${duty}
                    <span class="delete-duty" onclick="this.parentElement.remove(); updateStats();">✕</span>
                `;

                cell.appendChild(dutyElement);
                officerAssignments[officer.name].total++;
            }
        });
    });

    // Ensure key positions are covered
    const ensureKeyPositions = () => {
        // Ensure at least one Investigation duty per day
        days.forEach(day => {
            const dayShifts = shifts.map(shift => document.getElementById(`${day}-${shift}`));
            const hasInvestigation = dayShifts.some(cell => 
                cell.textContent.includes('Investigation')
            );

            if (!hasInvestigation) {
                // Find a suitable detective
                const detectives = ['Officer Chen', 'Officer Patel'];
                for (const detective of detectives) {
                    const assignments = officerAssignments[detective];
                    if (assignments.total < 5) {
                        // Add to morning shift if possible
                        const morningCell = document.getElementById(`${day}-morning`);
                        if (!morningCell.hasChildNodes()) {
                            const dutyElement = document.createElement('div');
                            dutyElement.className = 'officer-duty';
                            dutyElement.innerHTML = `
                                ${detective} (Detective)<br>
                                Investigation
                                <span class="delete-duty" onclick="this.parentElement.remove(); updateStats();">✕</span>
                            `;
                            morningCell.appendChild(dutyElement);
                            assignments.total++;
                            break;
                        }
                    }
                }
            }
        });

        // Ensure at least one Patrol duty per shift
        days.forEach(day => {
            shifts.forEach(shift => {
                const cell = document.getElementById(`${day}-${shift}`);
                const hasPatrol = cell.textContent.includes('Patrol');

                if (!hasPatrol && !cell.hasChildNodes()) {
                    // Find available patrol officer
                    const patrolOfficers = ['Officer Johnson', 'Officer Rodriguez', 'Officer Smith'];
                    for (const officer of patrolOfficers) {
                        const assignments = officerAssignments[officer];
                        if (assignments.total < 5 && (!shift === 'night' || assignments.nightShifts < 2)) {
                            const dutyElement = document.createElement('div');
                            dutyElement.className = 'officer-duty';
                            if (shift === 'night') {
                                dutyElement.classList.add('night-duty');
                                assignments.nightShifts++;
                            }
                            dutyElement.innerHTML = `
                                ${officer} (${officerDatabase.find(o => o.name === officer).rank})<br>
                                Patrol
                                <span class="delete-duty" onclick="this.parentElement.remove(); updateStats();">✕</span>
                            `;
                            cell.appendChild(dutyElement);
                            assignments.total++;
                            break;
                        }
                    }
                }
            });
        });
    };

    ensureKeyPositions();
    updateStats();
}

// Update the updateScheduleStats function
function updateScheduleStats() {
    const stats = {
        totalAssignments: 0,
        officerWorkload: {},
        shiftTypes: {
            morning: 0,
            evening: 0,
            night: 0
        }
    };
    
    document.querySelectorAll('.shift-cell').forEach(cell => {
        const duties = cell.querySelectorAll('.officer-duty');
        duties.forEach(duty => {
            stats.totalAssignments++;
            const officerName = duty.innerHTML.split('<br>')[0].trim();
            const dutyType = duty.innerHTML.split('<br>')[1].split('<')[0].trim();
            
            // Update officer workload
            if (!stats.officerWorkload[officerName]) {
                stats.officerWorkload[officerName] = {
                    total: 0,
                    duties: {}
                };
            }
            stats.officerWorkload[officerName].total++;
            stats.officerWorkload[officerName].duties[dutyType] = 
                (stats.officerWorkload[officerName].duties[dutyType] || 0) + 1;
            
            // Update shift types
            if (cell.id.includes('morning')) stats.shiftTypes.morning++;
            if (cell.id.includes('evening')) stats.shiftTypes.evening++;
            if (cell.id.includes('night')) stats.shiftTypes.night++;
        });
    });
    
    const statsHtml = `
        <h3>Schedule Statistics</h3>
        <p>Total Assignments: ${stats.totalAssignments}</p>
        <h4>Shift Distribution:</h4>
        <p>Morning: ${stats.shiftTypes.morning} | Evening: ${stats.shiftTypes.evening} | Night: ${stats.shiftTypes.night}</p>
        <h4>Officer Workload:</h4>
        ${Object.entries(stats.officerWorkload)
            .map(([officer, data]) => `
                <p>${officer}:<br>
                Total Shifts: ${data.total}<br>
                Duties: ${Object.entries(data.duties)
                    .map(([duty, count]) => `${duty}(${count})`)
                    .join(', ')}
                </p>
            `)
            .join('')}
    `;
    
    document.getElementById('scheduleStats').innerHTML = statsHtml;
}

// Initialize the officer select dropdown
document.addEventListener('DOMContentLoaded', () => {
    populateOfficerSelect();
});

// Function to clear the timetable
function clearTimetable() {
    if (confirm('Are you sure you want to clear the entire timetable?')) {
        document.querySelectorAll('.shift-cell').forEach(cell => {
            cell.innerHTML = '';
        });
        updateScheduleStats();
    }
}

// Helper function to remove individual duty
function removeDuty(element) {
    element.parentElement.remove();
    updateScheduleStats();
}

// Make functions globally available
window.assignDuty = assignDuty;
window.autoCreateTimetable = autoCreateTimetable;
window.clearTimetable = clearTimetable;
window.removeDuty = removeDuty;

// Add click handler for shift cells
document.querySelectorAll('.shift-cell').forEach(cell => {
    cell.addEventListener('click', function() {
        document.querySelectorAll('.shift-cell').forEach(c => c.classList.remove('selected-cell'));
        this.classList.add('selected-cell');
    });
}); 