const AD_LINKS = [
    { id: 1, name: 'Ad Network A', reward: 0.05, url: 'https://example.com/offer1' },
    { id: 2, name: 'Ad Network B', reward: 0.05, url: 'https://example.com/offer2' },
    { id: 3, name: 'Ad Network C', reward: 0.05, url: 'https://example.com/offer3' },
    { id: 4, name: 'Ad Network D', reward: 0.05, url: 'https://example.com/offer4' },
    { id: 5, name: 'Ad Network E', reward: 0.05, url: 'https://example.com/offer5' },
    { id: 6, name: 'Ad Network F', reward: 0.05, url: 'https://example.com/offer6' },
    { id: 7, name: 'Ad Network G', reward: 0.05, url: 'https://example.com/offer7' },
    { id: 8, name: 'Ad Network H', reward: 0.05, url: 'https://example.com/offer8' },
    { id: 9, name: 'Ad Network I', reward: 0.05, url: 'https://example.com/offer9' },
    { id: 10, name: 'Ad Network J', reward: 0.05, url: 'https://example.com/offer10' }
];

const PER_AD_REWARD = 0.05;
const MIN_WITHDRAWAL = 1.0;

let state = {
    balance: 0,
    completedAds: [],
    currentAdIndex: -1,
    isVpnBlocked: false
};

function detectVPN() {
    return new Promise((resolve) => {
        const ips = new Set();
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate || !ice.candidate.candidate) {
                resolve(ips.size > 1);
                return;
            }
            const match = ice.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
            if (match) ips.add(match[0]);
            if (ips.size > 1) {
                pc.close();
                resolve(true);
            }
        };
        setTimeout(() => {
            pc.close();
            resolve(ips.size > 1);
        }, 4000);
    });
}

