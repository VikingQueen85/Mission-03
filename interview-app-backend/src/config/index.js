
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); 

module.exports = {
    apiKey: process.env.REACT_APP_GEMINI_API_KEY, 
    port: process.env.PORT || 5000 
};