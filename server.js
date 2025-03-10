require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('./config/passport');
const path = require('path');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const helmet = require('helmet'); // Adicione o Helmet
const morgan = require('morgan'); // Adicione o Morgan

const app = express();
const port = process.env.PORT || 3000;

// Use o Morgan para registrar as solicitações HTTP (em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(helmet()); // Use o Helmet para segurança

// Configurações
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'minha_chave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // secure: true em produção
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware para disponibilizar variáveis nas views
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user;
    res.locals.req = req;
    next();
});

// Rota da página principal
app.get('/', (req, res) => {
    res.render('index');
});

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ Conectado ao MongoDB"))
    .catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// Rotas
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const uploadsRoutes = require('./routes/uploads');
const mainRoutes = require('./routes/main');
const arquiveRoutes = require('./routes/arquive');
const discordRoutes = require('./routes/discord');

app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/', discordRoutes);
app.use('/upload', uploadsRoutes);
app.use('/admin', adminRoutes);
app.use('/arquive', arquiveRoutes);

// Middleware de tratamento de erros 404
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Iniciar Servidor
app.listen(port, () => console.log(` Servidor rodando na porta ${port}`));