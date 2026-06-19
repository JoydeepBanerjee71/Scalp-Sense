console.log("Authentication/authentication.js")

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { 
    getAuth,
    createUserWithEmailAndPassword,
    signOut, signInWithEmailAndPassword,
    onAuthStateChanged,

} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js"

import { 
    getFirestore, collection, 
    getDocs, 
    addDoc, 
    setDoc,
    doc, deleteDoc, 
    onSnapshot,
    query, where,
    orderBy, limit,
    serverTimestamp, Timestamp,
    getDoc, updateDoc

} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    firebaseConfig();
});
    
const firebaseConfig = async function(){
    try{
        const database_key = 'YOUR_WEB_API_KEY'
        const response = await fetch(`/api/env/firebaseConfig?api_key=${database_key}`,{
            headers:{
                'Referer':`https://${window.location.hostname}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase configuration');
        }
        const firebaseConfig = await response.json();
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app)
        const UserRef = collection(db,'Users')

        console.log('Firebase initialized successfully');
        console.log('Authentication forms are ready');

        document.getElementById('root').addEventListener('submit', function(e){
            if(e.target && e.target.id == 'loginForm') {
                e.preventDefault();
                const loginForm = e.target;
                const email = loginForm.email.value;
                const password = loginForm.password.value;
                
                // Disable form and show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing In...';
                
                // Add timeout to prevent indefinite loading
                const loginTimeoutId = setTimeout(() => {
                    if (submitBtn.disabled) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        alert('Request timed out. Please try again.');
                    }
                }, 30000); // 30 second timeout
                
                signInWithEmailAndPassword(auth,email,password)
                    .then(async (cred) => {
                        console.log("User Logged In : ", cred.user);
                        console.log("User ID", cred.user.uid);
        
                        // Update button text to show progress
                        submitBtn.textContent = 'Loading profile...';
        
                        // Query to get user_type from Firebase
                        let user_role = null;
                        const getDocPromise = new Promise((resolve,reject)=>{
                            let docRef = doc(db,'Users',cred.user.uid);
                            getDoc(docRef)
                            .then(docSnapshot=>{
                                // Check if document exists and has data
                                if (docSnapshot.exists() && docSnapshot.data()) {
                                    user_role = docSnapshot.data().role || 'Patient';
                                } else {
                                    // Document doesn't exist, default to Patient
                                    user_role = 'Patient';
                                }
                                resolve(user_role) 
                            })
                            .catch(err => {
                                console.error('Error reading user document:', err);
                                // Default to Patient role on error
                                user_role = 'Patient';
                                resolve(user_role);
                            })
                        })
                        await getDocPromise;
                        let user_type = "user"
                        if(user_role==="Patient"){
                            user_type = "user"
                        }
                        else if(user_role==="Doctor"){
                            user_type = "doctor"
                        }
                        else if(user_role==="Admin"){
                            user_type = "admin"
                        }
        
                        let sessionJSON = {
                            "user_id": cred.user.uid,
                            "user_type": user_type
                        }
        
                        // Update button text to show final step
                        submitBtn.textContent = 'Finalizing...';
        
                        return fetch('/update_session', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(sessionJSON)
                        });
                    })
                    .then(response => {
                        if(response.ok){
                            return response.json();
                        }
                        else{
                            console.log("Failed to update user session")
                            throw new Error('Failed to update user session');
                        }
                    })
                    .then(data => {
                        console.log("Response from server:");
                        console.log(data);
                        
                        // Show success message and reset form
                        submitBtn.textContent = 'Login Successful!';
                        submitBtn.classList.remove('btn-primary');
                        submitBtn.classList.add('btn-success');
                        
                        // Clear form only after complete success
                        loginForm.reset();
                        
                        alert("Logged In Successfully! Welcome back!");
                        
                        // Redirect to home page
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    })
                    .catch(err => {
                        console.log(`Error Code : ${err.code}`);
                        console.log(`Error Message : ${err.message}`);
                        
                        // Reset button state
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        submitBtn.classList.remove('btn-success');
                        submitBtn.classList.add('btn-primary');
                        
                        // Handle specific error cases
                        let errorMessage = err.message;
                        if (err.code === 'auth/user-not-found') {
                            errorMessage = 'No account found with this email. Please sign up first.';
                        } else if (err.code === 'auth/wrong-password') {
                            errorMessage = 'Incorrect password. Please try again.';
                        } else if (err.code === 'auth/invalid-email') {
                            errorMessage = 'Please enter a valid email address.';
                        } else if (err.code === 'auth/too-many-requests') {
                            errorMessage = 'Too many failed attempts. Please try again later.';
                        }
                        
                        alert(`Error: ${errorMessage}`);
                        
                        // Only reset form on Firebase auth errors
                        if (err.code && err.code.startsWith('auth/')) {
                            loginForm.reset();
                        }
                    })
            }
        });
        
        
        document.getElementById('root').addEventListener('submit', function(e){
            if(e.target && e.target.id == 'signupForm') {
                e.preventDefault();
                const signupForm = e.target;
                const name = signupForm.name.value;
                const email = signupForm.email.value;
                const password = signupForm.password.value;
                
                // Disable form and show loading state
                const submitBtn = signupForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
                
                // Add timeout to prevent indefinite loading
                const timeoutId = setTimeout(() => {
                    if (submitBtn.disabled) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        alert('Request timed out. Please try again.');
                    }
                }, 30000); // 30 second timeout
                
                createUserWithEmailAndPassword(auth,email,password)
                    .then(async (cred) => {
                        console.log("Firebase user created successfully:", cred.user.uid);
                        console.log("User Created : ", cred.user);
                        console.log("User ID", cred.user.uid);
                        
                        // Update button text to show progress
                        submitBtn.textContent = 'Setting up profile...';
                        
                        // Put a query here to set the name of the person
                        const setDocPromise = new Promise((resolve,reject)=>{
                            setDoc(doc(db,'Users',cred.user.uid),{
                                name:name,
                                email:email,
                                online:true,
                                role:'Patient',
                                uid:cred.user.uid,
                                image:"" 
                            })
                            .then(()=>{
                                console.log('User added to firestore');
                                resolve(true)
                            })
                            .catch(err=>{
                                reject(new Error(err));
                            })
                        })

                        await setDocPromise;
                        console.log("User document created in Firestore successfully");
                        
                        // Clear timeout
                        clearTimeout(timeoutId);
                        
                        // Show success message
                        alert("Sign Up Successful! Welcome to ScalpSense! Please log in to continue.");
                        
                        // Clear form
                        signupForm.reset();
                        
                        // Switch to login form
                        document.getElementById('root').innerHTML = loginWindow;
                        
                        // Re-initialize Firebase for the login form after a short delay to ensure DOM is ready
                        setTimeout(() => {
                            try {
                                firebaseConfig();
                            } catch (error) {
                                console.error('Error re-initializing Firebase:', error);
                            }
                        }, 100);
                    })
                    .catch(err => {
                        console.log(`Error Code : ${err.code}`);
                        console.log(`Error Message : ${err.message}`);
                        
                        // Clear timeout
                        clearTimeout(timeoutId);
                        
                        // Reset button state
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        submitBtn.classList.remove('btn-success');
                        submitBtn.classList.add('btn-primary');
                        
                        // Handle specific error cases
                        let errorMessage = err.message;
                        if (err.code === 'auth/email-already-in-use') {
                            errorMessage = 'This email is already registered. Please try logging in instead.';
                        } else if (err.code === 'auth/weak-password') {
                            errorMessage = 'Password should be at least 6 characters long.';
                        } else if (err.code === 'auth/invalid-email') {
                            errorMessage = 'Please enter a valid email address.';
                        }
                        
                        alert(`Error: ${errorMessage}`);
                        
                        // Only reset form on Firebase errors, not session errors
                        if (err.code && err.code.startsWith('auth/')) {
                            signupForm.reset();
                        }
                    })
            }
        });
        
        // Shared function for Gmail opening and form reset
        window.openGmailAndResetForm = function() {
            const name = document.getElementById('doctorName')?.value || '';
            const qualification = document.getElementById('doctorQualification')?.value || '';
            const experience = document.getElementById('doctorExperience')?.value || '';
            const location = document.getElementById('doctorLocation')?.value || '';
            
            const body = `Hello Team Scalp Sense,

Below are my details:

Full Name: ${name}
Qualification: ${qualification}
Experience: ${experience}
Location: ${location}

Please review my application for doctor onboarding.

Thank you.`;
            
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=contact@example.com&su=${encodeURIComponent('Doctor Onboarding Request – ' + name)}&body=${encodeURIComponent(body)}`;
            
            window.open(gmailUrl, '_blank');
            
            // Reset the form
            document.forms["doctorForm"].reset();
        }

        document.getElementById('root').addEventListener('submit', function(e){
            if(e.target && e.target.id == 'doctorForm') {
                e.preventDefault();
                const doctorForm = e.target;
                
                // Let HTML5 required attributes handle validation
                if (!doctorForm.checkValidity()) {
                    return;
                }
                
                const submitBtn = doctorForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Opening Gmail...';
                
                window.openGmailAndResetForm();
                
                submitBtn.textContent = 'Gmail Opened';
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Request';
                }, 2000);
            }
        });


    }
    catch(error){
        console.error('Error initializing Firebase:', error)
    }
}

