// ===== Configuración (edita con los datos reales de tu tienda) =====
const CONFIG = {
  storeName: "Cava 57",
  whatsapp: "573001234567", // código de país + número, sin + ni espacios
  currency: "COP",
  locale: "es-CO",
  deliveryFee: 0
};

// ===== Catálogo: "img" es la URL de la imagen en línea (reemplázala por la de tu producto) =====
const img = (tags, n) => `https://loremflickr.com/320/400/${tags}?lock=${n}`;
const PRODUCTS = [
  { id: 1, name: "Aguardiente Antioqueño 750 ml", cat: "Aguardiente", price: 62000, img: img("liquor,bottle", 1) },
  { id: 2, name: "Ron Medellín Añejo 3 años 750 ml", cat: "Ron", price: 58000, img: img("rum,bottle", 2) },
  { id: 3, name: "Old Parr 12 años 750 ml", cat: "Whisky", price: 185000, img: img("whisky,bottle", 3) },
  { id: 4, name: "Buchanan's 12 años 750 ml", cat: "Whisky", price: 192000, img: img("scotch,whisky", 4) },
  { id: 5, name: "Vino Tinto Cabernet Sauvignon 750 ml", cat: "Vino", price: 45000, img: img("red,wine,bottle", 5) },
  { id: 6, name: "Vino Blanco Sauvignon Blanc 750 ml", cat: "Vino", price: 42000, img: img("white,wine,bottle", 6) },
  { id: 7, name: "Tequila Reposado 750 ml", cat: "Tequila", price: 138000, img: img("tequila,bottle", 7) },
  { id: 8, name: "Ginebra London Dry 700 ml", cat: "Ginebra", price: 125000, img: img("gin,bottle", 8) },
  { id: 9, name: "Cerveza Club Colombia x6", cat: "Cerveza", price: 24000, img: img("beer,bottles", 9) },
  { id: 10, name: "Cerveza Artesanal IPA x4", cat: "Cerveza", price: 36000, img: img("craft,beer", 10) }
];

// ===== Lógica =====
const $ = (s) => document.querySelector(s);
const fmt = (n) => new Intl.NumberFormat(CONFIG.locale, { style: "currency", currency: CONFIG.currency, maximumFractionDigits: 0 }).format(n);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let cart = store.get("cart", {});
let cat = "Todos", query = "";

// Verificación de edad
if (store.get("adult", false)) $("#age-gate").hidden = true;
$("#age-yes").onclick = () => { store.set("adult", true); $("#age-gate").hidden = true; };

// Catálogo
function renderFilters() {
  const cats = ["Todos", ...new Set(PRODUCTS.map(p => p.cat))];
  $("#filters").innerHTML = cats.map(c => `<button class="chip ${c === cat ? "on" : ""}" data-cat="${c}">${c}</button>`).join("");
}
function renderGrid() {
  const q = query.trim().toLowerCase();
  const list = PRODUCTS.filter(p => (cat === "Todos" || p.cat === cat) && p.name.toLowerCase().includes(q));
  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list.map(p => `
    <article class="card">
      <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.visibility='hidden'">
      <h3>${p.name}</h3>
      <p class="cat">${p.cat}</p>
      <div class="buy"><strong>${fmt(p.price)}</strong><button class="btn sm" data-add="${p.id}">Agregar</button></div>
    </article>`).join("");
}
$("#filters").onclick = (e) => { const c = e.target.dataset.cat; if (c) { cat = c; renderFilters(); renderGrid(); } };
$("#search").oninput = (e) => { query = e.target.value; renderGrid(); };
$("#grid").onclick = (e) => { const id = e.target.dataset.add; if (id) { change(+id, 1); toast("Agregado al carrito"); } };

// Carrito
const lines = () => Object.entries(cart).map(([id, qty]) => ({ p: PRODUCTS.find(x => x.id == id), qty })).filter(l => l.p);
const subtotal = () => lines().reduce((s, l) => s + l.p.price * l.qty, 0);
function change(id, d) {
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  store.set("cart", cart); renderCart();
}
function renderCart() {
  const ls = lines();
  $("#cart-count").textContent = ls.reduce((s, l) => s + l.qty, 0);
  $("#cart-total").textContent = fmt(subtotal() + (ls.length ? CONFIG.deliveryFee : 0));
  $("#cart-items").innerHTML = ls.length ? ls.map(({ p, qty }) => `
    <div class="line"><div><strong>${p.name}</strong><br><small>${fmt(p.price)}</small></div>
    <div class="qty"><button data-dec="${p.id}" aria-label="Quitar uno">−</button><span>${qty}</span><button data-inc="${p.id}" aria-label="Agregar uno">+</button></div></div>`).join("")
    : `<p class="empty">Tu carrito está vacío. Agrega productos del catálogo.</p>`;
}
$("#cart-items").onclick = (e) => {
  if (e.target.dataset.inc) change(+e.target.dataset.inc, 1);
  if (e.target.dataset.dec) change(+e.target.dataset.dec, -1);
};
const setDrawer = (open) => {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
  $("#scrim").hidden = !open;
};
$("#open-cart").onclick = () => setDrawer(true);
$("#close-cart").onclick = $("#scrim").onclick = () => setDrawer(false);
document.addEventListener("keydown", (e) => e.key === "Escape" && setDrawer(false));

// Pedido por WhatsApp (reemplazable por una pasarela: Wompi, Mercado Pago, etc.)
$("#checkout").onsubmit = (e) => {
  e.preventDefault();
  const ls = lines();
  if (!ls.length) return toast("Agrega al menos un producto");
  const f = Object.fromEntries(new FormData(e.target));
  const items = ls.map(l => `• ${l.qty} x ${l.p.name} — ${fmt(l.p.price * l.qty)}`).join("\n");
  const total = fmt(subtotal() + CONFIG.deliveryFee);
  const msg = `Hola, quiero hacer un pedido en ${CONFIG.storeName}:\n\n${items}\n\nTotal: ${total}\nNombre: ${f.nombre}\nTeléfono: ${f.telefono}\nDirección: ${f.direccion}\nPago: ${f.pago}`;
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  cart = {}; store.set("cart", cart); renderCart(); setDrawer(false); e.target.reset();
  toast("Pedido enviado. Te confirmaremos por WhatsApp.");
};

let t;
function toast(m) { const el = $("#toast"); el.textContent = m; el.classList.add("show"); clearTimeout(t); t = setTimeout(() => el.classList.remove("show"), 2200); }

renderFilters(); renderGrid(); renderCart();
