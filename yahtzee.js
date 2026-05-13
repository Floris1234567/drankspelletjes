// Instelbare grenzen voor onder/gemiddeld/boven gemiddeld per categorie
const grenzen = {
  ones:   { onder: 3, gemiddeld: 4 },
  twos:   { onder: 6, gemiddeld: 8 },
  threes: { onder: 9, gemiddeld: 12 },
  fours:  { onder: 12, gemiddeld: 16 },
  fives:  { onder: 15, gemiddeld: 20 },
  sixes:  { onder: 18, gemiddeld: 24 },
  three:  { onder: 18, gemiddeld: 21 },
  four:   { onder: 15, gemiddeld: 18 },
  chance: { onder: 17, gemiddeld: 20 }
};
// yahtzee.js
// Core Yahtzee drankspel logica

const categories = [
  { name: '1', key: 'ones', img: 'yahtzee_een.png' },
  { name: '2', key: 'twos', img: 'yahtzee_twee.png' },
  { name: '3', key: 'threes', img: 'yahtzee_drie.png' },
  { name: '4', key: 'fours', img: 'yahtzee_vier.png' },
  { name: '5', key: 'fives', img: 'yahtzee_vijf.png' },
  { name: '6', key: 'sixes', img: 'yahtzee_zes.png' },
  { name: 'Bonus', key: 'bonus', img: 'yahtzee_bonus .png', isBonus: true },
  { name: 'Drie dezelfde', key: 'three', img: 'yahtzee_driedezelfde.png' },
  { name: 'Vier dezelfde', key: 'four', img: 'yahtzee_vierdezelfde.png' },
  { name: 'Full House', key: 'fullhouse', img: 'yahtzee_fullhouse.png' },
  { name: 'Kleine straat', key: 'small', img: 'yahtzee_kleinestraat.png' },
  { name: 'Grote straat', key: 'large', img: 'yahtzee_grotestraat.png' },
  { name: 'Yahtzee', key: 'yahtzee', img: 'yahtzee_yahtzee.png' },
  { name: 'Willekeurig', key: 'chance', img: 'yahtzee_willekeurig.png' }
];

let players = [];
let currentPlayer = 0;
let currentRoll = 0;
let dice = [1, 1, 1, 1, 1];
let held = [false, false, false, false, false];
let scores = [];
let used = [];

function setupPlayers() {
  const num = parseInt(document.getElementById('numPlayers').value);
  const playerInputs = document.getElementById('playerInputs');
  playerInputs.innerHTML = '';
  for (let i = 0; i < num; i++) {
    playerInputs.innerHTML += `<div><label>Naam speler ${i+1}: <input type="text" id="player${i}" value="Speler${i+1}" /></label></div>`;
  }
  playerInputs.innerHTML += '<button onclick="startGame()">Start spel</button>';
  playerInputs.classList.remove('hidden');
}

function startGame() {
  const num = parseInt(document.getElementById('numPlayers').value);
  players = [];
  for (let i = 0; i < num; i++) {
    players.push(document.getElementById(`player${i}`).value || `Speler${i+1}`);
  }
  scores = Array(players.length).fill(0).map(() => Array(categories.length).fill(null));
  used = Array(players.length).fill(0).map(() => Array(categories.length).fill(false));
  document.getElementById('setup').classList.add('hidden');
  document.getElementById('yahtzeeBoard').classList.remove('hidden');
  document.getElementById('rollBtn').style.display = '';
  renderTable();
  resetTurn();
}

