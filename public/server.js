const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 4000;

// Membuka koneksi ke database SQLite
const db = new sqlite3.Database('./patients.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Membuat table jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  age INTEGER
)`);

// Middleware untuk body parser dan method override
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

// Menetapkan EJS sebagai view engine
app.set('view engine', 'ejs');

// Data sementara di array (misalnya untuk menampilkan data)
let patientsArray = [
  { id: 1, name: 'Afnan Maulidi', age: 22 },
  { id: 2, name: 'Budi Santoso', age: 23 },
];

// READ - Menampilkan semua data
app.get('/all', (req, res) => {
  // Ambil data dari database
  db.all('SELECT * FROM patients', [], (err, rows) => {
    if (err) {
      throw err;
    }
    res.render('index', { patients: rows });
  });
});

// CREATE - Form tambah data
app.get('/add', (req, res) => {
  res.render('add');
});

// CREATE - Menambah data baru ke database dan array
app.post('/add', (req, res) => {
  const { name, age } = req.body;
  if (!name || !age) {
    return res.status(400).send('Semua kolom harus diisi');
  }

  // Menambahkan data ke database
  db.run('INSERT INTO patients (name, age) VALUES (?, ?)', [name, age], function(err) {
    if (err) {
      return console.log(err.message);
    }
    
    // Ambil ID yang dihasilkan dari database
    const id = this.lastID;
    
    // Menambahkan data ke array untuk sementara (opsional)
    patientsArray.push({ id, name, age });

    res.redirect('/all');
  });
});

// UPDATE - Form edit data
app.get('/edit/:id', (req, res) => {
  const patientId = req.params.id;
  
  // Mengambil data dari database berdasarkan ID
  db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, row) => {
    if (err) {
      throw err;
    }
    res.render('edit', { patient: row });
  });
});

// UPDATE - Simpan perubahan data ke database dan array
app.put('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { name, age } = req.body;

  // Memperbarui data di database
  db.run('UPDATE patients SET name = ?, age = ? WHERE id = ?', [name, age, id], function(err) {
    if (err) {
      return console.log(err.message);
    }
    
    // Memperbarui data di array (opsional, jika data perlu ditampilkan segera)
    const patientIndex = patientsArray.findIndex(p => p.id == id);
    if (patientIndex !== -1) {
      patientsArray[patientIndex] = { id: Number(id), name, age };
    }
    
    res.redirect('/all');
  });
});

// DELETE - Menghapus data dari database dan array
app.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  
  // Menghapus data dari database
  db.run('DELETE FROM patients WHERE id = ?', [id], function(err) {
    if (err) {
      return console.log(err.message);
    }

    // Menghapus data dari array (opsional, jika perlu diperbarui segera)
    patientsArray = patientsArray.filter(p => p.id != id);
    
    res.redirect('/all');
  });
});

// Menjalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
