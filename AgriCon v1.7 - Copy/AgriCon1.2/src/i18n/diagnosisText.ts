import { Language } from '../types';

/**
 * The diagnosis backend (backend/model_runtime.py) returns fully-rendered
 * English prose for displayName / severityReason / diagnosis / recommendations
 * / caveats — it's a Python service, not part of this frontend's i18n system,
 * and giving it its own multi-language template engine would mean maintaining
 * the same wording twice in two languages of code.
 *
 * Instead this module replicates the backend's exact branching logic (same
 * thresholds, same fields) on the frontend, driven by the same translation
 * system as the rest of the UI. It consumes only the structured/numeric
 * fields of DiagnosisResult (predictedClass, confidence, stressedAreaPercent,
 * severity) — never the backend's English strings — so the displayed text is
 * always in the farmer's selected language, live model output included.
 *
 * Keep this in sync with backend/model_runtime.py's _severity / _narrative /
 * _recommendations / _caveats if that file's logic ever changes.
 */

export type PredictedClass = 'healthy' | 'pest' | 'disease' | 'nutrient_deficiency';

interface DiagStrings {
  displayName: Record<PredictedClass, string>;
  /** Compact labels for the field-report's zone list / area breakdown chips. */
  classLabelShort: Record<PredictedClass, string>;
  severityHealthy: string;
  severityLowConfidence: (confPct: number) => string;
  severitySingleTile: (confPct: number) => string;
  severityAreaBased: (areaPct: number, confPct: number) => string;
  narrativeHealthy: (confPct: number) => string;
  narrativePest: (scope: string) => string;
  narrativeDisease: (scope: string) => string;
  narrativeNutrient: (scope: string) => string;
  scopeArea: (areaPct: number) => string;
  scopeTile: string;
  recHealthy: string[];
  recPestBase: string[];
  recPestCritical: string;
  recPestNonCritical: string;
  recDiseaseBase: string[];
  recDiseaseCritical: string;
  recDiseaseNonCritical: string;
  recNutrient: string[];
  caveatBase: string;
  caveatLowConfidence: (confPct: number) => string;
  caveatPestWeak: string;
  caveatNutrientUnvalidated: string;
}

const en: DiagStrings = {
  displayName: {
    healthy: 'Healthy Canopy',
    pest: 'Pest Damage',
    disease: 'Foliar Disease',
    nutrient_deficiency: 'Nutrient Deficiency',
  },
  classLabelShort: {
    healthy: 'Healthy',
    pest: 'Pest damage',
    disease: 'Foliar disease',
    nutrient_deficiency: 'Nutrient (unvalidated)',
  },
  severityHealthy: 'Classified as healthy canopy.',
  severityLowConfidence: (p) =>
    `Capped at Moderate: model confidence is only ${p}%, too low to justify a Critical alert without a human look.`,
  severitySingleTile: (p) =>
    `Detected at ${p}% confidence. Capped at Moderate: this is a single crop tile, so how far the problem spreads cannot be judged from it — scan a wider photo of the block to assess extent.`,
  severityAreaBased: (a, p) => `${a}% of the sampled area flagged as stressed at ${p}% confidence.`,
  narrativeHealthy: (p) =>
    `No stress signature detected. Canopy texture and colour are consistent with healthy foliage across the sampled area (${p}% confidence).`,
  narrativePest: (scope) =>
    `Pest damage signature detected across ${scope} — the model is responding to small, high-frequency texture breaks (feeding holes, stippling, leaf-edge notching) rather than broad discolouration.`,
  narrativeDisease: (scope) =>
    `Foliar disease signature detected across ${scope} — broad low-frequency lesions and discolouration consistent with the rust/mosaic patterns in the training data.`,
  narrativeNutrient: (scope) =>
    `Pattern most closely matches a nutrient-deficiency signature over ${scope}, but see the caveat below: this class had no real training examples, so treat this as a prompt to check tissue/soil, not as a diagnosis.`,
  scopeArea: (a) => `roughly ${a}% of the sampled area`,
  scopeTile: 'this crop tile',
  recHealthy: [
    'No action needed from this scan — continue the normal scouting interval.',
    'Re-scan after the next irrigation or rainfall event to catch early change.',
    'Keep this tile as a healthy baseline for comparing later scans.',
  ],
  recPestBase: [
    'Ground-truth this tile: inspect the underside of leaves for insects, eggs and frass before acting on the aerial read.',
    'Count affected plants across several spots to estimate infestation level rather than treating on one tile.',
    'Check whether damage is spreading along a field edge or a row direction — that usually separates a migrating pest from a localised outbreak.',
  ],
  recPestCritical:
    'Large affected area: get a local agronomist or extension officer to confirm the pest and advise on control before spraying.',
  recPestNonCritical: 'Re-scan in 3–5 days to see whether the area is growing.',
  recDiseaseBase: [
    'Ground-truth this tile: check lesion shape, colour and whether it starts on lower or upper leaves — that distinguishes most soybean foliar diseases.',
    'Note recent humidity and leaf-wetness hours; most foliar disease pressure tracks them closely.',
    'Check whether neighbouring tiles show the same pattern to tell a spreading infection from an isolated patch.',
  ],
  recDiseaseCritical:
    'Large affected area: confirm the specific pathogen with an agronomist before any treatment decision — control differs sharply between rust and mosaic-type diseases.',
  recDiseaseNonCritical: 'Re-scan in 3–5 days to track whether lesions are expanding.',
  recNutrient: [
    'Treat this as a prompt to test, not a diagnosis: take a tissue or soil sample from this area and send it for analysis.',
    'Compare against a known-healthy tile from the same field and growth stage.',
    'Check irrigation uniformity in this zone — water stress and nutrient deficiency look similar from the air.',
  ],
  caveatBase:
    'Trained on soybean UAV imagery (MH-SoyaHealthVision). Photos of other crops, or close-up ground-level shots, are outside the training distribution — the model will still answer, but that answer is not supported by the validation numbers.',
  caveatLowConfidence: (p) =>
    `Low confidence (${p}%). The model is not distinguishing the classes well on this image; verify on the ground before acting.`,
  caveatPestWeak:
    "Pest is this model's weakest class (0.79 validation recall) — roughly 1 in 5 real pest tiles are still missed or misread as disease.",
  caveatNutrientUnvalidated:
    'Nutrient deficiency had NO real training examples (synthetic only, zero validation support). This prediction is unvalidated — do not act on it without a tissue or soil test.',
};

