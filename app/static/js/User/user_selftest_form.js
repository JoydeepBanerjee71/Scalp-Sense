console.log("Hello World")

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { 
    getAuth,
    onAuthStateChanged,

} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js"

import { 
    getFirestore, collection, 
    getDocs, 
    addDoc, 
    doc, deleteDoc, 
    onSnapshot,
    query, where,
    orderBy, limit,
    serverTimestamp, Timestamp,
    getDoc, updateDoc,

} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

let app = null;
let auth = null;
let uid = null;
let db = null;

document.addEventListener('DOMContentLoaded', async function() {
    [app, db, auth, uid] = await initFirebase();
    await hydrateExistingFormData();
    attachSummaryActionHandlers();
    await displayNextQuestion();
});

async function initFirebase(){
    try {
        if(!app){
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
            app = await initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            uid = null;
            const uidPromise = new Promise((resolve, reject) => {
                onAuthStateChanged(auth, (user) => {
                    if (user) {
                        uid = user.uid;
                        resolve(uid);
                    } else {
                        reject(new Error("Cannot detect user"));
                    }
                });
            });
            await uidPromise;
        }
        return [app, db, auth, uid];
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        
    }
}

const QUESTION_KEY_MAP = {
    1: "stress",
    2: "iron deficiency",
    3: "thyroid Deficiency",
    4: "dieting",
    5: "rash",
    6: "flaking",
    7: "heredity"
};

const QUESTION_LABELS = {
    "stress": "Significant stress",
    "iron deficiency": "History of anaemia / low iron",
    "thyroid Deficiency": "Thyroid disorders",
    "dieting": "Active dieting",
    "rash": "Rash, burning or scalp irritation",
    "flaking": "Scalp flaking / dandruff",
    "heredity": "Family history of hair loss"
};

let questionCounter = 1;
let lastSubmittedAt = null;

let form_data = {
    "dieting":null,
    "flaking":null,
    "heredity":null,
    "iron deficiency":null,
    "rash":null,
    "stress":null,
    "thyroid Deficiency":null
};


async function displayNextQuestion(){
    if(!(app&&auth&&db&&uid)){
        return;
    }

    hideStatusMessage();

    if(questionCounter>7){
        await submitFormResponses();
        return;
    }

    hideSummary();
    updateProgressIndicators();

    const currentCard = document.getElementById(`Q${questionCounter}`);
    document.querySelectorAll('.card').forEach(card=>{
        card.style.display = 'none';
    });

    if(currentCard){
        currentCard.style.display = 'block';
        applySelectionState(questionCounter);
    }
}

Array.from(document.getElementsByClassName('nextButton')).forEach(btn=>{
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        if(!hasAnsweredCurrentQuestion()){
            showStatusMessage("Please select an option to continue.");
            return;
        }
        questionCounter = questionCounter + 1;
        await displayNextQuestion();
    });
    
})

const buttons = document.querySelectorAll('.optionButton');

buttons.forEach(button => {
    button.addEventListener('click', function() {
        const card = button.closest('.card');
        if(card){
            card.querySelectorAll('.optionButton').forEach(btn=>{
                if(btn === button){
                    btn.classList.remove('notSelected');
                    btn.classList.add('selected');
                }else{
                    btn.classList.remove('selected');
                    btn.classList.add('notSelected');
                }
            });
        }
    });
});

async function hydrateExistingFormData(){
    if(!(db&&uid)){
        return;
    }
    try{
        const userRef = doc(db,'Users',uid);
        const docSnap = await getDoc(userRef);
        if(docSnap.exists()){
            const data = docSnap.data();
            if(data.form_data){
                form_data = {
                    ...form_data,
                    ...data.form_data
                };
            }
            if(data.form_data_submitted_at){
                lastSubmittedAt = data.form_data_submitted_at;
                const formatted = formatTimestamp(lastSubmittedAt);
                showStatusMessage(`Last submitted on ${formatted}`);
            }
        }
    }catch(error){
        console.warn('Unable to fetch previous self test data', error);
    }
}

function attachSummaryActionHandlers(){
    const editBtn = document.getElementById('editResponsesBtn');
    if(editBtn){
        editBtn.addEventListener('click', ()=>{
            hideSummary();
            questionCounter = 1;
            updateProgressIndicators();
            displayNextQuestion();
        });
    }
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if(viewProfileBtn){
        viewProfileBtn.addEventListener('click', ()=>{
            window.location.href = '/user/profile';
        });
    }
}

function showStatusMessage(message){
    const banner = document.getElementById('formStatusBanner');
    const textEl = document.getElementById('formStatusText');
    if(banner && textEl){
        banner.style.display = 'block';
        textEl.innerText = message;
    }
}

function hideStatusMessage(){
    const banner = document.getElementById('formStatusBanner');
    if(banner){
        banner.style.display = 'none';
    }
}

