const supabase = require('../config/supabase');

/**
 * Controller untuk mengelola data peminjaman buku perpustakaan
 */
const loanController = {
  /**
   * Mengambil semua data peminjaman buku dengan fitur filter query
   * Endpoint: GET /api/loans
   * Query params:
   *  - status: 'Dipinjam' | 'Kembali' | 'Terlambat' | 'Hilang'
   *  - member_name: nama anggota (pencarian teks / partial match)
   *  - member_id: nomor anggota
   *  - book_title: judul buku (pencarian teks / partial match)
   *  - book_code: kode buku
   *  - sort_by: kolom pengurutan (default: 'created_at')
   *  - order: 'asc' | 'desc' (default: 'desc')
   *  - limit: batas jumlah data
   *  - page: halaman (untuk pagination)
   */
  async getAllLoans(req, res, next) {
    try {
      const {
        status,
        member_name,
        member_id,
        book_title,
        book_code,
        sort_by = 'created_at',
        order = 'desc',
        limit,
        page,
      } = req.query;

      let query = supabase.from('loans').select('*', { count: 'exact' });

      // Filter berdasarkan status (case-insensitive / exact match)
      if (status) {
        query = query.ilike('status', status.trim());
      }

      // Filter pencarian nama anggota
      if (member_name) {
        query = query.ilike('member_name', `%${member_name.trim()}%`);
      }

      // Filter berdasarkan member_id
      if (member_id) {
        query = query.eq('member_id', member_id.trim());
      }

      // Filter pencarian judul buku
      if (book_title) {
        query = query.ilike('book_title', `%${book_title.trim()}%`);
      }

      // Filter berdasarkan kode buku
      if (book_code) {
        query = query.eq('book_code', book_code.trim());
      }

      // Pengurutan (Sorting)
      const ascending = order.toLowerCase() === 'asc';
      query = query.order(sort_by, { ascending });

      // Pagination jika limit & page ditentukan
      if (limit) {
        const itemLimit = parseInt(limit, 10);
        const currentPage = page ? parseInt(page, 10) : 1;
        const from = (currentPage - 1) * itemLimit;
        const to = from + itemLimit - 1;

        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Gagal mengambil data peminjaman buku',
          error: error.message,
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Data peminjaman buku berhasil diambil',
        total: count ?? data.length,
        filters_applied: {
          status: status || null,
          member_name: member_name || null,
          member_id: member_id || null,
          book_title: book_title || null,
          book_code: book_code || null,
        },
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mengambil detail satu data peminjaman berdasarkan ID
   * Endpoint: GET /api/loans/:id
   */
  async getLoanById(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          status: 'error',
          message: `Data peminjaman dengan ID '${id}' tidak ditemukan`,
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Detail data peminjaman berhasil diambil',
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Menambahkan data peminjaman buku baru
   * Endpoint: POST /api/loans
   * Body: { member_name, member_id, book_title, book_code, loan_date, due_date, status, notes }
   */
  async createLoan(req, res, next) {
    try {
      const {
        member_name,
        member_id,
        book_title,
        book_code,
        loan_date,
        due_date,
        status = 'Dipinjam',
        notes = null,
      } = req.body;

      // Validasi input wajib
      const missingFields = [];
      if (!member_name) missingFields.push('member_name');
      if (!member_id) missingFields.push('member_id');
      if (!book_title) missingFields.push('book_title');
      if (!book_code) missingFields.push('book_code');
      if (!due_date) missingFields.push('due_date');

      if (missingFields.length > 0) {
        return res.status(400).json({
          status: 'fail',
          message: `Field wajib belum diisi: ${missingFields.join(', ')}`,
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const newLoanData = {
        member_name: member_name.trim(),
        member_id: member_id.trim(),
        book_title: book_title.trim(),
        book_code: book_code.trim(),
        loan_date: loan_date || today,
        due_date,
        return_date: null,
        status: status.trim(),
        notes: notes ? notes.trim() : null,
      };

      const { data, error } = await supabase
        .from('loans')
        .insert([newLoanData])
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Gagal membuat catatan peminjaman baru',
          error: error.message,
        });
      }

      return res.status(201).json({
        status: 'success',
        message: 'Catatan peminjaman buku berhasil dibuat',
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Memperbarui data peminjaman buku (Update / Return book)
   * Endpoint: PUT /api/loans/:id
   */
  async updateLoan(req, res, next) {
    try {
      const { id } = req.params;
      const {
        member_name,
        member_id,
        book_title,
        book_code,
        loan_date,
        due_date,
        return_date,
        status,
        notes,
      } = req.body;

      // Cek apakah data peminjaman ada
      const { data: existingLoan, error: checkError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError || !existingLoan) {
        return res.status(404).json({
          status: 'error',
          message: `Data peminjaman dengan ID '${id}' tidak ditemukan`,
        });
      }

      // Siapkan payload pembaruan data
      const updatePayload = {};
      if (member_name !== undefined) updatePayload.member_name = member_name.trim();
      if (member_id !== undefined) updatePayload.member_id = member_id.trim();
      if (book_title !== undefined) updatePayload.book_title = book_title.trim();
      if (book_code !== undefined) updatePayload.book_code = book_code.trim();
      if (loan_date !== undefined) updatePayload.loan_date = loan_date;
      if (due_date !== undefined) updatePayload.due_date = due_date;
      if (notes !== undefined) updatePayload.notes = notes;

      if (status !== undefined) {
        updatePayload.status = status.trim();
        // Jika status diubah menjadi 'Kembali' dan return_date belum diisi, otomatis isi tanggal hari ini
        if (
          status.toLowerCase() === 'kembali' &&
          return_date === undefined &&
          !existingLoan.return_date
        ) {
          updatePayload.return_date = new Date().toISOString().split('T')[0];
        }
      }

      if (return_date !== undefined) {
        updatePayload.return_date = return_date;
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Tidak ada data perubahan yang dikirimkan dalam request body',
        });
      }

      const { data, error } = await supabase
        .from('loans')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Gagal memperbarui data peminjaman buku',
          error: error.message,
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Data peminjaman buku berhasil diperbarui',
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Menghapus catatan peminjaman buku
   * Endpoint: DELETE /api/loans/:id
   */
  async deleteLoan(req, res, next) {
    try {
      const { id } = req.params;

      // Cek apakah data ada
      const { data: existingLoan, error: checkError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError || !existingLoan) {
        return res.status(404).json({
          status: 'error',
          message: `Data peminjaman dengan ID '${id}' tidak ditemukan`,
        });
      }

      const { error } = await supabase.from('loans').delete().eq('id', id);

      if (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Gagal menghapus data peminjaman buku',
          error: error.message,
        });
      }

      return res.status(200).json({
        status: 'success',
        message: `Data peminjaman dengan ID '${id}' berhasil dihapus`,
        deleted_data: existingLoan,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Statistik ringkasan peminjaman buku
   * Endpoint: GET /api/loans/stats/summary
   */
  async getLoanStatistics(req, res, next) {
    try {
      const { data, error } = await supabase.from('loans').select('status');

      if (error) {
        return res.status(400).json({
          status: 'error',
          message: 'Gagal mengambil statistik peminjaman',
          error: error.message,
        });
      }

      const total = data.length;
      const stats = {
        total_peminjaman: total,
        dipinjam: data.filter((d) => d.status?.toLowerCase() === 'dipinjam').length,
        kembali: data.filter((d) => d.status?.toLowerCase() === 'kembali').length,
        terlambat: data.filter((d) => d.status?.toLowerCase() === 'terlambat').length,
        lainnya: data.filter(
          (d) => !['dipinjam', 'kembali', 'terlambat'].includes(d.status?.toLowerCase())
        ).length,
      };

      return res.status(200).json({
        status: 'success',
        message: 'Ringkasan statistik peminjaman berhasil diambil',
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = loanController;