const hi: DiagStrings = {
  displayName: {
    healthy: 'स्वस्थ पत्तियाँ',
    pest: 'कीट क्षति',
    disease: 'पत्ती रोग',
    nutrient_deficiency: 'पोषक तत्व की कमी',
  },
  classLabelShort: {
    healthy: 'स्वस्थ',
    pest: 'कीट क्षति',
    disease: 'पत्ती रोग',
    nutrient_deficiency: 'पोषक तत्व (असत्यापित)',
  },
  severityHealthy: 'स्वस्थ फसल के रूप में वर्गीकृत।',
  severityLowConfidence: (p) =>
    `मध्यम स्तर तक सीमित: मॉडल का विश्वास स्तर केवल ${p}% है, जो बिना मानव जांच के गंभीर चेतावनी देने के लिए पर्याप्त नहीं है।`,
  severitySingleTile: (p) =>
    `${p}% विश्वास स्तर पर पहचाना गया। मध्यम स्तर तक सीमित: यह एक ही फसल टाइल है, इसलिए समस्या कितनी फैली है यह इससे नहीं आंका जा सकता — पूरे क्षेत्र का आकलन करने के लिए खेत की एक बड़ी तस्वीर स्कैन करें।`,
  severityAreaBased: (a, p) => `नमूना क्षेत्र का ${a}% भाग ${p}% विश्वास स्तर पर तनावग्रस्त पाया गया।`,
  narrativeHealthy: (p) =>
    `कोई तनाव संकेत नहीं मिला। नमूना क्षेत्र में पत्तियों की बनावट और रंग स्वस्थ फसल के अनुरूप हैं (${p}% विश्वास स्तर)।`,
  narrativePest: (scope) =>
    `${scope} में कीट क्षति का संकेत मिला — मॉडल छोटे, बारीक बनावट परिवर्तनों (खाने के छेद, धब्बे, पत्ती किनारे की कतरन) पर प्रतिक्रिया दे रहा है, न कि व्यापक रंग-परिवर्तन पर।`,
  narrativeDisease: (scope) =>
    `${scope} में पत्ती रोग का संकेत मिला — व्यापक, धीमी गति से फैलने वाले धब्बे और रंग-परिवर्तन, जो प्रशिक्षण डेटा में रस्ट/मोज़ेक पैटर्न से मेल खाते हैं।`,
  narrativeNutrient: (scope) =>
    `${scope} में पैटर्न पोषक तत्व की कमी के संकेत से सबसे अधिक मेल खाता है, लेकिन नीचे दी गई चेतावनी देखें: इस श्रेणी के लिए कोई वास्तविक प्रशिक्षण उदाहरण नहीं थे, इसलिए इसे निदान नहीं बल्कि ऊतक/मिट्टी जांच कराने का संकेत मानें।`,
  scopeArea: (a) => `नमूना क्षेत्र के लगभग ${a}% भाग`,
  scopeTile: 'इस फसल टाइल',
  recHealthy: [
    'इस स्कैन से कोई कार्रवाई आवश्यक नहीं — सामान्य निगरानी अंतराल जारी रखें।',
    'जल्दी बदलाव पकड़ने के लिए अगली सिंचाई या बारिश के बाद फिर से स्कैन करें।',
    'बाद के स्कैन से तुलना के लिए इस टाइल को स्वस्थ आधार रेखा के रूप में रखें।',
  ],
  recPestBase: [
    'इस टाइल की ज़मीनी जांच करें: हवाई रीडिंग पर कार्रवाई करने से पहले पत्तियों के नीचे कीट, अंडे और मल के लिए जांचें।',
    'एक टाइल पर उपचार करने के बजाय संक्रमण स्तर का अनुमान लगाने के लिए कई जगहों पर प्रभावित पौधों की गिनती करें।',
    'जांचें कि क्षति खेत के किनारे या पंक्ति की दिशा में फैल रही है या नहीं — इससे आमतौर पर प्रवासी कीट और स्थानीय प्रकोप में अंतर पता चलता है।',
  ],
  recPestCritical:
    'बड़ा प्रभावित क्षेत्र: छिड़काव से पहले कीट की पुष्टि और नियंत्रण सलाह के लिए स्थानीय कृषि विशेषज्ञ या विस्तार अधिकारी से संपर्क करें।',
  recPestNonCritical: '3–5 दिनों में फिर से स्कैन करें यह देखने के लिए कि क्षेत्र बढ़ रहा है या नहीं।',
  recDiseaseBase: [
    'इस टाइल की ज़मीनी जांच करें: धब्बे का आकार, रंग और क्या यह निचली या ऊपरी पत्तियों से शुरू होता है, यह जांचें — इससे अधिकांश सोयाबीन पत्ती रोगों में अंतर पता चलता है।',
    'हाल की नमी और पत्तियों की गीली अवधि नोट करें; अधिकांश पत्ती रोग का दबाव इनसे निकटता से जुड़ा होता है।',
    'जांचें कि क्या पड़ोसी टाइलों में भी वही पैटर्न दिख रहा है, ताकि फैलते संक्रमण को अलग-थलग धब्बे से अलग किया जा सके।',
  ],
  recDiseaseCritical:
    'बड़ा प्रभावित क्षेत्र: किसी भी उपचार निर्णय से पहले कृषि विशेषज्ञ से विशिष्ट रोगजनक की पुष्टि कराएं — रस्ट और मोज़ेक-प्रकार के रोगों में नियंत्रण बहुत अलग होता है।',
  recDiseaseNonCritical: 'धब्बे बढ़ रहे हैं या नहीं यह जानने के लिए 3–5 दिनों में फिर से स्कैन करें।',
  recNutrient: [
    'इसे निदान नहीं बल्कि जांच कराने का संकेत मानें: इस क्षेत्र से ऊतक या मिट्टी का नमूना लेकर जांच के लिए भेजें।',
    'उसी खेत और वृद्धि अवस्था की किसी ज्ञात स्वस्थ टाइल से तुलना करें।',
    'इस क्षेत्र में सिंचाई की एकरूपता जांचें — हवाई तस्वीर में जल तनाव और पोषक तत्व की कमी एक जैसी दिख सकती हैं।',
  ],
  caveatBase:
    'सोयाबीन के ड्रोन चित्रों (MH-SoyaHealthVision) पर प्रशिक्षित। अन्य फसलों की तस्वीरें, या नज़दीक से ज़मीन-स्तर की तस्वीरें, प्रशिक्षण डेटा के दायरे से बाहर हैं — मॉडल फिर भी उत्तर देगा, लेकिन वह उत्तर सत्यापन आंकड़ों द्वारा समर्थित नहीं है।',
  caveatLowConfidence: (p) =>
    `कम विश्वास स्तर (${p}%)। मॉडल इस तस्वीर में श्रेणियों को अच्छी तरह अलग नहीं कर पा रहा; कार्रवाई से पहले ज़मीन पर जांच करें।`,
  caveatPestWeak:
    'कीट पहचान इस मॉडल की सबसे कमज़ोर श्रेणी है (0.79 सत्यापित रिकॉल) — लगभग हर 5 में से 1 वास्तविक कीट टाइल अब भी छूट जाती है या रोग समझ ली जाती है।',
  caveatNutrientUnvalidated:
    'पोषक तत्व की कमी के लिए कोई वास्तविक प्रशिक्षण उदाहरण नहीं थे (केवल सिंथेटिक, शून्य सत्यापन समर्थन)। यह अनुमान असत्यापित है — ऊतक या मिट्टी जांच के बिना इस पर कार्रवाई न करें।',
};

