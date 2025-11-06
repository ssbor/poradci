
const regionFilter = document.getElementById('regionFilter');

function filterJobs(allJobs) {
  const selectedRegion = regionFilter.value;
  return allJobs.filter(job => job.area === selectedRegion);
}

function renderJobs(jobs) {
  const container = document.getElementById('jobResults');
  container.innerHTML = '';

  jobs.forEach(job => {
    const section = document.createElement('section');
    section.innerHTML = `
      <h2>${job.obor}</h2>
      <p><strong>Počet míst:</strong> ${job.pocet_mist}</p>
      <p><strong>Medián spodní mzdy:</strong> ${job.mzda_median_mesicne}</p>
      <p><strong>CZ-ISCO:</strong> ${job.cz_isco}</p>
      <table border="1">
        <thead>
          <tr>
            <th>Profese</th>
            <th>Zaměstnavatel</th>
            <th>Okres</th>
            <th>Mzda</th>
            <th>Datum</th>
          </tr>
        </thead>
        <tbody>
          ${job.nabidky.map(n => `
            <tr>
              <td>${n.profese}</td>
              <td>${n.zamestnavatel}</td>
              <td>${n.okres}</td>
              <td>${n.mzda}</td>
              <td>${n.datum}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.appendChild(section);
  });
}

fetch('/data/job_offers.json')
  .then(response => response.json())
  .then(allJobs => {
    const visibleJobs = filterJobs(allJobs);
    renderJobs(visibleJobs);
  })
  .catch(error => console.error("Chyba při načítání dat:", error));
