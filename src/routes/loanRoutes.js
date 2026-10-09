const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');

// GET /api/loans/stats/summary - Ringkasan statistik
router.get('/stats/summary', loanController.getLoanStatistics);

// GET /api/loans - Mengambil semua peminjaman (dengan filter query)
router.get('/', loanController.getAllLoans);

// GET /api/loans/:id - Detail satu peminjaman berdasarkan ID
router.get('/:id', loanController.getLoanById);

// POST /api/loans - Membuat catatan peminjaman baru
router.post('/', loanController.createLoan);

// PUT /api/loans/:id - Memperbarui catatan peminjaman (termasuk pengembalian)
router.put('/:id', loanController.updateLoan);

// DELETE /api/loans/:id - Menghapus catatan peminjaman
router.delete('/:id', loanController.deleteLoan);

module.exports = router;
