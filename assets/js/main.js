import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================================
// 1. GLOBAL VARIABLES & CLASS SUBJECTS
// ==========================================
const classSubjects = {
    "Class I": ["Telugu", "Hindi", "English", "Maths", "EVS", "Computers"],
    "Class II": ["Hindi", "English", "Maths", "EVS", "Computers", "Telugu"],
    "Class III": ["English", "Maths", "GS", "Telugu", "Hindi", "Social", "Computers", "Vedic Maths"],
    "Class IV": ["Maths", "Social", "Telugu", "Hindi", "Computers", "GS", "English", "Vedic Maths"],
    "Class V": ["GS", "Telugu", "Computers", "English", "Maths", "Hindi", "Social", "Vedic Maths"],
    "Class VI": ["G.S", "Telugu", "Maths", "English", "Social", "Hindi"],
    "Class VII": ["English", "Hindi", "Social", "Telugu", "GS", "Maths"],
    "Class VIII": ["Maths", "Social", "English", "Biology", "Hindi", "Telugu", "Physics"],
    "Class IX": ["Hindi", "Telugu", "Maths", "English", "Physics", "Biology", "Social"],
    "Class X": ["Hindi", "Telugu", "Maths", "English", "Physics", "Biology", "Social"] // Class X = Class IX subjects
};

// ==========================================
// 2. SECTION NAVIGATION
// ==========================================
window.showSection = function(sectionId) {
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) targetSection.classList.add('active');
    
    // Load section-specific data when section is shown
    if (sectionId === 'principal-dashboard') loadApprovals();
    if (sectionId === 'attendance') loadStudents();
    if (sectionId === 'e-diary') loadSubjects();
    if (sectionId === 'parent-dashboard') loadParentDashboard();
    if (sectionId === 'poster-generator') drawPoster();
};

// ==========================================
// 3. ROLE SELECTION & LOGIN
// ==========================================
window.selectPortal = function(role) {
    localStorage.setItem('sv_role', role);
    if (role === 'school') {
        showSection('school-login');
    } else {
        showSection('link-child');
    }
};

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
                    showSection('attendance'); // Default incharge screen
                } else {
                    alert("Role not recognized.");
                }
            } else {
                alert("Incorrect PIN! Please try again.");
            }
        } else {
            alert("User not found! Please check your phone number.");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Something went wrong. Check console.");
    }
};

// ==========================================
// 4. PRINCIPAL DASHBOARD (APPROVALS)
// ==========================================
async function loadApprovals() {
    const container = document.getElementById('principal-data-container');
    if (!container) return;

    try {
        const querySnapshot = await getDocs(collection(db, "ediary"));
        let html = `
            <div class="stats-grid">
                <div class="stat-card blue-bg"><h4>Total Staff</h4><p>12</p></div>
                <div class="stat-card green-bg"><h4>Pending Approvals</h4><p id="pending-count">0</p></div>
            </div>
            <h3 class="section-title">Pending Approvals</h3>
            <div id="approvals-list"></div>
        `;
        container.innerHTML = html;

        const approvalsList = document.getElementById('approvals-list');
        const pendingCount = document.getElementById('pending-count');
        let count = 0;
        let approvalsHtml = '';

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === 'pending') {
                count++;
                approvalsHtml += `
                    <div class="approval-card" id="approval-${docSnap.id}">
                        <div class="approval-header">
                            <span class="badge class-badge">${data.className}</span>
                            <span class="time">${data.subject}</span>
                        </div>
                        <p class="approval-text"><strong>${data.subject}:</strong> ${data.notes}</p>
                        <div class="approval-actions">
                            <button class="btn-approve" onclick="approveDiary('${docSnap.id}')"><i class="fa-solid fa-check"></i> Approve</button>
                            <button class="btn-reject" onclick="rejectDiary('${docSnap.id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
                        </div>
                    </div>
                `;
            }
        });

        if (count === 0) approvalsHtml = `<p class="loading-text">No pending approvals.</p>`;
        approvalsList.innerHTML = approvalsHtml;
        pendingCount.textContent = count;

    } catch (error) {
        console.error("Error loading approvals:", error);
        container.innerHTML = `<p class="loading-text" style="color:red;">Error loading data.</p>`;
    }
}

window.approveDiary = async function(diaryId) {
    try {
        const diaryRef = doc(db, "ediary", diaryId);
        await updateDoc(diaryRef, { status: "approved", approvedBy: "Principal", approvedAt: new Date().toISOString() });
        alert("Diary Approved!");
        loadApprovals();
    } catch (error) { alert("Failed to approve."); }
};

