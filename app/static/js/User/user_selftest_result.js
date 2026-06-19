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
    doc, deleteDoc, 
    onSnapshot,
    query, where,
    orderBy, limit,
    serverTimestamp, Timestamp,
    getDoc, updateDoc,

} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

let db = null;
let uid = null;
let latestStage = null;
const API_KEY = 'YOUR_WEB_API_KEY';
const STAGE_DISPLAY_MAP = {
    'normal': 'Normal',
    'stage 1': 'Stage 1',
    'stage 2': 'Stage 2',
    'stage 3': 'Stage 3',
    'bald': 'Advanced / Bald'
};
const FALLBACK_PRODUCTS = {
    'normal': [
        { name: 'Scalp Balance Cleanser', description: 'Gentle daily wash that keeps a healthy scalp barrier intact.', price: '₹349' },
        { name: 'Cooling Aloe Serum', description: 'Aloe + cucumber serum to calm occasional irritation.', price: '₹399' }
    ],
    'stage 1': [
        { name: 'Biotin Booster Gummies', description: 'Daily biotin + zinc stack to combat early thinning.', price: '₹699' },
        { name: 'Peppermint Follicle Mist', description: 'Peppermint and tea tree spray to improve circulation.', price: '₹449' }
    ],
    'stage 2': [
        { name: 'Castor & Amla Oil', description: 'Nutrient-rich pre-wash oil that thickens mid-stage hair.', price: '₹549' },
        { name: 'Ginseng Activator', description: 'Leave-in tonic with ginseng + caffeine to wake dormant follicles.', price: '₹899' }
    ],
    'stage 3': [
        { name: 'Advanced DHT Blocker', description: 'Plant-based DHT defence serum for aggressive thinning.', price: '₹1299' },
        { name: 'Redensyl Treatment', description: 'Clinical-grade redensyl complex to reactivate follicles.', price: '₹1499' }
    ],
    'bald': [
        { name: 'Stem Cell Recovery Kit', description: 'Plant stem cell ampoules that prep for regrowth therapies.', price: '₹1999' },
        { name: 'Microneedle + Serum Duo', description: 'Microneedling roller plus copper peptide serum for scalp health.', price: '₹1799' }
    ]
};

