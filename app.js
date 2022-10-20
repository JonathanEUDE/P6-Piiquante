const { urlencoded } = require('express');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());

// Express Security : https://expressjs.com/en/advanced/best-practice-security.html
// Helmet is a collection of several smaller middleware functions that set security-related HTTP response headers.
// The top-level helmet function is a wrapper around 15 smaller middlewares.
app.use(helmet({
    crossOriginResourcePolicy:false
}));

// Hide Express in headers
app.disable('x-powered-by')



// REQUIRE ROUTES
const userRoutes = require('./routes/user');
const sauceRoutes = require('./routes/sauce');

// DATABASE CONNECTION
const serverUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_USER_PWD}@cluster0.nuxqm.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(serverUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName:process.env.DB_NAME
    })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch((e) => console.log('Connexion à MongoDB échouée !', e));

app.use(express.json());
app.use('/images', express.static(process.cwd() + '/images'))

/*app.use((req, res) => {
    res.json({ message: 'Votre requête a bien été reçue !' });
});*/

app.use((req,res, next) => {
    console.log(req.method + ' ' + req.url);
    next();
})

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes),
    message : 'Too many request ! Wait few minutes...',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use(limiter);

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

module.exports = app;