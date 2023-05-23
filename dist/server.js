"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = (0, express_1.default)();
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const port = process.env.PORT;
app.use(cors());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Hello, this is Express + TypeScript');
});
// get all todos
app.get('/todos/:userEmail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userEmail } = req.params;
    try {
        const todos = yield pool.query('SELECT * FROM todos WHERE user_email = $1', [userEmail]);
        res.json(todos.rows);
    }
    catch (error) {
        console.error(error);
    }
}));
// get user info
app.get('/users/:userEmail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userEmail } = req.params;
    try {
        const userInfo = yield pool.query('SELECT first_name, email FROM users WHERE email = $1', [userEmail]);
        res.json(userInfo.rows);
    }
    catch (error) {
        console.log(error);
    }
}));
// create a new todo
app.post('/todos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user_email, title, progress, date } = req.body;
    console.log(user_email, title, progress, date);
    const id = uuidv4();
    try {
        const newTodo = yield pool.query(`INSERT INTO todos (id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5)`, [id, user_email, title, progress, date]);
        res.json(newTodo);
    }
    catch (error) {
        console.error(error);
    }
}));
// edit a todo
app.put('/todos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { user_email, title, progress, date } = req.body;
    try {
        const editToDo = yield pool.query('UPDATE todos SET user_email = $1, title = $2, progress = $3, date = $4 WHERE id = $5;', [user_email, title, progress, date, id]);
        res.json(editToDo);
    }
    catch (error) {
        console.error(error);
    }
}));
//delete a todo
app.delete('/todos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deleteToDo = yield pool.query('DELETE FROM todos WHERE id = $1', [id]);
        res.json(deleteToDo);
    }
    catch (error) {
        console.error(error);
    }
}));
//signup
app.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, firstName, lastName, password } = req.body;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    try {
        yield pool.query(`INSERT INTO users (email, first_name, last_name, hashed_password) VALUES($1, $2, $3, $4)`, [email, firstName, lastName, hashedPassword]);
        const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' });
        res.json({ email, token });
    }
    catch (error) {
        if (error) {
            // res.json({ detail: error.detail })
            console.error(error);
        }
    }
}));
//login
app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const users = yield pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (!users.rows.length) {
            return res.json({ detail: 'User not found' });
        }
        const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' });
        const success = yield bcrypt.compare(password, users.rows[0].hashed_password);
        if (success) {
            res.json({ 'email': users.rows[0].email, token });
        }
        else {
            res.json({ detail: 'Login failed' });
        }
    }
    catch (error) {
        console.error(error);
    }
}));
app.listen(port, () => {
    console.log(`[Server]: I am running at https://localhost:${port}`);
});
