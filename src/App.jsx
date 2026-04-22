import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dog, 
  Cat, 
  Check, 
  Calculator, 
  Heart, 
  Syringe, 
  Activity, 
  ShieldAlert,
  Info,
  Loader2,
  Tag,
  Square,
  ChevronDown,
  X,
  MapPin,
  Stethoscope,
  PawPrint,
  Clock,
  Smartphone,
  Weight,
  ShieldCheck
} from 'lucide-react';

// --- CONFIGURATION ---
const WELLNESS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTY4enw_CNuDrGT7PzL3ci9LDtCbfbLIZJl--zgUbKIRmbQuSLN8lZ64aN0RZmxTQyhMC5AKL5DU46m/pub?gid=0&single=true&output=csv';
const PREVENTION_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1v_jDkpaRaggahRIlmX5SHoKPIH1h7bKKMyN5gy-C1Aw/gviz/tq?tqx=out:csv';

// --- CONSTANTS ---
const LIFE_STAGE_TOOLTIPS = {
  dog: {
    puppy: "0-6m",
    adult: "<25 lbs = 6m-9y\n25-90 lbs = 6m-6y\n90+ lbs = 6m-4y",
    senior: "<25 lbs = 10+y\n25-90 lbs = 7+y\n90+ lbs = 5+y"
  },
  cat: {
    puppy: "0-6m",
    adult: "6m-9y",
    senior: "10+y"
  }
};

const BUNDLE_ITEM_ID = 'exam_bundle';
const BUNDLE_PUPPY_ID = 'puppy_bundle';
const BUNDLE_KITTEN_ID = 'kitten_bundle';
const BUNDLE_BASIC_PRICE_BASE = 225;

