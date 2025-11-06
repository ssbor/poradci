
const regionFilter = document.getElementById('regionFilter');

function filterJobs(allJobs) {
    const selectedRegion = regionFilter.value;

    const filteredJobs = allJobs.filter(job => {
        if (selectedRegion === 'zahranici_bor') {
            return job.area === 'zahranici_bor';
        } else {
            return !selectedRegion || job.region === selectedRegion;
        }
    });

    return filteredJobs;
}

// Příklad použití:
// const jobs = [...]; // pole všech nabídek
// const visibleJobs = filterJobs(jobs);
// renderJobs(visibleJobs);