function blockVPN() {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0f0f1a;color:#fff;text-align:center;padding:20px">
            <div style="font-size:64px;margin-bottom:20px">🚫</div>
            <h1 style="font-size:24px;margin-bottom:12px">VPN Detected!</h1>
            <p style="color:#ff4444;font-size:16px">Please turn off your VPN to access this site.</p>
            <p style="color:#666;font-size:13px;margin-top:8px">VPN ব্যবহার করা যাবে না। অনুগ্রহ করে VPN বন্ধ করুন।</p>
        </div>
    `;
}

function getRefCode() {
    let ref = localStorage.getItem('refCode');
    if (!ref) {
        ref = 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
        localStorage.setItem('refCode', ref);
    }
    return ref;
}

function loadState() {
    const saved = localStorage.getItem('earnProState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.balance = parsed.balance || 0;
            state.completedAds = parsed.completedAds || [];
        } catch {}
    }
}

function saveState() {
    localStorage.setItem('earnProState', JSON.stringify({
        balance: state.balance,
        completedAds: state.completedAds
    }));
}

function resetDailyAds() {
    const lastDate = localStorage.getItem('lastAdDate');
    const today = new Date().toDateString();
    if (lastDate !== today) {
        state.completedAds = [];
        localStorage.setItem('lastAdDate', today);
        saveState();
    }
}

function renderAds() {
    const container = document.getElementById('adsContainer');
    const counter = document.getElementById('adCounter');
    if (!container) return;

    counter.textContent = `${state.completedAds.length}/${AD_LINKS.length}`;

    container.innerHTML = '';
    AD_LINKS.forEach((ad, index) => {
        const completed = state.completedAds.includes(ad.id);
        const div = document.createElement('div');
        div.className = `ad-item ${completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="ad-info">
                <h4>${ad.name}</h4>
                <p>${completed ? 'Completed ✓' : 'Click to watch & earn'}</p>
            </div>
            <span class="ad-reward">+$${ad.reward.toFixed(2)}</span>
            <button class="btn btn-sm" data-index="${index}" ${completed ? 'disabled' : ''}>
                ${completed ? 'Done' : 'Start'}
            </button>
        `;
        container.appendChild(div);
    });

    container.querySelectorAll('.btn-sm').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            startAd(index);
        });
    });

    updateUI();
}

function startAd(index) {
    state.currentAdIndex = index;
    const ad = AD_LINKS[index];
    const modal = document.getElementById('adModal');
    const timerEl = document.getElementById('adTimer');
    const statusEl = document.getElementById('adStatus');
    const visitBtn = document.getElementById('adVisitBtn');
    const contentEl = document.getElementById('adContent');

    modal.classList.add('active');
    timerEl.textContent = '5';
    statusEl.textContent = 'Loading ad...';
    visitBtn.style.display = 'none';

    contentEl.innerHTML = `
        <div style="padding: 20px; background: #1a1a3e; border-radius: 8px;">
            <h4 style="color: #00d4ff; margin-bottom: 8px;">${ad.name}</h4>
            <p style="color: #888; font-size: 12px;">Sponsored Advertisement</p>
            <div style="margin-top: 12px; padding: 20px; background: #0f0f1a; border-radius: 8px;">
                <p style="color: #555;">Ad content loading...</p>
            </div>
        </div>
    `;

    let countdown = 5;
    statusEl.textContent = `Watch ad for ${countdown} seconds...`;

    const timer = setInterval(() => {
        countdown--;
        timerEl.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(timer);
            timerEl.textContent = '✓';
            statusEl.textContent = 'Ad completed! You can now visit the link.';
            visitBtn.style.display = 'block';
        }
    }, 1000);

    visitBtn.onclick = () => {
        completeAd(ad);
        modal.classList.remove('active');
        clearInterval(timer);
        window.open(ad.url, '_blank');
    };
}

function completeAd(ad) {
    if (state.completedAds.includes(ad.id)) return;
    state.completedAds.push(ad.id);
    state.balance += ad.reward;
    saveState();
    renderAds();
    updateUI();

    if (state.completedAds.length === AD_LINKS.length) {
        setTimeout(showCongrats, 500);
    }
}

function showCongrats() {
    const modal = document.getElementById('congratsModal');
    const amount = document.getElementById('congratsAmount');
    amount.textContent = `$${(AD_LINKS.length * PER_AD_REWARD).toFixed(2)}`;
    modal.classList.add('active');

    document.getElementById('closeCongrats').onclick = () => {
        modal.classList.remove('active');
    };
}

function updateUI() {
    const bal = document.getElementById('balanceDisplay');
    if (bal) bal.textContent = `$${state.balance.toFixed(2)}`;

    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.disabled = state.balance < MIN_WITHDRAWAL;
    }
}

async function initVPNCheck() {
    const vpn = await detectVPN();
    state.isVpnBlocked = vpn;
    if (vpn) {
        blockVPN();
        return true;
    }
    return false;
}

function setupRefLink() {
    const refInput = document.getElementById('refLink');
    if (refInput) {
        const url = `${window.location.origin}${window.location.pathname}?ref=${getRefCode()}`;
        refInput.value = url;
    }

    document.getElementById('copyRefBtn')?.addEventListener('click', () => {
        refInput.select();
        navigator.clipboard.writeText(refInput.value);
    });
}

function setupModals() {
    document.getElementById('closeAdModal')?.addEventListener('click', () => {
        document.getElementById('adModal').classList.remove('active');
    });

    document.getElementById('closeWithdrawModal')?.addEventListener('click', () => {
        document.getElementById('withdrawModal').classList.remove('active');
    });

    document.getElementById('withdrawBtn')?.addEventListener('click', () => {
        document.getElementById('withdrawModal').classList.add('active');
    });

    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const label = document.getElementById('addressLabel');
            if (e.target.value === 'usdt') {
                label.textContent = 'USDT Address (BEP20)';
            } else {
                label.textContent = 'Litecoin Address';
            }
        });
    });

    document.getElementById('submitWithdraw')?.addEventListener('click', handleWithdraw);

    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal.active').forEach(modal => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}

function handleWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value) || 0;
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const address = document.getElementById('walletAddress').value.trim();
    const msgEl = document.getElementById('withdrawMsg');

    if (amount < MIN_WITHDRAWAL) {
        msgEl.className = 'msg error';
        msgEl.textContent = `Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`;
        return;
    }

    if (amount > state.balance) {
        msgEl.className = 'msg error';
        msgEl.textContent = 'Insufficient balance';
        return;
    }

    if (!address) {
        msgEl.className = 'msg error';
        msgEl.textContent = 'Please enter your wallet address';
        return;
    }

    const currency = payment === 'usdt' ? 'USDT (BEP20)' : 'Litecoin';

    state.balance -= amount;
    saveState();
    updateUI();

    msgEl.className = 'msg success';
    msgEl.textContent = `Withdrawal request submitted!\n$${amount.toFixed(2)} → ${currency}\nAddress: ${address.substr(0, 8)}...`;

    setTimeout(() => {
        document.getElementById('withdrawModal').classList.remove('active');
        msgEl.textContent = '';
    }, 3000);
}

(async () => {
    const vpnBlocked = await initVPNCheck();
    if (!vpnBlocked) {
        loadState();
        resetDailyAds();
        renderAds();
        setupRefLink();
        setupModals();
    }
})();