function hideSummary(){
    const summary = document.getElementById('submissionSummary');
    if(summary){
        summary.style.display = 'none';
    }
}

function updateProgressIndicators(){
    const tracker = document.getElementById('questionTracker');
    const progressBar = document.getElementById('questionProgressBar');
    if(tracker){
        tracker.innerText = Math.min(questionCounter, 7);
    }
    if(progressBar){
        const percent = Math.min(((questionCounter-1)/7)*100, 100);
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent.toFixed(0));
    }
}

function applySelectionState(questionNumber){
    const key = QUESTION_KEY_MAP[questionNumber];
    if(!key){
        return;
    }
    const value = form_data[key];
    const yesBtn = document.getElementById(`Q${questionNumber}_yesButton`);
    const noBtn = document.getElementById(`Q${questionNumber}_noButton`);
    [yesBtn,noBtn].forEach(btn=>{
        if(btn){
            btn.classList.remove('selected');
            btn.classList.add('notSelected');
        }
    });
    if(value === "Yes" && yesBtn){
        yesBtn.classList.add('selected');
        yesBtn.classList.remove('notSelected');
    }
    if(value === "No" && noBtn){
        noBtn.classList.add('selected');
        noBtn.classList.remove('notSelected');
    }
}

function hasAnsweredCurrentQuestion(){
    const key = QUESTION_KEY_MAP[questionCounter];
    if(!key){
        return false;
    }
    return form_data[key] === "Yes" || form_data[key] === "No";
}

async function submitFormResponses(){
    try{
        const userRef = doc(db,'Users',uid);
        const updateJson = {
            form_data: form_data,
            form_data_submitted_at: serverTimestamp()
        };
        await updateDoc(userRef, updateJson);
        renderSubmissionSummary();
        showStatusMessage("Thanks! Your responses have been shared with our team.");
    }catch(error){
        console.error('Unable to save form data', error);
        alert('Unable to submit the self-test form right now. Please try again.');
    }finally{
        questionCounter = 1;
    }
}

function renderSubmissionSummary(){
    const summary = document.getElementById('submissionSummary');
    const summaryResponses = document.getElementById('summaryResponses');
    const subtitle = document.getElementById('summarySubtitle');
    if(!(summary && summaryResponses)){
        return;
    }
    summaryResponses.innerHTML = '';
    Object.entries(QUESTION_KEY_MAP).forEach(([index, key])=>{
        const label = QUESTION_LABELS[key] || key;
        const value = form_data[key] || 'Not shared';
        const chip = document.createElement('div');
        chip.className = 'summary-response-chip';
        chip.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
        summaryResponses.appendChild(chip);
    });
    if(subtitle){
        subtitle.innerText = `Submitted on ${new Date().toLocaleString()}. A copy has been shared with our scalpcare team.`;
    }
    summary.style.display = 'block';
    document.querySelectorAll('.card').forEach(card=>{
        card.style.display = 'none';
    });
}

function formatTimestamp(timestamp){
    if(!timestamp){
        return '';
    }
    try{
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return date.toLocaleString();
    }catch(err){
        return '';
    }
}

document.getElementById('Q1_yesButton').addEventListener('click',()=>{
    form_data["stress"] = "Yes";
})

document.getElementById('Q1_noButton').addEventListener('click',()=>{
    form_data["stress"] = "No";
})

document.getElementById('Q2_yesButton').addEventListener('click',()=>{
    form_data["iron deficiency"] = "Yes";
})

document.getElementById('Q2_noButton').addEventListener('click',()=>{
    form_data["iron deficiency"] = "No";
})

document.getElementById('Q3_yesButton').addEventListener('click',()=>{
    form_data["thyroid Deficiency"] = "Yes";
})

document.getElementById('Q3_noButton').addEventListener('click',()=>{
    form_data["thyroid Deficiency"] = "No";
})

document.getElementById('Q4_yesButton').addEventListener('click',()=>{
    form_data["dieting"] = "Yes";
})

document.getElementById('Q4_noButton').addEventListener('click',()=>{
    form_data["dieting"] = "No";
})

document.getElementById('Q5_yesButton').addEventListener('click',()=>{
    form_data["rash"] = "Yes";
})

document.getElementById('Q5_noButton').addEventListener('click',()=>{
    form_data["rash"] = "No";
})

document.getElementById('Q6_yesButton').addEventListener('click',()=>{
    form_data["flaking"] = "Yes";
})

document.getElementById('Q6_noButton').addEventListener('click',()=>{
    form_data["flaking"] = "No";
})

document.getElementById('Q7_yesButton').addEventListener('click',()=>{
    form_data["heredity"] = "Yes";
})

document.getElementById('Q7_noButton').addEventListener('click',()=>{
    form_data["heredity"] = "No";
})