const ta: DiagStrings = {
  displayName: {
    healthy: 'ஆரோக்கியமான இலைக்கவசம்',
    pest: 'பூச்சி சேதம்',
    disease: 'இலை நோய்',
    nutrient_deficiency: 'ஊட்டச்சத்து குறைபாடு',
  },
  classLabelShort: {
    healthy: 'ஆரோக்கியம்',
    pest: 'பூச்சி சேதம்',
    disease: 'இலை நோய்',
    nutrient_deficiency: 'ஊட்டச்சத்து (சரிபார்க்கப்படாதது)',
  },
  severityHealthy: 'ஆரோக்கியமான இலைக்கவசமாக வகைப்படுத்தப்பட்டது.',
  severityLowConfidence: (p) =>
    `நடுத்தரமாக வரம்பிடப்பட்டது: மாதிரியின் நம்பகத்தன்மை ${p}% மட்டுமே, மனிதப் பரிசோதனை இல்லாமல் அபாயகரமான எச்சரிக்கைக்கு போதுமானதாக இல்லை.`,
  severitySingleTile: (p) =>
    `${p}% நம்பகத்தன்மையில் கண்டறியப்பட்டது. நடுத்தரமாக வரம்பிடப்பட்டது: இது ஒரே ஒரு பயிர் டைல் என்பதால், பிரச்சினை எவ்வளவு பரவியுள்ளது என்பதை இதிலிருந்து மதிப்பிட முடியாது — பரப்பளவை மதிப்பிட வயலின் பரந்த புகைப்படத்தை ஸ்கேன் செய்யவும்.`,
  severityAreaBased: (a, p) => `மாதிரி பகுதியில் ${a}% பகுதி ${p}% நம்பகத்தன்மையில் அழுத்தத்திற்கு உட்பட்டதாக குறிக்கப்பட்டது.`,
  narrativeHealthy: (p) =>
    `எந்த அழுத்த அறிகுறியும் கண்டறியப்படவில்லை. மாதிரி பகுதி முழுவதும் இலைகளின் அமைப்பும் நிறமும் ஆரோக்கியமான இலைகளுக்கு ஒத்ததாக உள்ளது (${p}% நம்பகத்தன்மை).`,
  narrativePest: (scope) =>
    `${scope} முழுவதும் பூச்சி சேத அறிகுறி கண்டறியப்பட்டது — பரந்த நிற மாற்றத்தை விட, சிறிய, நுணுக்கமான அமைப்பு மாற்றங்களுக்கு (உண்ட துளைகள், புள்ளிகள், இலை ஓர கிழிசல்) மாதிரி பதிலளிக்கிறது.`,
  narrativeDisease: (scope) =>
    `${scope} முழுவதும் இலை நோய் அறிகுறி கண்டறியப்பட்டது — பயிற்சி தரவில் உள்ள ரஸ்ட்/மொசைக் வடிவங்களுக்கு ஒத்த பரந்த, மெதுவாக பரவும் புள்ளிகளும் நிற மாற்றமும்.`,
  narrativeNutrient: (scope) =>
    `${scope} இல் உள்ள வடிவம் ஊட்டச்சத்து குறைபாடு அறிகுறியுடன் மிகவும் ஒத்துப்போகிறது, ஆனால் கீழே உள்ள எச்சரிக்கையைப் பார்க்கவும்: இந்த வகைக்கு உண்மையான பயிற்சி எடுத்துக்காட்டுகள் இல்லை, எனவே இதை நோயறிதலாக அல்ல, திசு/மண் பரிசோதனை செய்ய வேண்டிய அறிவுறுத்தலாக கருதவும்.`,
  scopeArea: (a) => `மாதிரி பகுதியில் தோராயமாக ${a}%`,
  scopeTile: 'இந்த பயிர் டைல்',
  recHealthy: [
    'இந்த ஸ்கேனிலிருந்து எந்த நடவடிக்கையும் தேவையில்லை — வழக்கமான கண்காணிப்பு இடைவெளியைத் தொடரவும்.',
    'ஆரம்பகட்ட மாற்றத்தைக் கண்டறிய அடுத்த நீர்ப்பாசனம் அல்லது மழைக்குப் பிறகு மீண்டும் ஸ்கேன் செய்யவும்.',
    'பிற்கால ஸ்கேன்களுடன் ஒப்பிட இந்த டைலை ஆரோக்கியமான அடிப்படையாக வைத்திருக்கவும்.',
  ],
  recPestBase: [
    'இந்த டைலை நேரடியாக சரிபார்க்கவும்: வான்வழி வாசிப்பின் அடிப்படையில் நடவடிக்கை எடுப்பதற்கு முன் இலைகளின் அடிப்பகுதியில் பூச்சிகள், முட்டைகள் மற்றும் கழிவுகளை ஆய்வு செய்யவும்.',
    'ஒரு டைலில் சிகிச்சை அளிப்பதற்குப் பதிலாக, தொற்று அளவை மதிப்பிட பல இடங்களில் பாதிக்கப்பட்ட செடிகளை எண்ணவும்.',
    'சேதம் வயல் ஓரத்தில் அல்லது வரிசை திசையில் பரவுகிறதா எனச் சரிபார்க்கவும் — இது பொதுவாக நகரும் பூச்சியை உள்ளூர் தாக்குதலிலிருந்து பிரிக்கும்.',
  ],
  recPestCritical:
    'பெரிய பாதிக்கப்பட்ட பகுதி: தெளிப்பதற்கு முன் பூச்சியை உறுதிப்படுத்தவும் கட்டுப்பாட்டு ஆலோசனைக்கும் உள்ளூர் வேளாண் நிபுணர் அல்லது விரிவாக்க அதிகாரியை அணுகவும்.',
  recPestNonCritical: 'பகுதி வளர்கிறதா எனப் பார்க்க 3–5 நாட்களில் மீண்டும் ஸ்கேன் செய்யவும்.',
  recDiseaseBase: [
    'இந்த டைலை நேரடியாக சரிபார்க்கவும்: புள்ளியின் வடிவம், நிறம் மற்றும் அது கீழ் அல்லது மேல் இலைகளில் தொடங்குகிறதா எனச் சரிபார்க்கவும் — இது பெரும்பாலான சோயா இலை நோய்களை வேறுபடுத்துகிறது.',
    'சமீபத்திய ஈரப்பதம் மற்றும் இலை-ஈரமான நேரத்தைக் குறித்துக் கொள்ளவும்; பெரும்பாலான இலை நோய் அழுத்தம் இவற்றைப் பின்பற்றுகிறது.',
    'பரவும் தொற்றை தனிமைப்படுத்தப்பட்ட புள்ளியிலிருந்து வேறுபடுத்த அருகிலுள்ள டைல்களில் அதே வடிவம் தெரிகிறதா எனச் சரிபார்க்கவும்.',
  ],
  recDiseaseCritical:
    'பெரிய பாதிக்கப்பட்ட பகுதி: எந்த சிகிச்சை முடிவுக்கும் முன் வேளாண் நிபுணருடன் குறிப்பிட்ட நோய்க்கிருமியை உறுதிப்படுத்தவும் — ரஸ்ட் மற்றும் மொசைக் வகை நோய்களுக்கு இடையே கட்டுப்பாடு பெரிதும் வேறுபடுகிறது.',
  recDiseaseNonCritical: 'புள்ளிகள் பரவுகின்றனவா எனக் கண்காணிக்க 3–5 நாட்களில் மீண்டும் ஸ்கேன் செய்யவும்.',
  recNutrient: [
    'இதை நோயறிதலாக அல்ல, பரிசோதனை செய்ய வேண்டிய அறிவுறுத்தலாகக் கருதவும்: இந்தப் பகுதியிலிருந்து திசு அல்லது மண் மாதிரி எடுத்து பகுப்பாய்வுக்கு அனுப்பவும்.',
    'அதே வயல் மற்றும் வளர்ச்சி நிலையிலிருந்து அறியப்பட்ட ஆரோக்கியமான டைலுடன் ஒப்பிடவும்.',
    'இந்த மண்டலத்தில் நீர்ப்பாசன சீரான தன்மையைச் சரிபார்க்கவும் — நீர் அழுத்தமும் ஊட்டச்சத்து குறைபாடும் வானிலிருந்து ஒரே மாதிரியாகத் தெரியும்.',
  ],
  caveatBase:
    'சோயாபீன் ட்ரோன் படங்களில் (MH-SoyaHealthVision) பயிற்சி பெற்றது. மற்ற பயிர்களின் புகைப்படங்கள், அல்லது நெருக்கமான தரைமட்ட புகைப்படங்கள், பயிற்சி தரவு வரம்பிற்கு வெளியே உள்ளன — மாதிரி இன்னும் பதிலளிக்கும், ஆனால் அந்த பதில் சரிபார்ப்பு எண்களால் ஆதரிக்கப்படவில்லை.',
  caveatLowConfidence: (p) =>
    `குறைந்த நம்பகத்தன்மை (${p}%). இந்த படத்தில் மாதிரி வகைகளை நன்றாக வேறுபடுத்தவில்லை; நடவடிக்கை எடுப்பதற்கு முன் தரையில் சரிபார்க்கவும்.`,
  caveatPestWeak:
    'பூச்சி இந்த மாதிரியின் மிகவும் பலவீனமான வகை (0.79 சரிபார்க்கப்பட்ட ரீகால்) — ஏறத்தாழ ஒவ்வொரு 5 உண்மையான பூச்சி டைல்களில் 1 இன்னும் தவறவிடப்படுகிறது அல்லது நோயாக தவறாகப் படிக்கப்படுகிறது.',
  caveatNutrientUnvalidated:
    'ஊட்டச்சத்து குறைபாட்டிற்கு உண்மையான பயிற்சி எடுத்துக்காட்டுகள் இல்லை (செயற்கை மட்டுமே, பூஜ்ஜிய சரிபார்ப்பு ஆதரவு). இந்த கணிப்பு சரிபார்க்கப்படவில்லை — திசு அல்லது மண் பரிசோதனை இல்லாமல் இதன் அடிப்படையில் நடவடிக்கை எடுக்க வேண்டாம்.',
};

