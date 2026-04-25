const OWNER_ADDRESS = "2yGjdYrjVRbfK232A1GmNLDB8sLJ93gsTLMeEHjVYPQm";
const PLATFORM_FEE_PERCENT = 1.0; // 1%
const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"; // Pump.fun Program

// ============================================================
// ⚡ TRADING ENGINE - The Heart of SolSniper
// ============================================================

async function executeTrade(isBuy) {
    const amountInput = document.getElementById('tradeAmount');
    const amount = parseFloat(amountInput.value);
    const tradeBtn = document.querySelector('.btn-execute-trade');

    if (isNaN(amount) || amount <= 0) {
        alert("⚠️ Enter a valid SOL amount!");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const mint = urlParams.get('mint');
    if (!mint) {
        alert("⚠️ No token selected!");
        return;
    }

    const feeSol = amount * (PLATFORM_FEE_PERCENT / 100);
    const totalSol = amount + feeSol;

    tradeBtn.innerText = "⏳ Processing...";
    tradeBtn.disabled = true;

    // Check if Burner Wallet is available (Auto-Sign mode)
    const savedBurner = JSON.parse(localStorage.getItem('burnerWallet'));
    const autoSign = savedBurner && savedBurner.autoSign;

    try {
        const connection = new solanaWeb3.Connection(SOLANA_RPC, 'confirmed');

        if (autoSign && savedBurner) {
            // ⚡ AUTO-SIGN MODE (Burner Wallet)
            await executeWithBurner(connection, savedBurner, mint, amount, feeSol, isBuy);
        } else if (window.solana && window.solana.isPhantom) {
            // 🦋 PHANTOM MODE (Manual sign)
            await executeWithPhantom(connection, mint, amount, feeSol, isBuy);
        } else {
            alert("⚠️ No wallet found! Connect Phantom or generate a Burner Wallet first.");
        }
    } catch (err) {
        console.error("Trade failed:", err);
        alert(`❌ Trade failed: ${err.message}`);
    } finally {
        tradeBtn.innerText = isBuy ? "⚡ Buy Now" : "💰 Sell Now";
        tradeBtn.disabled = false;
    }
}

// ============================================================
// 🚀 PUMPPORTAL INTEGRATION - Real Buy/Sell on Pump.fun
// ============================================================

async function buildPumpPortalTx(publicKey, mint, amount, isBuy) {
    const action = isBuy ? "buy" : "sell";
    
    const response = await fetch("https://pumpportal.fun/api/trade-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            publicKey: publicKey,
            action: action,
            mint: mint,
            amount: amount,
            denominatedInSol: "true",
            slippage: 10,
            priorityFee: 0.0005,
            pool: "pump"
        })
    });

    if (!response.ok) throw new Error(`PumpPortal Error: ${response.status}`);
    
    const data = await response.arrayBuffer();
    return new Uint8Array(data);
}

// ⚡ Burner Wallet Auto-Sign (REAL with PumpPortal)
async function executeWithBurner(connection, burner, mint, amount, feeSol, isBuy) {
    if (!burner.secretKeyArray) {
        alert("❌ Old wallet format. Please generate a new Burner Wallet.");
        return;
    }

    // Reconstruct keypair
    const secretKey = new Uint8Array(burner.secretKeyArray);
    const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
    const burnerPubKey = keypair.publicKey;

    // Check balance
    const balance = await connection.getBalance(burnerPubKey);
    const balanceSol = balance / solanaWeb3.LAMPORTS_PER_SOL;
    const totalNeeded = amount + feeSol + 0.005;

    if (balanceSol < totalNeeded) {
        alert(`❌ Insufficient Balance!\n\nBalance: ${balanceSol.toFixed(4)} SOL\nNeeded: ${totalNeeded.toFixed(4)} SOL\n\nPlease deposit more SOL into your Burner Wallet.`);
        return;
    }

    // 1. Get transaction from PumpPortal
    const txBytes = await buildPumpPortalTx(burnerPubKey.toString(), mint, amount, isBuy);
    
    // 2. Deserialize the transaction
    const transaction = solanaWeb3.Transaction.from(txBytes);
    
    // 3. Inject 1% Fee instruction → Owner wallet
    const feeLamports = Math.floor(feeSol * solanaWeb3.LAMPORTS_PER_SOL);
    transaction.add(
        solanaWeb3.SystemProgram.transfer({
            fromPubkey: burnerPubKey,
            toPubkey: new solanaWeb3.PublicKey(OWNER_ADDRESS),
            lamports: feeLamports,
        })
    );

    // 4. Update blockhash and sign
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = burnerPubKey;
    transaction.sign(keypair);

    // 5. Send to network
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
    
    addTradeToActivity(amount, isBuy, true);
    alert(`✅ ${isBuy ? '🟢 BOUGHT' : '🔴 SOLD'} ${amount} SOL\n💰 Fee: ${feeSol.toFixed(4)} SOL → Vault\n\n🔗 TX: https://solscan.io/tx/${signature}`);
}

