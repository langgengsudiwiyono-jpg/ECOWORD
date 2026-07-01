// === KONFIGURASI ===
const DB_URL = "https://api.npoint.io/f8cc9c6d4d0161d61098"; // Ganti dengan link npoint kamu
// ====================

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
                // Ambil data lama, tambah data baru, lalu simpan kembali
                const newTerm = {
                    term: term,
                    definition: def,
                    createdAt: Date.now()
                };
                
                termsArray.push(newTerm);
                // Urutkan berdasarkan waktu dibuat
                termsArray.sort((a, b) => a.createdAt - b.createdAt);

                // Kirim data ke npoint
                await fetch(DB_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(termsArray)
                });

                document.getElementById('termInput').value = '';
                document.getElementById('defInput').value = '';
                
                loadGlossary(); // Muat ulang data
            } catch (e) {
                alert("Gagal menyimpan: " + e.message);
            }
        }
    });
}

// --- MEMUAT DATA REAL-TIME (DENGAN POLLING) ---
async function loadGlossary() {
    try {
        const res = await fetch(DB_URL);
        let data = await res.json();
        
        if (!Array.isArray(data)) data = []; // Jika kosong, buat array kosong
        
        termsArray = data;
        termsArray.sort((a, b) => a.createdAt - b.createdAt); // Urutkan
        
        const list = document.getElementById('glossaryList');
        list.innerHTML = '';
        
        let counter = 1;
        termsArray.forEach((item) => {
            item.cardNumber = counter;
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>#${counter} ${item.term}</strong> <br>
                    <small>${item.definition}</small>
                </div>
                <button onclick="deleteTerm('${item.createdAt}')">Hapus</button>
            `;
            list.appendChild(li);
            counter++;
        });

        if (termsArray.length > 0) {
            if (currentCardIndex >= termsArray.length) currentCardIndex = 0;
            updateFlashcard();
        } else {
            document.getElementById('cardTerm').textContent = "Belum ada istilah";
            document.getElementById('cardDef').textContent = "Tambahkan istilah pertamamu!";
            document.getElementById('cardNumber').textContent = "#0";
        }
    } catch (e) {
        console.error("Error loading data:", e);
    }
}

// Fungsi delete
window.deleteTerm = async (timestamp) => {
    // Hapus berdasarkan waktu dibuat
    termsArray = termsArray.filter(item => String(item.createdAt) !== String(timestamp));
    
    await fetch(DB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(termsArray)
    });
    
    loadGlossary();
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

// --- SIMULASI REAL-TIME ---
// Mengecek database baru setiap 3 detik agar kartu selalu update jika ada orang lain menambah
setInterval(loadGlossary, 3000);

// Muat data pertama kali saat web dibuka
loadGlossary();