const signUpWindow = `
<div class="container">
    <div id="formInfo">
        <header>ScalpSense</header>
        <section>
            <h3>Sign Up</h3>
            <div class="authDiv">
                <form id="signupForm">
                    <div class="mb-3">
                        <label for="signupName" class="form-label">Full Name</label>
                        <input type="text" class="form-control" id="signupName" name="name" autocomplete="off" required>
                    </div>
                    <div class="mb-3">
                        <label for="signupEmail" class="form-label">Email address</label>
                        <input type="email" class="form-control" id="signupEmail" name="email" autocomplete="off" required>
                    </div>
                    <div class="mb-3">
                        <label for="signupPassword" class="form-label">Password</label>
                        <input type="password" class="form-control" id="signupPassword" name="password" autocomplete="off" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Sign Up</button>
                    <button id="proceedToLogin" class="btn btn-secondary">Click Here to Login</button>
                </form>
            </div>
        </section>
    </div>
    <div id="imageTab">
        <div class="image">
            <img src="https://img.freepik.com/premium-vector/female-doctor-reads-medical-analysis_258386-6.jpg">
        </div>
        <div class="loginText">
            <span>Are You A Doctor?</span>
            <button id="loginForDoctor" class="btn btn-success ms-4">Click Here</button>
        </div>
        
    </div>
</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,96L26.7,117.3C53.3,139,107,181,160,181.3C213.3,181,267,139,320,128C373.3,117,427,139,480,128C533.3,117,587,75,640,58.7C693.3,43,747,53,800,48C853.3,43,907,21,960,26.7C1013.3,32,1067,64,1120,64C1173.3,64,1227,32,1280,48C1333.3,64,1387,128,1413,160L1440,192L1440,320L1413.3,320C1386.7,320,1333,320,1280,320C1226.7,320,1173,320,1120,320C1066.7,320,1013,320,960,320C906.7,320,853,320,800,320C746.7,320,693,320,640,320C586.7,320,533,320,480,320C426.7,320,373,320,320,320C266.7,320,213,320,160,320C106.7,320,53,320,27,320L0,320Z"></path></svg>
`

