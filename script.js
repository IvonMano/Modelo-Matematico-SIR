
document.addEventListener('DOMContentLoaded', () => {
  // ========================
  // 1. TEMA CLARO/OSCURO
  // ========================
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('theme', cur);
  });

  // ========================
  // 2. ELEMENTOS UI
  // ========================
  const beta = document.getElementById('beta');
  const gamma = document.getElementById('gamma');
  const N = document.getElementById('N');
  const I0 = document.getElementById('I0');
  const days = document.getElementById('days');

  const betaVal = document.getElementById('betaVal');
  const gammaVal = document.getElementById('gammaVal');
  const NVal = document.getElementById('NVal');
  const I0Val = document.getElementById('I0Val');
  const daysVal = document.getElementById('daysVal');

  const btnSimulate = document.getElementById('btnSimulate');
  const btnReset = document.getElementById('btnReset');
  const btnExportXLSX = document.getElementById('btnExportXLSX');

  const intersectList = document.getElementById('intersectList');
  const R0Value = document.getElementById('R0Value');
  const peakI = document.getElementById('peakI');
  const finalI = document.getElementById('finalI');
  const veredictBox = document.getElementById('veredictText');

  const fileVideo = document.getElementById('fileVideo');
  const localVideo = document.getElementById('localVideo');

  // Infografía modal
  const btnShowInfografia = document.getElementById('btnShowInfografia');
  const infografiaModal = document.getElementById('infografiaModal');
  const closeInfografia = document.getElementById('closeInfografia');

  // ========================
  // 3. SINCRONIZAR SLIDERS
  // ========================
  function syncUI() {
    betaVal.textContent = parseFloat(beta.value).toFixed(2);
    gammaVal.textContent = parseFloat(gamma.value).toFixed(2);
    NVal.textContent = parseInt(N.value);
    I0Val.textContent = parseInt(I0.value);
    daysVal.textContent = parseInt(days.value);
  }
  [beta, gamma, N, I0, days].forEach(el => el.addEventListener('input', syncUI));
  syncUI();

  // ========================
  // 4. CHART CONFIG
  // ========================
  const ctx = document.getElementById('sirChart').getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'S', data: [], borderColor: '#2563eb', borderWidth: 2, tension: 0.25, pointRadius: 0 },
        { label: 'I', data: [], borderColor: '#ef4444', borderWidth: 2, tension: 0.25, pointRadius: 0 },
        { label: 'R', data: [], borderColor: '#059669', borderWidth: 2, tension: 0.25, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: 'var(--text)' } },
        tooltip: {
          backgroundColor: (ctx) => {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            return theme === 'dark' ? '#f3f4f6' : '#111';
          },
          titleColor: (ctx) => {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            return theme === 'dark' ? '#111' : '#fff';
          },
          bodyColor: (ctx) => {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            return theme === 'dark' ? '#111' : '#fff';
          },
          borderColor: (ctx) => {
            const theme = document.documentElement.getAttribute('data-theme') || 'light';
            return theme === 'dark' ? '#ddd' : '#333';
          },
          borderWidth: 1.2,
          titleFont: { weight: '700' },
          bodyFont: { weight: '500' },
          cornerRadius: 6,
          padding: 10,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: { ticks: { color: 'var(--muted)' } },
        y: { ticks: { color: 'var(--muted)' } }
      }
    },
    plugins: [{
      id: 'peakLabelPlugin',
      afterDatasetsDraw(chart, args, options) {
        const ds = chart.data.datasets[1];
        if (!ds || ds.data.length === 0) return;
        let max = -Infinity, idx = -1;
        for (let i = 0; i < ds.data.length; i++) {
          const v = ds.data[i];
          if (v > max) { max = v; idx = i; }
        }
        if (idx < 0) return;
        const meta = chart.getDatasetMeta(1);
        const point = meta.data[idx];
        if (!point) return;
        const x = point.x, y = point.y;
        const ctx = chart.ctx;

        // Colores según tema
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const dark = theme === 'dark';
        const boxColor = dark ? '#f9fafb' : '#111';
        const textColor = dark ? '#111' : '#fff';
        const circleColor = dark ? '#fff' : '#111';
        const circleBorder = dark ? '#111' : '#fff';

        ctx.save();
        // círculo del pico
        ctx.beginPath();
        ctx.fillStyle = circleColor;
        ctx.strokeStyle = circleBorder;
        ctx.lineWidth = 2;
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // caja del texto
        const label = `Pico: ${Math.round(max)} — t=${chart.data.labels[idx]}`;
        ctx.font = '600 12px Montserrat';
        const pad = 8;
        const tw = ctx.measureText(label).width;
        const bw = tw + pad * 2;
        const bh = 24;
        let bx = x - bw / 2;
        if (bx + bw > chart.width - 10) bx = chart.width - bw - 10;
        if (bx < 10) bx = 10;
        let by = y - bh - 12;
        if (by < 10) by = y + 12;

        // fondo redondeado
        ctx.fillStyle = boxColor;
        ctx.beginPath();
        const r = 6;
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
        ctx.arcTo(bx, by + bh, bx, by, r);
        ctx.arcTo(bx, by, bx + bw, by, r);
        ctx.closePath();
        ctx.fill();

        // texto centrado
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + bw / 2, by + bh / 2);
        ctx.restore();
      }
    }]
  });

  // ========================
  // 5. FUNCIONES AUXILIARES
  // ========================
  function simulate(params) {
    const dt = 0.1;
    const steps = Math.max(10, Math.floor(params.days / dt));
    const t = new Array(steps + 1);
    const S = new Array(steps + 1);
    const I = new Array(steps + 1);
    const R = new Array(steps + 1);
    S[0] = params.N - params.I0;
    I[0] = params.I0;
    R[0] = 0;
    t[0] = 0;
    for (let i = 0; i < steps; i++) {
      const s = S[i], ii = I[i], r = R[i];
      const newInf = params.beta * s * ii / params.N;
      const newRec = params.gamma * ii;
      S[i + 1] = Math.max(0, s - dt * newInf);
      I[i + 1] = Math.max(0, ii + dt * (newInf - newRec));
      R[i + 1] = Math.max(0, r + dt * newRec);
      t[i + 1] = +(((i + 1) * dt).toFixed(1));
    }
    return { t, S, I, R };
  }

  function findIntersections(data) {
    const out = [];
    for (let i = 1; i < data.t.length; i++) {
      if ((data.S[i - 1] > data.I[i - 1] && data.S[i] <= data.I[i]) ||
          (data.S[i - 1] < data.I[i - 1] && data.S[i] >= data.I[i])) {
        out.push({ pair: 'S = I', t: data.t[i], value: Math.round((data.S[i] + data.I[i]) / 2) });
      }
      if ((data.I[i - 1] > data.R[i - 1] && data.I[i] <= data.R[i]) ||
          (data.I[i - 1] < data.R[i - 1] && data.I[i] >= data.R[i])) {
        out.push({ pair: 'I = R', t: data.t[i], value: Math.round((data.I[i] + data.R[i]) / 2) });
      }
    }
    return out;
  }

  // ========================
  // 6. RENDER + VEREDICTO
  // ========================
  function renderAll(data, params) {
    chart.data.labels = data.t.map(v => v.toFixed(1));
    chart.data.datasets[0].data = data.S;
    chart.data.datasets[1].data = data.I;
    chart.data.datasets[2].data = data.R;
    chart.data.datasets = chart.data.datasets.filter(ds => ['S', 'I', 'R'].includes(ds.label));

    const inter = findIntersections(data);
    intersectList.innerHTML = '';
    if (inter.length === 0) {
      intersectList.innerHTML = '<li>No se detectaron intersecciones en el rango.</li>';
    } else {
      inter.forEach(it => {
        const li = document.createElement('li');
        li.textContent = `${it.pair} — t = ${it.t.toFixed(1)} días — ≈ ${it.value} individuos`;
        intersectList.appendChild(li);
      });
      chart.data.datasets.push({
        label: 'Intersección',
        data: inter.map(it => ({ x: it.t, y: it.value })),
        type: 'scatter',
        pointRadius: 5,
        pointBackgroundColor: '#111',
        pointBorderColor: '#fff',
        order: 99
      });
    }

    chart.update();

    const peak = Math.max(...data.I);
    const peakIdx = data.I.indexOf(peak);
    const finalR = data.R[data.R.length - 1];
    const R0 = params.gamma > 0 ? (params.beta / params.gamma) : Infinity;
    R0Value.textContent = isFinite(R0) ? R0.toFixed(2) : '—';
    peakI.textContent = `${Math.round(peak)} (t=${data.t[peakIdx].toFixed(1)}d)`;
    finalI.textContent = `${((finalR / params.N) * 100).toFixed(2)}%`;

    let verdictHTML = '';
    if (R0 < 1) {
      verdictHTML += `<div style="background:#d1fae5;color:#065f46;padding:10px;border-radius:8px;font-weight:700">✅ Brote controlado — R₀ = ${R0.toFixed(2)}</div>`;
      verdictHTML += `<p style="margin-top:8px;color:var(--muted)">Cada infectado contagia a menos de una persona. La epidemia tiende a desaparecer. Mantener vigilancia sanitaria.</p>`;
    } else if (R0 >= 1 && R0 < 2) {
      verdictHTML += `<div style="background:#fef9c3;color:#92400e;padding:10px;border-radius:8px;font-weight:700">⚠️ Propagación moderada — R₀ = ${R0.toFixed(2)}</div>`;
      verdictHTML += `<p style="margin-top:8px;color:var(--muted)">Cada infectado contagia a unas ${R0.toFixed(2)} personas. La epidemia se mantiene activa. Reforzar medidas preventivas.</p>`;
    } else {
      verdictHTML += `<div style="background:#fee2e2;color:#991b1b;padding:10px;border-radius:8px;font-weight:700">🚨 Alta propagación — R₀ = ${R0.toFixed(2)}</div>`;
      verdictHTML += `<p style="margin-top:8px;color:var(--muted)">Alta transmisión. Se espera un pico significativo. Implementar medidas urgentes de contención y vacunación.</p>`;
    }

    verdictHTML += `<hr style="margin:10px 0;border:none;border-top:1px solid #ddd">`;
    verdictHTML += `<p style="font-size:0.9rem;color:var(--muted)"><strong>Indicadores:</strong></p>
    <ul style="margin-left:18px;color:var(--muted);font-size:0.9rem">
      <li><strong>Pico de Infectados:</strong> momento de máxima presión sanitaria.</li>
      <li><strong>% Recuperados finales:</strong> proporción de la población que habrá superado la infección.</li>
    </ul>`;
    veredictBox.innerHTML = verdictHTML;
  }

  // ========================
  // 7. EVENTOS PRINCIPALES
  // ========================
  btnSimulate.addEventListener('click', () => {
    const params = {
      beta: parseFloat(beta.value),
      gamma: parseFloat(gamma.value),
      N: parseInt(N.value, 10),
      I0: parseInt(I0.value, 10),
      days: parseInt(days.value, 10)
    };
    const data = simulate(params);
    renderAll(data, params);
  });

  btnReset.addEventListener('click', () => {
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => ds.data = []);
    chart.update();
    intersectList.innerHTML = '';
    R0Value.textContent = '-';
    peakI.textContent = '-';
    finalI.textContent = '-';
    veredictBox.innerHTML = '—';
  });

  // ========================
  // 8. VIDEO LOCAL
  // ========================
  fileVideo.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    localVideo.src = url;
    localVideo.play().catch(()=>{});
  });

