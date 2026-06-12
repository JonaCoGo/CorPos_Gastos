// ─── STORAGE & FIREBASE ───────────────────────────────────────────────────────
export const STORAGE_KEY = "corpos_budget_v6";
export const FIRESTORE_DOC = "corpos/shared";

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
export const defaultPersonalExpenses = {
  jonatan: [
    { id: 1, desc: "PAC SURA", amount: 55500, day: 15, icon: "💊" },
    { id: 2, desc: "Cuota Viaje Ari", amount: 50000, day: 15, icon: "🚌" },
    { id: 3, desc: "Yinar", amount: 50000, day: 15, icon: "👶" },
    { id: 4, desc: "Cera", amount: 30000, day: 15, icon: "💄" },
    { id: 5, desc: "Cuota Manejo Banco", amount: 11200, day: 15, icon: "🏦" },
    { id: 6, desc: "Cuota Seguro Bancolombia", amount: 25000, day: 15, icon: "🛡️" },
    { id: 7, desc: "Barbería", amount: 20000, day: 30, icon: "💈" },
    { id: 8, desc: "Spotify Jona-Marce", amount: 10200, day: 30, icon: "🎵" },
    { id: 9, desc: "Ajuste", amount: 3100, day: null, icon: "💰" },
  ],
  marcela: [
    { id: 1, desc: "Clases de Inglés", amount: 320000, day: null, icon: "📚" },
    { id: 2, desc: "Arreglo Uñas", amount: 80000, day: null, icon: "💅" },
    { id: 3, desc: "Internet Madre", amount: 100000, day: null, icon: "📶" },
    { id: 4, desc: "Ajuste", amount: 600, day: null, icon: "💰" },
  ],
};

export const defaultFamilyCategories = [
  { id: "arriendo", label: "Arriendo", budget: 800000, icon: "🏠" },
  { id: "mercado", label: "Mercado", budget: 600000, icon: "🛒" },
  { id: "servicios", label: "Servicios", budget: 300000, icon: "💡" },
  { id: "pasajes", label: "Pasajes", budget: 510000, icon: "🚌" },
  { id: "tc", label: "TC / Crédito", budget: 0, icon: "💳" },
  { id: "ahorro_salidas", label: "Ahorro Salidas", budget: 150000, icon: "🎉" },
  { id: "ahorro_personal", label: "Ahorro Personal", budget: 150000, icon: "🐷" },
  { id: "internet_planes", label: "Internet + Planes Cel", budget: 145000, icon: "📱" },
  { id: "credi_ahorros", label: "Crédito / Ahorros", budget: 200000, icon: "🏦" },
  { id: "otros", label: "Otros", budget: 0, icon: "📦" },
];

// ─── LISTS & CATEGORIES ───────────────────────────────────────────────────────
export const ICONS = ["🏠","🛒","💡","🚌","💳","🎉","🐷","📱","🏦","📦","🍽️","🏥","📚","🎮","👕","🚗","🐾","🌿","💊","🎵","✈️","🏋️","💈","🧹"];

export const MONTH_NAMES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const EXTRA_CATS = ["Comida rápida","Restaurante","Mecato","Transporte / InDriver","Salud / Médico","Farmacia","Ropa","Entretenimiento","Regalos","Mascotas","Hogar / Arreglos","Tecnología","Belleza","Deporte","Otros"];

export const SUPERMARKETS = ["Éxito", "SuperMU", "D1", "Ara", "Isimo", "Plaza de mercado", "Otro"];

export const UNITS = [
  { id: "und", label: "Unidad" },
  { id: "lb",  label: "Libra (lb)" },
  { id: "kg",  label: "Kilo (kg)" },
  { id: "gr",  label: "Gramo (gr)" },
];

export const ALL_CATS = ["Todas", "Carnes y proteínas", "Frutas", "Verduras", "Lácteos", "Despensa", "Snacks y salsas", "Aseo hogar", "Aseo personal", "Otros"];

