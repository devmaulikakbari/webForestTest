const express = require("express");
const app = express();
const env = require("dotenv");
env.config();
require("./server");
const cors = require('cors');
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());
const port = process.env.PORT;

function routeSetup(){
    const routes = require("./routes/route");
    routes.setup(app)
}
routeSetup();

app.use((err, req, res, next) => {
  if (err.name === 'CorsError') {
      res.status(403).json({ error: 'CORS error: Forbidden' });
  } else {
      next(err);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