const te: DiagStrings = {
  displayName: {
    healthy: 'ఆరోగ్యకరమైన ఆకుపందిరి',
    pest: 'పురుగు నష్టం',
    disease: 'ఆకు వ్యాధి',
    nutrient_deficiency: 'పోషక లోపం',
  },
  classLabelShort: {
    healthy: 'ఆరోగ్యకరం',
    pest: 'పురుగు నష్టం',
    disease: 'ఆకు వ్యాధి',
    nutrient_deficiency: 'పోషకం (ధృవీకరించబడలేదు)',
  },
  severityHealthy: 'ఆరోగ్యకరమైన పంటగా వర్గీకరించబడింది.',
  severityLowConfidence: (p) =>
    `మధ్యస్థానికి పరిమితం చేయబడింది: మోడల్ విశ్వాసం కేవలం ${p}% మాత్రమే, మానవ పరిశీలన లేకుండా క్రిటికల్ హెచ్చరిక ఇవ్వడానికి సరిపోదు.`,
  severitySingleTile: (p) =>
    `${p}% విశ్వాసంతో గుర్తించబడింది. మధ్యస్థానికి పరిమితం చేయబడింది: ఇది ఒకే ఒక పంట టైల్ కావడంతో, సమస్య ఎంత వ్యాపించిందో దీని నుండి అంచనా వేయలేము — విస్తీర్ణాన్ని అంచనా వేయడానికి పొలం యొక్క విశాలమైన ఫోటోను స్కాన్ చేయండి.`,
  severityAreaBased: (a, p) => `నమూనా ప్రాంతంలో ${a}% భాగం ${p}% విశ్వాసంతో ఒత్తిడికి గురైనట్లు గుర్తించబడింది.`,
  narrativeHealthy: (p) =>
    `ఎలాంటి ఒత్తిడి సంకేతం కనుగొనబడలేదు. నమూనా ప్రాంతం అంతటా ఆకుల నిర్మాణం మరియు రంగు ఆరోగ్యకరమైన ఆకులకు అనుగుణంగా ఉన్నాయి (${p}% విశ్వాసం).`,
  narrativePest: (scope) =>
    `${scope} అంతటా పురుగు నష్టం సంకేతం కనుగొనబడింది — విస్తృత రంగు మార్పు కంటే, చిన్న, సూక్ష్మ నిర్మాణ మార్పులకు (తినే రంధ్రాలు, మచ్చలు, ఆకు అంచు కోతలు) మోడల్ స్పందిస్తోంది.`,
  narrativeDisease: (scope) =>
    `${scope} అంతటా ఆకు వ్యాధి సంకేతం కనుగొనబడింది — శిక్షణ డేటాలోని రస్ట్/మొజాయిక్ నమూనాలకు అనుగుణంగా విస్తృత, నెమ్మదిగా వ్యాపించే మచ్చలు మరియు రంగు మార్పు.`,
  narrativeNutrient: (scope) =>
    `${scope} లో నమూనా పోషక లోప సంకేతంతో బాగా సరిపోలుతుంది, కానీ దిగువ హెచ్చరికను చూడండి: ఈ తరగతికి నిజమైన శిక్షణ ఉదాహరణలు లేవు, కాబట్టి దీన్ని నిర్ధారణగా కాకుండా కణజాలం/నేల పరీక్ష చేయించుకోవాల్సిన సూచనగా భావించండి.`,
  scopeArea: (a) => `నమూనా ప్రాంతంలో సుమారు ${a}%`,
  scopeTile: 'ఈ పంట టైల్',
  recHealthy: [
    'ఈ స్కాన్ నుండి ఎలాంటి చర్య అవసరం లేదు — సాధారణ పర్యవేక్షణ వ్యవధిని కొనసాగించండి.',
    'ప్రారంభ మార్పును గుర్తించడానికి తదుపరి నీటిపారుదల లేదా వర్షం తర్వాత మళ్లీ స్కాన్ చేయండి.',
    'తర్వాతి స్కాన్‌లతో పోల్చడానికి ఈ టైల్‌ను ఆరోగ్యకరమైన ప్రాతిపదికగా ఉంచండి.',
  ],
  recPestBase: [
    'ఈ టైల్‌ను గ్రౌండ్-ట్రూత్ చేయండి: వైమానిక రీడింగ్ ఆధారంగా చర్య తీసుకునే ముందు ఆకుల అడుగు భాగంలో పురుగులు, గుడ్లు మరియు విసర్జనల కోసం పరిశీలించండి.',
    'ఒక టైల్‌పై చికిత్స చేయడానికి బదులుగా, ముట్టడి స్థాయిని అంచనా వేయడానికి అనేక ప్రాంతాల్లో ప్రభావిత మొక్కలను లెక్కించండి.',
    'నష్టం పొలం అంచున లేదా వరుస దిశలో వ్యాపిస్తుందో లేదో తనిఖీ చేయండి — ఇది సాధారణంగా వలస పురుగును స్థానిక ప్రకోపం నుండి వేరు చేస్తుంది.',
  ],
  recPestCritical:
    'పెద్ద ప్రభావిత ప్రాంతం: పిచికారీ చేయడానికి ముందు పురుగును నిర్ధారించి నియంత్రణపై సలహా కోసం స్థానిక వ్యవసాయ నిపుణుడు లేదా విస్తరణ అధికారిని సంప్రదించండి.',
  recPestNonCritical: 'ప్రాంతం పెరుగుతుందో లేదో చూడటానికి 3–5 రోజుల్లో మళ్లీ స్కాన్ చేయండి.',
  recDiseaseBase: [
    'ఈ టైల్‌ను గ్రౌండ్-ట్రూత్ చేయండి: మచ్చ ఆకారం, రంగు మరియు అది దిగువ లేదా ఎగువ ఆకుల నుండి మొదలవుతుందో లేదో తనిఖీ చేయండి — ఇది చాలా సోయాబీన్ ఆకు వ్యాధులను వేరు చేస్తుంది.',
    'ఇటీవలి తేమ మరియు ఆకు-తడి గంటలను గమనించండి; చాలా ఆకు వ్యాధి తీవ్రత వీటిని దగ్గరగా అనుసరిస్తుంది.',
    'వ్యాపించే సంక్రమణను వేరుచేయబడిన మచ్చ నుండి వేరు చేయడానికి పొరుగు టైల్స్‌లో అదే నమూనా కనిపిస్తుందో లేదో తనిఖీ చేయండి.',
  ],
  recDiseaseCritical:
    'పెద్ద ప్రభావిత ప్రాంతం: ఏదైనా చికిత్స నిర్ణయానికి ముందు నిర్దిష్ట వ్యాధికారకాన్ని వ్యవసాయ నిపుణుడితో నిర్ధారించండి — రస్ట్ మరియు మొజాయిక్ రకం వ్యాధుల మధ్య నియంత్రణ చాలా భిన్నంగా ఉంటుంది.',
  recDiseaseNonCritical: 'మచ్చలు విస్తరిస్తున్నాయో లేదో పర్యవేక్షించడానికి 3–5 రోజుల్లో మళ్లీ స్కాన్ చేయండి.',
  recNutrient: [
    'దీన్ని నిర్ధారణగా కాకుండా పరీక్ష చేయించుకోవాల్సిన సూచనగా భావించండి: ఈ ప్రాంతం నుండి కణజాలం లేదా నేల నమూనాను తీసుకుని విశ్లేషణ కోసం పంపండి.',
    'అదే పొలం మరియు పెరుగుదల దశ నుండి తెలిసిన ఆరోగ్యకరమైన టైల్‌తో పోల్చండి.',
    'ఈ మండలంలో నీటిపారుదల ఏకరూపతను తనిఖీ చేయండి — నీటి ఒత్తిడి మరియు పోషక లోపం గాలి నుండి ఒకేలా కనిపిస్తాయి.',
  ],
  caveatBase:
    'సోయాబీన్ UAV చిత్రాలపై (MH-SoyaHealthVision) శిక్షణ పొందింది. ఇతర పంటల ఫోటోలు, లేదా దగ్గరి నుండి తీసిన నేల-స్థాయి ఫోటోలు, శిక్షణ డేటా పరిధికి వెలుపల ఉన్నాయి — మోడల్ ఇప్పటికీ సమాధానం ఇస్తుంది, కానీ ఆ సమాధానానికి ధృవీకరణ సంఖ్యల మద్దతు లేదు.',
  caveatLowConfidence: (p) =>
    `తక్కువ విశ్వాసం (${p}%). ఈ చిత్రంలో మోడల్ తరగతులను సరిగ్గా వేరు చేయలేకపోతోంది; చర్య తీసుకునే ముందు నేలపై నిర్ధారించుకోండి.`,
  caveatPestWeak:
    'ఈ మోడల్‌లో పురుగు అత్యంత బలహీనమైన తరగతి (0.79 ధృవీకరించిన రీకాల్) — ప్రతి 5 నిజమైన పురుగు టైల్స్‌లో దాదాపు 1 ఇప్పటికీ తప్పిపోతుంది లేదా వ్యాధిగా తప్పుగా చదవబడుతుంది.',
  caveatNutrientUnvalidated:
    'పోషక లోపానికి నిజమైన శిక్షణ ఉదాహరణలు లేవు (సింథటిక్ మాత్రమే, సున్నా ధృవీకరణ మద్దతు). ఈ అంచనా ధృవీకరించబడలేదు — కణజాలం లేదా నేల పరీక్ష లేకుండా దీనిపై చర్య తీసుకోవద్దు.',
};