document.addEventListener("DOMContentLoaded", function() {

    document.getElementById('loading-wrapper').style.display = 'block';
    
    fetch(`/api/env/firebaseConfig?api_key=${API_KEY}`,{
        headers:{
            'Referer':`https://${window.location.hostname}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase configuration');
        }
        return response.json();
    })
    .then(firebaseConfig => {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        db = getFirestore(app);
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    console.log("User Signed In :", user);
                    console.log("User ID: ", user.uid);
                    uid = user.uid;
                    resolve(user.uid);
                } else {
                    console.log("No User Logged In: ", user);
                    reject(new Error('Firebase: No User Logged In'));
                }
            });
        });
    })
    .then(user_id => {
        const databaseURL = '/api/images/' + encodeURIComponent(user_id) + '/recent?api_key=' + encodeURIComponent(API_KEY)
        return fetch(databaseURL)
    })
    .then(response => response.json())
    .then(data =>{
        if(data['images'].length == 0){
            throw new Error('Empty data.images');
        }
        const base64Image = data['images'][0]['image_data'];
        const dateandtime = data['images'][0]['upload_time'];
        const stage = (data['images'][0]['stage'] || '').toLowerCase();
        latestStage = stage;

        const decodedBytes = atob(base64Image);
        const arrayBuffer = new ArrayBuffer(decodedBytes.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < decodedBytes.length; i++) {
            uint8Array[i] = decodedBytes.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(blob);
        document.getElementById('loading-wrapper').style.display = 'none';
        const resultImage = document.getElementById('resultImage')
        resultImage.src = imageUrl;
        const stageLabel = getStageDisplayName(stage);
        document.getElementById('stage').innerText = stageLabel;
        console.log(dateandtime);
        let formattedDate = formatDate(dateandtime);

        document.getElementById('resultDescription').innerText = 'Your hairloss stage is : ' + stageLabel
        document.getElementById('showDate').innerText = 'Date and Time: '+ formattedDate;

        let resultInfo = ''
        if (stage == 'normal'){
            resultInfo = normalStageText;
        }
        else if (stage == 'stage 1'){
            resultInfo = stageOneText;
        }
        else if (stage == 'stage 2'){
            resultInfo = stageTwoText; 
        }
        else if (stage == 'stage 3'){
            resultInfo = stageThreeText;
        }
        else{
            resultInfo = stageBaldText;
        }

        document.getElementById('resultInfo').innerHTML = resultInfo;

    })
    .then(async ()=>{
        if(db && uid){
            try {
                const userRef = doc(db,'Users',uid);
            let form_data = {};
            const formHistoryPromise = new Promise((resolve,reject)=>{
                getDoc(userRef)
                    .then(snap=>{
                        if(snap.exists() && snap.data().hasOwnProperty('form_data')){
                            form_data = snap.data()['form_data'];
                        }
                        resolve(form_data)
                    })
                    .catch(err=>{
                        console.warn('Firebase offline or error:', err.message);
                        // Don't reject, just resolve with empty data to continue
                        resolve({});
                    })
            })

            await formHistoryPromise;

            let flag = false;

            for(let property in form_data){
                if(property=='dieting'&&form_data[property]=='Yes'){
                    document.getElementById('dieting').style.display = 'block';
                    flag = true;
                }
                if(property=='flaking'&&form_data[property]=='Yes'){
                    document.getElementById('flaking').style.display = 'block';
                    flag = true;
                }
                if(property=='stress'&&form_data[property]=='Yes'){
                    document.getElementById('stress').style.display = 'block';
                    flag = true;
                }
                if(property=='iron deficiency'&&form_data[property]=='Yes'){
                    document.getElementById('ironDeficiency').style.display = 'block';
                    flag = true;
                }
                if(property=='rash'&&form_data[property]=='Yes'){
                    document.getElementById('rash').style.display = 'block';
                    flag = true;
                }
                if(property=='heredity'&&form_data[property]=='Yes'){
                    document.getElementById('heredity').style.display = 'block';
                    flag = true;
                }
            }
            console.log(flag);
            if(!flag){
                document.getElementById('reasonsDiv').style.display = 'none';
            }
            } catch (firebaseError) {
                console.warn('Firebase operation failed:', firebaseError.message);
                // Continue without Firebase data
            }
        }
    })
    .catch(err => {
        console.log('Error', err);
        alert(`Error: ${err}`);
        window.location.href = '/user/self-test';
    })


});


document.getElementById('retestBtn').addEventListener('click',function(){
    window.location.href = '/user/self-test';
})
document.getElementById('historyBtn').addEventListener('click',function(){
    window.location.href = '/user/self-test/history';
})
document.getElementById('recommendedBtn').addEventListener('click', async function(){
    if(!latestStage){
        alert('Results are still loading. Please try again in a moment.');
        return;
    }
    await loadRecommendedProducts(latestStage);
})
document.getElementById('consultBtn').addEventListener('click',function(){
    window.location.href = '/user/chat';
})

const shopStageBtn = document.getElementById('shopStageBtn');
if(shopStageBtn){
    shopStageBtn.addEventListener('click', function(){
        if(!latestStage){
            window.location.href = '/user/marketplace';
            return;
        }
        const stageLabel = encodeURIComponent(getStageDisplayName(latestStage));
        window.location.href = `/user/marketplace?stage=${stageLabel}`;
    });
}

function formatDate(inputDate) {
    // Parse the input date string
    const date = new Date(inputDate);

    // Define arrays for ordinal suffixes and months
    const ordinalSuffix = ['th', 'st', 'nd', 'rd'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Get the day, month, year, hours, and minutes
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Convert hours to 12-hour format and determine AM/PM
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;

    // Construct the formatted date string
    const formattedDate = `${day} ${months[month]} ${year}, ${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    return formattedDate;
}

function getStageDisplayName(stage){
    if(!stage){
        return 'your stage';
    }
    const key = stage.toLowerCase();
    return STAGE_DISPLAY_MAP[key] || stage;
}

async function loadRecommendedProducts(stage){
    const section = document.getElementById('recommendedProductsSection');
    const grid = document.getElementById('recommendedProductsGrid');
    const stageLabelEl = document.getElementById('recommendedStageLabel');
    if(!(section && grid && stageLabelEl)){
        return;
    }
    const label = getStageDisplayName(stage);
    stageLabelEl.innerText = label;
    grid.innerHTML = '<p>Finding products for you...</p>';
    section.style.display = 'block';
    try{
        const response = await fetch(`/api/database/products?api_key=${API_KEY}`);
        if(!response.ok){
            throw new Error('Unable to fetch catalog');
        }
        const data = await response.json();
        const filtered = data.filter(item => ((item.CATEGORY || '').toLowerCase() === label.toLowerCase()));
        if(filtered.length){
            renderRecommendedProducts(filtered.slice(0,3));
            section.scrollIntoView({behavior:'smooth', block:'start'});
            return;
        }
        throw new Error('No products for stage');
    }catch(error){
        const fallback = FALLBACK_PRODUCTS[stage] || [];
        renderRecommendedProducts(fallback);
        section.scrollIntoView({behavior:'smooth', block:'start'});
    }
}

function renderRecommendedProducts(products){
    const grid = document.getElementById('recommendedProductsGrid');
    if(!grid){
        return;
    }
    if(!products || products.length === 0){
        grid.innerHTML = '<p>We are curating products for this stage. Visit the marketplace for more options.</p>';
        return;
    }
    grid.innerHTML = '';
    products.forEach(product=>{
        const name = product.NAME || product.name || 'Product';
        const description = product.DESCRIPTION || product.description || '';
        const priceValue = product.PRICE || product.price || '';
        const price = priceValue ? `₹${priceValue.toString().replace('₹','')}` : '';
        const card = document.createElement('div');
        card.className = 'recommended-card';
        card.innerHTML = `<h3>${name}</h3><p>${description}</p>${price ? `<span>${price}</span>` : ''}`;
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary';
        button.textContent = 'View Product';
        button.addEventListener('click', ()=>{
            if(product.URL){
                window.open(product.URL, '_blank');
            }else{
                const stageLabel = getStageDisplayName(latestStage || '');
                window.location.href = `/user/marketplace?stage=${encodeURIComponent(stageLabel)}`;
            }
        });
        card.appendChild(button);
        grid.appendChild(card);
    });
}

const normalStageText = `
<h2>Normal Stage</h2>
<strong>Description : </strong>
<div id="text">In the normal stage, individuals have a full head of hair without any signs of balding or hair loss</div>
<strong>Recommendations:</strong>
<div id="text">
    <ul>
        <li>Maintain good hair care practices such as regular washing with a mild shampoo and conditioning.</li>
        <li>Avoid excessive use of heat styling tools and harsh chemical treatments.</li>
        <li>Eat a balanced diet rich in vitamins and minerals that support hair health, such as biotin, zinc, and vitamins A, C, and E.</li>
        <li>Consider using a wide-tooth comb to minimize hair breakage.</li>
        <li>Protect the scalp from sun damage by wearing a hat or applying sunscreen when exposed to direct sunlight for prolonged periods.</li>
    </ul>
</div>

`

const stageOneText = `
<h2>Stage 1</h2>
<strong>Description : </strong>
<div id="text">
Stage 1 typically involves minimal hair loss, often characterized by a slight recession of the hairline or thinning at the temples
</div>
<strong>Recommendations:</strong>
<div id="text">
    <ul>
        <li>
            Consult with a dermatologist or trichologist for an accurate diagnosis and personalized treatment plan
        </li>
        <li>
            Incorporate hair-strengthening and growth-promoting ingredients into your hair care routine, such as minoxidil or finasteride (under medical supervision).
        </li>
        <li>
            Explore non-invasive treatments like low-level laser therapy (LLLT) or platelet-rich plasma (PRP) therapy to stimulate hair follicle activity.
        </li>
        <li>
            Practice stress management techniques as stress can contribute to hair loss.
        </li>
        <li>
            Consider styling techniques to camouflage thinning areas, such as strategic haircuts or using volumizing products.
        </li>
    </ul>
</div>
`

const stageTwoText = `
<h2>Stage 2</h2>
<strong>Description : </strong>
<div id="text">
Stage 2 involves further progression of hair loss, with noticeable thinning or receding at the temples and possibly the crown area.
</div>
<strong>Recommendations:</strong>
<div id="text">
    <ul>
        <li>
            Discuss advanced treatment options with a specialist, including oral medications, topical solutions, or hair transplantation.
        </li>
        <li>
            Explore lifestyle changes that promote overall health, such as regular exercise and a balanced diet.
        </li>
        <li>
            Explore non-invasive treatments like low-level laser therapy (LLLT) or platelet-rich plasma (PRP) therapy to stimulate hair follicle activity.
        </li>
        <li>
            Use styling techniques to create the illusion of thicker hair, such as using hair fibers or hair-thickening sprays.
        </li>
        <li>
            Consider wearing hats or headscarves if self-conscious about hair loss.
        </li>
    </ul>
</div>
`

const stageThreeText = `
<h2>Stage 3</h2>
<strong>Description : </strong>
<div id="text">
Stage 3 is characterized by significant hair loss, with more extensive thinning or balding areas on the scalp.
</div>
<strong>Recommendations:</strong>
<div id="text">
    <ul>
        <li>
            Seek professional advice from a dermatologist or hair restoration expert to discuss treatment options tailored to your specific needs.
        </li>
        <li>
            Evaluate the potential benefits and risks of surgical interventions, such as hair transplantation or scalp reduction surgery.
        </li>
        <li>
            Experiment with hairstyles that embrace your natural hair texture or consider shaving your head for a bold, confident look.
        </li>
        <li>
            Prioritize self-care and emotional well-being by seeking support from friends, family, or support groups for individuals experiencing hair loss
        </li>
        <li>
            Explore alternative hair restoration options, such as wigs or hairpieces, to restore confidence and self-esteem.
        </li>
    </ul>
</div>
`

const stageBaldText = `
<h2>Stage Bald</h2>
<strong>Description : </strong>
<div id="text">
In the bald stage, individuals have significant or complete hair loss across large areas of the scalp.
</div>
<strong>Recommendations:</strong>
<div id="text">
    <ul>
        <li>
            Embrace baldness as a natural part of your appearance and identity.
        </li>
        <li>
            Consider maintaining a clean-shaven look for a polished and confident appearance.            
        </li>
        <li>
            Explore cosmetic options like scalp micropigmentation (SMP) to create the appearance of a closely shaved scalp or to add the illusion of density to thinning areas.
        </li>
        <li>
            Remember that baldness does not define your worth or attractiveness, and confidence and self-assurance are key to embracing your baldness with pride.
        </li>
    </ul>
</div>
`