const AD_LINKS = [
    { id: 1, name: 'Bonus Ad 1', reward: 0.06, url: 'https://example.com/bonus1', type: 'bonus' },
    { id: 2, name: 'Bonus Ad 2', reward: 0.06, url: 'https://example.com/bonus2', type: 'bonus' },
    { id: 3, name: 'Bonus Ad 3', reward: 0.06, url: 'https://example.com/bonus3', type: 'bonus' },
    { id: 4, name: 'Bonus Ad 4', reward: 0.06, url: 'https://example.com/bonus4', type: 'bonus' },
    { id: 5, name: 'Bonus Ad 5', reward: 0.06, url: 'https://example.com/bonus5', type: 'bonus' },
    { id: 6, name: 'Video Ad 1', reward: 0.03, url: 'https://example.com/video1', type: 'video' },
    { id: 7, name: 'Video Ad 2', reward: 0.03, url: 'https://example.com/video2', type: 'video' },
    { id: 8, name: 'Video Ad 3', reward: 0.03, url: 'https://example.com/video3', type: 'video' },
    { id: 9, name: 'Video Ad 4', reward: 0.03, url: 'https://example.com/video4', type: 'video' },
    { id: 10, name: 'Video Ad 5', reward: 0.03, url: 'https://example.com/video5', type: 'video' },
    { id: 11, name: 'Video Ad 6', reward: 0.03, url: 'https://example.com/video6', type: 'video' },
    { id: 12, name: 'Video Ad 7', reward: 0.03, url: 'https://example.com/video7', type: 'video' },
    { id: 13, name: 'Video Ad 8', reward: 0.03, url: 'https://example.com/video8', type: 'video' },
    { id: 14, name: 'Video Ad 9', reward: 0.03, url: 'https://example.com/video9', type: 'video' },
    { id: 15, name: 'Video Ad 10', reward: 0.03, url: 'https://example.com/video10', type: 'video' }
];

const MIN_WITHDRAWAL = 5.0;
const REF_REWARD = 0.25;
const REF_ACTIVATE_HOURS = 48;

let state = {
    balance: 0,
    completedAds: [],
    currentAdIndex: -1,
    isVpnBlocked: false,
    referrals: [],
    refEarnings: 0,
    activeFilter: 'all'
};

function detectVPN() {
    return new Promise((resolve) => {
        const ips = new Set();
        try {
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
        } catch {
            resolve(false);
        }
    });
}

function blockVPN() {
    document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#1e2b38;color:#c8d6e5;text-align:center;padding:20px">
            <div style="font-size:64px;margin-bottom:20px">🚫</div>
            <h1 style="font-size:24px;margin-bottom:12px">VPN Detected!</h1>
            <p style="color:#e74c3c;font-size:16px">Please turn off your VPN to access this site.</p>
            <p style="color:#7a8a9a;font-size:13px;margin-top:8px">VPN ব্যবহার করা যাবে না। অনুগ্রহ করে VPN বন্ধ করুন।</p>
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
            state.referrals = parsed.referrals || [];
            state.refEarnings = parsed.refEarnings || 0;
        } catch {}
    }
}

function saveState() {
    localStorage.setItem('earnProState', JSON.stringify({
        balance: state.balance,
        completedAds: state.completedAds,
        referrals: state.referrals,
        refEarnings: state.refEarnings
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

function getFilteredAds() {
    if (state.activeFilter === 'all') return AD_LINKS;
    return AD_LINKS.filter(ad => ad.type === state.activeFilter);
}

function isPrevCompleted(ad, filtered) {
    const idx = filtered.indexOf(ad);
    if (idx === 0) return true;
    return state.completedAds.includes(filtered[idx - 1].id);
}

function renderFilters() {
    const container = document.getElementById('filterTabs');
    if (!container) return;
    const filters = [
        { key: 'all', label: 'All' },
        { key: 'bonus', label: 'Bonus Ads' },
        { key: 'video', label: 'Video Ads' }
    ];
    container.innerHTML = filters.map(f =>
        `<button class="filter-btn ${state.activeFilter === f.key ? 'active' : ''}" data-filter="${f.key}">${f.label}</button>`
    ).join('');
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.activeFilter = btn.dataset.filter;
            renderFilters();
            renderAds();
        });
    });
}