const kn: DiagStrings = {
  displayName: {
    healthy: 'ಆರೋಗ್ಯಕರ ಎಲೆಗಳು',
    pest: 'ಕೀಟ ಹಾನಿ',
    disease: 'ಎಲೆ ರೋಗ',
    nutrient_deficiency: 'ಪೋಷಕಾಂಶ ಕೊರತೆ',
  },
  classLabelShort: {
    healthy: 'ಆರೋಗ್ಯಕರ',
    pest: 'ಕೀಟ ಹಾನಿ',
    disease: 'ಎಲೆ ರೋಗ',
    nutrient_deficiency: 'ಪೋಷಕಾಂಶ (ಪರಿಶೀಲಿಸದ)',
  },
  severityHealthy: 'ಆರೋಗ್ಯಕರ ಬೆಳೆ ಎಂದು ವರ್ಗೀಕರಿಸಲಾಗಿದೆ.',
  severityLowConfidence: (p) =>
    `ಮಧ್ಯಮಕ್ಕೆ ಸೀಮಿತಗೊಳಿಸಲಾಗಿದೆ: ಮಾದರಿಯ ವಿಶ್ವಾಸ ಕೇವಲ ${p}% ಮಾತ್ರ, ಮಾನವ ಪರಿಶೀಲನೆ ಇಲ್ಲದೆ ಗಂಭೀರ ಎಚ್ಚರಿಕೆ ನೀಡಲು ಸಾಕಾಗುವುದಿಲ್ಲ.`,
  severitySingleTile: (p) =>
    `${p}% ವಿಶ್ವಾಸದಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ. ಮಧ್ಯಮಕ್ಕೆ ಸೀಮಿತಗೊಳಿಸಲಾಗಿದೆ: ಇದು ಒಂದೇ ಬೆಳೆ ಟೈಲ್ ಆಗಿರುವುದರಿಂದ, ಸಮಸ್ಯೆ ಎಷ್ಟು ಹರಡಿದೆ ಎಂಬುದನ್ನು ಇದರಿಂದ ನಿರ್ಣಯಿಸಲಾಗುವುದಿಲ್ಲ — ವ್ಯಾಪ್ತಿಯನ್ನು ಅಂದಾಜಿಸಲು ಹೊಲದ ವಿಶಾಲ ಫೋಟೋವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.`,
  severityAreaBased: (a, p) => `ಮಾದರಿ ಪ್ರದೇಶದ ${a}% ಭಾಗವು ${p}% ವಿಶ್ವಾಸದಲ್ಲಿ ಒತ್ತಡಕ್ಕೊಳಗಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.`,
  narrativeHealthy: (p) =>
    `ಯಾವುದೇ ಒತ್ತಡದ ಲಕ್ಷಣ ಪತ್ತೆಯಾಗಿಲ್ಲ. ಮಾದರಿ ಪ್ರದೇಶದಾದ್ಯಂತ ಎಲೆಗಳ ವಿನ್ಯಾಸ ಮತ್ತು ಬಣ್ಣ ಆರೋಗ್ಯಕರ ಎಲೆಗಳಿಗೆ ಅನುಗುಣವಾಗಿವೆ (${p}% ವಿಶ್ವಾಸ).`,
  narrativePest: (scope) =>
    `${scope} ಉದ್ದಕ್ಕೂ ಕೀಟ ಹಾನಿಯ ಲಕ್ಷಣ ಪತ್ತೆಯಾಗಿದೆ — ವ್ಯಾಪಕ ಬಣ್ಣ ಬದಲಾವಣೆಗಿಂತ, ಚಿಕ್ಕ, ಸೂಕ್ಷ್ಮ ವಿನ್ಯಾಸ ಬದಲಾವಣೆಗಳಿಗೆ (ತಿಂದ ರಂಧ್ರಗಳು, ಚುಕ್ಕೆಗಳು, ಎಲೆ ಅಂಚಿನ ಕೊರೆತ) ಮಾದರಿ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತಿದೆ.`,
  narrativeDisease: (scope) =>
    `${scope} ಉದ್ದಕ್ಕೂ ಎಲೆ ರೋಗದ ಲಕ್ಷಣ ಪತ್ತೆಯಾಗಿದೆ — ತರಬೇತಿ ದತ್ತಾಂಶದಲ್ಲಿನ ರಸ್ಟ್/ಮೊಸಾಯಿಕ್ ಮಾದರಿಗಳಿಗೆ ಅನುಗುಣವಾದ ವ್ಯಾಪಕ, ನಿಧಾನವಾಗಿ ಹರಡುವ ಚುಕ್ಕೆಗಳು ಮತ್ತು ಬಣ್ಣ ಬದಲಾವಣೆ.`,
  narrativeNutrient: (scope) =>
    `${scope} ನಲ್ಲಿನ ಮಾದರಿಯು ಪೋಷಕಾಂಶ ಕೊರತೆಯ ಲಕ್ಷಣಕ್ಕೆ ಹೆಚ್ಚು ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ, ಆದರೆ ಕೆಳಗಿನ ಎಚ್ಚರಿಕೆಯನ್ನು ನೋಡಿ: ಈ ವರ್ಗಕ್ಕೆ ನೈಜ ತರಬೇತಿ ಉದಾಹರಣೆಗಳಿಲ್ಲ, ಆದ್ದರಿಂದ ಇದನ್ನು ರೋಗನಿರ್ಣಯವಾಗಿ ಅಲ್ಲ, ಅಂಗಾಂಶ/ಮಣ್ಣು ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳುವ ಸೂಚನೆಯಾಗಿ ಪರಿಗಣಿಸಿ.`,
  scopeArea: (a) => `ಮಾದರಿ ಪ್ರದೇಶದ ಸುಮಾರು ${a}%`,
  scopeTile: 'ಈ ಬೆಳೆ ಟೈಲ್',
  recHealthy: [
    'ಈ ಸ್ಕ್ಯಾನ್‌ನಿಂದ ಯಾವುದೇ ಕ್ರಮ ಅಗತ್ಯವಿಲ್ಲ — ಸಾಮಾನ್ಯ ಮೇಲ್ವಿಚಾರಣಾ ಅಂತರವನ್ನು ಮುಂದುವರಿಸಿ.',
    'ಆರಂಭಿಕ ಬದಲಾವಣೆಯನ್ನು ಪತ್ತೆಹಚ್ಚಲು ಮುಂದಿನ ನೀರಾವರಿ ಅಥವಾ ಮಳೆಯ ನಂತರ ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
    'ನಂತರದ ಸ್ಕ್ಯಾನ್‌ಗಳೊಂದಿಗೆ ಹೋಲಿಸಲು ಈ ಟೈಲ್ ಅನ್ನು ಆರೋಗ್ಯಕರ ಆಧಾರರೇಖೆಯಾಗಿ ಇರಿಸಿ.',
  ],
  recPestBase: [
    'ಈ ಟೈಲ್ ಅನ್ನು ನೆಲದ ಮೇಲೆ ಪರಿಶೀಲಿಸಿ: ವೈಮಾನಿಕ ಓದುವಿಕೆಯ ಆಧಾರದ ಮೇಲೆ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ಎಲೆಗಳ ಕೆಳಭಾಗದಲ್ಲಿ ಕೀಟಗಳು, ಮೊಟ್ಟೆಗಳು ಮತ್ತು ಹಿಕ್ಕೆಗಳಿಗಾಗಿ ಪರಿಶೀಲಿಸಿ.',
    'ಒಂದು ಟೈಲ್‌ಗೆ ಚಿಕಿತ್ಸೆ ನೀಡುವ ಬದಲು, ಸೋಂಕಿನ ಮಟ್ಟವನ್ನು ಅಂದಾಜಿಸಲು ಹಲವಾರು ಸ್ಥಳಗಳಲ್ಲಿ ಬಾಧಿತ ಸಸ್ಯಗಳನ್ನು ಎಣಿಸಿ.',
    'ಹಾನಿ ಹೊಲದ ಅಂಚಿನಲ್ಲಿ ಅಥವಾ ಸಾಲಿನ ದಿಕ್ಕಿನಲ್ಲಿ ಹರಡುತ್ತಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ — ಇದು ಸಾಮಾನ್ಯವಾಗಿ ವಲಸೆ ಹೋಗುವ ಕೀಟವನ್ನು ಸ್ಥಳೀಯ ಪ್ರಕೋಪದಿಂದ ಪ್ರತ್ಯೇಕಿಸುತ್ತದೆ.',
  ],
  recPestCritical:
    'ದೊಡ್ಡ ಬಾಧಿತ ಪ್ರದೇಶ: ಸಿಂಪಡಿಸುವ ಮೊದಲು ಕೀಟವನ್ನು ಖಚಿತಪಡಿಸಲು ಮತ್ತು ನಿಯಂತ್ರಣ ಸಲಹೆಗಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞ ಅಥವಾ ವಿಸ್ತರಣಾ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  recPestNonCritical: 'ಪ್ರದೇಶ ಬೆಳೆಯುತ್ತಿದೆಯೇ ಎಂದು ನೋಡಲು 3–5 ದಿನಗಳಲ್ಲಿ ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
  recDiseaseBase: [
    'ಈ ಟೈಲ್ ಅನ್ನು ನೆಲದ ಮೇಲೆ ಪರಿಶೀಲಿಸಿ: ಚುಕ್ಕೆಯ ಆಕಾರ, ಬಣ್ಣ ಮತ್ತು ಅದು ಕೆಳಗಿನ ಅಥವಾ ಮೇಲಿನ ಎಲೆಗಳಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ — ಇದು ಹೆಚ್ಚಿನ ಸೋಯಾಬೀನ್ ಎಲೆ ರೋಗಗಳನ್ನು ಪ್ರತ್ಯೇಕಿಸುತ್ತದೆ.',
    'ಇತ್ತೀಚಿನ ಆರ್ದ್ರತೆ ಮತ್ತು ಎಲೆ-ತೇವದ ಗಂಟೆಗಳನ್ನು ಗಮನಿಸಿ; ಹೆಚ್ಚಿನ ಎಲೆ ರೋಗದ ಒತ್ತಡ ಇವುಗಳನ್ನು ನಿಕಟವಾಗಿ ಅನುಸರಿಸುತ್ತದೆ.',
    'ಹರಡುತ್ತಿರುವ ಸೋಂಕನ್ನು ಪ್ರತ್ಯೇಕ ಚುಕ್ಕೆಯಿಂದ ಪ್ರತ್ಯೇಕಿಸಲು ಪಕ್ಕದ ಟೈಲ್‌ಗಳಲ್ಲಿ ಅದೇ ಮಾದರಿ ಕಂಡುಬರುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
  ],
  recDiseaseCritical:
    'ದೊಡ್ಡ ಬಾಧಿತ ಪ್ರದೇಶ: ಯಾವುದೇ ಚಿಕಿತ್ಸಾ ನಿರ್ಧಾರದ ಮೊದಲು ನಿರ್ದಿಷ್ಟ ರೋಗಕಾರಕವನ್ನು ಕೃಷಿ ತಜ್ಞರೊಂದಿಗೆ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ — ರಸ್ಟ್ ಮತ್ತು ಮೊಸಾಯಿಕ್ ಮಾದರಿಯ ರೋಗಗಳ ನಡುವೆ ನಿಯಂತ್ರಣ ಬಹಳ ಭಿನ್ನವಾಗಿದೆ.',
  recDiseaseNonCritical: 'ಚುಕ್ಕೆಗಳು ವಿಸ್ತರಿಸುತ್ತಿವೆಯೇ ಎಂದು ಪತ್ತೆಹಚ್ಚಲು 3–5 ದಿನಗಳಲ್ಲಿ ಮತ್ತೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
  recNutrient: [
    'ಇದನ್ನು ರೋಗನಿರ್ಣಯವಾಗಿ ಅಲ್ಲ, ಪರೀಕ್ಷೆ ಮಾಡಿಸಿಕೊಳ್ಳುವ ಸೂಚನೆಯಾಗಿ ಪರಿಗಣಿಸಿ: ಈ ಪ್ರದೇಶದಿಂದ ಅಂಗಾಂಶ ಅಥವಾ ಮಣ್ಣಿನ ಮಾದರಿಯನ್ನು ತೆಗೆದುಕೊಂಡು ವಿಶ್ಲೇಷಣೆಗೆ ಕಳುಹಿಸಿ.',
    'ಅದೇ ಹೊಲ ಮತ್ತು ಬೆಳವಣಿಗೆಯ ಹಂತದ ತಿಳಿದಿರುವ ಆರೋಗ್ಯಕರ ಟೈಲ್‌ನೊಂದಿಗೆ ಹೋಲಿಸಿ.',
    'ಈ ವಲಯದಲ್ಲಿ ನೀರಾವರಿ ಏಕರೂಪತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ — ನೀರಿನ ಒತ್ತಡ ಮತ್ತು ಪೋಷಕಾಂಶ ಕೊರತೆ ಗಾಳಿಯಿಂದ ಒಂದೇ ರೀತಿ ಕಾಣುತ್ತವೆ.',
  ],
  caveatBase:
    'ಸೋಯಾಬೀನ್ UAV ಚಿತ್ರಗಳ ಮೇಲೆ (MH-SoyaHealthVision) ತರಬೇತಿ ಪಡೆದಿದೆ. ಇತರ ಬೆಳೆಗಳ ಫೋಟೋಗಳು, ಅಥವಾ ಹತ್ತಿರದ ನೆಲಮಟ್ಟದ ಫೋಟೋಗಳು, ತರಬೇತಿ ದತ್ತಾಂಶ ವ್ಯಾಪ್ತಿಯ ಹೊರಗಿವೆ — ಮಾದರಿ ಇನ್ನೂ ಉತ್ತರಿಸುತ್ತದೆ, ಆದರೆ ಆ ಉತ್ತರವು ಪರಿಶೀಲನಾ ಅಂಕಿಅಂಶಗಳಿಂದ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ.',
  caveatLowConfidence: (p) =>
    `ಕಡಿಮೆ ವಿಶ್ವಾಸ (${p}%). ಈ ಚಿತ್ರದಲ್ಲಿ ಮಾದರಿ ವರ್ಗಗಳನ್ನು ಸರಿಯಾಗಿ ಪ್ರತ್ಯೇಕಿಸುತ್ತಿಲ್ಲ; ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳುವ ಮೊದಲು ನೆಲದ ಮೇಲೆ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.`,
  caveatPestWeak:
    'ಈ ಮಾದರಿಯಲ್ಲಿ ಕೀಟವು ಅತ್ಯಂತ ದುರ್ಬಲ ವರ್ಗವಾಗಿದೆ (0.79 ಪರಿಶೀಲಿತ ರೀಕಾಲ್) — ಪ್ರತಿ 5 ನೈಜ ಕೀಟ ಟೈಲ್‌ಗಳಲ್ಲಿ ಸುಮಾರು 1 ಇನ್ನೂ ತಪ್ಪಿಹೋಗುತ್ತದೆ ಅಥವಾ ರೋಗವೆಂದು ತಪ್ಪಾಗಿ ಓದಲಾಗುತ್ತದೆ.',
  caveatNutrientUnvalidated:
    'ಪೋಷಕಾಂಶ ಕೊರತೆಗೆ ನೈಜ ತರಬೇತಿ ಉದಾಹರಣೆಗಳಿಲ್ಲ (ಕೃತಕ ಮಾತ್ರ, ಶೂನ್ಯ ಪರಿಶೀಲನಾ ಬೆಂಬಲ). ಈ ಮುನ್ಸೂಚನೆ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿಲ್ಲ — ಅಂಗಾಂಶ ಅಥವಾ ಮಣ್ಣು ಪರೀಕ್ಷೆಯಿಲ್ಲದೆ ಇದರ ಆಧಾರದ ಮೇಲೆ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.',
};

