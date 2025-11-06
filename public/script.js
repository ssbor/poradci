
const regionFilter = document.getElementById('regionFilter');

function filterJobs(allJobs) {
    const selectedRegion = regionFilter.value;

   const filteredJobs = allJobs.filter(job => {
    const selectedRegion = regionFilter.value;

    if (selectedRegion === 'zahranici_bor') {
        return job.area === 'zahranici_bor';
    } else {
        return !selectedRegion || job.region === selectedRegion;
    }
});
// Příklad použití:
// const jobs = [...]; // pole všech nabídek
// const visibleJobs = filterJobs(jobs);
// renderJobs(visibleJobs);