// ─── SEED MARKET ITEMS ────────────────────────────────────────────────────────
export const SEED_MARKET_ITEMS = [
  {"id": "seed_001", "name": "Carne Molida", "pricePer": 11450, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_002", "name": "Milanesa de Cerdo", "pricePer": 12450, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_003", "name": "Filete de pechuga", "pricePer": 16800, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_004", "name": "Filete de tilapia", "pricePer": 13950, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_005", "name": "Fruta fresa x2", "pricePer": 12900, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_006", "name": "Fruta mora x2", "pricePer": 12900, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_007", "name": "Nuggets de pollo x2", "pricePer": 15800, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_008", "name": "Trozos de pechuga", "pricePer": 9490, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_009", "name": "Brócoli", "pricePer": 6990, "unit": "und", "supermarket": "D1", "category": "Verduras"},
  {"id": "seed_010", "name": "Arepas x2", "pricePer": 4300, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_011", "name": "Salchichas", "pricePer": 6400, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_012", "name": "Azúcar x2", "pricePer": 6900, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_013", "name": "Aceite", "pricePer": 6950, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_014", "name": "Arroz", "pricePer": 3790, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_015", "name": "Cebolla de huevo", "pricePer": 3100, "unit": "und", "supermarket": "D1", "category": "Verduras"},
  {"id": "seed_016", "name": "Champiñones", "pricePer": 7800, "unit": "und", "supermarket": "D1", "category": "Verduras"},
  {"id": "seed_017", "name": "Carne para asar", "pricePer": 18950, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_018", "name": "Café", "pricePer": 9650, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_019", "name": "Huevos x30 x2", "pricePer": 23980, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_020", "name": "Jamonada", "pricePer": 5990, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_021", "name": "Manzana", "pricePer": 10800, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_022", "name": "Mortadela", "pricePer": 2490, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_023", "name": "Pan tajado x3", "pricePer": 8970, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_024", "name": "Panela Molida x2", "pricePer": 7980, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_025", "name": "Piña", "pricePer": 6600, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_026", "name": "Galletas oficina x3", "pricePer": 9900, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_027", "name": "Tomate de árbol x3", "pricePer": 14700, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_028", "name": "Tortillas", "pricePer": 5150, "unit": "und", "supermarket": "D1", "category": "Despensa"},
  {"id": "seed_029", "name": "Zanahoria", "pricePer": 3200, "unit": "und", "supermarket": "D1", "category": "Verduras"},
  {"id": "seed_030", "name": "Lulo x2", "pricePer": 15980, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_031", "name": "Pepino x2", "pricePer": 3300, "unit": "und", "supermarket": "D1", "category": "Verduras"},
  {"id": "seed_032", "name": "Salsa de Cebolla", "pricePer": 2750, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_033", "name": "Salsa de Adobo", "pricePer": 2750, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_034", "name": "Mantequilla x2", "pricePer": 7980, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_035", "name": "Jabón loza x2", "pricePer": 2600, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_036", "name": "Detergente líquido", "pricePer": 13900, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_037", "name": "Bolsas de basura", "pricePer": 2350, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_038", "name": "Suavizante", "pricePer": 9990, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_039", "name": "Toallas cocina x2", "pricePer": 1750, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_040", "name": "Crema dental", "pricePer": 5950, "unit": "und", "supermarket": "D1", "category": "Aseo personal"},
  {"id": "seed_041", "name": "Jabón de baño", "pricePer": 5200, "unit": "und", "supermarket": "D1", "category": "Aseo personal"},
  {"id": "seed_042", "name": "Acondicionador", "pricePer": 13400, "unit": "und", "supermarket": "D1", "category": "Aseo personal"},
  {"id": "seed_043", "name": "Papel higiénico", "pricePer": 7100, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_044", "name": "Jabón íntimo", "pricePer": 3750, "unit": "und", "supermarket": "D1", "category": "Aseo personal"},
  {"id": "seed_045", "name": "Pañitos húmedos x2", "pricePer": 6980, "unit": "und", "supermarket": "D1", "category": "Aseo personal"},
  {"id": "seed_046", "name": "Leche x10", "pricePer": 32000, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_047", "name": "Crema de leche x2", "pricePer": 4800, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_048", "name": "Queso crema x2", "pricePer": 6800, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_049", "name": "Queso mozarela", "pricePer": 10500, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_050", "name": "Galletas", "pricePer": 5600, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_051", "name": "Galletas mini chip", "pricePer": 10450, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_052", "name": "Chocorramo", "pricePer": 7900, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_053", "name": "Malta x5", "pricePer": 7000, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_054", "name": "Yogurt x5", "pricePer": 5500, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_055", "name": "Mermelada de mora", "pricePer": 2490, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_056", "name": "Mostaza", "pricePer": 2550, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_057", "name": "Premezcla x2", "pricePer": 7980, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_058", "name": "Salsa de tomate", "pricePer": 4550, "unit": "und", "supermarket": "D1", "category": "Snacks y salsas"},
  {"id": "seed_059", "name": "Esponjas", "pricePer": 2400, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_060", "name": "Yogurt griego", "pricePer": 17450, "unit": "und", "supermarket": "D1", "category": "Lácteos"},
  {"id": "seed_061", "name": "Camarones", "pricePer": 20950, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_062", "name": "Pechuga de pollo", "pricePer": 15730, "unit": "und", "supermarket": "D1", "category": "Carnes y proteínas"},
  {"id": "seed_063", "name": "Aguacate x2", "pricePer": 3000, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_064", "name": "Mix de verduras", "pricePer": 5700, "unit": "und", "supermarket": "D1", "category": "Verduras"},
  {"id": "seed_065", "name": "Mango", "pricePer": 3300, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_066", "name": "Peras", "pricePer": 10990, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_067", "name": "Papaya", "pricePer": 7990, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_068", "name": "Plátano verde", "pricePer": 4300, "unit": "und", "supermarket": "D1", "category": "Frutas"},
  {"id": "seed_069", "name": "Limpiador", "pricePer": 2450, "unit": "und", "supermarket": "D1", "category": "Aseo hogar"},
  {"id": "seed_070", "name": "Pomos de algodón", "pricePer": 3150, "unit": "und", "supermarket": "D1", "category": "Aseo personal"}
];
