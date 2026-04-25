const OWNER_ADDRESS = "2yGjdYrjVRbfK232A1GmNLDB8sLJ93gsTLMeEHjVYPQm";
const PLATFORM_FEE_PERCENT = 1.0; // 1%

const tradeAmountInput = document.getElementById('tradeAmount');
const platformFeeEl = document.getElementById('platformFee');
const totalAmountEl = document.getElementById('totalAmount');
const activityRows = document.getElementById('activityRows');
const chartArea = document.getElementById('chartArea');

// --- Calculations ---

tradeAmountInput.addEventListener('input', (e) => {
    const amount = parseFloat(e.target.value);
    if (isNaN(amount) || amount <= 0) {
        platformFeeEl.innerText = "0.00 SOL";
        totalAmountEl.innerText = "0.00 SOL";
        return;
    }

    const fee = (amount * PLATFORM_FEE_PERCENT) / 100;
    const total = amount + fee;

    platformFeeEl.innerText = `${fee.toFixed(4)} SOL`;
    totalAmountEl.innerText = `${total.toFixed(4)} SOL`;
});

// --- Mock Activity Feed ---

const ADDRS = ["7xAz", "9u1p", "2hJk", "8Lmn", "5pQr", "1vWx", "3yZz"];

function addActivityRow() {
    const isBuy = Math.random() > 0.3;
    const addr = ADDRS[Math.floor(Math.random() * ADDRS.length)] + "..." + Math.floor(Math.random() * 9999);
    const amount = (Math.random() * 2).toFixed(2);
    const time = "just now";

    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `
        <span class="row-addr">${addr}</span>
        <span class="${isBuy ? 'row-buy' : 'row-sell'}">${isBuy ? 'Buy' : 'Sell'}</span>
        <span>${amount} SOL</span>
        <span style="color: var(--text-dim)">${time}</span>
    `;

    activityRows.prepend(row);
    if (activityRows.children.length > 10) activityRows.lastChild.remove();
}

// Initial rows
for (let i = 0; i < 5; i++) addActivityRow();
setInterval(addActivityRow, 4000);

// --- Real Chart Initialization ---
let chart, candleSeries;

function initChart() {
    if (typeof LightweightCharts === 'undefined') {
        alert("CRITICAL ERROR: TradingView library failed to load! Check your internet connection.");
        document.getElementById('chartArea').innerHTML = "<div style='color:red; padding:20px;'>Error: Chart Library not loaded!</div>";
        return;
    }

    const chartContainer = document.getElementById('chartArea');
    if (!chartContainer) return;

    // Force a height if it's missing
    chartContainer.style.height = "500px";
    chartContainer.style.backgroundColor = "#020617"; // Solid dark background

    chart = LightweightCharts.createChart(chartContainer, {
        layout: { background: { color: 'transparent' }, textColor: '#94a3b8' },
        grid: {
            vertLines: { color: 'rgba(30, 41, 59, 0.1)' },
            horzLines: { color: 'rgba(30, 41, 59, 0.1)' },
        },
        rightPriceScale: { borderColor: '#1e293b' },
        timeScale: { borderColor: '#1e293b', timeVisible: true },
        width: chartContainer.clientWidth || 800,
        height: 500,
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#00ffbd', downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#00ffbd', wickDownColor: '#ef4444',
        priceFormat: { type: 'price', precision: 8, minMove: 0.00000001 },
    });

    const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !chart) return;
        const { width } = entries[0].contentRect;
        chart.applyOptions({ width, height: 500 });
    });
    resizeObserver.observe(chartContainer);
}

async function fetchRealCandles(mint) {
    try {
        console.log(`Requesting candles for: ${mint}`);
        const response = await fetch(`https://frontend-api.pump.fun/candlesticks/${mint}?offset=0&limit=1000&timeframe=1`);
        const candles = await response.json();
        
        if (candles && Array.isArray(candles) && candles.length > 0) {
            const formattedData = candles.map(c => ({
                time: c.timestamp, 
                open: parseFloat(c.open),
                high: parseFloat(c.high),
                low: parseFloat(c.low),
                close: parseFloat(c.close)
            })).sort((a, b) => a.time - b.time);
            
            candleSeries.setData(formattedData);
            chart.timeScale().fitContent();
        } else {
            throw new Error("No data");
        }
    } catch (err) {
        console.warn("API Error, using fallback candles.");
        generateMockCandles();
    }
}

function generateMockCandles() {
    const data = [];
    let basePrice = 0.000042;
    let currentTime = Math.floor(Date.now() / 1000) - 150 * 60;
    for (let i = 0; i < 150; i++) {
        const o = basePrice;
        const c = basePrice + (Math.random() - 0.48) * 0.000008;
        data.push({ time: currentTime, open: o, high: Math.max(o, c) + 0.000002, low: Math.min(o, c) - 0.000002, close: c });
        basePrice = c;
        currentTime += 60;
    }
    candleSeries.setData(data);
    chart.timeScale().fitContent();
}

async function fetchCoinDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const mint = urlParams.get('mint');

    if (!mint) {
        console.log("No mint address found in URL, showing simulation.");
        generateMockCandles();
        return;
    }

    const titleEl = document.getElementById('coinTitle');
    const addrEl = document.getElementById('coinAddr');
    const imgEl = document.getElementById('coinImg');
    const descEl = document.getElementById('coinDescriptionText');

    // Show immediate feedback
    titleEl.innerText = `Token [${mint.slice(0, 4)}...]`;
    addrEl.innerText = `${mint.slice(0, 8)}...`;

    try {
        console.log(`Fetching details for mint: ${mint}...`);
        const response = await fetch(`https://frontend-api.pump.fun/coins/${mint}`);
        
        if (!response.ok) throw new Error("API Blocked or Token not found");
        
        const coin = await response.json();

        // Update UI with REAL data
        titleEl.innerHTML = `${coin.name} <span class="symbol">[${coin.symbol}]</span>`;
        imgEl.src = coin.image_uri;
        addrEl.innerText = `${coin.mint.slice(0, 8)}...`;
        if (descEl) descEl.innerText = coin.description || "No description provided.";
        
        fetchRealCandles(mint);
    } catch (err) {
        console.warn("API Error (CORS). Showing simulated data.");
        // We already set the title and addr above as immediate feedback
        if (descEl) descEl.innerText = "Real-time metadata is currently restricted in local preview. Connect to a server to see full coin details.";
        generateMockCandles();
    }
}

// Start everything with a slight delay to ensure layout is ready
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initChart();
        fetchCoinDetails();
    }, 400); 
});

// --- Tab Switching ---

document.getElementById('buyTab').addEventListener('click', () => {
    document.getElementById('buyTab').classList.add('active');
    document.getElementById('sellTab').classList.remove('active');
});

document.getElementById('sellTab').addEventListener('click', () => {
    document.getElementById('sellTab').classList.add('active');
    document.getElementById('buyTab').classList.remove('active');
});