const loginWindow = `
<div class="container">
<div id="imageTab">
    <div class="image">
        <img src="https://cdni.iconscout.com/illustration/premium/thumb/student-progress-tracking-3862328-3213880.png'">
    </div>
    <div class="loginText">
        <span>Are You A Doctor?</span>
        <button id="loginForDoctor" class="btn btn-success ms-4">Click Here</button>
    </div>
    
</div>
<div id="formInfo">
    <header>ScalpSense</header>
    <section>
        <h3>Login</h3>
        <div class="authDiv">
            <form id="loginForm">
                <div class="mb-3">
                    <label for="loginEmail" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="loginEmail" name="email" autocomplete="off" required>
                </div>
                <div class="mb-3">
                    <label for="loginPassword" class="form-label">Password</label>
                    <input type="password" class="form-control" id="loginPassword" name="password" autocomplete="off" required>
                </div>
                <button type="submit" class="btn btn-primary">Log In</button>
                <button id="proceedToSignUp" class="btn btn-secondary">Click Here to Sign Up</button>                
                <div class="loginText forMobile">
                    <span>Are You A Doctor?</span>
                    <button id="loginForDoctor" class="btn btn-success ms-4">Click Here</button>
                </div>
            </form>

        </div>
    </section>
</div>
</div>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,96L26.7,117.3C53.3,139,107,181,160,181.3C213.3,181,267,139,320,128C373.3,117,427,139,480,128C533.3,117,587,75,640,58.7C693.3,43,747,53,800,48C853.3,43,907,21,960,26.7C1013.3,32,1067,64,1120,64C1173.3,64,1227,32,1280,48C1333.3,64,1387,128,1413,160L1440,192L1440,320L1413.3,320C1386.7,320,1333,320,1280,320C1226.7,320,1173,320,1120,320C1066.7,320,1013,320,960,320C906.7,320,853,320,800,320C746.7,320,693,320,640,320C586.7,320,533,320,480,320C426.7,320,373,320,320,320C266.7,320,213,320,160,320C106.7,320,53,320,27,320L0,320Z"></path></svg>
`

