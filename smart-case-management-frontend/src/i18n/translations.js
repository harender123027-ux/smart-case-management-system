export const translations = {
  en: {
    // App
    appName: 'Smart Case Mgmt',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    sync: 'Sync',
    syncing: 'Syncing...',
    offline: 'OFFLINE',
    online: 'ONLINE',

    // Login
    login: 'Login',
    username: 'Username',
    password: 'Password',
    loginBtn: 'Login',
    loginError: 'Invalid username or password',
    offlineLogin: 'Logged in offline mode',

    // Dashboard
    dashboard: 'Dashboard',
    totalCases: 'Total Cases',
    openCases: 'Open Cases',
    urgentCases: 'Urgent',
    pendingComplaints: 'Pending',
    recentCases: 'Recent Cases',
    quickActions: 'Quick Actions',
    newComplaint: 'New Complaint',
    searchCase: 'Search Case',
    evidence: 'Evidence',
    predictive: 'Predictive AI',

    // Complaints
    complaints: 'Complaints',
    registerComplaint: 'Register Complaint',
    complainantName: 'Complainant Name',
    phone: 'Phone Number',
    address: 'Address',
    complaintType: 'Complaint Type',
    description: 'Description',
    location: 'Location',
    priority: 'Priority',
    submit: 'Submit Complaint',
    voiceInput: 'Voice Input',
    speaking: 'Listening...',
    types: {
      theft: 'Theft',
      assault: 'Assault',
      fraud: 'Fraud',
      missing: 'Missing Person',
      accident: 'Accident',
      other: 'Other',
    },

    // Cases
    cases: 'Cases',
    caseSearch: 'Case Search',
    searchPlaceholder: 'Search cases with AI...',
    aiSearch: 'AI Search',
    noResults: 'No cases found',
    caseNumber: 'Case No.',
    status: 'Status',
    officer: 'Officer',

    // Evidence
    evidenceTracker: 'Evidence Tracker',
    addEvidence: 'Add Evidence',
    evidenceTitle: 'Evidence Title',
    evidenceType: 'Evidence Type',
    attachFile: 'Attach File',
    noEvidence: 'No evidence recorded',

    // Predictive
    predictivePolicing: 'Predictive Analysis',
    analyzeBtn: 'Run Analysis',
    insights: 'AI Insights',
    analyzing: 'Analyzing crime data...',

    // Statuses
    open: 'Open',
    closed: 'Closed',
    investigating: 'Investigating',
    pending: 'Pending',
    resolved: 'Resolved',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  },
  hi: {
    // App
    appName: 'स्मार्ट केस प्रबंधन',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    sync: 'सिंक',
    syncing: 'सिंक हो रहा है...',
    offline: 'ऑफलाइन',
    online: 'ऑनलाइन',

    // Login
    login: 'लॉगिन',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    loginBtn: 'लॉगिन करें',
    loginError: 'अमान्य उपयोगकर्ता नाम या पासवर्ड',
    offlineLogin: 'ऑफलाइन मोड में लॉगिन',

    // Dashboard
    dashboard: 'डैशबोर्ड',
    totalCases: 'कुल मामले',
    openCases: 'खुले मामले',
    urgentCases: 'अत्यावश्यक',
    pendingComplaints: 'लंबित',
    recentCases: 'हाल के मामले',
    quickActions: 'त्वरित कार्रवाई',
    newComplaint: 'नई शिकायत',
    searchCase: 'केस खोजें',
    evidence: 'साक्ष्य',
    predictive: 'भविष्यवाणी AI',

    // Complaints
    complaints: 'शिकायतें',
    registerComplaint: 'शिकायत दर्ज करें',
    complainantName: 'शिकायतकर्ता का नाम',
    phone: 'फ़ोन नंबर',
    address: 'पता',
    complaintType: 'शिकायत का प्रकार',
    description: 'विवरण',
    location: 'स्थान',
    priority: 'प्राथमिकता',
    submit: 'शिकायत दर्ज करें',
    voiceInput: 'आवाज़ से दर्ज करें',
    speaking: 'सुन रहा है...',
    types: {
      theft: 'चोरी',
      assault: 'हमला',
      fraud: 'धोखाधड़ी',
      missing: 'लापता व्यक्ति',
      accident: 'दुर्घटना',
      other: 'अन्य',
    },

    // Cases
    cases: 'मामले',
    caseSearch: 'केस खोज',
    searchPlaceholder: 'AI से केस खोजें...',
    aiSearch: 'AI खोज',
    noResults: 'कोई मामला नहीं मिला',
    caseNumber: 'केस नं.',
    status: 'स्थिति',
    officer: 'अधिकारी',

    // Evidence
    evidenceTracker: 'साक्ष्य ट्रैकर',
    addEvidence: 'साक्ष्य जोड़ें',
    evidenceTitle: 'साक्ष्य शीर्षक',
    evidenceType: 'साक्ष्य प्रकार',
    attachFile: 'फ़ाइल संलग्न करें',
    noEvidence: 'कोई साक्ष्य दर्ज नहीं',

    // Predictive
    predictivePolicing: 'पूर्वानुमान विश्लेषण',
    analyzeBtn: 'विश्लेषण करें',
    insights: 'AI अंतर्दृष्टि',
    analyzing: 'अपराध डेटा का विश्लेषण...',

    // Statuses
    open: 'खुला',
    closed: 'बंद',
    investigating: 'जांच में',
    pending: 'लंबित',
    resolved: 'हल किया',
    low: 'कम',
    medium: 'मध्यम',
    high: 'उच्च',
    urgent: 'अत्यावश्यक',
  },
};

export const t = (key, language = 'en') => {
  const keys = key.split('.');
  let val = translations[language];
  for (const k of keys) val = val?.[k];
  return val || translations['en'][key] || key;
};
