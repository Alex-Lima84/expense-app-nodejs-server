import express, { Express, Request, Response } from 'express';
const { v4: uuidv4 } = require('uuid')
const cors = require('cors');
const app: Express = express();
const pool = require('./db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const port = process.env.PORT

app.use(cors())
app.use(express.json())

// get all todos
app.get('/todos/:userEmail', async (req, res) => {

    const { userEmail } = req.params
    try {
        const todos = await pool.query('SELECT * FROM todos WHERE user_email = $1', [userEmail])
        res.json(todos.rows)
    } catch (error) {
        console.error(error)
    }
})

// get user info
app.get('/users/:userEmail', async (req: Request, res: Response) => {

    const { userEmail } = req.params
    try {
        const userInfo = await pool.query('SELECT first_name, email FROM users WHERE email = $1', [userEmail])
        res.json(userInfo.rows)
    } catch (error) {
        console.log(error)
    }
})

// create a new todo
app.post('/todos', async (req: Request, res: Response) => {
    const { user_email, title, progress, date } = req.body
    const id = uuidv4()
    try {
        const newTodo = await pool.query(`INSERT INTO todos (id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5)`,
            [id, user_email, title, progress, date])
        res.json(newTodo)
    } catch (error) {
        console.error(error)
    }
})

// edit a todo
app.put('/todos/:id', async (req: Request, res: Response) => {
    const { id } = req.params
    const { user_email, title, progress, date } = req.body
    try {

        const editToDo = await pool.query('UPDATE todos SET user_email = $1, title = $2, progress = $3, date = $4 WHERE id = $5;',
            [user_email, title, progress, date, id])
        res.json(editToDo)
    } catch (error) {
        console.error(error)
    }
})

//delete a todo
app.delete('/todos/:id', async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const deleteToDo = await pool.query('DELETE FROM todos WHERE id = $1', [id])
        res.json(deleteToDo)
    } catch (error) {
        console.error(error)
    }
})

//signup
app.post('/signin', async (req: Request, res: Response) => {
    const { email, firstName, lastName, password } = req.body
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    try {
        await pool.query(`INSERT INTO users (email, first_name, last_name, hashed_password) VALUES($1, $2, $3, $4)`, [email, firstName, lastName, hashedPassword])

        const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' })

        res.json({ email, token })

    } catch (error: any) {

        if (error) {
            res.json({ detail: error.detail })
            console.error(error)
        }
    }
})

//login
app.post('/login', async (req, res) => {
    const { email, password } = req.body
    try {
        const users = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        if (!users.rows.length) {
            return res.json({ detail: 'User not found' })
        }

        const token = jwt.sign({ email }, 'secret', { expiresIn: '1hr' })

        const success = await bcrypt.compare(password, users.rows[0].hashed_password)

        if (success) {
            res.json({ 'email': users.rows[0].email, token })
        } else {
            res.json({ detail: 'Login failed' })
        }

    } catch (error) {
        console.error(error)
    }
})



app.listen(port, () => {
    console.log(`[Server]: Running at https://localhost:${port}`);
});