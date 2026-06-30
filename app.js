import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// === KONFIGURASI FIREBASE KAMU DI SINI ===
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID_KAMU",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID_KAMU",
  appId: "APP_ID_KAMU"
};
// =========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Cek apakah user login, untuk mengarahkan halaman
onAuthStateChanged(auth, (user) => {
    if (window.location.pathname.includes('index.html')) {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('userEmail').textContent = user.email;
            loadGlossary(user.uid);
        }
    } else if (window.location.pathname.includes('login.html')) {
        if (user) {
            window.location.href = 'index.html';
        }
    }
});

// --- LOGICA LOGIN ---
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signInWithEmailAndPassword(auth, email, password).catch(err => {
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('errorMsg').textContent = err.message;
        });
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        createUserWithEmailAndPassword(auth, email, password).catch(err => {
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('errorMsg').textContent = err.message;
        });
    });
}

// --- LOGOUT ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => signOut(auth));
}

// --- GLOSARIUM & GAME LOGIC ---
let termsArray = [];
let currentCardIndex = 0;

const addTermBtn = document.getElementById('addTermBtn');
if (addTermBtn) {
    addTermBtn.addEventListener('click', async () => {
        const term = document.getElementById('termInput').value.trim();
        const def = document.getElementById('defInput').value.trim();
        const user = auth.currentUser;

        if (term && def && user) {
            try {
                await addDoc(collection(db, "glossary"), {
                    term: term,
                    definition: def,
                    userId: user.uid,
                    createdAt: new Date()
                });
                document.getElementById('termInput').value = '';
                document.getElementById('defInput').value = '';
            } catch (e) {
                alert("Gagal menyimpan: " + e.message);
            }
        }
    });
}

function loadGlossary(userId) {
    const q = query(collection(db, "glossary"), where("userId", "==", userId));
    onSnapshot(q, (snapshot) => {
        termsArray = [];
        const list = document.getElementById('glossaryList');
        list.innerHTML = '';
        
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            termsArray.push(data);
            
            // Tambahkan ke list HTML
            const li = document.createElement('li');
            li.innerHTML = `<strong>${data.term}</strong>: ${data.definition} 
                            <button onclick="deleteTerm('${docSnap.id}')">Hapus</button>`;
            list.appendChild(li);
        });

        if (termsArray.length > 0) {
            currentCardIndex = 0;
            updateFlashcard();
        } else {
            document.getElementById('cardTerm').textContent = "Belum ada istilah";
            document.getElementById('cardDef').textContent = "Tambahkan istilah dulu!";
        }
    });
}

// Buat fungsi delete global agar bisa dipanggil dari HTML
window.deleteTerm = async (id) => {
    await deleteDoc(doc(db, "glossary", id));
}

// --- GAME FLASHCARD ---
const flashcard = document.getElementById('flashcard');
const flipBtn = document.getElementById('flipBtn');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

if (flipBtn) {
    flipBtn.addEventListener('click', () => flashcard.classList.toggle('flipped'));
    flashcard.addEventListener('click', () => flashcard.classList.toggle('flipped'));
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (termsArray.length === 0) return;
        currentCardIndex = (currentCardIndex + 1) % termsArray.length;
        flashcard.classList.remove('flipped'); // Reset posisi kartu
        setTimeout(updateFlashcard, 300); // Tunggu animasi selesai
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (termsArray.length === 0) return;
        currentCardIndex = (currentCardIndex - 1 + termsArray.length) % termsArray.length;
        flashcard.classList.remove('flipped');
        setTimeout(updateFlashcard, 300);
    });
}

function updateFlashcard() {
    if (termsArray.length > 0) {
        const card = termsArray[currentCardIndex];
        document.getElementById('cardTerm').textContent = card.term;
        document.getElementById('cardDef').textContent = card.definition;
    }
}
