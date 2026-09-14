const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Pobieramy elementy interfejsu (UI) z HTML
const uiLevel = document.getElementById("ui-level");
const uiXp = document.getElementById("ui-xp");
const uiGold = document.getElementById("ui-gold");

// Statystyki bohatera (dodane punkty, złoto i poziom)
let gracz = {
    x: 100,
    y: 180,
    width: 40,
    height: 40,
    kolor: "blue",
    predkosc: 4,
    silaAtaku: 15,
    zasiegAtaku: 60,
    czyAtakuje: false,
    licznikAtaku: 0,
    
    // NOWE STATYSTYKI RPG:
    poziom: 1,
    xp: 0,
    potrzebneXp: 100, // Tyle XP trzeba na Level Up
    zloto: 0
};

// Statystyki kukły treningowej
let kukla = {
    x: 280,
    y: 180,
    width: 40,
    height: 40,
    kolor: "brown",
    hp: 100,
    maxHp: 100
};

let tekstyObrazen = [];

// Logika klawiatury
let klawisze = {};
window.addEventListener("keydown", e => {
    klawisze[e.key] = true;
    if (e.key === " ") atakuj();
});
window.addEventListener("keyup", e => klawisze[e.key] = false);

// --- LOGIKA JOYSTICKA ---
const base = document.getElementById("joystick-base");
const stick = document.getElementById("joystick-stick");
let joystickX = 0, joystickY = 0, maxPrzesuniecie = 40;

base.addEventListener("touchstart", handleTouch);
base.addEventListener("touchmove", handleTouch);
base.addEventListener("touchend", () => {
    stick.style.transform = `translate(0px, 0px)`;
    joystickX = 0; joystickY = 0;
});

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const baseRect = base.getBoundingClientRect();
    let deltaX = touch.clientX - (baseRect.left + baseRect.width / 2);
    let deltaY = touch.clientY - (baseRect.top + baseRect.height / 2);
    const odleglosc = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (odleglosc > maxPrzesuniecie) {
        deltaX = (deltaX / odleglosc) * maxPrzesuniecie;
        deltaY = (deltaY / odleglosc) * maxPrzesuniecie;
    }
    stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    joystickX = deltaX / maxPrzesuniecie;
    joystickY = deltaY / maxPrzesuniecie;
}

// --- LOGIKA ATAKU, XP I ZŁOTA ---
const btnAttack = document.getElementById("btn-attack");
btnAttack.addEventListener("touchstart", (e) => {
    e.preventDefault();
    atakuj();
});

function atakuj() {
    if (gracz.czyAtakuje) return;

    gracz.czyAtakuje = true;
    gracz.licznikAtaku = 10;

    const srodekGraczaX = gracz.x + gracz.width / 2;
    const srodekGraczaY = gracz.y + gracz.height / 2;
    const srodekKuklyX = kukla.x + kukla.width / 2;
    const srodekKuklyY = kukla.y + kukla.height / 2;

    const odleglosc = Math.sqrt(Math.pow(srodekKuklyX - srodekGraczaX, 2) + Math.pow(srodekKuklyY - srodekGraczaY, 2));

    if (odleglosc <= gracz.zasiegAtaku && kukla.hp > 0) {
        let obrazenia = gracz.silaAtaku + Math.floor(Math.random() * 11) - 5;
        kukla.hp -= obrazenia;

        // NAGRODA ZA HIT: Za każde uderzenie dostajesz trochę złota i XP
        gracz.zloto += Math.floor(Math.random() * 3) + 1; // 1-3 złota
        gracz.xp += 5; // 5 punktów XP za udany cios

        tekstyObrazen.push({
            x: kukla.x + 10,
            y: kukla.y - 10,
            tekst: "-" + obrazenia,
            kolor: "red",
            czasZycia: 30
        });

        // SPRAWDZENIE CZY KUKŁA PADŁA
        if (kukla.hp <= 0) {
            kukla.hp = 0;
            
            // BONUS ZA ZNISZCZENIE: Duży zastrzyk złota i XP
            gracz.zloto += 50;
            gracz.xp += 40;

            tekstyObrazen.push({
                x: kukla.x - 10,
                y: kukla.y - 30,
                tekst: "+50 ZŁOTA & +40 XP!",
                kolor: "yellow",
                czasZycia: 50
            });

            setTimeout(() => {
                kukla.hp = kukla.maxHp;
            }, 2000);
        }

        // SPRAWDZENIE CZY JEST LEVEL UP
        if (gracz.xp >= gracz.potrzebneXp) {
            gracz.xp -= gracz.potrzebneXp; // Zachowaj nadwyżkę XP
            gracz.poziom += 1;
            gracz.potrzebneXp = Math.floor(gracz.potrzebneXp * 1.5); // Kolejny poziom wymaga więcej XP
            gracz.silaAtaku += 5; // Bohater staje się silniejszy!

            tekstyObrazen.push({
                x: gracz.x - 20,
                y: gracz.y - 30,
                tekst: "AWANS! POZIOM " + gracz.poziom,
                kolor: "#00ffff", // Błękitny kolor awansu
                czasZycia: 60
            });
        }

        // Aktualizujemy dane na górnym pasku
        aktualizujUI();
    }
}

