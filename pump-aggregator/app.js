// --- Configuration ---
const OWNER_ADDRESS = "2yGjdYrjVRbfK232A1GmNLDB8sLJ93gsTLMeEHjVYPQm";
const PLATFORM_FEE_PERCENT = 1.0; // 1% Fee
const MOCK_COINS = [
    {
        name: "ELON DUCK",
        symbol: "DUCK",
        mcap: "$12,450",
        progress: 45,
        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Duck1",
        desc: "The first duck on Mars. Quack quack to the moon! 🚀"
    },
    {
        name: "SOLANA CAT",
        symbol: "SCAT",
        mcap: "$8,200",
        progress: 22,
        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Cat2",
        desc: "Meow! Fastest cat in the crypto space. Solana native."
    },
    {
        name: "PUMP IT",
        symbol: "PUMP",
        mcap: "$45,900",
        progress: 78,
        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pump3",
        desc: "Just pump it. No logic, just vibes and green candles."
    },
    {
        name: "Meme AI",
        symbol: "MAI",
        mcap: "$2,100",
        progress: 5,
        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=AI4",
        desc: "Artificial Intelligence meets Dank Memes. Truly revolutionary."
    },
    {
        name: "DOGE 2.0",
        symbol: "DOGE2",
        mcap: "$105,000",
        progress: 100,
        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Doge5",
        desc: "The legend returns. Graduating to Raydium soon!"
    },
    {
        name: "FROG SOL",
        symbol: "FROG",
        mcap: "$3,400",
        progress: 12,
        img: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Frog6",
        desc: "Ribbit! Jumping through the bonding curve at light speed."
    }
];

const coinGrid = document.getElementById('coinGrid');

// --- Real Pump.fun API Integration ---

async function fetchRealCoins() {
    try {
        console.log("Fetching live tokens from Pump.fun...");
        // Fetching the most active coins
        const response = await fetch('https://frontend-api.pump.fun/coins?offset=0&limit=30&sort=last_reply&order=DESC&includeNsfw=false');
        const coins = await response.json();
        
        if (coins && coins.length > 0) {
            // Update King of the Hill (The first coin in the list is usually very active)
            updateKOTH(coins[0]);
            // Render the rest in the grid
            renderRealCoins(coins.slice(1));
        }
    } catch (err) {
        console.warn("API blocked or down, using fallback display.");
        renderRealCoins(MOCK_COINS);
    }
}

function updateKOTH(coin) {
    const kothCard = document.querySelector('.koth-card');
    if (!kothCard) return;

    const mcap = coin.market_cap ? `$${Math.floor(coin.market_cap * 0.00013 * 150).toLocaleString()}` : "$24,500";
    const progress = coin.v_buy_reserves_percentage || 0;

    kothCard.querySelector('h2').innerText = `${coin.name} [${coin.symbol}]`;
    kothCard.querySelector('.koth-img').src = coin.image_uri;
    kothCard.querySelector('.addr').innerText = `${coin.mint.slice(0, 6)}...${coin.mint.slice(-4)}`;
    kothCard.querySelector('.stat:nth-child(1) .value').innerText = mcap;
    kothCard.querySelector('.percent').innerText = `${Math.floor(progress)}%`;
    kothCard.querySelector('.progress-fill').style.width = `${progress}%`;
    
    kothCard.querySelector('.btn-buy-koth').onclick = () => window.location.href = `coin.html?mint=${coin.mint}`;
}

function renderRealCoins(coins) {
    coinGrid.innerHTML = '';
    coins.forEach(coin => {
        const card = document.createElement('div');
        card.className = 'coin-card';
        card.onclick = () => window.location.href = `coin.html?mint=${coin.mint}`;
        
        const mcap = coin.market_cap ? `$${Math.floor(coin.market_cap * 0.00013 * 150).toLocaleString()}` : "$0";
        const progress = coin.v_buy_reserves_percentage || 0;

        card.innerHTML = `
            <div class="coin-card-header">
                <img src="${coin.image_uri}" alt="${coin.name}" class="coin-card-img" onerror="this.src='https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback'">
                <div class="coin-card-title">
                    <h3>${coin.name} [${coin.symbol}]</h3>
                    <span class="coin-mcap">MCap: ${mcap}</span>
                </div>
            </div>
            <p class="coin-desc">${coin.description || "Live token from Pump.fun"}</p>
            <div class="progress-container" style="width: 100%;">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${Math.floor(progress)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%;"></div>
                </div>
            </div>
        `;
        coinGrid.appendChild(card);
    });
}

