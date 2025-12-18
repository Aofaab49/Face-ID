const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const scanBtn = document.getElementById('scan-btn');
const statusMsg = document.getElementById('status-message');
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const logoutBtn = document.getElementById('logout-btn');
const wrapper = document.querySelector('.camera-wrapper');

// Registration Elements
const registerModeBtn = document.getElementById('register-mode-btn');
const registerScreen = document.getElementById('register-screen');
const regWebcam = document.getElementById('reg-webcam');
const regNameInput = document.getElementById('reg-name');
const cancelRegBtn = document.getElementById('cancel-reg-btn');
const saveRegBtn = document.getElementById('save-reg-btn');

let isScanning = false;
let members = []; // Store registered members { name, timestamp }

// Load members from local storage if any
if (localStorage.getItem('faceID_members')) {
    members = JSON.parse(localStorage.getItem('faceID_members'));
}

// Initialize Camera
async function startCamera(videoElement) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        return true;
    } catch (err) {
        console.error("Camera access denied:", err);
        return false;
    }
}

// Initialize Main Camera
startCamera(video).then(success => {
    if (success) statusMsg.innerText = "System Active. Ready.";
    else {
        statusMsg.innerText = "Error: Camera Access Denied";
        statusMsg.style.color = "var(--error-color)";
        scanBtn.disabled = true;
    }
});

// Face Detection Simulation
async function detectFace() {
    if ('FaceDetector' in window) {
        try {
            const faceDetector = new FaceDetector();
            const faces = await faceDetector.detect(video);
            return faces.length > 0;
        } catch (e) {
            return true; // Fallback
        }
    }
    return true;
}

async function startScan() {
    if (isScanning) return;
    isScanning = true;

    wrapper.classList.add('scanning');
    statusMsg.innerText = "Scanning Biometrics...";
    statusMsg.style.color = "var(--text-main)";
    scanBtn.classList.add('disabled');

    const startTime = Date.now();
    const minScanTime = 2500;

    let faceFound = false;

    // Simulation Loop
    for (let i = 0; i < 20; i++) {
        if (i % 5 === 0) {
            const textSteps = ["Analyzing Facial Structure...", "Generating Hash...", "Querying Database...", "Verifying..."];
            statusMsg.innerText = textSteps[Math.floor(Math.random() * textSteps.length)];
        }

        const found = await detectFace();
        if (found) faceFound = true;

        await new Promise(r => setTimeout(r, 100));
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < minScanTime) {
        await new Promise(r => setTimeout(r, minScanTime - elapsed));
    }

    if (!faceFound) {
        failScan("No Face Detected");
        return;
    }

    // AUTHENTICATION LOGIC
    if (members.length === 0) {
        failScan("Access Denied: No Registered Members");
    } else {
        // Simulate matching algorithm - for demo, pick the most recent member
        // In a real app, this would match the face embedding
        const matchedMember = members[members.length - 1];
        grantAccess(matchedMember);
    }
}

function failScan(reason) {
    statusMsg.innerText = reason;
    statusMsg.style.color = "var(--error-color)";
    wrapper.classList.remove('scanning');
    isScanning = false;
    scanBtn.classList.remove('disabled');

    // Shake effect
    wrapper.style.transform = "translateX(5px)";
    setTimeout(() => wrapper.style.transform = "translateX(-5px)", 50);
    setTimeout(() => wrapper.style.transform = "translateX(5px)", 100);
    setTimeout(() => wrapper.style.transform = "translateX(0)", 150);
}

function grantAccess(member) {
    statusMsg.innerHTML = `IDENTITY CONFIRMED: <span style="color:var(--primary-color)">${member.name}</span>`;
    statusMsg.style.color = "var(--success-color)";
    wrapper.classList.remove('scanning');
    wrapper.classList.add('success');

    setTimeout(() => {
        loginScreen.classList.add('hidden');
        setTimeout(() => {
            // REDIRECT TO TARGET WEBSITE
            window.location.href = "https://www.medicinebhumibol.com/index.php";
        }, 500);
    }, 1500);
}

function updateDashboard() {
    const now = new Date();
    document.getElementById('last-login-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function logout() {
    location.reload(); // Simplest way to reset everything for demo
}

// ------ REGISTRATION LOGIC ------

function openRegistration() {
    loginScreen.classList.add('hidden');
    setTimeout(() => {
        loginScreen.style.display = 'none';
        registerScreen.classList.remove('hidden');
        startCamera(regWebcam);
        regNameInput.value = '';
        regNameInput.focus();
    }, 500);
}

function closeRegistration() {
    registerScreen.classList.add('hidden');
    setTimeout(() => {
        loginScreen.style.display = 'flex';
        // Force reflow
        void loginScreen.offsetWidth;
        loginScreen.classList.remove('hidden');
        startCamera(video); // Switch back to main camera
    }, 500);
}

function saveMember() {
    const name = regNameInput.value.trim();
    if (!name) {
        alert("Please enter a name.");
        return;
    }

    // Simulate scanning/saving face
    saveRegBtn.innerText = "Scanning...";
    saveRegBtn.disabled = true;

    setTimeout(() => {
        const newMember = {
            id: Date.now(),
            name: name,
            registeredAt: new Date().toISOString()
        };

        members.push(newMember);
        localStorage.setItem('faceID_members', JSON.stringify(members));

        saveRegBtn.innerText = "Saved!";

        setTimeout(() => {
            saveRegBtn.innerText = "Save ID";
            saveRegBtn.disabled = false;
            closeRegistration();
            statusMsg.innerText = "Member Registered. Ready to Scan.";
            statusMsg.style.color = "var(--success-color)";
        }, 800);
    }, 1500);
}

// Event Listeners
scanBtn.addEventListener('click', startScan);
logoutBtn.addEventListener('click', logout);
registerModeBtn.addEventListener('click', openRegistration);
cancelRegBtn.addEventListener('click', closeRegistration);
saveRegBtn.addEventListener('click', saveMember);

// Handle Enter key in input
regNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveMember();
});

// Window resize
window.addEventListener('resize', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
});
