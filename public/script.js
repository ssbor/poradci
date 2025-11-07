
let allJobs = []; // Zde se uloží všechny načtené nabídky
const jobListings = document.getElementById('job-listings'); // Předpokládám, že zde se zobrazují nabídky
const regionFilter = document.getElementById('region-filter'); // ID filtru z index.html

// --- 1. FUNKCE PRO VYKRESLENÍ NABÍDEK ---
function renderJobs(jobs) {
    jobListings.innerHTML = ''; // Vyčistí seznam
    
    if (jobs.length === 0) {
        jobListings.innerHTML = '<p class="no-results">Žádné pracovní nabídky neodpovídají zvolenému filtru.</p>';
        return;
    }

    jobs.forEach(job => {
        const jobElement = document.createElement('div');
        jobElement.classList.add('job-card'); 
        
        // Zde byste měla mít svůj kód pro formátování karty (title, company, location atd.)
        jobElement.innerHTML = `
            <h3>${job.title}</h3>
            <p class="company">${job.company}</p>
            <p class="location">${job.location}</p>
            <p class="region">${job.region}</p>
        `;
        jobListings.appendChild(jobElement);
    });
}

// --- 2. FUNKCE PRO FILTROVÁNÍ (Zde je Vaše úprava) ---
function filterJobs() {
    // Využívá proměnnou allJobs, která byla načtena na začátku
    const selectedRegion = regionFilter.value; 

    const filteredJobs = allJobs.filter(job => {
        // Kontrola, zda je vybráno "Zahraničí"
        if (selectedRegion === 'zahranici_bor') {
            // Zobrazí jen nabídky, které mají "area": "zahranici_bor"
            return job.area === 'zahranici_bor'; 
        } else {
            // Standardní filtrování podle regionu nebo zobrazí vše, pokud není nic vybráno
            return !selectedRegion || job.region === selectedRegion; 
        }
    });

    // POZOR: KLÍČOVÝ KROK! Vykreslí vyfiltrované nabídky
    renderJobs(filteredJobs); 
}

// --- 3. FUNKCE PRO NAČTENÍ DAT A INICIALIZACE ---
function fetchJobs() {
    fetch('job_offers.json') // Cesta k Vašemu datovému souboru
        .then(response => {
            if (!response.ok) {
                throw new Error('Chyba při načítání souboru job_offers.json');
            }
            return response.json();
        })
        .then(data => {
            allJobs = data; // Uloží načtená data
            filterJobs(); // Spustí první filtrování (zobrazí se "Všechny kraje")
        })
        .catch(error => {
            console.error('Došlo k chybě:', error);
            jobListings.innerHTML = '<p class="error-message">Nepodařilo se načíst pracovní nabídky. Zkontrolujte, zda je soubor **job_offers.json** nahrán na GitHub.</p>';
        });
}

// --- 4. SPUSŤTE A NASLOUCHEJTE ZMĚNÁM ---
// Po načtení stránky se spustí načítání dat
document.addEventListener('DOMContentLoaded', fetchJobs);

// Naslouchá změnám ve filtru (Krok 2)
if (regionFilter) {
    regionFilter.addEventListener('change', filterJobs);
}
