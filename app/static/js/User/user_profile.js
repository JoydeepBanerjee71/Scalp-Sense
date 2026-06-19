import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { 
    getAuth,
    onAuthStateChanged,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { 
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js";

let app = null;
let auth = null;
let db = null;
let storage = null;
let uid = null;
let latestSelfTestData = null;

const SELF_TEST_LABELS = {
    "stress": "Significant Stress",
    "iron deficiency": "History of Anaemia",
    "thyroid Deficiency": "Thyroid Disorders",
    "dieting": "Active Dieting",
    "rash": "Scalp Irritation / Rash",
    "flaking": "Scalp Flaking",
    "heredity": "Family History"
};

// Initialize Firebase
async function initFirebase() {
    try {
        if (!app) {
            const api_key = 'YOUR_WEB_API_KEY';
            const response = await fetch(`/api/env/firebaseConfig?api_key=${api_key}`, {
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
            
            return new Promise((resolve, reject) => {
                onAuthStateChanged(auth, (user) => {
                    if (user) {
                        uid = user.uid;
                        resolve(uid);
                    } else {
                        reject(new Error("No user logged in"));
                    }
                });
            });
        }
        return uid;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
}

// Load user data from Firestore
async function loadUserData() {
    try {
        await initFirebase();
        
        if (!uid) {
            throw new Error("User ID not available");
        }
        
        const userRef = doc(db, 'Users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Display user name
            const userName = userData.name || userData.email || 'User';
            document.getElementById('userWelcome').textContent = `Hi, ${userName}`;
            
            // Display email
            const email = userData.email || (auth && auth.currentUser ? auth.currentUser.email : '');
            const emailEl = document.getElementById('userEmail');
            const emailItem = document.getElementById('userEmailItem');
            if (email && emailEl && emailItem) {
                emailEl.textContent = email;
                emailItem.style.display = 'inline-flex';
            }
            
            // Display profile picture if exists
            if (userData.image) {
                const profilePicture = document.getElementById('profilePicture');
                const placeholder = document.getElementById('profilePicturePlaceholder');
                profilePicture.src = userData.image;
                profilePicture.style.display = 'block';
                placeholder.style.display = 'none';
            }

            renderSelfTestSummary(userData.form_data, userData.form_data_submitted_at);
        } else {
            console.warn('User document does not exist');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Handle profile picture upload
async function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
    }
    
    try {
        showLoading(true);
        await initFirebase();
        
        // Upload to Firebase Storage
        const imageRef = ref(storage, `profile_pictures/${uid}/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(imageRef);
        
        // Update Firestore with image URL
        const userRef = doc(db, 'Users', uid);
        await updateDoc(userRef, {
            image: downloadURL
        });
        
        // Update UI
        const profilePicture = document.getElementById('profilePicture');
        const placeholder = document.getElementById('profilePicturePlaceholder');
        profilePicture.src = downloadURL;
        profilePicture.style.display = 'block';
        placeholder.style.display = 'none';
        
        showLoading(false);
        alert('Profile picture updated successfully!');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        showLoading(false);
        alert('Failed to upload profile picture. Please try again.');
    }
}

// Delete account
async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.')) {
        return;
    }
    
    if (!confirm('This is your last chance. Click OK to permanently delete your account.')) {
        return;
    }
    
    try {
        showLoading(true);
        await initFirebase();
        
        // Delete user document from Firestore
        const userRef = doc(db, 'Users', uid);
        await deleteDoc(userRef);
        
        // Delete user from Firebase Auth
        const user = auth.currentUser;
        if (user) {
            await deleteUser(user);
        }
        
        showLoading(false);
        
        // Redirect to login page
        alert('Your account has been deleted successfully.');
        window.location.href = '/logout';
    } catch (error) {
        console.error('Error deleting account:', error);
        showLoading(false);
        alert('Failed to delete account. Please try again or contact support.');
    }
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

function formatFirestoreTimestamp(timestamp){
    if(!timestamp){
        return '';
    }
    try{
        if(typeof timestamp.toDate === 'function'){
            return timestamp.toDate().toLocaleString();
        }
        if(timestamp.seconds){
            return new Date(timestamp.seconds * 1000).toLocaleString();
        }
        return new Date(timestamp).toLocaleString();
    }catch(error){
        return '';
    }
}

function renderSelfTestSummary(formData, submittedAt){
    const card = document.getElementById('selfTestSummaryCard');
    const list = document.getElementById('selfTestResponseList');
    const emptyState = document.getElementById('selfTestEmptyState');
    const updatedAt = document.getElementById('selfTestUpdatedAt');

    if(!(card && list && emptyState && updatedAt)){
        return;
    }

    latestSelfTestData = formData || null;

    if(formData){
        emptyState.style.display = 'none';
        list.innerHTML = '';
        Object.entries(SELF_TEST_LABELS).forEach(([key, label])=>{
            const value = formData[key] || 'Not shared';
            const chip = document.createElement('div');
            chip.className = 'self-test-response-chip';
            chip.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
            list.appendChild(chip);
        });
        updatedAt.textContent = submittedAt ? `Last updated on ${formatFirestoreTimestamp(submittedAt)}` : 'Responses saved.';
        list.style.display = 'grid';
    }else{
        list.innerHTML = '';
        list.style.display = 'none';
        emptyState.style.display = 'block';
        updatedAt.textContent = 'Share your scalp lifestyle so we can personalise recommendations.';
        latestSelfTestData = null;
    }

}

function buildSelfTestEmailBody(){
    if(!latestSelfTestData){
        return null;
    }
    const lines = Object.entries(SELF_TEST_LABELS).map(([key,label])=>{
        return `${label}: ${latestSelfTestData[key] || 'Not shared'}`;
    });
    return `Hello Team ScalpSense,

Here are my latest self-test responses:

${lines.map(item => `- ${item}`).join('\n')}

Please review these details and guide me with the next steps.

Thank you.`
}

function openSelfTestEmail(){
    if(!latestSelfTestData){
        alert('Please complete the self-test before sending your responses.');
        return;
    }
    const sendBtn = document.getElementById('sendSelfTestBtn');
    if(sendBtn){
        sendBtn.disabled = true;
        sendBtn.textContent = 'Opening Gmail...';
    }
    const userName = document.getElementById('userWelcome')?.textContent?.replace('Hi,','').trim() || 'ScalpSense User';
    const body = buildSelfTestEmailBody();
    const subject = `Self-Test Responses – ${userName}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=contact@example.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    setTimeout(()=>{
        if(sendBtn){
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send to Email';
        }
    }, 1500);
}

// Open edit profile modal
async function openEditProfileModal() {
    try {
        await initFirebase();
        
        const userRef = doc(db, 'Users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const userName = userData.name || '';
            
            // Populate form with current data
            document.getElementById('editName').value = userName;
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            // Show modal
            document.getElementById('editProfileModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error opening edit profile modal:', error);
        alert('Failed to load profile data. Please try again.');
    }
}

// Close edit profile modal
function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

// Handle edit profile form submission
async function handleEditProfile(event) {
    event.preventDefault();
    
    const newName = document.getElementById('editName').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate name
    if (!newName) {
        alert('Please enter your name');
        return;
    }
    
    // If changing password, validate
    if (newPassword) {
        if (!currentPassword) {
            alert('Please enter your current password to change password');
            return;
        }
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
    }
    
    try {
        showLoading(true);
        await initFirebase();
        
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }
        
        // Update name in Firestore (always update name)
        const userRef = doc(db, 'Users', uid);
        await updateDoc(userRef, { name: newName });
        
        // Update display name in Firebase Auth
        await updateProfile(user, {
            displayName: newName
        });
        
        // If password is being changed, re-authenticate and update password
        if (newPassword) {
            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            // Update password
            await updatePassword(user, newPassword);
        }
        
        // Update UI
        document.getElementById('userWelcome').textContent = `Hi, ${newName}`;
        
        showLoading(false);
        closeEditProfileModal();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showLoading(false);
        
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect');
        } else if (error.code === 'auth/weak-password') {
            alert('New password is too weak');
        } else if (error.code === 'auth/requires-recent-login') {
            alert('For security, please log out and log back in before changing your password');
        } else {
            alert('Failed to update profile. Please try again.');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load user data
    loadUserData();
    
    // Profile picture upload handler
    const profilePictureUpload = document.getElementById('profilePictureUpload');
    if (profilePictureUpload) {
        profilePictureUpload.addEventListener('change', handleProfilePictureUpload);
    }
    
    // Delete account button handler
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', deleteAccount);
    }
    
    // Edit profile link
    const editProfileLink = document.getElementById('editProfileLink');
    if (editProfileLink) {
        editProfileLink.addEventListener('click', function(e) {
            e.preventDefault();
            openEditProfileModal();
        });
    }
    
    // Edit profile modal handlers
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    
    if (closeEditModal) {
        closeEditModal.addEventListener('click', closeEditProfileModal);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditProfileModal);
    }
    
    // Close modal when clicking outside
    if (editProfileModal) {
        editProfileModal.addEventListener('click', function(e) {
            if (e.target === editProfileModal) {
                closeEditProfileModal();
            }
        });
    }
    
    // Handle form submission
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }
    
    // Notification settings link (placeholder for now)
    const notificationSettingsLink = document.getElementById('notificationSettingsLink');
    if (notificationSettingsLink) {
        notificationSettingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Notification settings coming soon!');
        });
    }

    const editSelfTestBtn = document.getElementById('editSelfTestBtn');
    if (editSelfTestBtn) {
        editSelfTestBtn.addEventListener('click', function() {
            window.location.href = '/user/self-test/form?edit=true';
        });
    }

    const startSelfTestBtn = document.getElementById('startSelfTestBtn');
    if (startSelfTestBtn) {
        startSelfTestBtn.addEventListener('click', function() {
            window.location.href = '/user/self-test/form';
        });
    }

    const sendSelfTestBtn = document.getElementById('sendSelfTestBtn');
    if (sendSelfTestBtn) {
        sendSelfTestBtn.addEventListener('click', openSelfTestEmail);
    }

    const summaryCard = document.getElementById('selfTestSummaryCard');
    if(summaryCard){
        summaryCard.addEventListener('click', function(event){
            if(event.target.closest('.self-test-card-actions')){
                return;
            }
            summaryCard.classList.toggle('show-actions');
            summaryCard.classList.toggle('is-expanded');
        });
    }
});

