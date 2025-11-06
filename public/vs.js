// Safe, reusable filter function for jobs.

function _normalize(v) {
    return (v === undefined || v === null) ? '' : String(v).trim().toLowerCase();
}

/**
 * Filter jobs by region or special area key.
 * @param {Array} allJobs - array of job objects
 * @param {string} [selectedRegion] - optional selected region string; if omitted, reads #regionFilter.value in the DOM
 * @returns {Array} filtered jobs
 */
function filterJobs(allJobs, selectedRegion) {
    if (!Array.isArray(allJobs)) return [];

    const selectedRaw = (typeof selectedRegion === 'string' && selectedRegion.length > 0)
        ? selectedRegion
        : (typeof document !== 'undefined' && document.getElementById ? (document.getElementById('regionFilter') && document.getElementById('regionFilter').value) : '');

    const selected = _normalize(selectedRaw);

    if (!selected || selected === 'all') return allJobs;

    return allJobs.filter(job => {
        if (!job) return false;

        const jobRegion = _normalize(job.region);
        const jobArea = _normalize(job.area);

        // support job.region as array
        const regionMatches = Array.isArray(job.region)
            ? job.region.map(_normalize).includes(selected)
            : jobRegion === selected;

        if (selected === 'zahranici_bor') {
            return jobArea === 'zahranici_bor';
        }

        return regionMatches;
    });
}

// Export for CommonJS and window global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = filterJobs;
}
if (typeof window !== 'undefined') {
    window.filterJobs = filterJobs;
}