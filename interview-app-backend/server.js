//========== MAIN ENTRY POINT (server.js) ==========//
const app = express("./src/app")
const config = require("./src/config/index")

const port = config.port || 5000

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
