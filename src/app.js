require('express-async-errors');
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/auth');
const adminRouter = require('./routes/adminAuth');
const fbRouter = require('./routes/fbauth');
const gitRouter = require('./routes/gitauth');
const emailVerificationRouter = require('./routes/EmailVerification');
const { connectDB } = require('./controllers/db');
const { errorHandler, unknownRoutes } = require('./utils/middleware');
const { authorizeUser } = require('./controllers/auth');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const session = require('express-session');

const openApiDocumentation = require('./swagger/openApiDocumentation');

require('express-async-errors');
require('dotenv').config();


connectDB();
const SessionMgt = require('./services/SessionManagement');

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);



//passport middleware
app.use(session({
    secret: 'facebook-login-app',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// configure user session
SessionMgt.config(app);

// auth routes
app.use('/api/admin/auth', adminRouter);
app.use('/api/auth/email', emailVerificationRouter());
app.use('/api/auth', authorizeUser, userRouter);

// app.use('/api/admin/auth/email', emailVerificationRouter());
app.use('/api/fbauth', fbRouter);
app.use('/api/gitauth', gitRouter);

// DON'T DELETE: Admin acc. verification

// app.use('/api/admin/auth/email', emailVerificationRouter());



app.use('/', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));

app.use(unknownRoutes);
app.use(errorHandler);



module.exports = app;
