/* =====================================================
   JIRANI — data & settings
   Everything you might want to change lives here:
   app name, exchange rates, services, and demo runners.
   When you build a real backend, these arrays become
   database tables.
   ===================================================== */

const CONFIG = {
  appName: "Jirani",
  tagline: "Your neighbour back home",
  serviceFeePercent: 8, // what Jirani earns per completed errand

  // KES per 1 unit of foreign currency.
  // Indicative only — update these, or fetch from an exchange-rate API later.
  currencies: { KES: 1, USD: 129, GBP: 170, AUD: 85, CAD: 94, EUR: 150, AED: 35 },
};

const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
  "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
  "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu",
  "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa",
  "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
  "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi",
  "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

const SERVICES = [
  { id: "gadgets",   icon: "📱", label: "Buy gadgets & electronics" },
  { id: "building",  icon: "🧱", label: "Buy construction materials" },
  { id: "furniture", icon: "🪑", label: "Buy furniture (chairs, beds, sofas)" },
  { id: "surprise",  icon: "🎁", label: "Surprise a parent or loved one" },
  { id: "groceries", icon: "🛒", label: "Groceries & household shopping" },
  { id: "documents", icon: "📄", label: "Government & document errands" },
  { id: "site",      icon: "🏗️", label: "Site visits & progress photos" },
  { id: "farm",      icon: "🌾", label: "Farm & land check-ups" },
  { id: "fees",      icon: "🏫", label: "School fees, rent & bill drop-offs" },
  { id: "courier",   icon: "📦", label: "Pick-up & courier" },
];

const COUNTRIES_ABROAD = [
  "Australia", "United States", "United Kingdom", "Canada", "United Arab Emirates",
  "Qatar", "Germany", "South Africa", "New Zealand", "Saudi Arabia", "Other",
];

/* Demo runners. `rate` is in Kenya Shillings (KES) per errand, starting price. */
const RUNNERS_SEED = [
  {
    id: "r1", name: "Laban Bett", county: "Uasin Gishu", town: "Eldoret",
    phone: "+254700000001", status: "verified", ownerEmail: "",
    idMasked: "•••• 4821", kraMasked: "A•••••••8K", joined: "2025-02-11",
    bio: "Eldoret-based and fully verified. I buy gadgets, construction materials and furniture, and I plan parent surprises from start to finish: cake, balloons, a video crew, and a photo for you to see it live.",
    services: [
      { id: "gadgets", rate: 1500 }, { id: "building", rate: 2500 },
      { id: "furniture", rate: 2000 }, { id: "surprise", rate: 3500 },
    ],
    reviews: [
      { by: "Wanjiku M., Perth", stars: 5, date: "2025-08-02", text: "Laban surprised my mum for her 60th. He sent photos at every step and even held the phone so I could watch live. Worth every shilling." },
      { by: "Kip T., Calgary", stars: 5, date: "2025-06-18", text: "Bought 40 bags of cement and delivered to my plot in Kapseret. Receipts matched every time." },
      { by: "Aisha R., Dubai", stars: 4, date: "2025-04-09", text: "Good communication. The sofa arrived a day late but he told me early." },
    ],
  },
  {
    id: "r2", name: "Wanjiru Kamau", county: "Nairobi", town: "Westlands",
    phone: "+254700000002", status: "verified", ownerEmail: "",
    idMasked: "•••• 1370", kraMasked: "A•••••••2Z", joined: "2025-01-05",
    bio: "Former procurement officer. I handle electronics shopping on Moi Avenue and River Road, plus NTSA, KRA and Lands office errands so you do not have to take leave.",
    services: [
      { id: "gadgets", rate: 1200 }, { id: "documents", rate: 2500 },
      { id: "fees", rate: 800 }, { id: "courier", rate: 1000 },
    ],
    reviews: [
      { by: "Daniel O., London", stars: 5, date: "2025-09-01", text: "Got my logbook transfer sorted in two days. Clear updates and honest about the fees." },
      { by: "Grace N., Toronto", stars: 5, date: "2025-07-14", text: "Bought a laptop for my brother's school. She compared three shops before buying." },
    ],
  },
  {
    id: "r3", name: "Otieno Odhiambo", county: "Kisumu", town: "Milimani",
    phone: "+254700000003", status: "verified", ownerEmail: "",
    idMasked: "•••• 9054", kraMasked: "A•••••••5P", joined: "2025-03-20",
    bio: "I check on plots and building sites around Kisumu and Siaya, and send dated photos and short videos. I also buy materials from trusted hardware dealers.",
    services: [
      { id: "site", rate: 2000 }, { id: "building", rate: 3000 }, { id: "farm", rate: 2500 },
    ],
    reviews: [
      { by: "Brian A., Sydney", stars: 5, date: "2025-08-21", text: "Weekly site updates while my house went up. Caught a problem with the foundation early." },
    ],
  },
  {
    id: "r4", name: "Fatuma Hassan", county: "Mombasa", town: "Nyali",
    phone: "+254700000004", status: "verified", ownerEmail: "",
    idMasked: "•••• 6612", kraMasked: "A•••••••1M", joined: "2025-04-02",
    bio: "Coastal errands: groceries for your parents in Likoni and Bamburi, surprise dinners, gift hampers and pharmacy pick-ups.",
    services: [
      { id: "groceries", rate: 1000 }, { id: "surprise", rate: 4000 }, { id: "courier", rate: 900 },
    ],
    reviews: [
      { by: "Said K., Doha", stars: 5, date: "2025-09-10", text: "My mother cried happy tears. Fatuma filmed the whole thing." },
      { by: "Amina W., Manchester", stars: 4, date: "2025-05-30", text: "Reliable and polite. Would book again." },
    ],
  },
  {
    id: "r5", name: "Mercy Njeri", county: "Nyeri", town: "Nyeri Town",
    phone: "+254700000005", status: "verified", ownerEmail: "",
    idMasked: "•••• 3347", kraMasked: "A•••••••9C", joined: "2025-05-15",
    bio: "I run errands across Nyeri, Kirinyaga and Murang'a. Farm visits, school fees drop-offs, and buying furniture from local fundis.",
    services: [
      { id: "farm", rate: 1800 }, { id: "fees", rate: 700 }, { id: "furniture", rate: 1800 },
    ],
    reviews: [
      { by: "Peter M., Auckland", stars: 5, date: "2025-07-27", text: "Paid my daughter's school fees in person and sent the receipt the same hour." },
    ],
  },
  {
    id: "r6", name: "Kiprotich Rono", county: "Nakuru", town: "Nakuru Town",
    phone: "+254700000006", status: "verified", ownerEmail: "",
    idMasked: "•••• 7781", kraMasked: "A•••••••4T", joined: "2025-06-01",
    bio: "Hardware and building-material runs across Nakuru, Naivasha and Gilgil. I negotiate with suppliers so you do not pay the 'diaspora price'.",
    services: [
      { id: "building", rate: 2200 }, { id: "gadgets", rate: 1400 }, { id: "courier", rate: 800 },
    ],
    reviews: [],
  },
];