// 🦋 Phantom Manual Sign (REAL with PumpPortal)
async function executeWithPhantom(connection, mint, amount, feeSol, isBuy) {
    if (!window.solana.publicKey) {
        await window.solana.connect();
    }
    
    const userPubKey = window.solana.publicKey;

    // 1. Get transaction from PumpPortal
    const txBytes = await buildPumpPortalTx(userPubKey.toString(), mint, amount, isBuy);
    
    // 2. Deserialize
    const transaction = solanaWeb3.Transaction.from(txBytes);
    
    // 3. Inject 1% Fee → Owner wallet
    const feeLamports = Math.floor(feeSol * solanaWeb3.LAMPORTS_PER_SOL);
    transaction.add(
        solanaWeb3.SystemProgram.transfer({
            fromPubkey: userPubKey,
            toPubkey: new solanaWeb3.PublicKey(OWNER_ADDRESS),
            lamports: feeLamports,
        })
    );

    // 4. Update blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubKey;

    // 5. Send to Phantom for signing
    const { signature } = await window.solana.signAndSendTransaction(transaction);
    
    addTradeToActivity(amount, isBuy, false);
    alert(`✅ ${isBuy ? '🟢 BOUGHT' : '🔴 SOLD'} ${amount} SOL\n💰 Fee sent to vault ✓\n\n🔗 TX: https://solscan.io/tx/${signature}`);
}

// Adds trade to the live activity feed
function addTradeToActivity(amount, isBuy, isAuto) {
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `
        <span class="row-addr">${isAuto ? '🤖 AutoSnipe' : '👤 You'}...${Math.floor(Math.random()*9999)}</span>
        <span class="${isBuy ? 'row-buy' : 'row-sell'}">${isBuy ? 'Buy' : 'Sell'}</span>
        <span>${amount.toFixed(2)} SOL</span>
        <span style="color: var(--text-dim)">just now</span>
    `;
    document.getElementById('activityRows').prepend(row);
}

function generateMockSignature() {
    return [...Array(64)].map(() => Math.floor(Math.random()*16).toString(16)).join('').slice(0, 44) + '...';
}


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
        height: 350,
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
let currentMode = 'buy';

document.getElementById('buyTab').addEventListener('click', () => {
    currentMode = 'buy';
    document.getElementById('buyTab').classList.add('active');
    document.getElementById('sellTab').classList.remove('active');
    document.getElementById('tradeBtn').innerText = "⚡ Buy Now";
    document.getElementById('tradeBtn').style.background = "linear-gradient(135deg, #00ffbd, #00cc99)";
    document.getElementById('tradeBtn').style.color = "#000";
});

document.getElementById('sellTab').addEventListener('click', () => {
    currentMode = 'sell';
    document.getElementById('sellTab').classList.add('active');
    document.getElementById('buyTab').classList.remove('active');
    document.getElementById('tradeBtn').innerText = "💰 Sell Now";
    document.getElementById('tradeBtn').style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
    document.getElementById('tradeBtn').style.color = "#fff";
});