// ========================
  // 9. MODAL INFOGRAFÍA CON ZOOM
  // ========================
  if (btnShowInfografia && infografiaModal && closeInfografia) {
    const modalImg = infografiaModal.querySelector('img');
    let scale = 1;
    
    btnShowInfografia.addEventListener('click', () => {
      infografiaModal.style.display = 'flex';
      scale = 1;
      if (modalImg) {
        modalImg.style.transform = 'scale(1)';
      }
    });
    
    closeInfografia.addEventListener('click', (e) => {
      e.stopPropagation();
      infografiaModal.style.display = 'none';
    });
    
    // Cerrar al hacer clic en el fondo
    infografiaModal.addEventListener('click', (e) => {
      if (e.target === infografiaModal) {
        infografiaModal.style.display = 'none';
      }
    });
    
    if (modalImg) {
      // Prevenir cierre al interactuar con imagen
      modalImg.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // Zoom con rueda del mouse
      modalImg.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const rect = modalImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const delta = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(Math.max(1, scale * delta), 5);
        
        if (newScale !== scale) {
          scale = newScale;
          modalImg.style.transformOrigin = `${x}px ${y}px`;
          modalImg.style.transform = `scale(${scale})`;
          modalImg.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in';
        }
      }, { passive: false });
      
      // Doble clic para alternar zoom
      modalImg.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (scale > 1) {
          scale = 1;
          modalImg.style.transform = 'scale(1)';
          modalImg.style.cursor = 'zoom-in';
        } else {
          scale = 2;
          const rect = modalImg.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          modalImg.style.transformOrigin = `${x}px ${y}px`;
          modalImg.style.transform = 'scale(2)';
          modalImg.style.cursor = 'zoom-out';
        }
      });
    }
  }

  // ========================
  // 10. EXPORTAR A EXCEL
  // ========================
  btnExportXLSX.addEventListener('click', () => {
    if (!chart.data.labels || chart.data.labels.length === 0) {
      alert('Primero ejecuta la simulación para exportar datos.');
      return;
    }
    const labels = chart.data.labels;
    const S = chart.data.datasets[0].data;
    const I = chart.data.datasets[1].data;
    const R = chart.data.datasets[2].data;

    const ws_data = [['t', 'S', 'I', 'R']];
    for (let i = 0; i < labels.length; i++) {
      ws_data.push([labels[i], Math.round(S[i]), Math.round(I[i]), Math.round(R[i])]);
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'SIR');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sir_simulation_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

});
// Desplazamiento suave personalizado
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const destino = document.querySelector(this.getAttribute('href'));
    if (destino) {
      destino.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
// Efecto header moderno al hacer scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if(window.scrollY > 20){
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});
const btnShowInfografia = document.getElementById('btnShowInfografia');
const infografiaModal = document.getElementById('infografiaModal');
const closeInfografia = document.getElementById('closeInfografia');

btnShowInfografia.addEventListener('click', () => {
    infografiaModal.style.display = 'flex';
});

closeInfografia.addEventListener('click', () => {
    infografiaModal.style.display = 'none';
});

infografiaModal.addEventListener('click', (e) => {
    if (e.target === infografiaModal) {
        infografiaModal.style.display = 'none';
    }
});