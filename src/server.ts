import express, { Express, NextFunction, Request, Response } from 'express';
const { v4: uuidv4 } = require('uuid')
const cors = require('cors');
const app: Express = express();
const pool = require('./db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

interface CustomRequest extends Request {
    userEmail?: string;
}

const port = process.env.PORT

app.use(cors())
app.use(express.json())

const checkToken = (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, 'secret');
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

// get user info
app.get('/users/:userEmail', checkToken, async (req: CustomRequest, res: Response) => {

    const { userEmail } = req.params

    if (userEmail !== req.userEmail) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const userInfo = await pool.query('SELECT first_name, email FROM users WHERE email = $1', [userEmail])
        res.json(userInfo.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// get all expenses
app.get('/expenses/:userEmail', checkToken, async (req: CustomRequest, res: Response) => {
    const { userEmail } = req.params;

    if (userEmail !== req.userEmail) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const expenses = await pool.query(
            'SELECT * FROM expenses WHERE user_email = $1 ORDER BY updated_at DESC LIMIT 10',
            [userEmail]
        );
        const formattedExpenses = expenses.rows.map((expense: { expense_date: string | number | Date }) => {
            const formattedDate = new Date(expense.expense_date).toLocaleDateString('en-GB');
            return { ...expense, expense_date: formattedDate };
        });
        res.json(formattedExpenses);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// get expense categories
app.get('/expense-categories', checkToken, async (req: Request, res: Response) => {

    try {
        const expenseCategories = await pool.query('SELECT * FROM expense_categories')
        res.json(expenseCategories.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// get expense types
app.get('/expense-types/:expenseCategoryId', checkToken, async (req: Request, res: Response) => {

    const { expenseCategoryId } = req.params

    try {
        const expenseTypes = await pool.query('SELECT * FROM expense_types WHERE expense_category = $1', [expenseCategoryId])
        res.json(expenseTypes.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// create an expense
app.post('/expense-entry', async (req: Request, res: Response) => {
    const { expenseTypeName, expenseAmount, expenseCategoryName, expenseDate, expenseYear, expenseMonth, userEmail } = req.body
    const id = uuidv4()
    try {
        const newExpense = await pool.query(`INSERT INTO expenses (expense_type, expense_amount, expense_category, expense_date, expense_year, expense_month, id, user_email) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
            [expenseTypeName, expenseAmount, expenseCategoryName, expenseDate, expenseYear, expenseMonth, id, userEmail])
        res.json(newExpense)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// edit an expense
app.put('/expense/:userEmail/:id', async (req: Request, res: Response) => {
    const updated_at = new Date()
    const { expenseTypeName, expenseAmount, expenseCategoryName, expenseDate, expenseYear, expenseMonth, userEmail, id } = req.body
    try {

        const editExpense = await pool.query('UPDATE expenses SET expense_type = $1, expense_amount = $2, expense_category = $3, expense_date = $4, expense_year = $5, expense_month = $6, updated_at = $7 WHERE user_email = $8 AND id = $9;',
            [expenseTypeName, expenseAmount, expenseCategoryName, expenseDate, expenseYear, expenseMonth, updated_at, userEmail, id])
        res.json(editExpense)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// get expense info
app.get('/expense/:userEmail/:id', checkToken, async (req: Request, res: Response) => {
    const { userEmail, id } = req.params

    try {
        const getExpenseInfo = await pool.query('SELECT expense_type, expense_amount, expense_category, expense_date, expense_year, expense_month, id, updated_at FROM expenses WHERE user_email = $1 AND id = $2', [userEmail, id])
        res.json(getExpenseInfo.rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// get income types
app.get('/income-types', checkToken, async (req: Request, res: Response) => {

    try {
        const incomeTypes = await pool.query('SELECT * FROM income_types')
        res.json(incomeTypes.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'An error occurred' });
    }
})

// create an income
app.post('/income-entry', async (req: Request, res: Response) => {
    const { incomeTypeName, incomeAmount, incomeDate, incomeYear, incomeMonth, userEmail } = req.body
    const id = uuidv4()
    try {
        const newExpense = await pool.query(`INSERT INTO incomes (income_type, income_amount, income_date, income_year, income_month, id, user_email) 
        VALUES($1, $2, $3, $4, $5, $6, $7)`,
            [incomeTypeName, incomeAmount, incomeDate, incomeYear, incomeMonth, id, userEmail])
        res.json(newExpense)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'An error occurred' });
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
        res.status(500).json({ error: 'An error occurred' });
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

app.use((req, res) => {
    res.send("Expense app backend.");
})
