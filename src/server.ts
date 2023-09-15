import express, { Express } from 'express';
const cors = require('cors');
const app: Express = express();
import multer from 'multer';
require('dotenv').config();

const port = process.env.PORT

app.use(cors())
app.use(express.json())

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let csvData: Record<string, string>[] = [];

app.get('/test', (req, res) => {
    res.send('Server is running');
});

app.post('/api/files', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    csvData = [];

    const fileBuffer = req.file.buffer.toString();
    const rows = fileBuffer.split('\n');

    const headers = rows[0].split(',');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',');
        const rowData: Record<string, string> = {};

        for (let j = 0; j < headers.length; j++) {
            const key = headers[j].trim(); // Remove leading/trailing spaces
            const value = row[j].trim(); // Remove leading/trailing spaces
            rowData[key] = value;
        }

        csvData.push(rowData);
    }

    return res.status(200).json({ message: 'File uploaded and processed successfully' });
});


app.get('/api/users', (req, res) => {
    const searchParam = req.query.q;

    if (!searchParam) {
        return res.status(400).json({ message: 'Search term is required.' });
    }

    const searchTermArray = Array.isArray(searchParam) ? searchParam : [searchParam];

    const matchingRows = csvData.filter((row) => {
        const rowValues = Object.values(row).map((value) => value.toString().toLowerCase());

        return searchTermArray.some((term) => {
            if (typeof term === 'string') {
                return rowValues.some((rowValue) => rowValue.includes(term.toLowerCase()));
            }
            return false;
        });
    });

    res.json(matchingRows);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});