// --- ENHANCED ITEM INFORMATION ---
const getEnhancedInfo = (item, species, lifeStage) => {
  const name = (item.name || '').toLowerCase();
  const id = (item.id || '').toLowerCase();
  const cat = item.category || '';

  // Bundles
  if (id.includes('bundle')) return {
    title: item.name,
    what: "Discounted, all-inclusive packages designed to provide young and senior pets with their full series of exams, core vaccinations, and essential diagnostic screenings.",
    why: "Bundling these services ensures your pet stays on a strict medical schedule during their most vulnerable developmental stage while providing you with significant savings.",
    austin: "Central Texas has a high exposure rate for infectious diseases due to our year-round outdoor lifestyle. Establishing strong immunity is the best way to protect your new family member before they hit the trails or parks."
  };

  // Exams
  if (name.includes('exam') || name.includes('consult')) return {
    title: item.name,
    what: "A comprehensive 'nose-to-tail' physical assessment conducted by a veterinarian.",
    why: "Because pets age much faster than humans, an annual (or bi-annual) exam is critical for detecting early signs of disease-such as dental issues, heart murmurs, or new growths-that may not be visible at home.",
    austin: species === 'cat' 
      ? "Since cats are notorious for hiding subtle symptoms of disease, the regular exam can allow immediate intervention if abnormal changes occur."
      : "Keeping a close eye on your pet's health is crucial in Austin, where the intense summer heat and active outdoor lifestyle put extra physical demands on their bodies."
  };

  // DAP / Distemper Parvo
  if (name.includes('dap') || name.includes('distemper') || name.includes('parvo')) return {
    title: item.name,
    what: "A core vaccine that protects against three major viral diseases: Distemper, Adenovirus (Hepatitis), and Parvovirus.",
    why: "These diseases are highly contagious and can be fatal, especially Parvovirus, which survives in the environment for long periods. This vaccine is essential for every dog regardless of lifestyle.",
    austin: "With Austin's massive dog park culture and popular trails (like the Barton Creek Greenbelt), your dog has a high chance of encountering contaminated soil where Parvovirus thrives.",
    frequency: lifeStage === 'puppy' ? "Every 3-4 weeks until >16 weeks, then at the first annual appointment, then every 3 years thereafter." : "Every 3 years, if boosted on schedule."
  };

  // Rabies
  if (name.includes('rabies')) return {
    title: item.name,
    what: name.includes('purevax') ? "A specialized, non-adjuvanted vaccine designed specifically for the safety of cats to prevent Rabies." : "A vaccine that protects against the Rabies virus, which affects the central nervous system.",
    why: "Rabies is 100% fatal to pets and can be transmitted to humans. Vaccination is not only a top health priority but is strictly required by state and local law.",
    austin: "Central Texas and the Hill Country have very high populations of bats, skunks, and raccoons-the primary carriers of Rabies. Even indoor-only pets are at risk if a bat accidentally enters the home (a common occurrence in Austin).",
    frequency: species === 'cat' 
      ? (lifeStage === 'puppy' 
          ? "Given after 12wks of age and then at the first annual appointment, then every 1-3 years, depending on the formulation of the vaccine given (available in 1yr and 3yr formulations)." 
          : "PureVax formulations come in 1-year and 3-year options. Given every 1 or 3 years if previous vaccine was on schedule.")
      : (lifeStage === 'puppy'
          ? "Given after 12wks of age, then at the first annual appointment, then every 3 years thereafter if rabies is given on schedule."
          : "Every 3 years if previous rabies vaccine was on schedule.")
  };

  // Bordetella
  if (name.includes('bordetella') || name.includes('kennel')) return {
    title: item.name,
    what: "Often called the 'Kennel Cough' vaccine, it protects against the most common bacterial cause of infectious tracheobronchitis.",
    why: "It prevents harsh, hacking coughs and respiratory infections. This is a core vaccine at our practice, essential for dogs that interact with others.",
    austin: "An absolute must for Austin's dog-friendly patios, breweries, and busy daycare facilities where respiratory bugs spread rapidly through the air.",
    frequency: "Intranasal vaccine given every year."
  };

  // Leptospirosis
  if (name.includes('lepto')) return {
    title: item.name,
    what: "A core vaccine against a bacterial infection spread through the urine of wildlife (like raccoons, opossums, or rodents) often found in soil or standing water.",
    why: "Leptospirosis can cause life-threatening kidney or liver failure. It is also 'zoonotic,' meaning humans can contract the disease from their infected pets.",
    austin: "Extremely critical in Austin. Dogs easily contract Lepto by drinking from puddles, swimming in Lady Bird Lake or local creeks, or just sniffing areas where urban wildlife frequently travel in backyards.",
    frequency: "Every year for adult and senior dogs (If a puppy, first time receiving the vaccine, or if the vaccine has lapsed more than 15 months, it must be boosted 4 weeks later)."
  };

  // Canine Influenza
  if (name.includes('flu') || name.includes('influenza') || name.includes('civ')) return {
    title: item.name,
    what: "A vaccine that protects against the highly contagious 'dog flu' (H3N8 and H3N2 strains).",
    why: "Influenza is a social disease spread through respiratory droplets. It can cause severe coughing, fever, and in some cases, life-threatening pneumonia.",
    austin: "Flu outbreaks happen frequently in high-density social areas. If your dog visits Austin boarding facilities, groomers, or crowded dog parks, this is highly recommended.",
    frequency: "Every year for adult and senior dogs (If a puppy, first time receiving the vaccine, or if the vaccine has lapsed more than 15 months, it must be boosted 4 weeks later)."
  };

  // RCP / FVRCP
  if (name.includes('rcp') || name.includes('fvr')) return {
    title: item.name,
    what: "A core feline vaccine protecting against Rhinotracheitis, Calicivirus, and Panleukopenia.",
    why: "These viruses are highly contagious and cause severe respiratory infections or life-threatening feline distemper (Panleukopenia).",
    austin: "Even indoor-only cats in Austin should stay current, as you can easily track these hardy viruses into your home on your shoes after walking around your neighborhood.",
    frequency: lifeStage === 'puppy' ? "Boosted every 4 weeks until >16 weeks old, then every 3 years." : "Administered every 3 years, if given on schedule."
  };

  // FeLV (Vaccine)
  if ((name.includes('leukemia') || name.includes('felv')) && cat === 'Core') return {
    title: item.name,
    what: "A vaccine that protects against Feline Leukemia, a virus that weakens a cat's immune system and can cause cancer or severe anemia.",
    why: "FeLV is spread through close contact, such as grooming, biting, or sharing water bowls. Vaccination is highly recommended for all kittens and any adult cat with outdoor access.",
    austin: "Austin has a very large free-roaming and community cat population. If your cat ever steps onto the patio or back yard, they are at risk of encountering an infected stray.",
    frequency: lifeStage === 'puppy' ? "Two doses are given 3-4 weeks apart, then every 1-2 years based on lifestyle." : "Every 1-2 years based on lifestyle (Unless it is the first time given, in which case it is boosted 4 weeks later)."
  };

  // Heartworm Combo Lab
  if ((name.includes('combo') || name.includes('heartworm')) && cat === 'Labwork') return {
    title: item.name,
    what: "A blood test combined with a fecal screen to check for heartworms and common intestinal parasites.",
    why: "Heartworms are transmitted by mosquitoes and can cause permanent heart and lung damage. To ensure your pet's safety, we utilize advanced PCR technology that is significantly more sensitive than traditional microscopic screens. This DNA-based test can detect common intestinal parasites such as Giardia, Hookworms, and Roundworms-even when they are 'hidden' and not actively shedding eggs. This ensures your pet is truly clear of infection before continuing their essential monthly prevention.",
    austin: "Because Central Texas rarely gets hard freezes, both mosquitoes and intestinal parasites remain active threats nearly year-round. Heartworm disease is highly endemic to the Austin area, and our popular local parks, dog-friendly patios, and trails are frequent sources of parasitic exposure. Due to this high level of community traffic, using the most sensitive DNA screening available is critical to catch low-level or asymptomatic infections that traditional tests often miss.",
    frequency: "Screened every year."
  };

  // PCR / Fecal / Intestinal Parasite Screen
  if ((name.includes('pcr') || name.includes('parasite') || name.includes('fecal')) && cat === 'Labwork') return {
    title: item.name,
    what: "A highly advanced diagnostic test that uses PCR (Polymerase Chain Reaction) technology to detect the DNA of specific parasites in a stool sample.",
    why: "PCR is significantly more sensitive than traditional microscopic screens. It detects parasites like Giardia, Roundworms, Hookworms, and Whipworms even when they aren't actively shedding eggs.",
    austin: "Austin's warm, humid climate allows intestinal parasites to survive and thrive year-round in the soil of our parks, trails, and even your own backyard.",
    frequency: "Screened every year."
  };

  // FIV/FeLV Lab
  if ((id.includes('fiv') || name.includes('fiv')) && cat === 'Labwork') return {
    title: item.name,
    what: "A rapid blood test that screens for Feline Leukemia Virus (FeLV) and Feline Immunodeficiency Virus (FIV).",
    why: "These viruses can be passed from a mother cat to her kittens or through social contact. Testing is essential to understand your cat's health status and ensure they receive appropriate care.",
    austin: "Knowing your cat's status helps protect them and the large local feline community in Travis County.",
    frequency: "Performed once as a kitten, and then recommended annually based on lifestyle."
  };

  // Adult Wellness Labwork
  if (id.includes('adult') && cat === 'Labwork') return {
    title: "Adult Early Detection Screening Labwork",
    what: "A blood panel (CBC and Chemistry) that checks organ function, including the kidneys, liver, and blood sugar levels.",
    why: "These tests provide a 'window' inside the body, allowing us to establish a healthy baseline and catch metabolic changes long before your pet acts or feels sick.",
    austin: null
  };

  // Senior Wellness Labwork
  if (id.includes('senior') && cat === 'Labwork') return {
    title: "Senior Early Detection Screening Labwork",
    what: "Our most comprehensive diagnostic screen, including a Complete Blood Cell Count (CBC), expanded organ chemistries, thyroid (T4) testing, urinalysis, and an intestinal parasite screen.",
    why: "As pets age, the risk of 'hidden' diseases like kidney/liver disease, thyroid disease, or diabetes increases. This panel checks much more than standard screens to catch issues early when they are most manageable.",
    austin: null
  };

  // Prevention
  if (cat === 'Prevention') {
    let freqText = "Administered once every month.";
    if (name.includes('extended') || name.includes('6-month') || name.includes('12-month') || name.includes('injectable')) {
      freqText = "Given every 6 to 12 months.";
    }
    
    let whatText = "Protection against common parasites.";
    if (name.includes('all-in-one') || name.includes('combo') || name.includes('trio') || name.includes('quattro') || (name.includes('heartworm') && (name.includes('flea') || name.includes('tick')))) whatText = "Complete year-round protection against heartworms, fleas, ticks, and intestinal parasites.";
    else if (name.includes('heartworm') || name.includes('proheart') || name.includes('heartgard')) whatText = "Targeted protection against heartworm disease and intestinal parasites.";
    else if (name.includes('flea') || name.includes('tick') || name.includes('bravecto') || name.includes('nexgard')) whatText = "Targeted protection against fleas and ticks.";

    return {
      title: item.name,
      what: whatText,
      why: "Consistent prevention is far cheaper and safer than treating a parasitic infection once it has taken hold.",
      austin: "Because of our mild winters, parasites never go dormant in Austin. Skipping even one month of prevention significantly increases the risk of infection.",
      frequency: item.description || freqText
    };
  }

  // Fallback
  return {
    title: item.name,
    what: item.description || "Information about this recommended service.",
    why: null,
    austin: null
  };
};

// --- UTILITIES ---
const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; 
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      }
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.trim().toLowerCase());
  
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index] ? row[index].trim() : '';
      
      if (header.includes('price') || header === 'itemized_price') {
        value = parseFloat(value.replace(/\$/g, '').replace(/,/g, '')) || 0;
      }
      
      obj[header] = value;
    });
    
    if (obj.itemized_price === undefined || obj.itemized_price === 0) {
      obj.itemized_price = obj.price;
    }
    
    return obj;
  });
};