// Funkcja zmieniająca tekst w panelu HTML
function aktualizujUI() {
    uiLevel.innerText = "POZIOM: " + gracz.poziom;
    uiXp.innerText = "XP: " + gracz.xp + " / " + gracz.potrzebneXp;
    uiGold.innerText = "ZŁOTO: " + gracz.zloto;
}

// --- GŁÓWNA PĘTLA GRY ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ruch
    if (klawisze["ArrowUp"] || klawisze["w"]) gracz.y -= gracz.predkosc;
    if (klawisze["ArrowDown"] || klawisze["s"]) gracz.y += gracz.predkosc;
    if (klawisze["ArrowLeft"] || klawisze["a"]) gracz.x -= gracz.predkosc;
    if (klawisze["ArrowRight"] || klawisze["d"]) gracz.x += gracz.predkosc;

    gracz.x += joystickX * gracz.predkosc;
    gracz.y += joystickY * gracz.predkosc;

    if (gracz.x < 0) gracz.x = 0;
    if (gracz.x > canvas.width - gracz.width) gracz.x = canvas.width - gracz.width;
    if (gracz.y < 0) gracz.y = 0;
    if (gracz.y > canvas.height - gracz.height) gracz.y = canvas.height - gracz.height;

    if (gracz.czyAtakuje) {
        gracz.licznikAtaku--;
        if (gracz.licznikAtaku <= 0) gracz.czyAtakuje = false;
    }

    // Rysowanie kukły
    if (kukla.hp > 0) {
        ctx.fillStyle = kukla.kolor;
        ctx.fillRect(kukla.x, kukla.y, kukla.width, kukla.height);

        ctx.fillStyle = "red";
        ctx.fillRect(kukla.x, kukla.y - 15, kukla.width, 6);
        ctx.fillStyle = "lightgreen";
        ctx.fillRect(kukla.x, kukla.y - 15, (kukla.hp / kukla.maxHp) * kukla.width, 6);
    } else {
        ctx.fillStyle = "gray";
        ctx.fillRect(kukla.x, kukla.y + 20, kukla.width, 20);
    }

    // Rysowanie gracza
    ctx.fillStyle = gracz.czyAtakuje ? "yellow" : gracz.kolor;
    ctx.fillRect(gracz.x, gracz.y, gracz.width, gracz.height);

    if (gracz.czyAtakuje) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gracz.x + gracz.width/2, gracz.y + gracz.height/2, gracz.zasiegAtaku, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Rysowanie tekstów (obrażenia, złoto, level up)
    for (let i = tekstyObrazen.length - 1; i >= 0; i--) {
        let t = tekstyObrazen[i];
        ctx.fillStyle = t.kolor;
        ctx.font = "bold 14px Arial";
        ctx.fillText(t.tekst, t.x, t.y);
        
        t.y -= 0.8;
        t.czasZycia--;
        
        if (t.czasZycia <= 0) {
            tekstyObrazen.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// Uruchomienie początkowe interfejsu i pętli
aktualizujUI();
gameLoop();
