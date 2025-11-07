// Počkáme, až se načte celý HTML dokument
document.addEventListener('DOMContentLoaded', () => {

    // Najdeme klíčové HTML prvky
    const regionFilter = document.getElementById('regionFilter');
    const jobListContainer = document.getElementById('jobListContainer');
    
    // Proměnná pro uložení VŠECH nabídek, aby se nemusela data načítat znovu
    let allJobs = [];

    // --- 1. Načtení dat při startu ---
    fetch('job_offers.json') // Načteme data
        .then(response => response.json())
        .then(data => {
            allJobs = data; // Uložíme si je do proměnné
            renderJobs(allJobs); // Vykreslíme VŠECHNY práce při prvním načtení
        })
        .catch(error => {
            console.error('Chyba při načítání dat:', error);
            jobListContainer.innerHTML = '<p>Nepodařilo se načíst nabídky práce.</p>';
        });

    // --- 2. Přidání "posluchače" na filtr ---
    regionFilter.addEventListener('change', () => {
        // Pokaždé, když uživatel změní filtr...
        const filteredJobs = filterJobs(allJobs); // ...zavoláme vaši filtrační funkci
        renderJobs(filteredJobs); // ...a vykreslíme výsledek
    });

    // --- 3. Vaše funkce filterJobs (OPRAVENÁ) ---
    function filterJobs(jobsToFilter) {
        const selectedRegion = regionFilter.value;

        const filteredJobs = jobsToFilter.filter(job => {
            // Poznámka: proměnná selectedRegion je už definovaná výše
            
            if (selectedRegion === 'zahranici_bor') {
                return job.area === 'zahranici_bor';
            } else {
                // Pokud je selectedRegion "" (prázdný, "Všechny"),
                // !selectedRegion bude true a vrátí se všechny práce.
                // Jinak se porovná job.region === selectedRegion
                return !selectedRegion || job.region === selectedRegion;
            }
        });
        
        // --- TOTO CHYBĚLO ---
        return filteredJobs; 
    }

    // --- 4. Funkce pro vykreslení ---
    function renderJobs(jobsToRender) {
        // Vyprázdníme kontejner
        jobListContainer.innerHTML = '';

        if (jobsToRender.length === 0) {
            jobListContainer.innerHTML = '<p>Pro tento filtr nebyly nalezeny žádné nabídky.</p>';
            return;
        }

        // Pro každou práci v poli vytvoříme HTML
        jobsToRender.forEach(job => {
            const jobElement = document.createElement('div');
            jobElement.style.border = '1px solid #ccc';
            jobElement.style.padding = '10px';
            jobElement.style.marginBottom = '10px';
            
            jobElement.innerHTML = `
                <h3>${job.title}</h3>
                <p><strong>Firma:</strong> ${job.company}</p>
                <p><strong>Místo:</strong> ${job.location}</p>
                <p><em>Region: ${job.region} / Area: ${job.area}</em></p>
            `;
            
            jobListContainer.appendChild(jobElement);
        });
    }

});