const doctorWindow = `
<div class="container">
    <div id="formInfo">
        <header>ScalpSense</header>
        <section>
            <h3>Apply For Doctor</h3>
            <div class="authDiv">
                <form id="doctorForm">
                    <div class="mb-3">
                        <label for="doctorName" class="form-label">Full Name</label>
                        <input type="text" class="form-control" id="doctorName" autocomplete="off" placeholder="Enter Full Name" required>
                    </div>
                    <div class="mb-3">
                        <label for="doctorQualification" class="form-label">Qualification</label>
                        <input type="text" class="form-control" id="doctorQualification" autocomplete="off" placeholder="Enter Degree Details" required>
                    </div>
                    <div class="mb-3">
                        <label for="doctorExperience" class="form-label">Experience</label>
                        <input type="text" class="form-control" id="doctorExperience" autocomplete="off" placeholder="Eg. 3-5 years" required>
                    </div>
                    <div class="mb-3">
                        <label for="doctorLocation" class="form-label">Location</label>
                        <input type="text" class="form-control" id="doctorLocation" autocomplete="off" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Send Request</button>
                    <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                        Instructions
                    </button>
                </form>
            </div>
        </section>
    </div>
    <div id="imageTab">
        <div class="image">
            <img src="https://t4.ftcdn.net/jpg/03/30/33/29/360_F_330332917_MO0x1tcYedbGxUM4wgATwyOkU7xY5wEI.jpg">
        </div>
        <div class="loginText">
            <span>Are You A Patient?</span>
            <button id="proceedToSignUp" class="btn btn-success ms-4">Click Here</button>
        </div>
        
    </div>
</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,96L26.7,117.3C53.3,139,107,181,160,181.3C213.3,181,267,139,320,128C373.3,117,427,139,480,128C533.3,117,587,75,640,58.7C693.3,43,747,53,800,48C853.3,43,907,21,960,26.7C1013.3,32,1067,64,1120,64C1173.3,64,1227,32,1280,48C1333.3,64,1387,128,1413,160L1440,192L1440,320L1413.3,320C1386.7,320,1333,320,1280,320C1226.7,320,1173,320,1120,320C1066.7,320,1013,320,960,320C906.7,320,853,320,800,320C746.7,320,693,320,640,320C586.7,320,533,320,480,320C426.7,320,373,320,320,320C266.7,320,213,320,160,320C106.7,320,53,320,27,320L0,320Z"></path></svg>

`

document.getElementById('root').innerHTML = signUpWindow;

document.getElementById('root').addEventListener('click', function(e){
    if(e.target && e.target.id == 'proceedToLogin') {
        e.preventDefault();
        document.getElementById('root').innerHTML = loginWindow; 
    }
});

// Add event listener for "proceedToSignUp" button
document.getElementById('root').addEventListener('click', function(e){
    if(e.target && e.target.id == 'proceedToSignUp') {
        e.preventDefault();
        document.getElementById('root').innerHTML = signUpWindow; 
    }
});

document.getElementById('root').addEventListener('click', function(e){
    if(e.target && e.target.id == 'loginForDoctor') {
        e.preventDefault();
        document.getElementById('root').innerHTML = doctorWindow; 
    }
});

// Add event listener for "Send Mail" button in instructions modal
document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'sendMailBtn') {
        window.openGmailAndResetForm();
    }
});