// Simulate new coins being added
function simulateLiveFeed() {
    setInterval(() => {
        // Randomly update progress of a coin
        const randomIndex = Math.floor(Math.random() * MOCK_COINS.length);
        if (MOCK_COINS[randomIndex].progress < 100) {
            MOCK_COINS[randomIndex].progress += Math.floor(Math.random() * 5);
            if (MOCK_COINS[randomIndex].progress > 100) MOCK_COINS[randomIndex].progress = 100;
            renderCoins();
        }
    }, 3000);
}

// Initial render
fetchRealCoins();

// Refresh real coins every 5 seconds
setInterval(fetchRealCoins, 5000);

// --- Sniper / Burner Wallet Logic ---

const sniperModal = document.getElementById('sniperModal');
const openSniperBtn = document.getElementById('openSniper');
const closeSniperBtn = document.getElementById('closeSniper');
const generateBurnerBtn = document.getElementById('generateBurner');
const burnerAddressEl = document.getElementById('burnerAddress');
const walletStatusEl = document.getElementById('walletStatus');

openSniperBtn.addEventListener('click', () => sniperModal.style.display = 'flex');

// Close when clicking the X icon
closeSniperBtn.addEventListener('click', () => {
    sniperModal.style.display = 'none';
});

// Close when clicking outside the modal content (the background)
window.addEventListener('click', (event) => {
    if (event.target === sniperModal) {
        sniperModal.style.display = 'none';
    }
});

function generateBurnerWallet() {
    // In a real app, we'd use: const keypair = solanaWeb3.Keypair.generate();
    // For this demo, we simulate a Solana address
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let mockAddr = "";
    for (let i = 0; i < 44; i++) mockAddr += chars.charAt(Math.floor(Math.random() * chars.length));
    
    const mockPrivKey = "5J..." + Math.random().toString(36).substring(7);

    // Save to LocalStorage
    const burner = {
        address: mockAddr,
        privateKey: mockPrivKey,
        autoSign: true
    };
    localStorage.setItem('burnerWallet', JSON.stringify(burner));

    updateBurnerUI(burner);
    alert("New Burner Wallet Generated! Copy your Private Key if needed.");
}

function updateBurnerUI(burner) {
    if (burner) {
        burnerAddressEl.innerText = burner.address;
        walletStatusEl.innerText = "ACTIVE";
        walletStatusEl.className = "status-active";
        document.getElementById('autoSignToggle').checked = burner.autoSign;
        document.getElementById('depositArea').style.display = 'block';
        document.getElementById('viewPrivKeyBtn').style.display = 'block';
    }
}

// --- View Private Key Logic ---
let keyTimerInterval = null;

document.getElementById('viewPrivKeyBtn').addEventListener('click', () => {
    const savedBurner = JSON.parse(localStorage.getItem('burnerWallet'));
    if (!savedBurner) return;

    const area = document.getElementById('privKeyArea');
    const keyDisplay = document.getElementById('actualPrivKey');
    const timerEl = document.getElementById('keyTimer');
    
    area.style.display = 'block';
    keyDisplay.innerText = savedBurner.privateKey;
    
    let timeLeft = 30 * 60; // 30 minutes in seconds
    
    if (keyTimerInterval) clearInterval(keyTimerInterval);
    
    keyTimerInterval = setInterval(() => {
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.innerText = `${mins}m ${secs}s`;
        
        if (timeLeft <= 0) {
            clearInterval(keyTimerInterval);
            area.style.display = 'none';
            keyDisplay.innerText = "••••••••••••••••";
        }
    }, 1000);
});

// Copy Private Key
document.getElementById('copyPrivKey').addEventListener('click', () => {
    const key = document.getElementById('actualPrivKey').innerText;
    if (key.includes('•')) return;
    navigator.clipboard.writeText(key);
    alert("Private Key copied to clipboard! Keep it safe.");
});

async function refreshBalance() {
    const burnerAddr = burnerAddressEl.innerText;
    if (burnerAddr === "None") return;

    try {
        console.log(`Refreshing balance for ${burnerAddr}...`);
        
        // In a real app with solana-web3.js:
        // const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");
        // const balance = await connection.getBalance(new solanaWeb3.PublicKey(burnerAddr));
        // burnerBalanceEl.innerText = `${(balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(3)} SOL`;
        
        // For the demo, we simulate the balance update
        // (In reality, this would fetch from the blockchain)
    } catch (err) {
        console.error("Failed to fetch balance:", err);
    }
}