const ml: DiagStrings = {
  displayName: {
    healthy: 'ആരോഗ്യമുള്ള ഇലക്കൂട്ടം',
    pest: 'കീട നാശം',
    disease: 'ഇല രോഗം',
    nutrient_deficiency: 'പോഷക കുറവ്',
  },
  classLabelShort: {
    healthy: 'ആരോഗ്യമുള്ളത്',
    pest: 'കീട നാശം',
    disease: 'ഇല രോഗം',
    nutrient_deficiency: 'പോഷകം (സ്ഥിരീകരിക്കാത്തത്)',
  },
  severityHealthy: 'ആരോഗ്യമുള്ള വിളയായി തരംതിരിച്ചു.',
  severityLowConfidence: (p) =>
    `മിതമായതിലേക്ക് പരിമിതപ്പെടുത്തി: മോഡലിന്റെ വിശ്വാസ്യത വെറും ${p}% മാത്രമാണ്, മനുഷ്യ പരിശോധനയില്ലാതെ ഗുരുതരമായ മുന്നറിയിപ്പ് നൽകാൻ പര്യാപ്തമല്ല.`,
  severitySingleTile: (p) =>
    `${p}% വിശ്വാസ്യതയിൽ കണ്ടെത്തി. മിതമായതിലേക്ക് പരിമിതപ്പെടുത്തി: ഇത് ഒരൊറ്റ വിള ടൈൽ ആയതിനാൽ, പ്രശ്നം എത്രത്തോളം വ്യാപിച്ചു എന്ന് ഇതിൽ നിന്ന് വിലയിരുത്താൻ കഴിയില്ല — വ്യാപ്തി വിലയിരുത്താൻ വയലിന്റെ വിശാലമായ ഫോട്ടോ സ്കാൻ ചെയ്യുക.`,
  severityAreaBased: (a, p) => `സാമ്പിൾ പ്രദേശത്തിന്റെ ${a}% ഭാഗം ${p}% വിശ്വാസ്യതയിൽ സമ്മർദ്ദത്തിലാണെന്ന് കണ്ടെത്തി.`,
  narrativeHealthy: (p) =>
    `സമ്മർദ്ദ ലക്ഷണങ്ങളൊന്നും കണ്ടെത്തിയില്ല. സാമ്പിൾ പ്രദേശത്തുടനീളം ഇലകളുടെ ഘടനയും നിറവും ആരോഗ്യമുള്ള ഇലകൾക്ക് അനുസൃതമാണ് (${p}% വിശ്വാസ്യത).`,
  narrativePest: (scope) =>
    `${scope} മുഴുവൻ കീട നാശത്തിന്റെ ലക്ഷണം കണ്ടെത്തി — വിശാലമായ നിറവ്യത്യാസത്തേക്കാൾ, ചെറിയ, സൂക്ഷ്മമായ ഘടനാ മാറ്റങ്ങളോട് (തിന്ന ദ്വാരങ്ങൾ, പുള്ളികൾ, ഇല അരികിലെ കടിച്ചെടുപ്പ്) മോഡൽ പ്രതികരിക്കുന്നു.`,
  narrativeDisease: (scope) =>
    `${scope} മുഴുവൻ ഇല രോഗത്തിന്റെ ലക്ഷണം കണ്ടെത്തി — പരിശീലന ഡാറ്റയിലെ റസ്റ്റ്/മൊസൈക് മാതൃകകൾക്ക് അനുസൃതമായ വിശാലവും സാവധാനം പടരുന്നതുമായ പുള്ളികളും നിറവ്യത്യാസവും.`,
  narrativeNutrient: (scope) =>
    `${scope} ൽ കാണുന്ന മാതൃക പോഷക കുറവിന്റെ ലക്ഷണവുമായി ഏറ്റവും അടുത്ത് യോജിക്കുന്നു, എന്നാൽ താഴെയുള്ള മുന്നറിയിപ്പ് കാണുക: ഈ വിഭാഗത്തിന് യഥാർത്ഥ പരിശീലന ഉദാഹരണങ്ങളില്ല, അതിനാൽ ഇതിനെ രോഗനിർണയമായല്ല, ടിഷ്യു/മണ്ണ് പരിശോധന നടത്താനുള്ള സൂചനയായി കണക്കാക്കുക.`,
  scopeArea: (a) => `സാമ്പിൾ പ്രദേശത്തിന്റെ ഏകദേശം ${a}%`,
  scopeTile: 'ഈ വിള ടൈൽ',
  recHealthy: [
    'ഈ സ്കാനിൽ നിന്ന് നടപടിയൊന്നും ആവശ്യമില്ല — സാധാരണ നിരീക്ഷണ ഇടവേള തുടരുക.',
    'നേരത്തെയുള്ള മാറ്റം കണ്ടെത്താൻ അടുത്ത ജലസേചനത്തിനോ മഴയ്ക്കോ ശേഷം വീണ്ടും സ്കാൻ ചെയ്യുക.',
    'പിന്നീടുള്ള സ്കാനുകളുമായി താരതമ്യം ചെയ്യാൻ ഈ ടൈൽ ആരോഗ്യമുള്ള അടിസ്ഥാനമായി സൂക്ഷിക്കുക.',
  ],
  recPestBase: [
    'ഈ ടൈൽ നേരിട്ട് പരിശോധിക്കുക: വ്യോമ റീഡിംഗിന്റെ അടിസ്ഥാനത്തിൽ നടപടിയെടുക്കുന്നതിന് മുമ്പ് ഇലകളുടെ അടിഭാഗത്ത് പ്രാണികൾ, മുട്ടകൾ, കാഷ്ഠം എന്നിവയ്ക്കായി പരിശോധിക്കുക.',
    'ഒരു ടൈലിൽ ചികിത്സിക്കുന്നതിനുപകരം, ബാധയുടെ തോത് കണക്കാക്കാൻ പല സ്ഥലങ്ങളിലും ബാധിച്ച ചെടികളെ എണ്ണുക.',
    'നാശം വയലിന്റെ അരികിലൂടെയോ വരി ദിശയിലോ പടരുന്നുണ്ടോ എന്ന് പരിശോധിക്കുക — ഇത് സാധാരണയായി കുടിയേറുന്ന കീടത്തെ പ്രാദേശിക ബാധയിൽ നിന്ന് വേർതിരിക്കുന്നു.',
  ],
  recPestCritical:
    'വലിയ ബാധിത പ്രദേശം: തളിക്കുന്നതിന് മുമ്പ് കീടത്തെ സ്ഥിരീകരിക്കാനും നിയന്ത്രണ ഉപദേശത്തിനും പ്രാദേശിക കാർഷിക വിദഗ്ധനെയോ വിപുലീകരണ ഉദ്യോഗസ്ഥനെയോ ബന്ധപ്പെടുക.',
  recPestNonCritical: 'പ്രദേശം വളരുന്നുണ്ടോ എന്ന് കാണാൻ 3–5 ദിവസത്തിനുള്ളിൽ വീണ്ടും സ്കാൻ ചെയ്യുക.',
  recDiseaseBase: [
    'ഈ ടൈൽ നേരിട്ട് പരിശോധിക്കുക: പുള്ളിയുടെ ആകൃതി, നിറം, അത് താഴത്തെയോ മുകളിലെയോ ഇലകളിൽ നിന്ന് തുടങ്ങുന്നോ എന്ന് പരിശോധിക്കുക — ഇത് മിക്ക സോയാബീൻ ഇല രോഗങ്ങളെയും വേർതിരിക്കുന്നു.',
    'സമീപകാല ഈർപ്പവും ഇല-നനവ് സമയവും ശ്രദ്ധിക്കുക; മിക്ക ഇല രോഗ സമ്മർദ്ദവും ഇവയെ അടുത്ത് പിന്തുടരുന്നു.',
    'പടരുന്ന അണുബാധയെ ഒറ്റപ്പെട്ട പുള്ളിയിൽ നിന്ന് വേർതിരിക്കാൻ അയൽ ടൈലുകളിലും ഇതേ മാതൃക കാണുന്നുണ്ടോ എന്ന് പരിശോധിക്കുക.',
  ],
  recDiseaseCritical:
    'വലിയ ബാധിത പ്രദേശം: ഏതെങ്കിലും ചികിത്സാ തീരുമാനത്തിന് മുമ്പ് നിർദ്ദിഷ്ട രോഗാണുവിനെ കാർഷിക വിദഗ്ധനുമായി സ്ഥിരീകരിക്കുക — റസ്റ്റും മൊസൈക് തരം രോഗങ്ങളും തമ്മിൽ നിയന്ത്രണം വളരെയധികം വ്യത്യാസപ്പെട്ടിരിക്കുന്നു.',
  recDiseaseNonCritical: 'പുള്ളികൾ വ്യാപിക്കുന്നുണ്ടോ എന്ന് നിരീക്ഷിക്കാൻ 3–5 ദിവസത്തിനുള്ളിൽ വീണ്ടും സ്കാൻ ചെയ്യുക.',
  recNutrient: [
    'ഇതിനെ രോഗനിർണയമായല്ല, പരിശോധന നടത്താനുള്ള സൂചനയായി കണക്കാക്കുക: ഈ പ്രദേശത്ത് നിന്ന് ടിഷ്യു അല്ലെങ്കിൽ മണ്ണ് സാമ്പിൾ എടുത്ത് വിശകലനത്തിന് അയയ്ക്കുക.',
    'അതേ വയലിലെയും വളർച്ചാ ഘട്ടത്തിലെയും അറിയപ്പെടുന്ന ആരോഗ്യമുള്ള ടൈലുമായി താരതമ്യം ചെയ്യുക.',
    'ഈ മേഖലയിലെ ജലസേചന ഏകീകൃതത പരിശോധിക്കുക — ജല സമ്മർദ്ദവും പോഷക കുറവും ആകാശത്ത് നിന്ന് ഒരുപോലെ കാണപ്പെടും.',
  ],
  caveatBase:
    'സോയാബീൻ UAV ചിത്രങ്ങളിൽ (MH-SoyaHealthVision) പരിശീലനം നേടിയത്. മറ്റ് വിളകളുടെ ഫോട്ടോകൾ, അല്ലെങ്കിൽ അടുത്ത് നിന്നുള്ള നിലത്തുനിന്നുള്ള ഫോട്ടോകൾ, പരിശീലന ഡാറ്റാ പരിധിക്ക് പുറത്താണ് — മോഡൽ ഇപ്പോഴും ഉത്തരം നൽകും, പക്ഷേ ആ ഉത്തരത്തെ സ്ഥിരീകരണ കണക്കുകൾ പിന്തുണയ്ക്കുന്നില്ല.',
  caveatLowConfidence: (p) =>
    `കുറഞ്ഞ വിശ്വാസ്യത (${p}%). ഈ ചിത്രത്തിൽ മോഡൽ വിഭാഗങ്ങളെ നന്നായി വേർതിരിക്കുന്നില്ല; നടപടിയെടുക്കുന്നതിന് മുമ്പ് നിലത്ത് സ്ഥിരീകരിക്കുക.`,
  caveatPestWeak:
    'ഈ മോഡലിലെ ഏറ്റവും ദുർബലമായ വിഭാഗമാണ് കീടം (0.79 സ്ഥിരീകരിച്ച റീകോൾ) — ഏകദേശം 5 യഥാർത്ഥ കീട ടൈലുകളിൽ 1 എണ്ണം ഇപ്പോഴും നഷ്ടപ്പെടുകയോ രോഗമായി തെറ്റായി വായിക്കപ്പെടുകയോ ചെയ്യുന്നു.',
  caveatNutrientUnvalidated:
    'പോഷക കുറവിന് യഥാർത്ഥ പരിശീലന ഉദാഹരണങ്ങളില്ല (കൃത്രിമം മാത്രം, പൂജ്യം സ്ഥിരീകരണ പിന്തുണ). ഈ പ്രവചനം സ്ഥിരീകരിക്കപ്പെട്ടിട്ടില്ല — ടിഷ്യു അല്ലെങ്കിൽ മണ്ണ് പരിശോധന കൂടാതെ ഇതിന്റെ അടിസ്ഥാനത്തിൽ നടപടിയെടുക്കരുത്.',
};

