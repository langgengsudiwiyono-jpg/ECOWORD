import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

let termsArray = [];
let currentCardIndex = 0;

// --- LOGIKA TAMBAH ISTILAH ---
const addTermBtn = document.getElementById('addTermBtn');
if (addTermBtn) {
    addTermBtn.addEventListener('click', async () => {
        const term = document.getElementById('termInput').value.trim();
        const def = document.getElementById('defInput').value.trim();

        if (term && def) {
            try {
                // Menambahkan data ke Firebase dengan timestamp server
                await addDoc(collection(db, "glossary"), {
                    term: term,
                    definition: def,
                    createdAt: serverTimestamp() // Untuk mengurutkan kartu
                });
                document.getElementById('termInput').value = '';
                document.getElementById('defInput').value = '';
            } catch (e) {
                alert("Gagal menyimpan: " + e.message);
            }
        }
    });
}

// --- MEMUAT DATA REAL-TIME UNTUK SEMUA ORANG ---
function loadGlossary() {
    // Urutkan berdasarkan waktu dibuat
    const q = query(collection(db, "glossary"), orderBy("createdAt", "asc"));
    
    onSnapshot(q, (snapshot) => {
        termsArray = [];
        const list = document.getElementById('glossaryList');
        list.innerHTML = '';
        
        let counter = 1;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            data.cardNumber = counter; // Beri nomor urut kartu
            termsArray.push(data);
            
            // Tambahkan ke list HTML
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>#${counter} ${data.term}</strong> <br>
                    <small>${data.definition}</small>
                </div>
                <button onclick="deleteTerm('${docSnap.id}')">Hapus</button>
            `;
            list.appendChild(li);
            counter++;
        });

        // Update tampilan kartu
        if (termsArray.length > 0) {
            if (currentCardIndex >= termsArray.length) currentCardIndex = 0;
            updateFlashcard();
        } else {
            document.getElementById('cardTerm').textContent = "Belum ada istilah";
            document.getElementById('cardDef').textContent = "Tambahkan istilah pertamamu!";
            document.getElementById('cardNumber').textContent = "#0";
        }
    });
}

// Fungsi delete global
window.deleteTerm = async (id) => {
    await deleteDoc(doc(db, "glossary", id));
}

// --- KONTROL GAME FLASHCARD ---
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
        flashcard.classList.remove('flipped');
        setTimeout(updateFlashcard, 300);
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
        document.getElementById('cardNumber').textContent = `#${card.cardNumber}`;
    }
}

// Mulai memuat data saat web dibuka
loadGlossary();