function renderTable() {
  const table = document.getElementById('scoreTable');
  let html = '<tr><th></th>';
  for (let p = 0; p < players.length; p++) {
    html += `<th>${players[p]}</th>`;
  }
  html += '</tr>';
  for (let c = 0; c < categories.length; c++) {
    html += '<tr>';
    // Toon afbeelding voor categorie
    if (categories[c].img) {
      html += `<td class="cat"><img src="img/${categories[c].img}" alt="${categories[c].name}" style="height:44px;width:80px;vertical-align:middle;">${categories[c].isBonus ? '<br><span style="font-size:13px;">Bonus</span>' : ''}</td>`;
    } else {
      html += `<td class="cat">${categories[c].name}</td>`;
    }
    for (let p = 0; p < players.length; p++) {
      let val = scores[p][c];
      // Bonus berekenen en huidige som tonen
      if (categories[c].key === 'bonus') {
        const sum = [0,1,2,3,4,5].map(idx => scores[p][idx] || 0).reduce((a,b)=>a+b,0);
        val = (sum >= 63 ? 35 : 0) + ` <span style='font-size:12px;color:#555;'>(${sum}/63)</span>`;
      }
      const clickable = currentPlayer === p && !used[p][c] && currentRoll > 0 && !categories[c].isBonus;
      html += `<td ${clickable ? `onclick=\"chooseCategory(${c})\" style=\"cursor:pointer;background:#ffe3f4;\"` : ''}>${val !== null ? val : ''}</td>`;
    }
    html += '</tr>';
  }
  table.innerHTML = html;
}

function renderDice() {
  const diceRow = document.getElementById('diceRow');
  diceRow.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    diceRow.innerHTML += `<div class="die${held[i] ? ' held' : ''}" onclick="toggleHold(${i})">${dice[i]}</div>`;
  }
}

function rollDice() {
  if (currentRoll >= 3) return;
  for (let i = 0; i < 5; i++) {
    if (!held[i]) {
      dice[i] = Math.floor(Math.random() * 6) + 1;
    }
  }
  currentRoll++;
  renderDice();
  document.getElementById('rollBtn').disabled = currentRoll >= 3;
  renderTable();
}

function toggleHold(idx) {
  if (currentRoll === 0) return;
  held[idx] = !held[idx];
  renderDice();
}

function resetTurn() {
  currentRoll = 0;
  dice = [1, 1, 1, 1, 1];
  held = [false, false, false, false, false];
  document.getElementById('rollBtn').disabled = false;
  renderDice();
  renderTable();
}

function chooseCategory(catIdx) {
  if (used[currentPlayer][catIdx] || categories[catIdx].isBonus) return;
  const val = calculateScore(catIdx, dice);
  scores[currentPlayer][catIdx] = val;
  used[currentPlayer][catIdx] = true;
  renderTable(); // update bonus direct
  showDrankPopup(catIdx, val);
}

function nextPlayer() {
  currentPlayer = (currentPlayer + 1) % players.length;
  resetTurn();
}

function calculateScore(catIdx, dice) {
  // Yahtzee score logic
  const counts = [0,0,0,0,0,0,0];
  for (let d of dice) counts[d]++;
  const sum = dice.reduce((a,b) => a+b, 0);
  switch(categories[catIdx].key) {
    case 'ones': return counts[1]*1;
    case 'twos': return counts[2]*2;
    case 'threes': return counts[3]*3;
    case 'fours': return counts[4]*4;
    case 'fives': return counts[5]*5;
    case 'sixes': return counts[6]*6;
    case 'three': return Object.values(counts).some(x=>x>=3) ? sum : 0;
    case 'four': return Object.values(counts).some(x=>x>=4) ? sum : 0;
    case 'fullhouse': return (Object.values(counts).includes(3) && Object.values(counts).includes(2)) ? 25 : 0;
    case 'small': return isSmallStraight(dice) ? 30 : 0;
    case 'large': return isLargeStraight(dice) ? 40 : 0;
    case 'yahtzee': return Object.values(counts).some(x=>x===5) ? 50 : 0;
    case 'chance': return sum;
    case 'bonus': return null; // wordt dynamisch berekend
    default: return 0;
  }
}

function isSmallStraight(dice) {
  const uniq = Array.from(new Set(dice)).sort();
  const str = uniq.join('');
  return str.includes('1234') || str.includes('2345') || str.includes('3456');
}
function isLargeStraight(dice) {
  const uniq = Array.from(new Set(dice)).sort().join('');
  return uniq === '12345' || uniq === '23456';
}

