require('dotenv').config();
const { parseNaturalLanguageSearch } = require('./services/smartSearchService');
(async () => {
  try {
    const filters = await parseNaturalLanguageSearch('Beach house under ₹5000 near Goa with a pool');
    console.log('filters', filters);
  } catch (e) {
    console.error('ERROR_MESSAGE:', e.message);
    console.error('ERROR_STACK:', e.stack);
    if (e.response) {
      console.error('ERROR_RESPONSE:', e.response);
    }
  }
})();
