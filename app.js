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
const { v4: uuidv4 } = require('uuid') // Library used for CSP policy

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

app.options('*', cors())

app
  .use(express.json())
  .use(cors())
  .use(helmet())
  .use(mongoSanitize({ replaceWith: '_' }))

app.use('/api/auth', userRoutes)
app.use('/api/sauces', saucesRoutes)
app.use('/images', express.static(path.join(__dirname, 'images')))

// adapt header for csp
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src-attr 'unsafe-inline'; img-src 'https://*hotsauce-378315.oa.r.appspot.com/' 'http://*localhost:3000/' 'unsafe-inline'git;"
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