function showDrankPopup(catIdx, val) {
  // Drankregels toepassen
  const cat = categories[catIdx].key;
  // Getallenrij: bepaal onder/gemiddeld/boven
  if(['ones','twos','threes','fours','fives','sixes'].includes(cat)){
    const grens = grenzen[cat];
    if(val < grens.onder) {
      showCustomPopup('Onder gemiddeld, neem 2 slokken', 'red', nextPlayer);
    } else if(val < grens.gemiddeld) {
      showCustomPopup('Gemiddeld', 'yellow', nextPlayer);
    } else {
      showSlokkenVerdelen(2, 'Goed, boven gemiddeld, deel 2 slokken uit');
    }
    return;
  }
  // Three of a kind
  if(cat==='three'){
    const grens = grenzen.three;
    if(val < grens.onder) {
      showCustomPopup('Onder gemiddeld, neem 2 slokken', 'red', nextPlayer);
    } else if(val <= grens.gemiddeld) {
      showCustomPopup('Gemiddeld', 'yellow', nextPlayer);
    } else {
      showSlokkenVerdelen(2, 'Goed, boven gemiddeld, deel 2 slokken uit');
    }
    return;
  }
  // Four of a kind
  if(cat==='four'){
    const grens = grenzen.four;
    if(val < grens.onder) {
      showCustomPopup('Onder gemiddeld, neem 2 slokken', 'red', nextPlayer);
    } else if(val <= grens.gemiddeld) {
      showCustomPopup('Gemiddeld', 'yellow', nextPlayer);
    } else {
      showSlokkenVerdelen(2, 'Goed, boven gemiddeld, deel 2 slokken uit');
    }
    return;
  }
  // Chance
  if(cat==='chance'){
    const grens = grenzen.chance;
    if(val < grens.onder) {
      showCustomPopup('Onder gemiddeld, neem 2 slokken', 'red', nextPlayer);
    } else if(val <= grens.gemiddeld) {
      showCustomPopup('Gemiddeld', 'yellow', nextPlayer);
    } else {
      showSlokkenVerdelen(2, 'Goed, boven gemiddeld, deel 2 slokken uit');
    }
    return;
  }
  // Full house, small/large straight, yahtzee: behoud bestaande regels (optioneel uitbreiden)
  let msg = '';
  let canGive = false;
  if(cat==='fullhouse'){
    if(val===0) msg = 'Niet gehaald: neem 2 slokken';
    else { msg = 'Full house! Deel 2 slokken uit'; canGive=true; }
  } else if(cat==='large'){
    if(val===0) msg = 'Niet gehaald: neem 2 slokken';
    else { msg = 'Grote straat! Deel 3 slokken uit'; canGive=true; }
  } else if(cat==='yahtzee'){
    if(val===0) msg = 'Niet gehaald: neem 2 slokken';
    else { msg = 'YAHTZEE! Deel 4 slokken uit'; canGive=true; }
  } else if(cat==='small'){
    if(val===0) msg = 'Niet gehaald: neem 2 slokken';
    else { msg = 'Kleine straat! Deel 2 slokken uit'; canGive=true; }
  }
  if(msg) {
    if(msg.includes('neem 2 slokken')) {
      showCustomPopup(msg, 'red', nextPlayer);
    } else if(msg.includes('Gemiddeld')) {
      showCustomPopup(msg, 'yellow', nextPlayer);
    } else if(msg.includes('Deel')) {
      showCustomPopup(msg, 'green', nextPlayer);
    } else {
      showCustomPopup(msg, 'yellow', nextPlayer);
    }
    return;
  }
  if(canGive) {
    const slokken = (cat==='large') ? 3 : (cat==='yahtzee') ? 4 : 2;
    showSlokkenVerdelen(slokken, msg);
  }
}

// Algemene popup functie voor kleur en kliksluiten
function showCustomPopup(text, color, onClose) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:10000;display:flex;align-items:center;justify-content:center;';
  const modal = document.createElement('div');
  let bg = '#fff7c0', fg = '#222';
  if(color==='red'){ bg='#d32f2f'; fg='#fff'; }
  if(color==='green'){ bg='#43a047'; fg='#fff'; }
  if(color==='yellow'){ bg='#ffe066'; fg='#222'; }
  modal.style = `background:${bg};color:${fg};padding:38px 32px;border-radius:18px;box-shadow:0 4px 32px #0005;min-width:220px;max-width:90vw;text-align:center;font-size:2rem;font-weight:bold;cursor:pointer;`;
  modal.innerHTML = text;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.onclick = modal.onclick = function() {
    closeModal();
    if(onClose) onClose();
  };
}

