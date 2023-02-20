const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize') // get rid of $ everywhere in req.
const mongodbErrorHandler = require('mongoose-mongodb-errors')

const path = require('path')
const userRoutes = require('./routes/user')
const saucesRoutes = require('./routes/sauces')

const app = express()
dotenv.config()

mongoose
  .connect(process.env.DBACCESS, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connexion à MongoDB réussie 👍!'))
  .catch(() => console.log('Connexion à MongoDB échouée 😨!'))

mongoose.plugin(mongodbErrorHandler)

// Library used to generate nonce
const { v4: uuidv4 } = require('uuid') // Library used for CSP policy
const helmet = require('helmet')
app.use((req, res, next) => {
  // Setting the nonce on response object to be used later
  res.locals.nonce = uuidv4().replace(/\-/g, '')
  // Defining the CSP middleware
  const cspMiddleWare = helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'style-src': ["'self'", `'nonce-${res.locals.nonce}'`]
    }
  })
  cspMiddleWare(req, res, next)
})
app.get('/', function (req, res) {
  // Whenever the index page is requested, attach the generated nonce by replacing a keyword
  const filePath = path.resolve(__dirname, '../web/dist', 'index.html')
  // read in the index.html file
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    // replace the unique keyword (in this case 'random-csp-nonce') with server generated nonce
    result = data.replace('random-csp-nonce', res.locals.nonce)
    res.send(result)
  })
})

// app.options('*', cors())

app
  .use(express.json())
  .use(cors())
  .use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  .use(mongoSanitize({ replaceWith: '_' }))

app.use('/api/auth', userRoutes)
app.use('/api/sauces', saucesRoutes)
app.use('/images', express.static(path.join(__dirname, 'images')))

// adapt header for cors
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline';"
  )
  next()
})

// Serve the static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')))

// Catch-all route that sends the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

module.exports = app