function renderAds() {
    const container = document.getElementById('adsContainer');
    const counter = document.getElementById('adCounter');
    if (!container) return;

    const filtered = getFilteredAds();
    const totalInFilter = filtered.length;
    const completedInFilter = filtered.filter(a => state.completedAds.includes(a.id)).length;
    const totalEarned = state.completedAds.reduce((sum, id) => {
        const ad = AD_LINKS.find(a => a.id === id);
        return sum + (ad ? ad.reward : 0);
    }, 0);

    counter.textContent = `${completedInFilter}/${totalInFilter}`;
    document.getElementById('totalEarned').textContent = totalEarned.toFixed(2);

    container.innerHTML = '';
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#6a7a8a;text-align:center;padding:20px">No ads available</p>';
        return;
    }

    filtered.forEach((ad, i) => {
        const completed = state.completedAds.includes(ad.id);
        const prevDone = isPrevCompleted(ad, filtered);
        const locked = !completed && !prevDone;
        const globalIndex = AD_LINKS.indexOf(ad);
        const div = document.createElement('div');
        div.className = `ad-item ${completed ? 'completed' : ''} ${locked ? 'locked' : ''}`;
        div.innerHTML = `
            <div class="ad-info">
                <h4>${ad.name}</h4>
                <p>${completed ? 'Completed' : locked ? 'Complete previous ad to unlock' : 'Click to watch'}</p>
            </div>
            <span class="ad-reward">+$${ad.reward.toFixed(2)}</span>
            <button class="btn btn-sm" data-index="${globalIndex}" ${completed || locked ? 'disabled' : ''}>
                ${completed ? 'Done' : locked ? 'Locked' : 'Start'}
            </button>
        `;
        container.appendChild(div);
    });

    container.querySelectorAll('.btn-sm:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            startAd(index);
        });
    });

    updateUI();
}

function startAd(index) {
    if (state.isVpnBlocked) { blockVPN(); return; }
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
        <div style="padding:16px;text-align:center">
            <h4 style="color:#88c7f7;font-size:14px;margin-bottom:8px">${ad.name}</h4>
            <p style="color:#6a7a8a;font-size:11px">Sponsored Advertisement</p>
            <div style="margin-top:12px;padding:20px;background:#1e2b38;border-radius:3px">
                <p style="color:#5a6a7a">Ad content loading...</p>
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
            timerEl.textContent = 'OK';
            statusEl.textContent = 'Ad completed! Click the button to visit the link.';
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
    document.getElementById('congratsModal').classList.add('active');
    document.getElementById('closeCongrats').onclick = () => {
        document.getElementById('congratsModal').classList.remove('active');
    };
}

function checkReferral() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref !== getRefCode()) {
        const existing = state.referrals.find(r => r.code === ref);
        if (!existing) {
            state.referrals.push({ code: ref, time: Date.now(), activated: false });
            saveState();
        }
    }
}

function processReferrals() {
    const now = Date.now();
    const ms48h = REF_ACTIVATE_HOURS * 60 * 60 * 1000;
    state.referrals.forEach(r => {
        if (!r.activated && (now - r.time >= ms48h)) {
            r.activated = true;
            state.refEarnings += REF_REWARD;
            state.balance += REF_REWARD;
        }
    });
    saveState();
    updateUI();
}

function updateUI() {
    document.getElementById('balanceDisplay').textContent = `$${state.balance.toFixed(2)}`;
    document.getElementById('withdrawBtn').disabled = state.balance < MIN_WITHDRAWAL;
    document.getElementById('refCount').textContent = state.referrals.length;
    document.getElementById('refEarnings').textContent = state.refEarnings.toFixed(2);
}

async function initVPNCheck() {
    state.isVpnBlocked = await detectVPN();
    if (state.isVpnBlocked) { blockVPN(); return true; }
    return false;
}

function setupRefLink() {
    const refInput = document.getElementById('refLink');
    if (refInput) {
        refInput.value = `${window.location.origin}${window.location.pathname}?ref=${getRefCode()}`;
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
            document.getElementById('addressLabel').textContent =
                e.target.value === 'usdt' ? 'USDT Address (BEP20)' : 'Litecoin Address';
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
        msgEl.textContent = 'Enter your wallet address';
        return;
    }

    state.balance -= amount;
    saveState();
    updateUI();

    msgEl.className = 'msg success';
    msgEl.textContent = `Request submitted! $${amount.toFixed(2)} → ${payment === 'usdt' ? 'USDT' : 'LTC'} | ${address.substr(0,8)}...`;

    setTimeout(() => {
        document.getElementById('withdrawModal').classList.remove('active');
        msgEl.textContent = '';
    }, 3000);
}

(async () => {
    if (await initVPNCheck()) return;
    loadState();
    checkReferral();
    processReferrals();
    resetDailyAds();
    renderFilters();
    renderAds();
    setupRefLink();
    setupModals();
    setInterval(processReferrals, 60000);
})();