const getIconType = (item) => {
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  
  if (cat.includes('lab') || name.includes('test') || name.includes('panel')) return 'lab';
  if (name.includes('exam') || name.includes('consult')) return 'exam';
  if (cat.includes('prevention')) return 'prevention';
  return 'vaccine';
};

export default function App() {
  const [services, setServices] = useState([]);
  const [preventionServices, setPreventionServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  const [species, setSpecies] = useState('dog'); 
  const [lifeStage, setLifeStage] = useState('adult'); 
  const [lifestyle, setLifestyle] = useState({
    boarding: false, 
    outdoors: false, 
    grooming: false, 
  });
  const [labPreference, setLabPreference] = useState('comprehensive'); 
  const [isPuppySixMonths, setIsPuppySixMonths] = useState(false);
  
  // Prevention States
  const [petWeight, setPetWeight] = useState('');
  const [prevCoverage, setPrevCoverage] = useState('');
  const [prevSupply, setPrevSupply] = useState('6-Month');
  const [selectedPrevProductName, setSelectedPrevProductName] = useState('');
  const [isEconomicalSelected, setIsEconomicalSelected] = useState(false);
  const [isPrevDeclined, setIsPrevDeclined] = useState(false); 

  const [modalItem, setModalItem] = useState(null);
  
  const [declinedItems, setDeclinedItems] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [selectedRabiesId, setSelectedRabiesId] = useState(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modalItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [modalItem]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wellRes, prevRes] = await Promise.allSettled([
          fetch(WELLNESS_SHEET_URL),
          fetch(PREVENTION_SHEET_URL)
        ]);

        if (wellRes.status === 'fulfilled' && wellRes.value.ok) {
          const wellText = await wellRes.value.text();
          setServices(parseCSV(wellText));
        } else {
          throw new Error('Failed to fetch wellness data.');
        }

        if (prevRes.status === 'fulfilled' && prevRes.value.ok) {
          const prevText = await prevRes.value.text();
          const prevData = parseCSV(prevText).map(p => ({ ...p, category: 'Prevention' }));
          setPreventionServices(prevData);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading sheets:", err);
        setError("Could not load pricing data. Please check your internet connection.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync Prev Coverage when species changes
  useEffect(() => {
    if (species === 'cat') {
      setPrevCoverage('Heartworm/Flea/Tick'); // Force auto-select for cats
    } else {
      setPrevCoverage(''); // Let dog owners choose
    }
    setSelectedPrevProductName('');
    setIsEconomicalSelected(false);
    setIsPrevDeclined(false); 
  }, [species]);

  // Reset puppy 6 month check if life stage changes
  useEffect(() => {
    if (lifeStage !== 'puppy') {
      setIsPuppySixMonths(false);
    }
  }, [lifeStage]);

  const getMatchesSpecies = (item, currentSpecies) => {
    const itemSpeciesRaw = (item.species || '').toLowerCase();
    if (itemSpeciesRaw === 'all' || itemSpeciesRaw === 'any' || itemSpeciesRaw === '') return true;
    const speciesInSheet = itemSpeciesRaw.split(/[\s,]+/).filter(Boolean);
    const itemIsForBoth = speciesInSheet.includes('both');
    return speciesInSheet.includes(currentSpecies) || itemIsForBoth;
  };

  const getMatchesLifeStage = (item, currentStage) => {
    const itemStageRaw = (item.life_stage || '').toLowerCase().trim();
    if (itemStageRaw === 'all' || itemStageRaw === 'any' || itemStageRaw === '') return true;
    
    const stagesInSheet = itemStageRaw.split(/[\s,]+/).filter(Boolean);
    if (currentStage === 'puppy') {
      return stagesInSheet.includes('puppy') || stagesInSheet.includes('kitten');
    }
    return stagesInSheet.includes(currentStage);
  };

  const labVariants = useMemo(() => {
    if (!services.length) return { combo: null, hw: null, fecal: null };
    
    const candidates = services.filter(s => {
      const isLab = s.category === 'Labwork';
      const isNotComprehensive = s.trigger_tag !== 'comprehensive' && s.trigger_tag !== 'senior';
      return isLab && isNotComprehensive && getMatchesSpecies(s, species) && getMatchesLifeStage(s, lifeStage);
    });

    const combo = candidates.find(s => {
      const name = s.name.toLowerCase();
      return (name.includes('heartworm') && (name.includes('parasite') || name.includes('fecal'))) || name.includes('bundle') || name.includes('combo');
    });

    const hw = candidates.find(s => {
      const name = s.name.toLowerCase();
      return name.includes('heartworm') && !name.includes('parasite') && !name.includes('fecal');
    });

    const fecal = candidates.find(s => {
      const name = s.name.toLowerCase();
      return (name.includes('parasite') || name.includes('fecal')) && !name.includes('heartworm');
    });

    return { combo, hw, fecal };
  }, [services, species, lifeStage]);

  const rabiesVariants = useMemo(() => {
    if (species !== 'cat' || lifeStage === 'puppy') return { yr1: null, yr3: null };

    const candidates = services.filter(s => 
      s.category === 'Core' &&
      getMatchesSpecies(s, 'cat') && 
      getMatchesLifeStage(s, lifeStage) &&
      s.name.toLowerCase().includes('rabies')
    );

    const yr3 = candidates.find(s => s.name.toLowerCase().includes('3yr') || s.name.toLowerCase().includes('3 yr'));
    const yr1 = candidates.find(s => s.name.toLowerCase().includes('1yr') || s.name.toLowerCase().includes('1 yr'));

    return { yr1, yr3 };
  }, [services, species, lifeStage]);

  // --- PREVENTION LOGIC ---

  const availablePreventions = useMemo(() => {
    if (isPrevDeclined || !petWeight || !prevCoverage || !preventionServices.length) return [];
    const weight = parseFloat(petWeight);
    if (isNaN(weight) || weight <= 0) return [];

    const priceKey = prevSupply === '6-Month' ? '6-month price' : '12-month price';

    return preventionServices.filter(p => {
      if (!p.species || p.species.toLowerCase() !== species.toLowerCase()) return false;
      
      const min = parseFloat(p['weight min'] || 0);
      const max = parseFloat(p['weight max'] || 999);
      if (weight < min || weight > max) return false;

      const cov = (p.coverage || '').toLowerCase();
      const selCov = prevCoverage.toLowerCase();
      if (cov !== selCov) return false;

      // Puppy exclusion rules for certain long-acting products
      if (lifeStage === 'puppy') {
        const n = (p['product name'] || '').toLowerCase();
        if (n.includes('bravecto') || n.includes('proheart')) return false;
      }

      if (!p[priceKey] || p[priceKey] <= 0 || isNaN(p[priceKey])) return false;

      return true;
    });
  }, [preventionServices, species, petWeight, prevCoverage, lifeStage, prevSupply, isPrevDeclined]);

  const activePrevention = useMemo(() => {
    if (!availablePreventions.length) return null;
    
    const priceKey = prevSupply === '6-Month' ? '6-month price' : '12-month price';
    
    if (isEconomicalSelected) {
      return availablePreventions.reduce((minItem, currentItem) => 
        currentItem[priceKey] < minItem[priceKey] ? currentItem : minItem
      , availablePreventions[0]);
    }

    return availablePreventions.find(p => p['product name'] === selectedPrevProductName) || null;
  }, [availablePreventions, isEconomicalSelected, selectedPrevProductName, prevSupply]);

  useEffect(() => {
    if (labVariants.combo && !selectedLabId) {
      setSelectedLabId(labVariants.combo.id);
    }
  }, [labVariants, selectedLabId]);

  useEffect(() => {
    if (species === 'cat' && lifeStage !== 'puppy') {
       if (rabiesVariants.yr3 && selectedRabiesId !== rabiesVariants.yr3.id && selectedRabiesId !== rabiesVariants.yr1?.id) {
         setSelectedRabiesId(rabiesVariants.yr3.id);
       } else if (rabiesVariants.yr1 && !rabiesVariants.yr3 && !selectedRabiesId) {
         setSelectedRabiesId(rabiesVariants.yr1.id);
       }
    }
  }, [rabiesVariants, species, lifeStage, selectedRabiesId]);

  const getItemType = (item) => {
    if (!item) return 'other';
    const cat = item.category;
    const tag = item.trigger_tag;
    const type = getIconType(item);
    const name = (item.name || '').toLowerCase();
    const isCombo = name.includes('heartworm') && (name.includes('parasite') || name.includes('fecal'));

    if (item.id === 'lab_pcr' || item.id === 'lab_fivfelv' || item.id === 'lab_fiv_felv') return 'basic_lab';

    const isPuppyBundleVaccine = species === 'dog' && (name.includes('rabies') || name.includes('dap') || name.includes('lepto') || name.includes('bord'));
    if (lifeStage === 'puppy' && isPuppyBundleVaccine) return 'puppy_vax';

    const isKittenBundleVaccine = species === 'cat' && (
        name.includes('rabies') || 
        name.includes('rcp') || 
        name.includes('fvr') || 
        name.includes('leukemia') || 
        name.includes('felv')
    );
    if (lifeStage === 'puppy' && isKittenBundleVaccine) return 'kitten_vax';

    if (cat === 'Core' && type === 'exam') return 'exam';
    if (cat === 'Core' && type === 'vaccine') return 'core_vaccine';
    if (cat === 'Labwork' && (isCombo || tag === 'basic' || item.isLabVariant)) return 'basic_lab'; 
    if (cat === 'Labwork' && (tag === 'comprehensive' || tag === 'senior')) return 'comp_lab';
    if (cat === 'Prevention') return 'prevention';
    return 'other';
  };

  const recommendations = useMemo(() => {
    if (loading || error) return [];

    let recs = [];
    const matchesSpecies = (s) => getMatchesSpecies(s, species);
    const matchesLifeStage = (s) => getMatchesLifeStage(s, lifeStage);
    
    // 1. Core items
    recs = recs.concat(services.filter(s => {
      if (s.category !== 'Core' || !matchesSpecies(s) || !matchesLifeStage(s)) return false;
      if (species === 'cat' && lifeStage !== 'puppy' && s.name.toLowerCase().includes('rabies')) return false;
      return true;
    }));

    if (species === 'cat' && lifeStage === 'puppy') {
       const kittenVax = services.filter(s => {
          const name = s.name.toLowerCase();
          const isVax = name.includes('rabies') || name.includes('rcp') || name.includes('fvr') || name.includes('leukemia') || name.includes('felv');
          return isVax && matchesSpecies(s) && matchesLifeStage(s);
       });
       recs = recs.concat(kittenVax);
    }

    if (species === 'cat' && lifeStage !== 'puppy' && (rabiesVariants.yr3 || rabiesVariants.yr1)) {
        const activeRabies = [rabiesVariants.yr3, rabiesVariants.yr1].find(r => r && r.id === selectedRabiesId);
        const itemToAdd = activeRabies || rabiesVariants.yr3 || rabiesVariants.yr1;
        if (itemToAdd) recs.push({ ...itemToAdd, isRabiesVariant: true });
    }

    if (lifestyle.boarding) {
      recs = recs.concat(services.filter(s => matchesSpecies(s) && matchesLifeStage(s) && (s.trigger_tag === 'boarding')));
    }
    if (lifestyle.outdoors) {
      recs = recs.concat(services.filter(s => matchesSpecies(s) && matchesLifeStage(s) && (s.trigger_tag === 'outdoors' || s.trigger_tag === 'outside')));
    }

    const labItems = services.filter(s => s.category === 'Labwork' && matchesSpecies(s) && matchesLifeStage(s));
    const isComprehensive = labPreference === 'comprehensive';
    const isPuppy = lifeStage === 'puppy'; 

    if (labVariants.combo || labVariants.hw || labVariants.fecal) {
        if (species === 'cat' && lifeStage !== 'puppy') {
             if (labVariants.fecal) {
                recs.push(labVariants.fecal);
             } else if (labVariants.combo) {
                recs.push(labVariants.combo);
             }
        } else {
             const activeVariant = [labVariants.combo, labVariants.hw, labVariants.fecal].find(v => v && v.id === selectedLabId);
             if (activeVariant) {
               recs.push({ ...activeVariant, isLabVariant: true });
             } else if (labVariants.combo) {
               recs.push({ ...labVariants.combo, isLabVariant: true });
             }
        }
    } else {
        recs = recs.concat(labItems.filter(s => s.trigger_tag === 'basic'));
    }

    if (isPuppy) {
      const pcrItem = services.find(s => s.id === 'lab_pcr' && matchesSpecies(s) && matchesLifeStage(s));
      if (pcrItem) recs.push(pcrItem);
      
      if (species === 'cat') {
        const fivItem = services.find(s => (s.id === 'lab_fivfelv' || s.id === 'lab_fiv_felv') && matchesSpecies(s) && matchesLifeStage(s));
        if (fivItem) recs.push(fivItem);
      }
      
      // Mid-series Heartworm Screen for older puppies
      if (isPuppySixMonths) {
         const hwItem = services.find(s => s.category === 'Labwork' && s.name.toLowerCase().includes('heartworm') && !s.name.toLowerCase().includes('fecal') && !s.name.toLowerCase().includes('parasite') && getMatchesSpecies(s, species));
         if (hwItem) recs.push({ ...hwItem, isLabVariant: false }); 
      }
      
      const bundleId = species === 'dog' ? BUNDLE_PUPPY_ID : BUNDLE_KITTEN_ID;
      const youngBundle = services.find(s => s.id === bundleId && matchesSpecies(s) && matchesLifeStage(s));
      if (youngBundle) recs.push(youngBundle);
    }

    if (isComprehensive && !isPuppy) {
       recs = recs.concat(labItems.filter(s => s.trigger_tag === 'senior' || s.trigger_tag === 'comprehensive'));
    }
    
    // Adult Bundle Item Row
    const bundleRow = services.find(s => s.id === BUNDLE_ITEM_ID && matchesSpecies(s) && matchesLifeStage(s));
    if (bundleRow && !isPuppy) recs.push(bundleRow);

    // --- Inject Active Prevention Selection ---
    if (!isPrevDeclined && activePrevention) {
      const priceKey = prevSupply === '6-Month' ? '6-month price' : '12-month price';
      const price = activePrevention[priceKey];
      
      let displayName = `${activePrevention['product name']} (${prevSupply} Supply)`;
      if (activePrevention['product name'].toLowerCase().includes('proheart 12') && prevSupply === '12-Month') {
        displayName = displayName.replace(/\(12-Month Supply\)/i, '(12 month Coverage Injection)');
      } else if (activePrevention['product name'].toLowerCase().includes('proheart 12')) {
        displayName = `${activePrevention['product name']} (12 month Coverage Injection)`;
      }

      recs.push({
        id: 'prev_' + activePrevention['product name'],
        name: displayName,
        category: 'Prevention',
        description: activePrevention.description,
        price: price,
        itemized_price: price,
        isPrevention: true
      });
    }

    const uniqueRecs = [...new Map(recs.map(item => [item.id || item.name, item])).values()];
    const comprehensiveIds = ['lab_adultk9', 'lab_adultfe', 'lab_seniork9', 'lab_seniorfe'];
    const standaloneIds = ['lab_hw-pcr', 'lab_hw', 'lab_pcr'];
    const hasComprehensive = uniqueRecs.some(item => comprehensiveIds.includes(item.id));

    return uniqueRecs.map(item => {
      let newItem = { ...item };
      
      if (hasComprehensive && standaloneIds.includes(newItem.id)) {
        newItem.isIncludedInComp = true;
      }
      
      // Dynamic renaming for Adult/Senior labwork items
      if (newItem.category === 'Labwork') {
          if (newItem.id.includes('adult')) newItem.name = "Adult Early Detection Screening Labwork";
          if (newItem.id.includes('senior')) newItem.name = "Senior Early Detection Screening Labwork";
      }

      return newItem;
    });
  }, [species, lifeStage, lifestyle, labPreference, services, loading, error, labVariants, selectedLabId, rabiesVariants, selectedRabiesId, activePrevention, prevSupply, isPrevDeclined, isPuppySixMonths]);

  const { totalItemizedValue, displayTotal, activeBundle } = useMemo(() => {
    const acceptedItems = recommendations.filter(item => !declinedItems.includes(item.id));
    
    const hasFullBundle = acceptedItems.some(i => i.id === BUNDLE_ITEM_ID);
    const hasPuppyBundle = acceptedItems.some(i => i.id === BUNDLE_PUPPY_ID);
    const hasKittenBundle = acceptedItems.some(i => i.id === BUNDLE_KITTEN_ID);

    const hasExam = acceptedItems.some(i => getItemType(i) === 'exam');
    const hasBasicLab = acceptedItems.some(i => getItemType(i) === 'basic_lab');
    const hasCoreVax = acceptedItems.some(i => getItemType(i) === 'core_vaccine');

    const compLabIds = ['lab_adultk9', 'lab_adultfe', 'lab_seniork9', 'lab_seniorfe'];
    const hasCompLabSelected = acceptedItems.some(item => compLabIds.includes(item.id));

    let bundleType = null;
    if (hasFullBundle || hasPuppyBundle || hasKittenBundle) {
        bundleType = 'full';
    } else if (hasExam && hasBasicLab && !hasCoreVax && (labPreference === 'basic' || species === 'dog') && lifeStage !== 'puppy') {
        bundleType = 'basic';
    }

    const itemizedTotal = acceptedItems.reduce((sum, item) => {
        if (item.id === BUNDLE_ITEM_ID || item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID) return sum;
        return sum + (item.itemized_price || 0);
    }, 0);

    let finalTotal = 0;
    if (bundleType === 'basic') {
        finalTotal = BUNDLE_BASIC_PRICE_BASE;
        acceptedItems.forEach(item => {
            const type = getItemType(item);
            if (type !== 'exam' && type !== 'basic_lab') {
                finalTotal += (item.price || 0);
            }
        });
    } else if (bundleType === 'full') {
        const isPuppyBundleActive = acceptedItems.some(i => i.id === BUNDLE_PUPPY_ID);
        const isKittenBundleActive = acceptedItems.some(i => i.id === BUNDLE_KITTEN_ID);
        
        acceptedItems.forEach(item => {
            const type = getItemType(item);
            const isCoreComponent = ['exam', 'core_vaccine', 'basic_lab'].includes(type);
            const isPuppyComponent = isPuppyBundleActive && ['exam', 'puppy_vax', 'basic_lab'].includes(type);
            const isKittenComponent = isKittenBundleActive && ['exam', 'kitten_vax', 'basic_lab'].includes(type);
            
            const isIncludedComponent = isCoreComponent || isPuppyComponent || isKittenComponent;
            const isBundleId = item.id === BUNDLE_ITEM_ID || item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID;

            if (isIncludedComponent && !isBundleId) {
                finalTotal += 0;
            } else {
                finalTotal += (item.price || 0);
            }
        });
    } else {
        acceptedItems.forEach(item => {
          const type = getItemType(item);
          if (type === 'basic_lab' && hasCompLabSelected) {
            finalTotal += 0;
          } else {
            finalTotal += (item.itemized_price || 0);
          }
        });
    }

    return { 
        totalItemizedValue: itemizedTotal, 
        displayTotal: finalTotal, 
        activeBundle: bundleType 
    };
  }, [recommendations, declinedItems, species, labPreference, lifeStage]);

  useEffect(() => {
    const acceptedIds = recommendations.filter(r => !declinedItems.includes(r.id)).map(r => r.id);
    const compLabIds = ['lab_adultk9', 'lab_adultfe', 'lab_seniork9', 'lab_seniorfe'];
    const hasComp = acceptedIds.some(id => compLabIds.includes(id));
    const isBundleActive = acceptedIds.includes(BUNDLE_ITEM_ID) || acceptedIds.includes(BUNDLE_PUPPY_ID) || acceptedIds.includes(BUNDLE_KITTEN_ID);
    
    if ((isBundleActive || hasComp) && labVariants.combo && selectedLabId !== labVariants.combo.id) {
       setSelectedLabId(labVariants.combo.id);
    }
  }, [recommendations, labVariants, selectedLabId, declinedItems]);

  const toggleLifestyle = (key) => setLifestyle(prev => ({ ...prev, [key]: !prev[key] }));
  
  const toggleItemDecline = (id) => {
    const item = recommendations.find(r => r.id === id);
    if (!item) return;
    const itemType = getItemType(item);
    
    // Prevent declining exam OR comprehensive labwork (when "Best Medicine" is selected)
    const isUndeniable = itemType === 'exam' || (labPreference === 'comprehensive' && item.category === 'Labwork' && lifeStage !== 'puppy') || item.isPrevention;
    if (isUndeniable) return; 

    setDeclinedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Render Modal Information
  const renderModal = () => {
    if (!modalItem) return null;
    const info = getEnhancedInfo(modalItem, species, lifeStage);
    
    const mItemType = getItemType(modalItem);
    const mIconType = getIconType(modalItem);
    let modalDisplayCategory = modalItem.category;
    if (mItemType === 'exam') modalDisplayCategory = 'Required';
    else if (mIconType === 'vaccine') modalDisplayCategory = 'Vaccine';
    else if (mIconType === 'prevention') modalDisplayCategory = 'Prevention';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          onClick={() => setModalItem(null)}
        />
        
        <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
            <div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block">
                {modalDisplayCategory}
              </span>
              <h3 className="text-xl font-bold text-slate-800 leading-tight pr-4">
                {info.title}
              </h3>
            </div>
            <button 
              onClick={() => setModalItem(null)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors self-start"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 leading-relaxed">
            <div>
              <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2 text-base">
                <Stethoscope size={18} className="text-blue-500" />
                What it is
              </h4>
              <p className="text-sm">{info.what}</p>
            </div>

            {info.frequency && (
              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2 text-base">
                  <Clock size={18} className="text-blue-500" />
                  How often is it given?
                </h4>
                <p className="text-sm">{info.frequency}</p>
              </div>
            )}

            {info.why && (
              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2 text-base">
                  <ShieldAlert size={18} className="text-blue-500" />
                  Why it's important
                </h4>
                <p className="text-sm">{info.why}</p>
              </div>
            )}

            {info.austin && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                <h4 className="flex items-center gap-2 font-bold text-orange-800 mb-2 text-sm">
                  <MapPin size={16} className="text-orange-500" />
                  Why this matters in Austin
                </h4>
                <p className="text-sm text-orange-900 leading-relaxed">{info.austin}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
      <div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={48} /><p>Loading current prices...</p></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} /><h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Data</h2><p className="text-slate-600 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      
      {renderModal()}

      <header className="bg-blue-600 text-white pt-6 pb-5 px-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-2xl mx-auto flex flex-col items-center sm:items-start text-center sm:text-left relative z-10">
          <div className="bg-white px-4 py-3 rounded-2xl shadow-md mb-4 flex items-center justify-center border border-blue-400/30">
            {imgError ? (
              <span className="font-bold text-blue-800 text-lg">Bluebonnet Animal Hospital</span>
            ) : (
              <img src="/logo.jpg" alt="Bluebonnet Animal Hospital" className="h-10 sm:h-14 object-contain" onError={() => setImgError(true)} />
            )}
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <PawPrint className="fill-blue-400 text-blue-200 opacity-90" size={22} />
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white drop-shadow-sm">
              Wellness Visit Navigator
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-2">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> 1. Pet Profile</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => setSpecies('dog')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${species === 'dog' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}><Dog size={32} /><span className="font-medium">Dog</span></button>
            <button onClick={() => setSpecies('cat')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${species === 'cat' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}><Cat size={32} /><span className="font-medium">Cat</span></button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {['puppy', 'adult', 'senior'].map((stage) => (
              <div key={stage} className="flex flex-col">
                <button 
                  onClick={() => setLifeStage(stage)} 
                  className={`w-full py-2.5 rounded-lg text-sm font-bold capitalize transition-all border-2 ${
                    lifeStage === stage 
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {stage === 'puppy' ? (species === 'cat' ? 'Kitten' : 'Puppy') : stage}
                </button>
                <div className="text-[11px] text-slate-500 text-center whitespace-pre-line leading-relaxed mt-2 px-1 font-medium">
                  {LIFE_STAGE_TOOLTIPS[species][stage]}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 2. PREVENTION SECTION --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-500"/> 2. Prevention (Optional)
            </h2>
            
            {!isPrevDeclined && petWeight && (
              <button 
                onClick={() => {
                   setIsPrevDeclined(true);
                   setPetWeight('');
                   setSelectedPrevProductName('');
                   setIsEconomicalSelected(false);
                }}
                className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <X size={14} /> Decline
              </button>
            )}
          </div>
          
          {isPrevDeclined ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center animate-in fade-in">
               <div className="flex items-center gap-3">
                 <Square size={20} className="text-slate-400 shrink-0" />
                 <span className="text-sm text-slate-500 font-medium">Prevention declined</span>
               </div>
               <button 
                 onClick={() => setIsPrevDeclined(false)}
                 className="text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-full transition-colors"
               >
                 Re-add
               </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Weight size={16} /> Pet Weight (lbs)
                </label>
                <input 
                  type="number" 
                  value={petWeight} 
                  onChange={(e) => setPetWeight(e.target.value)} 
                  placeholder="Enter weight in lbs" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
                />
                {lifeStage === 'puppy' && (
                  <div className="mt-3 text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                    <Info className="shrink-0 mt-0.5" size={14} />
                    <p><strong>Note for growing pets:</strong> It is recommended to get product month-to-month until your pet is in a stable weight range for the product they will be on long-term.</p>
                  </div>
                )}
              </div>

              {petWeight && parseFloat(petWeight) > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  
                  {/* Coverage Needed */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Coverage Needed</label>
                    {species === 'dog' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {['Heartworm/Flea/Tick', 'Heartworm', 'Flea/Tick'].map(cov => (
                          <button 
                            key={cov} 
                            onClick={() => setPrevCoverage(cov)} 
                            className={`px-3 py-2.5 text-sm border rounded-lg font-medium transition-colors ${prevCoverage === cov ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            {cov === 'Heartworm/Flea/Tick' ? 'All-in-One Combo' : cov + ' Only'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button 
                          className="px-3 py-2.5 text-sm border rounded-lg font-medium transition-colors bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                          disabled
                        >
                          All-in-One Combo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Supply Length */}
                  {prevCoverage && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Supply Length</label>
                      <div className="flex gap-2">
                          {['6-Month', '12-Month'].map(sup => (
                            <button 
                              key={sup} 
                              onClick={() => setPrevSupply(sup)} 
                              className={`flex-1 px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${prevSupply === sup ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                              {sup} Supply
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Available Products List */}
                  {prevCoverage && availablePreventions.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-sm font-semibold text-slate-700">Select Product Preference</label>
                      
                      <button 
                        onClick={() => setIsEconomicalSelected(true)}
                        className={`w-full text-left p-3 border rounded-xl flex items-center justify-between transition-all ${isEconomicalSelected ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-white border-slate-200 hover:border-green-300'}`}
                      >
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              Most Economical Option <Tag size={14} className="text-green-600"/>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Automatically picks the lowest cost product for a {prevSupply.toLowerCase()} supply.</div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isEconomicalSelected ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                            {isEconomicalSelected && <Check size={12} className="text-white"/>}
                          </div>
                      </button>

                      {availablePreventions.map(p => {
                          const isSelected = !isEconomicalSelected && selectedPrevProductName === p['product name'];
                          const price = p[prevSupply === '6-Month' ? '6-month price' : '12-month price'];
                          
                          return (
                            <button 
                              key={p['product name']}
                              onClick={() => { setIsEconomicalSelected(false); setSelectedPrevProductName(p['product name']); }}
                              className={`w-full text-left p-3 border rounded-xl flex items-center justify-between transition-all ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                            >
                              <div className="pr-4">
                                <div className="font-bold text-slate-800">{p['product name']}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                  <Clock size={12} className="text-slate-400"/> 
                                  {p.description || "View schedule"}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                  <div className="font-semibold text-slate-700">${price.toFixed(2)}</div>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                    {isSelected && <Check size={12} className="text-white"/>}
                                  </div>
                              </div>
                            </button>
                          );
                      })}
                    </div>
                  )}
                  
                  {prevCoverage && availablePreventions.length === 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                      <Info className="text-orange-500 shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-orange-800 leading-relaxed">
                        No matching products were found for a {species} weighing {petWeight} lbs requiring {prevCoverage} coverage for a {prevSupply} supply.
                        {lifeStage === 'puppy' && " Note: Certain long-acting products are restricted for puppies."}
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </section>

        {!(species === 'cat' && lifeStage === 'puppy') && (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><ShieldAlert size={20} className="text-blue-500"/> 3. Lifestyle & Risk</h2>
          
          {lifeStage === 'puppy' && species === 'dog' && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isPuppySixMonths ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                  {isPuppySixMonths && <Check size={14} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={isPuppySixMonths} onChange={() => setIsPuppySixMonths(!isPuppySixMonths)} />
                <span className="flex-1 text-sm font-medium text-slate-700">Has your puppy reached 6 months of age?</span>
              </label>
            </div>
          )}

          <div className="space-y-3">
            {species === 'dog' && (
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${lifestyle.boarding ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{lifestyle.boarding && <Check size={14} className="text-white" />}</div>
                <input type="checkbox" className="hidden" checked={lifestyle.boarding} onChange={() => toggleLifestyle('boarding')} /><span className="flex-1 text-sm">Goes to Boarding, Grooming, or Daycare?</span>
              </label>
            )}
            {species === 'cat' && (
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${lifestyle.outdoors ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{lifestyle.outdoors && <Check size={14} className="text-white" />}</div>
                <input type="checkbox" className="hidden" checked={lifestyle.outdoors} onChange={() => toggleLifestyle('outdoors')} /><span className="flex-1 text-sm">Goes Outdoors?</span>
              </label>
            )}
          </div>
          {lifeStage !== 'puppy' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold mb-3">Labwork Preference</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setLabPreference('comprehensive')} 
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${labPreference === 'comprehensive' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                  >
                    Best Medicine (Recommended)
                  </button>
                  <button 
                    onClick={() => setLabPreference('basic')} 
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${labPreference === 'basic' ? 'bg-slate-200 border-slate-300 text-slate-800 shadow-inner' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Essential
                  </button>
                </div>
            </div>
          )}
        </section>
        )}

        <section className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-slate-800 text-white p-4 sticky top-0 z-10 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-semibold flex items-center gap-2"><Calculator size={18} /> Estimated Visit</h2>
              <div className="text-right">
                {activeBundle && totalItemizedValue > displayTotal ? (
                  <>
                     <div className="text-sm text-slate-400 line-through mr-2 inline-block">${totalItemizedValue.toFixed(2)}</div>
                     <div className="text-xl font-bold text-green-400 inline-block">${displayTotal.toFixed(2)}</div>
                  </>
                ) : (
                  <div className="text-xl font-bold">${displayTotal.toFixed(2)}</div>
                )}
              </div>
            </div>
            {activeBundle && (
               <div className="flex justify-end">
                 <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                   <Tag size={10} /> 
                   {activeBundle === 'full' 
                      ? (lifeStage === 'puppy' ? (species === 'cat' ? 'Kitten Bundle Applied' : 'Puppy Bundle Applied') : 'Wellness Bundle Applied') 
                      : 'Basic Bundle Applied'}
                 </span>
               </div>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {recommendations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Select options above to build your visit</div>
            ) : (
              recommendations.map((item) => {
                const iconType = getIconType(item);
                const isDeclined = declinedItems.includes(item.id);
                const itemType = getItemType(item);
                
                const isBundleActive = activeBundle !== null;
                const acceptedIds = recommendations.filter(r => !declinedItems.includes(r.id)).map(r => r.id);
                const isPuppyBundleActive = acceptedIds.includes(BUNDLE_PUPPY_ID);
                const isKittenBundleActive = acceptedIds.includes(BUNDLE_KITTEN_ID);
                const compLabIds = ['lab_adultk9', 'lab_adultfe', 'lab_seniork9', 'lab_seniorfe'];
                const hasCompLabSelected = acceptedIds.some(id => compLabIds.includes(id));

                let isIncluded = false;
                if (isPuppyBundleActive) {
                    isIncluded = item.id !== BUNDLE_PUPPY_ID && ['exam', 'puppy_vax', 'basic_lab'].includes(itemType);
                } else if (isKittenBundleActive) {
                    isIncluded = item.id !== BUNDLE_KITTEN_ID && ['exam', 'kitten_vax', 'basic_lab'].includes(itemType);
                } else {
                    isIncluded = (isBundleActive) && 
                                   item.id !== BUNDLE_ITEM_ID && 
                                   ['exam', 'core_vaccine', 'basic_lab'].includes(itemType);
                }
                
                const isBasicLabInComp = !isPuppyBundleActive && !isKittenBundleActive && hasCompLabSelected && itemType === 'basic_lab';

                let displayCategory = item.category;
                if (itemType === 'exam') displayCategory = 'Required';
                else if (iconType === 'vaccine') displayCategory = 'Vaccine';
                else if (iconType === 'prevention') displayCategory = 'Prevention';

                const isUndeniable = itemType === 'exam' || (labPreference === 'comprehensive' && item.category === 'Labwork' && lifeStage !== 'puppy') || iconType === 'prevention';

                return (
                  <div key={item.id} className={`group transition-all duration-300 border-l-4 ${isDeclined ? 'opacity-50 grayscale' : ''} ${isIncluded ? 'border-indigo-400 bg-indigo-50/30 pl-10 shadow-inner' : 'border-transparent pl-4 hover:bg-slate-50'}`}>
                    <div className="pr-4 py-4 flex justify-between items-start gap-3">
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleItemDecline(item.id); }} 
                        className={`mt-1 focus:outline-none relative group ${isUndeniable ? 'cursor-not-allowed' : 'hover:text-blue-600'}`}
                        disabled={isUndeniable}
                      >
                        {isDeclined ? (
                           <Square size={20} className="text-slate-400" />
                        ) : (
                           <div className={`rounded text-white ${isUndeniable ? 'bg-slate-300' : 'bg-blue-600'}`}>
                             <Check size={20} />
                           </div>
                        )}
                        
                        {!isUndeniable && (
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                            {isDeclined ? "Re-add to Visit" : "Decline Service"}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                          </div>
                        )}
                      </button>

                      <div className="mt-1 text-slate-400">
                        {iconType === 'vaccine' && <Syringe size={18} />}
                        {iconType === 'lab' && <Activity size={18} />}
                        {iconType === 'exam' && <Heart size={18} />}
                        {iconType === 'prevention' && <ShieldCheck size={18} />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 cursor-pointer" onClick={() => setModalItem(item)}>
                             <span className={`font-medium ${isDeclined ? ((item.id === BUNDLE_ITEM_ID || item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID) ? 'text-slate-400' : 'text-slate-500 line-through') : 'text-slate-800'}`}>
                               {item.name}
                             </span>
                             {(isIncluded || (isBasicLabInComp && !isDeclined)) && (
                               <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-0.5">
                                 <Check size={10} /> {(isIncluded) ? 'Included in Bundle' : 'Included with Panel'}
                               </div>
                             )}
                          </div>
                          <div className="text-right pl-2">
                             <div className="flex flex-col items-end">
                               {/* Strikethrough Logic */}
                               {(!isDeclined && item.id !== BUNDLE_ITEM_ID && item.id !== BUNDLE_PUPPY_ID && item.id !== BUNDLE_KITTEN_ID && (isIncluded || isBasicLabInComp || (isBundleActive && !item.isPrevention && item.itemized_price > item.price))) && (
                                 <span className="text-[10px] text-slate-400 line-through italic">${item.itemized_price.toFixed(2)}</span>
                               )}
                               <span className={`font-semibold block ${isIncluded || (isBasicLabInComp && !isDeclined) ? 'text-indigo-600' : 'text-slate-700'}`}>
                                 {isIncluded || (isBasicLabInComp && !isDeclined) ? 'Included' : 
                                  ((item.id === BUNDLE_ITEM_ID || item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID) && isDeclined) ? '$0.00' :
                                  `$${(isBundleActive && !isDeclined && !item.isPrevention ? item.price : item.itemized_price).toFixed(2)}`}
                               </span>
                             </div>
                             
                             {/* LAB VARIANTS */}
                             {item.isLabVariant && !isDeclined && (
                               <div className="relative mt-1">
                                 <select 
                                   className="appearance-none bg-blue-50 border border-blue-200 text-blue-700 text-[10px] rounded py-1 pl-2 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                   value={selectedLabId || ''}
                                   onChange={(e) => setSelectedLabId(e.target.value)}
                                   onClick={(e) => e.stopPropagation()}
                                   disabled={isBundleActive || hasCompLabSelected}
                                 >
                                   {labVariants.combo && <option value={labVariants.combo.id}>Combo (${(isBundleActive || hasCompLabSelected ? labVariants.combo.price : labVariants.combo.itemized_price).toFixed(2)})</option>}
                                   {labVariants.hw && <option value={labVariants.hw.id} disabled={isBundleActive || hasCompLabSelected}>Heartworm Only (${(isBundleActive || hasCompLabSelected ? labVariants.hw.price : labVariants.hw.itemized_price).toFixed(2)})</option>}
                                   {labVariants.fecal && <option value={labVariants.fecal.id} disabled={isBundleActive || hasCompLabSelected}>Fecal Only (${(isBundleActive || hasCompLabSelected ? labVariants.fecal.price : labVariants.fecal.itemized_price).toFixed(2)})</option>}
                                 </select>
                                 <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                               </div>
                             )}

                             {/* RABIES VARIANTS (CAT) */}
                             {item.isRabiesVariant && !isDeclined && (
                               <div className="relative mt-1">
                                 <select 
                                   className="appearance-none bg-blue-50 border border-blue-200 text-blue-700 text-[10px] rounded py-1 pl-2 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                   value={selectedRabiesId || ''}
                                   onChange={(e) => setSelectedRabiesId(e.target.value)}
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                   {rabiesVariants.yr3 && <option value={rabiesVariants.yr3.id}>3-Year Rabies (${(isBundleActive ? 0 : rabiesVariants.yr3.itemized_price).toFixed(2)})</option>}
                                   {rabiesVariants.yr1 && <option value={rabiesVariants.yr1.id}>1-Year Rabies (${(isBundleActive ? 0 : rabiesVariants.yr1.itemized_price).toFixed(2)})</option>}
                                 </select>
                                 <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                               </div>
                             )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 uppercase tracking-wider">
                            {displayCategory}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setModalItem(item); }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none ${
                              isDeclined 
                                ? 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200' 
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 hover:from-blue-100 hover:to-indigo-100 border border-indigo-100 hover:-translate-y-0.5'
                            }`}
                          >
                            <PawPrint size={14} className={isDeclined ? "text-slate-400" : "text-indigo-500"} /> 
                            {isDeclined ? 'Why do I need this?' : "The 'why' behind it"}
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Prices Disclaimer & Financing Link */}
          <div className="p-5 bg-indigo-50/50 border-t border-indigo-100 flex flex-col items-center gap-3">
             <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-indigo-100/50 w-full max-w-sm text-center">
                 <a href="https://bluebonnetah.com/payment-options/" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-bold hover:underline mb-2 block">
                    Want to explore our 0% interest payment options? Click here
                 </a>
                 <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-indigo-500 font-medium">
                    <span className="flex items-center gap-1"><Check size={12} /> Soft credit check</span>
                    <span className="flex items-center gap-1"><Check size={12} /> Flexible payment options</span>
                    <span className="flex items-center gap-1"><Check size={12} /> Fast approval</span>
                 </div>
             </div>
             <p className="text-[10px] text-slate-400 text-center mt-1">*Prices are estimates only. Prevention products are calculated separately based on weight.</p>
          </div>
        </section>

        {/* --- APP DOWNLOAD BANNER --- */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 mt-6">
          <div className="bg-blue-100 p-4 rounded-full text-blue-600 shrink-0">
            <Smartphone size={32} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Unsure about your pet's vaccine status?</h3>
            <p className="text-sm text-slate-600">
              View your pet's full medical profile, upcoming reminders, and appointment history securely on our app.
            </p>
          </div>
          <a 
            href="https://bluebonnetah.com/download-our-app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
          >
            Download App
          </a>
        </section>

      </main>
    </div>
  );
}