const DIAG_STRINGS: Record<Language, DiagStrings> = { EN: en, HI: hi, TA: ta, TE: te, KN: kn, ML: ml };

/** Compact translated class label for the field-report's zone list / chips. */
export function getClassLabel(language: Language, cls: PredictedClass): string {
  const s = DIAG_STRINGS[language] ?? DIAG_STRINGS.EN;
  return s.classLabelShort[cls];
}

export interface LocalizedDiagnosis {
  displayName: string;
  severityReason: string;
  diagnosis: string;
  recommendations: string[];
  caveats: string[];
}

/** Minimal shape this needs from DiagnosisResult — avoids a circular import. */
export interface DiagnosisResultLike {
  predictedClass: PredictedClass;
  confidence: number; // already a 0-100 percentage
  severity: 'Low' | 'Moderate' | 'Critical';
  stressedAreaPercent: number | null; // already a 0-100 percentage, or null
}

/**
 * Rebuilds displayName / severityReason / diagnosis / recommendations /
 * caveats in the given language from the result's raw numeric/categorical
 * fields — mirrors backend/model_runtime.py's branching exactly.
 */
export function localizeDiagnosis(
  language: Language,
  result: DiagnosisResultLike
): LocalizedDiagnosis {
  const s = DIAG_STRINGS[language] ?? DIAG_STRINGS.EN;
  const cls = result.predictedClass;
  const confPct = Math.round(result.confidence);
  const areaPct =
    result.stressedAreaPercent !== null && result.stressedAreaPercent !== undefined
      ? Math.round(result.stressedAreaPercent)
      : null;

  const displayName = s.displayName[cls];

  let severityReason: string;
  if (cls === 'healthy') {
    severityReason = s.severityHealthy;
  } else if (result.confidence < 55) {
    severityReason = s.severityLowConfidence(confPct);
  } else if (areaPct === null) {
    severityReason = s.severitySingleTile(confPct);
  } else {
    severityReason = s.severityAreaBased(areaPct, confPct);
  }

  const scope = areaPct !== null ? s.scopeArea(areaPct) : s.scopeTile;
  let diagnosis: string;
  if (cls === 'healthy') diagnosis = s.narrativeHealthy(confPct);
  else if (cls === 'pest') diagnosis = s.narrativePest(scope);
  else if (cls === 'disease') diagnosis = s.narrativeDisease(scope);
  else diagnosis = s.narrativeNutrient(scope);

  let recommendations: string[];
  if (cls === 'healthy') {
    recommendations = s.recHealthy;
  } else if (cls === 'pest') {
    recommendations = [
      ...s.recPestBase,
      result.severity === 'Critical' ? s.recPestCritical : s.recPestNonCritical,
    ];
  } else if (cls === 'disease') {
    recommendations = [
      ...s.recDiseaseBase,
      result.severity === 'Critical' ? s.recDiseaseCritical : s.recDiseaseNonCritical,
    ];
  } else {
    recommendations = s.recNutrient;
  }

  const caveats: string[] = [s.caveatBase];
  if (result.confidence < 55) caveats.push(s.caveatLowConfidence(confPct));
  if (cls === 'pest') caveats.push(s.caveatPestWeak);
  if (cls === 'nutrient_deficiency') caveats.push(s.caveatNutrientUnvalidated);

  return { displayName, severityReason, diagnosis, recommendations, caveats };
}