async function depositToBurner() {
    const amount = document.getElementById('depositAmount').value;
    if (!amount || amount <= 0) return alert("Enter a valid SOL amount");
    if (!walletAddress) return alert("Please connect your main wallet (Phantom) first!");

    const burnerAddr = burnerAddressEl.innerText;
    
    alert(`Transferring ${amount} SOL from ${walletAddress} to your Burner Wallet...\nConfirm in Phantom.`);

    try {
        // Simulating success
        setTimeout(() => {
            alert("Deposit Successful! Your Burner Wallet is now funded.");
            const currentBalance = parseFloat(document.getElementById('burnerBalance').innerText) || 0;
            const newBalance = currentBalance + parseFloat(amount);
            document.getElementById('burnerBalance').innerText = `${newBalance.toFixed(3)} SOL`;
            
            // Show a nice green glow on the balance
            document.getElementById('burnerBalance').style.color = "var(--accent-green)";
        }, 2000);

    } catch (err) {
        console.error("Deposit failed:", err);
    }
}

// Refresh balance every 15 seconds
setInterval(refreshBalance, 15000);

// Toggle Import Area
document.getElementById('toggleImport').addEventListener('click', () => {
    const area = document.getElementById('importArea');
    area.style.display = area.style.display === 'none' ? 'block' : 'none';
});

// Confirm Import
document.getElementById('confirmImport').addEventListener('click', () => {
    const privKey = document.getElementById('importPrivKey').value;
    if (!privKey || privKey.length < 32) return alert("Please enter a valid Private Key");

    // Simulate address derivation:
    const mockAddr = "Restored..." + Math.random().toString(36).substring(7);

    const burner = {
        address: mockAddr,
        privateKey: privKey,
        autoSign: true
    };
    localStorage.setItem('burnerWallet', JSON.stringify(burner));
    updateBurnerUI(burner);
    
    alert("Wallet Restored Successfully!");
    document.getElementById('importArea').style.display = 'none';
});

generateBurnerBtn.addEventListener('click', generateBurnerWallet);
document.getElementById('confirmDeposit').addEventListener('click', depositToBurner);

// Load burner on startup
window.addEventListener('load', () => {
    const savedBurner = localStorage.getItem('burnerWallet');
    if (savedBurner) {
        updateBurnerUI(JSON.parse(savedBurner));
    }
});

// --- Solana Wallet Connection ---

let walletAddress = null;

async function connectWallet() {
    // Check if Phantom is installed
    const isPhantomInstalled = window.solana && window.solana.isPhantom;

    if (!isPhantomInstalled) {
        alert("Phantom wallet is not installed. Please install it from phantom.app");
        window.open("https://phantom.app/", "_blank");
        return;
    }

    try {
        // Connect to Phantom
        const response = await window.solana.connect();
        walletAddress = response.publicKey.toString();
        const publicKey = new ethers.BrowserProvider(window.solana).getSigner(); // Placeholder logic
        
        // --- Fetch REAL Balance from Solana Blockchain ---
        try {
            const rpcUrl = "https://api.mainnet-beta.solana.com";
            const requestBody = {
                jsonrpc: "2.0",
                id: 1,
                method: "getBalance",
                params: [walletAddress]
            };

            const rpcResponse = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const rpcData = await rpcResponse.json();
            const lamports = rpcData.result.value;
            const solBalance = (lamports / 1000000000).toFixed(2);
            
            document.getElementById('mainWalletBalance').innerText = `${solBalance} SOL`;
        } catch (err) {
            console.error("Failed to fetch real balance:", err);
            document.getElementById('mainWalletBalance').innerText = "0.00 SOL";
        }
        
        // Update UI
        const connectBtn = document.getElementById('connectWallet');
        const infoPill = document.getElementById('walletInfoPill');
        const addrEl = document.getElementById('mainWalletAddr');
        
        connectBtn.style.display = 'none';
        infoPill.style.display = 'flex';
        addrEl.innerText = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        
    } catch (err) {
        console.error("Wallet connection failed:", err);
    }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);

// Check if already connected on load
window.addEventListener('load', async () => {
    if (window.solana && window.solana.isPhantom) {
        try {
            const response = await window.solana.connect({ onlyIfTrusted: true });
            walletAddress = response.publicKey.toString();
            const btn = document.getElementById('connectWallet');
            btn.innerText = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        } catch (err) {
            // User has not authenticated with this site yet
        }
    }
});