function showSlokkenVerdelen(aantal, extraMsg) {
  let msg = `<div style='margin-bottom:8px;'>${extraMsg || ''}</div>Je mag ${aantal} slokken uitdelen.`;
  msg += '<form id="slokkenForm">';
  for(let i=0;i<players.length;i++){
    if(i!==currentPlayer){
      msg += `<div style='margin:12px 0;font-size:1.2rem;display:flex;align-items:center;gap:16px;justify-content:center;'>
        <span style='min-width:90px;display:inline-block;text-align:right;'>${players[i]}</span>
        <button type='button' class='slokBtn' onclick='window.changeSlok(${i},-1,${aantal})' style='font-size:2rem;width:44px;height:44px;border-radius:50%;background:#d32f2f;color:#fff;border:none;margin:0 8px;'>-</button>
        <span id='give${i}' style='display:inline-block;width:32px;text-align:center;font-size:1.5rem;'>0</span>
        <button type='button' class='slokBtn' onclick='window.changeSlok(${i},1,${aantal})' style='font-size:2rem;width:44px;height:44px;border-radius:50%;background:#43a047;color:#fff;border:none;margin:0 8px;'>+</button>
      </div>`;
    }
  }
  msg += '</form>';
  msg += `<br><button id='modalOkBtn' disabled style='font-size:1.3rem;padding:10px 32px;border-radius:12px;background:#ffe066;color:#222;border:none;cursor:pointer;opacity:0.7;'>OK</button>`;
  showModal(msg);
  // Slokverdeling bijhouden
  window.slokVerdeling = {};
  for(let i=0;i<players.length;i++){
    if(i!==currentPlayer) window.slokVerdeling[i]=0;
  }
  window.changeSlok = function(idx, delta, max) {
    const span = document.getElementById('give'+idx);
    let val = window.slokVerdeling[idx]||0;
    val += delta;
    if(val<0) val=0;
    if(val>max) val=max;
    window.slokVerdeling[idx]=val;
    span.textContent = val;
    updateSlokOkBtn(max);
  }
  window.updateSlokOkBtn = function(max) {
    let totaal = 0;
    for(let i in window.slokVerdeling) totaal += window.slokVerdeling[i];
    const okBtn = document.getElementById('modalOkBtn');
    if(totaal===max){
      okBtn.disabled = false;
      okBtn.style.opacity = 1;
    } else {
      okBtn.disabled = true;
      okBtn.style.opacity = 0.7;
    }
  }
  document.getElementById('modalOkBtn').onclick = function(e) {
    e.preventDefault();
    let totaal = 0;
    for(let i in window.slokVerdeling) totaal += window.slokVerdeling[i];
    if(totaal!==aantal) return;
    closeModal();
    nextPlayer();
  };
}

function confirmSlokken(aantal) {
  let totaal = 0;
  for(let i=0;i<players.length;i++){
    if(i!==currentPlayer){
      const val = parseInt(document.getElementById('give'+i).value)||0;
      totaal += val;
    }
  }
  if(totaal!==aantal){
    showModal('Verdeel exact '+aantal+' slokken!', function(){});
    return;
  }
  closeModal();
  nextPlayer();
}

// Modal helpers
function showModal(message, onOk) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:10000;display:flex;align-items:center;justify-content:center;';
  const modal = document.createElement('div');
  modal.style = 'background:#fff7c0;padding:28px 22px;border-radius:18px;box-shadow:0 4px 32px #0005;min-width:220px;max-width:90vw;text-align:center;';
  modal.innerHTML = `<div style='margin-bottom:18px;'>${message}</div><button id='modalOkBtn'>OK</button>`;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(()=>{
    document.getElementById('modalOkBtn').focus();
  }, 100);
  document.getElementById('modalOkBtn').onclick = function(e) {
    e.preventDefault();
    if(onOk) onOk();
    else closeModal();
  };
}
function closeModal() {
  const old = document.getElementById('modalOverlay');
  if(old) old.remove();
}

window.setupPlayers = setupPlayers;
window.startGame = startGame;
window.rollDice = rollDice;
window.toggleHold = toggleHold;
window.chooseCategory = chooseCategory;
