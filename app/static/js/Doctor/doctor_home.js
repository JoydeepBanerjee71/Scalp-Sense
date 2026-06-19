import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    EmailAuthProvider,
    updatePassword,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    onSnapshot,
    limit,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";

const API_KEY = 'YOUR_WEB_API_KEY';
const FORM_LABELS = {
    "stress": "Significant Stress",
    "iron deficiency": "History of Anaemia",
    "thyroid Deficiency": "Thyroid Disorders",
    "dieting": "Active Dieting",
    "rash": "Scalp Irritation / Rash",
    "flaking": "Scalp Flaking",
    "heredity": "Family History"
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let doctorUid = null;
let doctorProfile = null;
let patientList = [];
const patientMap = new Map();
let selectedPatientId = null;
let chatUnsubscribe = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeDoctorWorkspace();
});

async function initializeDoctorWorkspace() {
    try {
        await initFirebase();
        await Promise.all([loadDoctorProfile(), loadProducts()]);
        await loadPatients();
        setupEventListeners();
        initProfileSupportModal();
    } catch (error) {
        console.error('Unable to initialise doctor workspace', error);
        alert('Unable to load doctor workspace. Please refresh after signing in again.');
    }
}

async function initFirebase() {
    if (!app) {
        const response = await fetch(`/api/env/firebaseConfig?api_key=${API_KEY}`, {
            headers: {
                'Referer': `https://${window.location.hostname}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase configuration');
        }
        const firebaseConfig = await response.json();
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        doctorUid = await new Promise((resolve, reject) => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    resolve(user.uid);
                } else {
                    reject(new Error('Doctor not authenticated'));
                }
            });
        });
    }
    return [app, db, auth, doctorUid];
}

async function loadDoctorProfile() {
    const greetingEl = document.getElementById('doctorGreeting');
    const patientStatEl = document.getElementById('statPatientCount');
    const photoPreview = document.getElementById('doctorPhotoPreview');
    const doctorRef = doc(db, 'Users', doctorUid);
    const doctorSnap = await getDoc(doctorRef);
    if (doctorSnap.exists()) {
        const doctorData = doctorSnap.data();
        doctorProfile = { ...doctorData, uid: doctorUid };
        const name = doctorData.name || 'ScalpSense Doctor';
        greetingEl.textContent = `Welcome back, Dr. ${name}`;
        const assigned = Array.isArray(doctorData.assigned_patients) ? doctorData.assigned_patients.length : 0;
        patientStatEl.textContent = assigned;
        if (photoPreview) {
            photoPreview.src = doctorData.image || "https://via.placeholder.com/160x160?text=Doctor";
        }
        renderCertificateList(doctorData.certificates || []);
    } else {
        greetingEl.textContent = 'Welcome back, Doctor';
        renderCertificateList([]);
    }
}

async function loadPatients() {
    const listEl = document.getElementById('doctorPatientList');
    listEl.innerHTML = '<p>Loading patients...</p>';
    patientList = [];
    patientMap.clear();
    const doctorRef = doc(db, 'Users', doctorUid);
    const doctorSnap = await getDoc(doctorRef);
    const assigned = doctorSnap.exists() && Array.isArray(doctorSnap.data().assigned_patients) ? doctorSnap.data().assigned_patients : [];

    if (assigned.length) {
        for (const patientId of assigned) {
            const patientRef = doc(db, 'Users', patientId);
            const patientSnap = await getDoc(patientRef);
            if (patientSnap.exists()) {
                const data = { ...patientSnap.data(), uid: patientId };
                patientList.push(data);
                patientMap.set(patientId, data);
            }
        }
    } else {
        const usersRef = collection(db, 'Users');
        const usersQuery = query(usersRef, where('role', '==', 'User'), limit(12));
        const snapshot = await getDocs(usersQuery);
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const uid = data.uid || docSnap.id;
            patientList.push({ ...data, uid });
            patientMap.set(uid, { ...data, uid });
        });
    }

    renderPatientList(patientList);
    document.getElementById('statPatientCount').textContent = patientList.length;
    document.getElementById('statPendingChats').textContent = patientList.length;
}

function renderPatientList(patients) {
    const listEl = document.getElementById('doctorPatientList');
    if (!patients.length) {
        listEl.innerHTML = '<p>No patients assigned yet.</p>';
        return;
    }
    listEl.classList.remove('empty-state');
    listEl.innerHTML = '';
    patients.forEach(patient => {
        const card = document.createElement('div');
        card.className = 'patient-card';
        card.dataset.patientId = patient.uid;
        card.innerHTML = `
            <h4>${patient.name || 'Unnamed Patient'}</h4>
            <p>${patient.email || 'No email on record'}</p>
            <p>Stage: ${patient.latest_stage || 'Unknown'}</p>
        `;
        if (patient.uid === selectedPatientId) {
            card.classList.add('active');
        }
        listEl.appendChild(card);
    });
}

function setupEventListeners() {
    const patientListEl = document.getElementById('doctorPatientList');
    patientListEl.addEventListener('click', (event) => {
        const card = event.target.closest('.patient-card');
        if (!card) return;
        selectPatient(card.dataset.patientId);
    });

    const messageForm = document.getElementById('doctorMessageForm');
    messageForm.addEventListener('submit', sendDoctorMessage);

    const searchInput = document.getElementById('patientSearchInput');
    searchInput.addEventListener('input', (event) => {
        const queryText = event.target.value.toLowerCase();
        const filtered = patientList.filter(patient => {
            return (patient.name || '').toLowerCase().includes(queryText) ||
                   (patient.email || '').toLowerCase().includes(queryText);
        });
        renderPatientList(filtered);
    });

    document.getElementById('refreshDoctorData').addEventListener('click', async () => {
        await Promise.all([loadPatients(), loadProducts()]);
    });

    document.getElementById('reloadProductsBtn').addEventListener('click', loadProducts);

    document.getElementById('productForm').addEventListener('submit', handleProductFormSubmit);
    setupProfileForms();
}

function initProfileSupportModal(){
    const modal = document.getElementById('profileSupportModal');
    const openBtn = document.getElementById('openProfileSupport');
    const closeBtn = document.getElementById('closeProfileSupport');
    if(!modal || !openBtn || !closeBtn){
        return;
    }
    const toggleModal = (show) => {
        modal.classList.toggle('show', show);
        modal.setAttribute('aria-hidden', show ? 'false' : 'true');
        document.body.style.overflow = show ? 'hidden' : '';
    };
    openBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        toggleModal(true);
    });
    closeBtn.addEventListener('click', ()=>toggleModal(false));
    modal.addEventListener('click', (event)=>{
        if(event.target === modal){
            toggleModal(false);
        }
    });
    window.addEventListener('keydown', (event)=>{
        if(event.key === 'Escape' && modal.classList.contains('show')){
            toggleModal(false);
        }
    });
}

function selectPatient(patientId) {
    if (!patientId) return;
    selectedPatientId = patientId;
    document.querySelectorAll('.patient-card').forEach(card => {
        card.classList.toggle('active', card.dataset.patientId === patientId);
    });
    const patient = patientMap.get(patientId);
    document.getElementById('chatPanelSubtitle').textContent = `Chatting with ${patient?.name || 'patient'}.`;
    loadChatForPatient(patientId);
    loadPatientInsights(patientId);
}

function loadChatForPatient(patientId) {
    const historyEl = document.getElementById('doctorMessageHistory');
    historyEl.innerHTML = '<p>Loading conversation...</p>';
    if (chatUnsubscribe) {
        chatUnsubscribe();
        chatUnsubscribe = null;
    }
    const chatRoomId = [doctorUid, patientId].sort().join('_');
    const messageRef = collection(db, `chat_rooms/${chatRoomId}/messages`);
    const messageQuery = query(messageRef, orderBy('timestamp', 'asc'));
    chatUnsubscribe = onSnapshot(messageQuery, (snapshot) => {
        if (snapshot.empty) {
            historyEl.innerHTML = '<p class="text-muted">Start the conversation with a quick hello.</p>';
            return;
        }
        historyEl.innerHTML = '';
        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const row = document.createElement('div');
            row.classList.add('message-row', data.senderId === doctorUid ? 'me' : 'them');
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = data.message;
            row.appendChild(bubble);
            historyEl.appendChild(row);
        });
        historyEl.scrollTop = historyEl.scrollHeight;
    }, (error) => {
        console.error('Unable to load chat history', error);
        historyEl.innerHTML = '<p class="text-danger">Unable to load conversation.</p>';
    });
}

async function sendDoctorMessage(event) {
    event.preventDefault();
    if (!selectedPatientId) {
        alert('Please select a patient first.');
        return;
    }
    const input = document.getElementById('doctorMessageInput');
    const message = input.value.trim();
    if (!message) return;
    try {
        const chatRoomId = [doctorUid, selectedPatientId].sort().join('_');
        const messageRef = collection(db, `chat_rooms/${chatRoomId}/messages`);
        await addDoc(messageRef, {
            message,
            receiverId: selectedPatientId,
            senderId: doctorUid,
            timestamp: serverTimestamp()
        });
        input.value = '';
    } catch (error) {
        console.error('Unable to send message', error);
        alert('Message failed. Please retry.');
    }
}

async function loadPatientInsights(patientId) {
    const stageLabelEl = document.getElementById('insightsStageLabel');
    const stageDateEl = document.getElementById('insightsStageDate');
    const imageEl = document.getElementById('insightsStageImage');
    stageLabelEl.textContent = 'Loading...';
    stageDateEl.textContent = '';
    try {
        const response = await fetch(`/api/images/${encodeURIComponent(patientId)}/recent?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Stage data unavailable');
        }
        const data = await response.json();
        if (data.images && data.images.length) {
            const latest = data.images[0];
            stageLabelEl.textContent = latest.stage || 'Unknown';
            stageDateEl.textContent = formatDate(latest.upload_time);
            imageEl.src = base64ToDataUrl(latest.image_data);
        } else {
            stageLabelEl.textContent = 'No scans yet';
            stageDateEl.textContent = '';
            imageEl.src = 'https://via.placeholder.com/480x300?text=No+Image';
        }
    } catch (error) {
        console.warn('Unable to load stage insights', error);
        stageLabelEl.textContent = 'Unavailable';
        stageDateEl.textContent = '';
        imageEl.src = 'https://via.placeholder.com/480x300?text=No+Image';
    }

    try {
        const patientRef = doc(db, 'Users', patientId);
        const patientSnap = await getDoc(patientRef);
        if (patientSnap.exists()) {
            const data = patientSnap.data();
            patientMap.set(patientId, { ...data, uid: patientId });
            renderFormChips(data.form_data || null);
        } else {
            renderFormChips(null);
        }
    } catch (error) {
        console.warn('Unable to load questionnaire data', error);
        renderFormChips(null);
    }
}

function renderFormChips(formData) {
    const chipsEl = document.getElementById('insightsFormChips');
    chipsEl.innerHTML = '';
    if (!formData) {
        chipsEl.innerHTML = '<span class="chip">No self-test shared</span>';
        return;
    }
    Object.entries(FORM_LABELS).forEach(([key, label]) => {
        const value = formData[key] || 'No';
        const chip = document.createElement('span');
        chip.className = 'chip' + (value === 'Yes' ? ' alert' : '');
        chip.textContent = `${label}: ${value}`;
        chipsEl.appendChild(chip);
    });
}

async function loadProducts() {
    const tableBody = document.getElementById('marketplaceTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Loading...</td></tr>';
    try {
        const response = await fetch(`/api/database/products?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Unable to fetch products');
        }
        const products = await response.json();
        document.getElementById('statProductCount').textContent = products.length;
        renderProductTable(products);
    } catch (error) {
        console.error('Unable to load products', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Unable to load products.</td></tr>';
    }
}

function renderProductTable(products) {
    const tableBody = document.getElementById('marketplaceTableBody');
    if (!products.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No products found.</td></tr>';
        return;
    }
    tableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${product.NAME}</strong><br>
                <small>${product.BRAND || '—'}</small>
            </td>
            <td>${product.CATEGORY || '—'}</td>
            <td>₹${product.PRICE}</td>
            <td>${Number(product.BEST_SELLER) === 1 ? 'Yes' : 'No'}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" data-product-id="${product.ID}">Remove</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    tableBody.querySelectorAll('button[data-product-id]').forEach(button => {
        button.addEventListener('click', () => handleDeleteProduct(button.dataset.productId));
    });
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const payload = {
        NAME: form.querySelector('#productName').value.trim(),
        PRICE: Number(form.querySelector('#productPrice').value),
        IMAGE: form.querySelector('#productImage').value.trim(),
        DESCRIPTION: form.querySelector('#productDescription').value.trim(),
        BRAND: form.querySelector('#productBrand').value.trim(),
        BENEFITS: form.querySelector('#productBenefits').value.trim(),
        URL: form.querySelector('#productUrl').value.trim(),
        CATEGORY: form.querySelector('#productCategory').value,
        BEST_SELLER: form.querySelector('#productBestSeller').checked ? 1 : 0
    };
    try {
        const response = await fetch(`/api/database/products?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Product not saved');
        }
        form.reset();
        await loadProducts();
        alert('Product saved successfully.');
    } catch (error) {
        console.error('Unable to save product', error);
        alert('Unable to save product. Check inputs and try again.');
    }
}

async function handleDeleteProduct(productId) {
    if (!confirm('Remove this product from the marketplace?')) return;
    try {
        const response = await fetch(`/api/database/product/${productId}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        await loadProducts();
    } catch (error) {
        console.error('Unable to delete product', error);
        alert('Failed to remove product.');
    }
}

function setupProfileForms() {
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordFormSubmit);
    }
    const photoForm = document.getElementById('photoForm');
    if (photoForm) {
        photoForm.addEventListener('submit', handlePhotoFormSubmit);
    }
    const certificateForm = document.getElementById('certificateForm');
    if (certificateForm) {
        certificateForm.addEventListener('submit', handleCertificateFormSubmit);
    }
    const leaveForm = document.getElementById('leaveForm');
    if (leaveForm) {
        leaveForm.addEventListener('submit', handleLeaveFormSubmit);
    }
    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketFormSubmit);
    }
}

async function handlePasswordFormSubmit(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
    }
    try {
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        event.target.reset();
        alert('Password updated successfully.');
    } catch (error) {
        console.error('Unable to update password', error);
        alert(error.message || 'Unable to update password.');
    }
}

async function handlePhotoFormSubmit(event) {
    event.preventDefault();
    const file = document.getElementById('doctorPhotoInput').files[0];
    if (!file) {
        alert('Please select an image.');
        return;
    }
    try {
        const photoRef = ref(storage, `doctor_profiles/${doctorUid}/${Date.now()}_${file.name}`);
        await uploadBytes(photoRef, file);
        const downloadURL = await getDownloadURL(photoRef);
        await updateDoc(doc(db, 'Users', doctorUid), { image: downloadURL });
        if (doctorProfile) {
            doctorProfile.image = downloadURL;
        }
        const preview = document.getElementById('doctorPhotoPreview');
        if (preview) {
            preview.src = downloadURL;
        }
        event.target.reset();
        alert('Profile photo updated.');
    } catch (error) {
        console.error('Unable to upload photo', error);
        alert('Failed to upload photo.');
    }
}

function renderCertificateList(certificates) {
    const listEl = document.getElementById('certificateList');
    if (!listEl) return;
    if (!certificates || !certificates.length) {
        listEl.classList.add('empty-state');
        listEl.innerHTML = '<p>No certificates uploaded yet.</p>';
        return;
    }
    listEl.classList.remove('empty-state');
    listEl.innerHTML = '';
    certificates.forEach(cert => {
        const item = document.createElement('div');
        item.className = 'certificate-item';
        const uploadedAt = cert.uploaded_at ? formatDate(cert.uploaded_at) : '';
        item.innerHTML = `
            <div>
                <strong>${cert.label || 'Certificate'}</strong><br>
                <small>${uploadedAt}</small>
            </div>
            <a href="${cert.url}" target="_blank" class="btn btn-sm btn-outline-primary">View</a>
        `;
        listEl.appendChild(item);
    });
}

async function handleCertificateFormSubmit(event) {
    event.preventDefault();
    const file = document.getElementById('certificateFile').files[0];
    const label = document.getElementById('certificateLabel').value.trim();
    if (!file || !label) {
        alert('Please provide both a file and a title.');
        return;
    }
    try {
        const certRef = ref(storage, `doctor_certificates/${doctorUid}/${Date.now()}_${file.name}`);
        await uploadBytes(certRef, file);
        const downloadURL = await getDownloadURL(certRef);
        const newCert = {
            label,
            url: downloadURL,
            uploaded_at: new Date().toISOString()
        };
        const existingCerts = doctorProfile?.certificates || [];
        const updatedCerts = [...existingCerts, newCert];
        await updateDoc(doc(db, 'Users', doctorUid), { certificates: updatedCerts });
        doctorProfile = { ...(doctorProfile || {}), certificates: updatedCerts };
        renderCertificateList(updatedCerts);
        event.target.reset();
        alert('Certificate uploaded.');
    } catch (error) {
        console.error('Unable to upload certificate', error);
        alert('Certificate upload failed.');
    }
}

async function handleLeaveFormSubmit(event) {
    event.preventDefault();
    const fromDate = document.getElementById('leaveFrom').value;
    const toDate = document.getElementById('leaveTo').value;
    const reason = document.getElementById('leaveReason').value.trim();
    if (new Date(fromDate) > new Date(toDate)) {
        alert('End date must be after start date.');
        return;
    }
    try {
        await addDoc(collection(db, 'leave_requests'), {
            doctor_id: doctorUid,
            doctor_name: doctorProfile?.name || '',
            from: fromDate,
            to: toDate,
            reason,
            status: 'Pending',
            submitted_at: serverTimestamp()
        });
        event.target.reset();
        alert('Leave request submitted.');
    } catch (error) {
        console.error('Unable to submit leave request', error);
        alert('Leave request failed.');
    }
}

async function handleTicketFormSubmit(event) {
    event.preventDefault();
    const subject = document.getElementById('ticketSubject').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();
    try {
        await addDoc(collection(db, 'support_tickets'), {
            doctor_id: doctorUid,
            doctor_name: doctorProfile?.name || '',
            subject,
            description,
            status: 'Open',
            submitted_at: serverTimestamp()
        });
        event.target.reset();
        alert('Support ticket sent.');
    } catch (error) {
        console.error('Unable to raise ticket', error);
        alert('Ticket submission failed.');
    }
}

function base64ToDataUrl(base64String) {
    if (!base64String) {
        return 'https://via.placeholder.com/480x300?text=No+Image';
    }
    try {
        const bytes = atob(base64String);
        const buffer = new ArrayBuffer(bytes.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i++) {
            view[i] = bytes.charCodeAt(i);
        }
        const blob = new Blob([view], { type: 'image/png' });
        return URL.createObjectURL(blob);
    } catch {
        return 'https://via.placeholder.com/480x300?text=No+Image';
    }
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
}