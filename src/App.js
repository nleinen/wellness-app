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
  ChevronDown
} from 'lucide-react';

// --- CONFIGURATION ---
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTY4enw_CNuDrGT7PzL3ci9LDtCbfbLIZJl--zgUbKIRmbQuSLN8lZ64aN0RZmxTQyhMC5AKL5DU46m/pub?gid=0&single=true&output=csv';

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
      
      if (header === 'price' || header === 'itemized_price') {
        value = parseFloat(value.replace('$', '')) || 0;
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
  return 'vaccine';
};

const LIFE_STAGE_TOOLTIPS = {
  dog: {
    puppy: "0-1y",
    adult: "<25 lbs = 1-9y\n25-90 lbs = 1-6y\n90+ lbs = 1-4y",
    senior: "<25 lbs = 10+y\n25-90 lbs = 7+y\n90+ lbs = 5+y"
  },
  cat: {
    puppy: "0-1y",
    adult: "1-9y",
    senior: "10+y"
  }
};

const BUNDLE_ITEM_ID = 'exam_bundle';
const BUNDLE_PUPPY_ID = 'puppy_bundle';
const BUNDLE_KITTEN_ID = 'kitten_bundle';
const BUNDLE_BASIC_PRICE_BASE = 225;

export default function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [species, setSpecies] = useState('dog'); 
  const [lifeStage, setLifeStage] = useState('adult'); 
  const [lifestyle, setLifestyle] = useState({
    boarding: false, 
    outdoors: false, 
    grooming: false, 
  });
  const [labPreference, setLabPreference] = useState('comprehensive'); 
  const [expandedItem, setExpandedItem] = useState(null);
  
  const [declinedItems, setDeclinedItems] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [selectedRabiesId, setSelectedRabiesId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Failed to fetch data');
        const text = await response.text();
        const parsedData = parseCSV(text);
        setServices(parsedData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading sheet:", err);
        setError("Could not load pricing data. Please check your internet connection.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (window.tailwindcss) return;
    const script = document.createElement('script');
    script.src = "https://cdn.tailwindcss.com";
    script.async = true;
    document.head.appendChild(script);
  }, []);

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

  // Rabies Variants (1yr vs 3yr) for Cats
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

    // Specifically identify items included in the Puppy Bundle
    const isPuppyBundleVaccine = species === 'dog' && (name.includes('rabies') || name.includes('dap') || name.includes('lepto') || name.includes('bord'));
    if (lifeStage === 'puppy' && isPuppyBundleVaccine) return 'puppy_vax';

    // Specifically identify items included in the Kitten Bundle
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
    
    // Updated basic lab logic to include lab_fiv_felv
    if (cat === 'Labwork' && (isCombo || tag === 'basic' || item.isLabVariant || item.id === 'lab_pcr' || item.id === 'lab_fivfelv' || item.id === 'lab_fiv_felv')) return 'basic_lab'; 
    if (cat === 'Labwork' && (tag === 'comprehensive' || tag === 'senior')) return 'comp_lab';
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
      // Exclude generic rabies if we are handling variants for adult cats
      if (species === 'cat' && lifeStage !== 'puppy' && s.name.toLowerCase().includes('rabies')) return false;
      return true;
    }));

    // Inject Rabies Variant for Cats (Adult/Senior)
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
      
      // Look for FIV test by either ID
      if (species === 'cat') {
        const fivItem = services.find(s => (s.id === 'lab_fivfelv' || s.id === 'lab_fiv_felv') && matchesSpecies(s) && matchesLifeStage(s));
        if (fivItem) recs.push(fivItem);
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

    const uniqueRecs = [...new Map(recs.map(item => [item.id, item])).values()];
    const comprehensiveIds = ['lab_adultk9', 'lab_adultfe', 'lab_seniork9', 'lab_seniorfe'];
    const standaloneIds = ['lab_hw-pcr', 'lab_hw', 'lab_pcr'];
    const hasComprehensive = uniqueRecs.some(item => comprehensiveIds.includes(item.id));

    return uniqueRecs.map(item => {
      if (hasComprehensive && standaloneIds.includes(item.id)) {
        return { ...item, isIncludedInComp: true };
      }
      return item;
    });
  }, [species, lifeStage, lifestyle, labPreference, services, loading, error, labVariants, selectedLabId, rabiesVariants, selectedRabiesId]);

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
    if (getItemType(item) === 'exam') return; 
    setDeclinedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isItemBundled = (item) => {
    if (!activeBundle) return false;
    const type = getItemType(item);
    
    const isPuppyBundleActive = recommendations.some(r => r.id === BUNDLE_PUPPY_ID && !declinedItems.includes(r.id));
    const isKittenBundleActive = recommendations.some(r => r.id === BUNDLE_KITTEN_ID && !declinedItems.includes(r.id));
    
    if (activeBundle === 'full') {
        if (isPuppyBundleActive) return ['exam', 'puppy_vax', 'basic_lab'].includes(type);
        if (isKittenBundleActive) return ['exam', 'kitten_vax', 'basic_lab'].includes(type);
        return ['exam', 'core_vaccine', 'basic_lab', 'comp_lab'].includes(type);
    }
    if (activeBundle === 'basic') return ['exam', 'basic_lab', 'comp_lab'].includes(type);
    return false;
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
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="fill-blue-400 text-blue-100" /> Bluebonnet Animal Hospital</h1>
          <p className="text-blue-100 text-sm mt-1">Wellness Visit Navigator</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><Activity size={20} className="text-blue-500"/> 1. Pet Profile</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button onClick={() => setSpecies('dog')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${species === 'dog' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}><Dog size={32} /><span className="font-medium">Dog</span></button>
            <button onClick={() => setSpecies('cat')} className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${species === 'cat' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}><Cat size={32} /><span className="font-medium">Cat</span></button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['puppy', 'adult', 'senior'].map((stage) => (
              <div key={stage} className="flex-1 relative group">
                <button onClick={() => setLifeStage(stage)} className={`w-full py-2 rounded-md text-sm font-medium capitalize transition-all ${lifeStage === stage ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {stage === 'puppy' ? (species === 'cat' ? 'Kitten' : 'Puppy') : stage}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-xl text-center">
                  <div className="font-semibold mb-1 text-slate-300 border-b border-slate-600 pb-1">Typical Age Range</div>
                  <div className="whitespace-pre-line leading-relaxed">{LIFE_STAGE_TOOLTIPS[species][stage]}</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {!(species === 'cat' && lifeStage === 'puppy') && (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2"><ShieldAlert size={20} className="text-blue-500"/> 2. Lifestyle & Risk</h2>
          <div className="space-y-3">
            {species === 'dog' && (
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${lifestyle.boarding ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{lifestyle.boarding && <Check size={14} className="text-white" />}</div>
                <input type="checkbox" className="hidden" checked={lifestyle.boarding} onChange={() => toggleLifestyle('boarding')} /><span className="flex-1">Goes to Boarding, Grooming, or Daycare?</span>
              </label>
            )}
            {species === 'cat' && (
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${lifestyle.outdoors ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{lifestyle.outdoors && <Check size={14} className="text-white" />}</div>
                <input type="checkbox" className="hidden" checked={lifestyle.outdoors} onChange={() => toggleLifestyle('outdoors')} /><span className="flex-1">Goes Outdoors?</span>
              </label>
            )}
          </div>
          {lifeStage !== 'puppy' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold mb-2">Labwork Preference</h3>
                <div className="flex gap-2">
                <button onClick={() => setLabPreference('basic')} className={`flex-1 px-3 py-2 text-sm border rounded-lg ${labPreference === 'basic' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200'}`}>Essential</button>
                <button onClick={() => setLabPreference('comprehensive')} className={`flex-1 px-3 py-2 text-sm border rounded-lg ${labPreference === 'comprehensive' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200'}`}>Best Medicine (Recommended)</button>
                </div>
            </div>
          )}
        </section>
        )}

        <section className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-slate-800 text-white p-4 sticky top-0 z-10">
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
                 <span className="text-xs font-semibold bg-green-500/20 text-green-300 px-2 py-0.5 rounded flex items-center gap-1">
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
                
                const isBasicLabInComp = hasCompLabSelected && itemType === 'basic_lab';

                return (
                  <div key={item.id} className={`group transition-all hover:bg-slate-50 ${isDeclined ? 'opacity-50 grayscale' : ''}`}>
                    <div className="p-4 flex justify-between items-start gap-3">
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleItemDecline(item.id); }} 
                        className={`mt-1 focus:outline-none relative group ${itemType === 'exam' ? 'cursor-not-allowed' : 'hover:text-blue-600'}`}
                        disabled={itemType === 'exam'}
                      >
                        {isDeclined ? (
                           <Square size={20} className="text-slate-400" />
                        ) : (
                           <div className={`rounded text-white ${itemType === 'exam' ? 'bg-slate-300' : 'bg-blue-600'}`}>
                             <Check size={20} />
                           </div>
                        )}
                        
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          {itemType === 'exam' ? "Required Item" : (isDeclined ? "Re-add to Visit" : "Decline Service")}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                        </div>
                      </button>

                      <div className="mt-1 text-slate-400">{iconType === 'vaccine' && <Syringe size={18} />}{iconType === 'lab' && <Activity size={18} />}{iconType === 'exam' && <Heart size={18} />}</div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                             <span className={`font-medium ${isDeclined ? ((item.id === BUNDLE_ITEM_ID || item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID) ? 'text-slate-400' : 'text-slate-500 line-through') : 'text-slate-800'}`}>
                               {item.name}
                             </span>
                             {(isIncluded || (isBasicLabInComp && !isDeclined)) && (
                               <div className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                                 <Check size={10} /> {(isIncluded) ? 'Included in Bundle' : 'Included with Panel'}
                               </div>
                             )}
                          </div>
                          <div className="text-right">
                             <div className="flex flex-col items-end">
                               {/* Strikethrough Logic */}
                               {((item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID) && !isDeclined || (item.id !== BUNDLE_ITEM_ID && item.id !== BUNDLE_PUPPY_ID && item.id !== BUNDLE_KITTEN_ID && !isDeclined && (isIncluded || isBasicLabInComp || (isBundleActive && item.itemized_price > item.price)))) && (
                                 <span className="text-[10px] text-slate-400 line-through italic">${item.itemized_price.toFixed(2)}</span>
                               )}
                               <span className={`font-semibold block ${isIncluded || (isBasicLabInComp && !isDeclined) ? 'text-green-600' : 'text-slate-700'}`}>
                                 {isIncluded || (isBasicLabInComp && !isDeclined) ? 'Included' : 
                                  ((item.id === BUNDLE_ITEM_ID || item.id === BUNDLE_PUPPY_ID || item.id === BUNDLE_KITTEN_ID) && isDeclined) ? '$0.00' :
                                  `$${(isBundleActive && !isDeclined ? item.price : item.itemized_price).toFixed(2)}`}
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
                        <div className="flex items-center gap-2 mt-1 cursor-pointer" onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">{item.category}</span>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1"><Info size={10} /> {isDeclined ? 'Declined' : 'More Info'}</div>
                        </div>
                      </div>
                    </div>
                    {expandedItem === item.id && (
                      <div className="bg-blue-50 px-4 py-3 ml-14 mr-4 mb-4 rounded-lg text-sm text-slate-700 border border-blue-100 animate-in fade-in slide-in-from-top-1">
                        <p>{item.description}</p>
                        {item.trigger_tag === 'outside' && item.species === 'dog' && <div className="mt-2 text-xs bg-white p-2 rounded border border-blue-100"><strong>Note:</strong> Leptospirosis is zoonotic, meaning it can spread from pets to humans.</div>}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200"><p className="text-[10px] text-slate-500 text-center">*Prices are estimates only. Medications and prevention products are calculated separately based on weight.</p></div>
        </section>
      </main>
    </div>
  );
}