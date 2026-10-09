const express = require('express');
const cors = require('cors');
const loanRoutes = require('./routes/loanRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (Development / Debug)
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// Root & Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Selamat datang di Library Loan Management REST API 📚',
    author: 'Ivandra Julio',
    version: '1.0.0',
    documentation: {
      endpoints: {
        'GET /api/loans': 'Mendapatkan semua data peminjaman (Mendukung query filter: ?status=Terlambat|Dipinjam|Kembali, ?member_name=, ?book_title=)',
        'GET /api/loans/:id': 'Mendapatkan detail satu peminjaman berdasarkan ID',
        'POST /api/loans': 'Membuat data peminjaman buku baru',
        'PUT /api/loans/:id': 'Memperbarui data peminjaman buku / mengubah status peminjaman',
        'DELETE /api/loans/:id': 'Menghapus data peminjaman buku',
        'GET /api/loans/stats/summary': 'Melihat ringkasan statistik peminjaman',
      },
      filter_examples: [
        '/api/loans?status=Terlambat',
        '/api/loans?status=Dipinjam',
        '/api/loans?status=Kembali',
        '/api/loans?member_name=Ivandra',
        '/api/loans?book_title=Clean+Code',
      ],
    },
  });
});

app.get('/api', (req, res) => {
  res.redirect('/');
});

// API Routes
app.use('/api/loans', loanRoutes);
app.use('/loans', loanRoutes); // Alias for direct /loans access

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route '${req.originalUrl}' dengan method '${req.method}' tidak ditemukan. Silakan cek dokumentasi di GET /`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan internal pada server',
  });
});

module.exports = app;