window.rejectDiary = async function(diaryId) {
    try {
        const diaryRef = doc(db, "ediary", diaryId);
        await updateDoc(diaryRef, { status: "rejected", approvedBy: "Principal", approvedAt: new Date().toISOString() });
        alert("Diary Rejected.");
        loadApprovals();
    } catch (error) { alert("Failed to reject."); }
};

// ==========================================
// 5. INCHARGE - ATTENDANCE
// ==========================================
function loadStudents() {
    const container = document.getElementById('student-attendance-list');
    if (!container) return;

    // మొదట డమ్మీ డేటా (తర్వాత Firestore నుండి తెస్తాము)
    const mockStudents = [
        { roll: 1, name: "Ravi Kumar" }, { roll: 2, name: "Sita Sharma" },
        { roll: 3, name: "Arjun Reddy" }, { roll: 4, name: "Priya Singh" },
        { roll: 5, name: "Kiran Rao" }
    ];

    let html = '';
    mockStudents.forEach(student => {
        html += `
            <div class="attendance-card">
                <div class="student-info">
                    <span class="roll-badge">${String(student.roll).padStart(2, '0')}</span>
                    <span class="student-name">${student.name}</span>
                </div>
                <div class="attendance-actions">
                    <button class="att-btn active-p" onclick="markAttendance(this, 'P')">P</button>
                    <button class="att-btn" onclick="markAttendance(this, 'A')">A</button>
                    <button class="att-btn" onclick="markAttendance(this, 'L')">L</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    setTodayDate('today-date');
}

window.markAttendance = function(btn, status) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active-p', 'active-a', 'active-l'));
    if (status === 'P') btn.classList.add('active-p');
    if (status === 'A') btn.classList.add('active-a');
    if (status === 'L') btn.classList.add('active-l');
};

window.submitAttendance = function() {
    alert("Attendance Submitted! (Firestore integration pending)");
};

// ==========================================
// 6. INCHARGE - E-DIARY
// ==========================================
window.loadSubjects = function() {
    const classSelect = document.getElementById('diary-class-select');
    const container = document.getElementById('subjects-container');
    if (!classSelect || !container) return;

    const selectedClass = classSelect.value;
    const subjects = classSubjects[selectedClass] || [];

    let html = '';
    subjects.forEach(subject => {
        html += `
            <div class="subject-card">
                <div class="subject-header"><span class="subject-name">📘 ${subject}</span></div>
                <textarea class="subject-textarea" placeholder="Enter ${subject} notes here..." data-subject="${subject}"></textarea>
            </div>
        `;
    });
    container.innerHTML = html;
    setTodayDate('diary-date');
};

window.addManualSubject = function() {
    const subjectName = prompt("Enter subject name:");
    if (subjectName && subjectName.trim() !== '') {
        const container = document.getElementById('subjects-container');
        const newCard = document.createElement('div');
        newCard.className = 'subject-card';
        newCard.innerHTML = `
            <div class="subject-header"><span class="subject-name">📘 ${subjectName}</span></div>
            <textarea class="subject-textarea" placeholder="Enter ${subjectName} notes here..." data-subject="${subjectName}"></textarea>
        `;
        container.appendChild(newCard);
    }
};

window.submitEDiary = async function() {
    const classSelect = document.getElementById('diary-class-select');
    const selectedClass = classSelect.value;
    const textareas = document.querySelectorAll('.subject-textarea');
    let hasData = false;

    for (const textarea of textareas) {
        const subject = textarea.getAttribute('data-subject');
        const notes = textarea.value.trim();
        if (notes !== '') {
            hasData = true;
            try {
                await addDoc(collection(db, "ediary"), {
                    className: selectedClass, subject: subject, notes: notes,
                    status: "pending", createdAt: new Date().toISOString(), createdBy: "Incharge"
                });
            } catch (error) { console.error("Error saving:", error); }
        }
    }

    if (hasData) {
        alert("E-Diary sent for Principal Approval!");
        textareas.forEach(t => t.value = '');
    } else {
        alert("Please enter at least one subject notes.");
    }
};

// ==========================================
// 7. INCHARGE - ANNOUNCEMENTS
// ==========================================
window.switchTab = function(btn, type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const classGroup = document.getElementById('class-selector-group');
    if (classGroup) classGroup.style.display = (type === 'school') ? 'none' : 'flex';
};

window.submitAnnouncement = async function() {
    const message = document.getElementById('announcement-message').value.trim();
    const classSelect = document.getElementById('announcement-class-select');
    const isClassNotice = document.getElementById('class-selector-group').style.display !== 'none';
    
    if (!message) { alert("Please enter a message."); return; }

    try {
        await addDoc(collection(db, "announcements"), {
            scope: isClassNotice ? 'class' : 'school',
            className: isClassNotice ? classSelect.value : null,
            message: message, status: "pending",
            createdAt: new Date().toISOString(), createdBy: "Incharge"
        });
        alert("Announcement sent for approval!");
        document.getElementById('announcement-message').value = '';
    } catch (error) { console.error("Error:", error); }
};

// ==========================================
// 8. PARENT - LINK CHILD
// ==========================================
window.handleLinkChild = async function(event) {
    event.preventDefault();
    const relation = document.getElementById('child-relation').value;
    const parentName = document.getElementById('parent-name').value.trim();
    const childClass = document.getElementById('child-class').value;
    const rollNumber = document.getElementById('child-roll').value;
    const dob = document.getElementById('child-dob').value;

    if (!parentName || !rollNumber || !dob) { alert("Please fill all fields."); return; }

    const parentId = parentName.replace(/\s+/g, '_').toLowerCase() + "_" + rollNumber;
    const childData = { name: "Student_" + rollNumber, className: childClass, rollNo: parseInt(rollNumber), dob: dob };

    try {
        const parentRef = doc(db, "parents", parentId);
        const parentDoc = await getDoc(parentRef);
        
        if (parentDoc.exists()) {
            const existingData = parentDoc.data();
            const updatedStudents = [...existingData.linkedStudents, childData];
            await updateDoc(parentRef, { linkedStudents: updatedStudents });
        } else {
            await setDoc(parentRef, { relation: relation, parentName: parentName, linkedStudents: [childData], createdAt: new Date().toISOString() });
        }

        localStorage.setItem('sv_linked_child', JSON.stringify(childData));
        alert("Child Linked Successfully!");
        showSection('parent-dashboard');

    } catch (error) { console.error("Link Error:", error); alert("Something went wrong."); }
};

// ==========================================
// 9. PARENT DASHBOARD
// ==========================================
async function loadParentDashboard() {
    const activeChildEl = document.getElementById('active-child-name');
    const attendanceEl = document.getElementById('parent-attendance-status');
    const diaryList = document.getElementById('parent-diary-list');
    const noticeList = document.getElementById('parent-notice-list');

    if (!activeChildEl) return;

    try {
        const linkedChild = JSON.parse(localStorage.getItem('sv_linked_child') || 'null');
        if (!linkedChild) {
            activeChildEl.textContent = "No child linked";
            diaryList.innerHTML = `<p class="loading-text">Please link a child first.</p>`;
            noticeList.innerHTML = `<p class="loading-text">Please link a child first.</p>`;
            return;
        }

        activeChildEl.textContent = `${linkedChild.name} (${linkedChild.className})`;
        attendanceEl.textContent = "Present"; // Dummy for now

        // E-Diary (Approved)
        const diarySnapshot = await getDocs(collection(db, "ediary"));
        let diaryHtml = '', diaryCount = 0;
        diarySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === 'approved' && data.className === linkedChild.className) {
                diaryCount++;
                diaryHtml += `
                    <div class="diary-card">
                        <div class="diary-header"><span class="badge class-badge">${data.subject}</span><span class="time">Approved</span></div>
                        <p>${data.notes}</p>
                    </div>
                `;
            }
        });
        if (diaryCount === 0) diaryHtml = `<p class="loading-text">No approved diary entries.</p>`;
        diaryList.innerHTML = diaryHtml;

        // Notice Board (Approved)
        const noticeSnapshot = await getDocs(collection(db, "announcements"));
        let noticeHtml = '', noticeCount = 0;
        noticeSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status === 'approved' && (data.scope === 'school' || data.className === linkedChild.className)) {
                noticeCount++;
                noticeHtml += `<div class="notice-card"><p>${data.message}</p></div>`;
            }
        });
        if (noticeCount === 0) noticeHtml = `<p class="loading-text">No notices.</p>`;
        noticeList.innerHTML = noticeHtml;

    } catch (error) { console.error("Parent Dashboard Error:", error); }
}

// ==========================================
// 10. POSTER GENERATOR (Canvas)
// ==========================================
function drawPoster() {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width, height = canvas.height;

    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#0F4C81"; ctx.fillRect(0, 0, width, 15);

    const logoImg = new Image();
    logoImg.src = 'assets/images/logo.png';
    logoImg.onload = () => { ctx.drawImage(logoImg, width / 2 - 40, 30, 80, 80); };

    ctx.fillStyle = "#0F4C81"; ctx.font = "bold 28px Poppins, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("SRI VISWA GROUP OF INSTITUTIONS", width / 2, 150);

    ctx.strokeStyle = "#3F8F29"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(100, 170); ctx.lineTo(width - 100, 170); ctx.stroke();

    ctx.fillStyle = "#1E293B"; ctx.font = "bold 24px Poppins, sans-serif";
    ctx.fillText("📚 E-DIARY UPDATE", width / 2, 220);

    ctx.font = "18px Poppins, sans-serif"; ctx.fillStyle = "#64748B";
    ctx.fillText("Class: IX  |  Date: 26 Oct 2023", width / 2, 260);

    const subjects = [
        { name: "MATHS", notes: "Complete chapter 5 exercises." },
        { name: "SCIENCE", notes: "Bring practical records tomorrow." },
        { name: "ENGLISH", notes: "Read page 45 and write summary." }
    ];

    let yPos = 320; ctx.textAlign = "left";
    subjects.forEach((sub) => {
        ctx.fillStyle = "#0F4C81"; ctx.font = "bold 20px Poppins, sans-serif";
        ctx.fillText(`🔹 ${sub.name}`, 80, yPos);
        ctx.fillStyle = "#1E293B"; ctx.font = "16px Poppins, sans-serif";
        ctx.fillText(sub.notes, 100, yPos + 30);
        yPos += 100;
    });

    ctx.save();
    ctx.translate(width / 2, yPos + 50); ctx.rotate(-10 * Math.PI / 180);
    ctx.strokeStyle = "#3F8F29"; ctx.lineWidth = 4; ctx.strokeRect(-100, -30, 200, 60);
    ctx.fillStyle = "#3F8F29"; ctx.font = "bold 24px Poppins, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("✅ APPROVED", 0, 10);
    ctx.restore();

    ctx.fillStyle = "#64748B"; ctx.font = "14px Poppins, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Generated via Sri Viswa Connect App", width / 2, height - 40);
}

window.downloadPoster = function() {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `SriViswa_Poster_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
};

window.shareToWhatsApp = function() {
    const text = encodeURIComponent("*SRI VISWA GROUP OF INSTITUTIONS*\n*E-Diary Update* 📚\n\nClass: IX\nDate: 26 Oct 2023\n\n🔹 *Maths:* Complete chapter 5 exercises.\n🔹 *Science:* Bring practical records tomorrow.\n\n_This is an automated message._");
    window.open(`https://wa.me/?text=${text}`, '_blank');
};

// ==========================================
// 11. UTILITY FUNCTIONS
// ==========================================
function setTodayDate(elementId) {
    const dateEl = document.getElementById(elementId);
    if (dateEl) {
        const today = new Date();
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        dateEl.textContent = today.toLocaleDateString('en-IN', options);
    }
}

// ==========================================
// 12. DARK MODE, FOOTER, PWA (GLOBAL)
// ==========================================
window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('sv_dark_mode', isDark);
    const icon = document.getElementById('dark-mode-toggle-icon');
    if (icon) {
        if (isDark) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
        else { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { document.getElementById('global-splash').classList.add('hidden'); }, 1500);
    if (localStorage.getItem('sv_dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('dark-mode-toggle-icon');
        if (icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
    }
});

// Footer Long Press / Click
let pressTimer, isLongPress = false;
const footerText = document.getElementById('gi-footer-text');
if (footerText) {
    const startPress = (e) => {
        e.preventDefault(); isLongPress = false;
        pressTimer = setTimeout(() => { isLongPress = true; alert("GI Super Admin Login (Phase 3)"); pressTimer = null; }, 3000);
    };
    const cancelPress = () => {
        if (pressTimer) {
            clearTimeout(pressTimer); pressTimer = null;
            if (!isLongPress) document.getElementById('gi-popup').classList.add('active');
        }
    };
    footerText.addEventListener('mousedown', startPress);
    footerText.addEventListener('mouseup', cancelPress);
    footerText.addEventListener('mouseleave', () => { if(pressTimer) clearTimeout(pressTimer); });
    footerText.addEventListener('touchstart', startPress, {passive: false});
    footerText.addEventListener('touchend', cancelPress);
}

window.openGiPopup = () => document.getElementById('gi-popup').classList.add('active');
window.closeGiPopup = () => document.getElementById('gi-popup').classList.remove('active');

// PWA Install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('show');
});
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
                document.getElementById('install-banner').classList.remove('show');
            }
        });
    }
});
window.addEventListener('appinstalled', () => {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('show');
    deferredPrompt = null;
});
