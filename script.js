/* ==========================================================
   TenderFlow — Application Logic
   ========================================================== */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  const state = {
    lang: 'en',
    theme: localStorage.getItem('tf-theme') || 'dark',
    tender: null,         // parsed tender object
    documents: [],        // sorted requirement documents
    uploadedFiles: [],    // { id, file, name, size, pageCount, hash, isDuplicate, matchedTo }
    matches: {},          // docId -> fileId
    expiryDates: {},      // docId -> date string
    generatedBlob: null,
    generatedFilename: '',
    fileIdCounter: 0,
  };

  // ── i18n Strings ───────────────────────────────────────────
  const i18n = {
    en: {
      tagline: 'Build. Verify. Submit.',
      step1_title: 'Load Tender Requirements',
      step1_desc: 'Start by loading the requirements.json file for your tender.',
      step2_title: 'Upload PDF Documents',
      step2_desc: 'Upload the PDF files you want to include in your tender package.',
      step3_title: 'Match & Validate Documents',
      step3_desc: 'Match each uploaded file to a tender requirement and verify expiry dates.',
      step4_title: 'Generate Package',
      step4_desc: 'Combine all matched documents into a single submission-ready PDF package.',
      load_empty: 'No tender loaded yet. Upload a requirements.json file to get started.',
      load_btn: 'Load requirements.json',
      reload_btn: 'Load Different Tender',
      tender_id: 'Tender ID',
      tender_title: 'Tender Title',
      procuring_entity: 'Procuring Entity',
      bidder_name: 'Bidder Name',
      submission_deadline: 'Submission Deadline',
      stat_files: 'files',
      stat_size: 'total size',
      stat_matched: 'matched',
      stat_duplicates: 'duplicates',
      drop_text: 'Drag & drop PDF files here, or click to browse',
      drop_hint: 'Up to 30 PDF files, 50 MB total',
      uploaded_files: 'Uploaded Files',
      clear_all: 'Clear All',
      col_order: '#',
      col_document: 'Document',
      col_type: 'Type',
      col_matched_file: 'Matched File',
      col_expiry: 'Expiry Date',
      col_status: 'Status',
      col_action: 'Action',
      mandatory: 'Required',
      optional: 'Optional',
      status_ok: 'OK',
      status_missing: 'Missing',
      status_expired: 'Expired',
      status_expiry_needed: 'Expiry date needed',
      status_not_provided: 'Not provided',
      no_match: 'No file matched',
      expiry_na: 'N/A',
      btn_match: 'Match',
      btn_change: 'Change',
      btn_unmatch: 'Remove',
      match_modal_title: 'Select a File',
      match_modal_desc_tpl: 'Choose a file to match with "{docName}":',
      no_files_available: 'No available files to match. Upload more PDFs or unmatch existing assignments.',
      cancel: 'Cancel',
      all_clear: 'All requirements are satisfied. Ready to generate.',
      issues_tpl: '{count} issue(s) must be resolved before the package can be generated.',
      generate_btn: 'Generate Package',
      generating: 'Generating package…',
      success_title: 'Package generated successfully!',
      download_btn: 'Download Package',
      footer_text: 'All document processing happens locally in your browser. Your files never leave your device.',
      lang_switch_label: 'EN',
      lang_switch_aria: 'Switch to English',
      // Errors
      err_invalid_json: 'This file doesn\'t look like valid JSON. Please check the file and try again.',
      err_missing_fields: 'The JSON is missing required fields (tender or documents). Make sure you\'re using the correct format.',
      err_non_pdf: '"{name}" isn\'t a PDF file. Please choose PDF files only.',
      err_too_many_files: 'You can upload at most 30 files. Please remove some files first.',
      err_too_large: 'Total file size exceeds 50 MB. Please remove some files to continue.',
      err_corrupted_pdf: 'We couldn\'t read "{name}". It may be damaged or password-protected. Please try another file.',
      err_pdf_generation: 'Something went wrong while generating the package. Please try again.',
      err_duplicate_info: 'Duplicate of "{name}" — same content detected.',
      toast_tender_loaded: 'Tender requirements loaded successfully.',
      toast_files_uploaded: '{count} file(s) uploaded.',
      toast_file_removed: 'File removed.',
      toast_all_cleared: 'All files cleared.',
      toast_matched: 'File matched successfully.',
      toast_unmatched: 'Match removed.',
      pages_tpl: '{count} page(s)',
      size_tpl: '{size}',
      cover_title: 'Tender Document Package',
      cover_tender_id: 'Tender ID',
      cover_tender_title: 'Tender Title',
      cover_entity: 'Procuring Entity',
      cover_bidder: 'Bidder Name',
      cover_deadline: 'Submission Deadline',
      cover_created: 'Package Created',
      cover_documents: 'Included Documents',
      success_tender: 'Tender: {id}',
      success_docs: '{count} documents',
      success_pages: '{count} pages',
    },
    bn: {
      tagline: 'তৈরি করুন। যাচাই করুন। জমা দিন।',
      step1_title: 'টেন্ডার প্রয়োজনীয়তা লোড করুন',
      step1_desc: 'আপনার টেন্ডারের requirements.json ফাইল লোড করে শুরু করুন।',
      step2_title: 'পিডিএফ ডকুমেন্ট আপলোড করুন',
      step2_desc: 'আপনার টেন্ডার প্যাকেজে অন্তর্ভুক্ত করতে চান এমন পিডিএফ ফাইল আপলোড করুন।',
      step3_title: 'ডকুমেন্ট মিলান ও যাচাই করুন',
      step3_desc: 'প্রতিটি আপলোড করা ফাইল টেন্ডার প্রয়োজনীয়তার সাথে মিলান এবং মেয়াদ যাচাই করুন।',
      step4_title: 'প্যাকেজ তৈরি করুন',
      step4_desc: 'সমস্ত মিলিত ডকুমেন্ট একটি জমাদান-প্রস্তুত পিডিএফ প্যাকেজে একত্রিত করুন।',
      load_empty: 'এখনও কোনো টেন্ডার লোড হয়নি। শুরু করতে একটি requirements.json ফাইল আপলোড করুন।',
      load_btn: 'requirements.json লোড করুন',
      reload_btn: 'অন্য টেন্ডার লোড করুন',
      tender_id: 'টেন্ডার আইডি',
      tender_title: 'টেন্ডার শিরোনাম',
      procuring_entity: 'ক্রয়কারী সংস্থা',
      bidder_name: 'দরদাতার নাম',
      submission_deadline: 'জমাদানের সময়সীমা',
      stat_files: 'ফাইল',
      stat_size: 'মোট সাইজ',
      stat_matched: 'মিলেছে',
      stat_duplicates: 'ডুপ্লিকেট',
      drop_text: 'পিডিএফ ফাইল এখানে টেনে আনুন, অথবা ব্রাউজ করতে ক্লিক করুন',
      drop_hint: 'সর্বোচ্চ ৩০টি পিডিএফ ফাইল, মোট ৫০ এমবি',
      uploaded_files: 'আপলোড করা ফাইল',
      clear_all: 'সব মুছুন',
      col_order: '#',
      col_document: 'ডকুমেন্ট',
      col_type: 'ধরন',
      col_matched_file: 'মিলিত ফাইল',
      col_expiry: 'মেয়াদ শেষের তারিখ',
      col_status: 'অবস্থা',
      col_action: 'পদক্ষেপ',
      mandatory: 'আবশ্যিক',
      optional: 'ঐচ্ছিক',
      status_ok: 'ঠিক আছে',
      status_missing: 'অনুপস্থিত',
      status_expired: 'মেয়াদ উত্তীর্ণ',
      status_expiry_needed: 'মেয়াদের তারিখ প্রয়োজন',
      status_not_provided: 'প্রদান করা হয়নি',
      no_match: 'কোনো ফাইল মিলেনি',
      expiry_na: 'প্রযোজ্য নয়',
      btn_match: 'মিলান',
      btn_change: 'পরিবর্তন',
      btn_unmatch: 'সরান',
      match_modal_title: 'একটি ফাইল নির্বাচন করুন',
      match_modal_desc_tpl: '"{docName}" এর সাথে মিলানোর জন্য একটি ফাইল নির্বাচন করুন:',
      no_files_available: 'মিলানোর জন্য কোনো উপলব্ধ ফাইল নেই। আরও পিডিএফ আপলোড করুন অথবা বিদ্যমান মিলান সরান।',
      cancel: 'বাতিল',
      all_clear: 'সমস্ত প্রয়োজনীয়তা পূরণ হয়েছে। তৈরি করার জন্য প্রস্তুত।',
      issues_tpl: 'প্যাকেজ তৈরি করার আগে {count}টি সমস্যা সমাধান করতে হবে।',
      generate_btn: 'প্যাকেজ তৈরি করুন',
      generating: 'প্যাকেজ তৈরি হচ্ছে…',
      success_title: 'প্যাকেজ সফলভাবে তৈরি হয়েছে!',
      download_btn: 'প্যাকেজ ডাউনলোড করুন',
      footer_text: 'সমস্ত ডকুমেন্ট প্রক্রিয়াকরণ আপনার ব্রাউজারে স্থানীয়ভাবে হয়। আপনার ফাইল কখনও আপনার ডিভাইস ছাড়ে না।',
      lang_switch_label: 'বাং',
      lang_switch_aria: 'বাংলায় পরিবর্তন করুন',
      err_invalid_json: 'এই ফাইলটি বৈধ JSON মনে হচ্ছে না। অনুগ্রহ করে ফাইলটি পরীক্ষা করে আবার চেষ্টা করুন।',
      err_missing_fields: 'JSON-এ প্রয়োজনীয় ক্ষেত্র (tender বা documents) অনুপস্থিত। সঠিক ফরম্যাট ব্যবহার করছেন কিনা নিশ্চিত হন।',
      err_non_pdf: '"{name}" একটি পিডিএফ ফাইল নয়। শুধুমাত্র পিডিএফ ফাইল নির্বাচন করুন।',
      err_too_many_files: 'সর্বোচ্চ ৩০টি ফাইল আপলোড করা যায়। অনুগ্রহ করে কিছু ফাইল সরান।',
      err_too_large: 'মোট ফাইলের আকার ৫০ এমবি অতিক্রম করেছে। চালিয়ে যেতে কিছু ফাইল সরান।',
      err_corrupted_pdf: '"{name}" পড়া যায়নি। এটি ক্ষতিগ্রস্ত বা পাসওয়ার্ড-সুরক্ষিত হতে পারে। অন্য একটি ফাইল ব্যবহার করুন।',
      err_pdf_generation: 'প্যাকেজ তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      err_duplicate_info: '"{name}" এর ডুপ্লিকেট — একই কন্টেন্ট পাওয়া গেছে।',
      toast_tender_loaded: 'টেন্ডার প্রয়োজনীয়তা সফলভাবে লোড হয়েছে।',
      toast_files_uploaded: '{count}টি ফাইল আপলোড হয়েছে।',
      toast_file_removed: 'ফাইল সরানো হয়েছে।',
      toast_all_cleared: 'সব ফাইল মুছে ফেলা হয়েছে।',
      toast_matched: 'ফাইল সফলভাবে মিলেছে।',
      toast_unmatched: 'মিলান সরানো হয়েছে।',
      pages_tpl: '{count} পৃষ্ঠা',
      size_tpl: '{size}',
      cover_title: 'টেন্ডার ডকুমেন্ট প্যাকেজ',
      cover_tender_id: 'টেন্ডার আইডি',
      cover_tender_title: 'টেন্ডার শিরোনাম',
      cover_entity: 'ক্রয়কারী সংস্থা',
      cover_bidder: 'দরদাতার নাম',
      cover_deadline: 'জমাদানের সময়সীমা',
      cover_created: 'প্যাকেজ তৈরির তারিখ',
      cover_documents: 'অন্তর্ভুক্ত ডকুমেন্ট',
      success_tender: 'টেন্ডার: {id}',
      success_docs: '{count}টি ডকুমেন্ট',
      success_pages: '{count} পৃষ্ঠা',
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  function t(key, params = {}) {
    let str = (i18n[state.lang] && i18n[state.lang][key]) || i18n.en[key] || key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
    return str;
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }

  async function hashFile(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showToast(message, type = 'info') {
    const container = $('#toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function getDocTitle(doc) {
    return state.lang === 'bn' ? (doc.title_bn || doc.title_en) : doc.title_en;
  }

  function getDocDesc(doc) {
    return state.lang === 'bn' ? (doc.description_bn || doc.description_en || '') : (doc.description_en || '');
  }

  function getTenderField(field) {
    const tender = state.tender;
    if (!tender) return '—';
    if (state.lang === 'bn') {
      return tender[field + '_bn'] || tender[field + '_en'] || tender[field] || '—';
    }
    return tender[field + '_en'] || tender[field] || '—';
  }

  // ── Theme ──────────────────────────────────────────────────
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tf-theme', theme);
    const sunIcon = $('#icon-sun');
    const moonIcon = $('#icon-moon');
    if (theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  // ── Language ───────────────────────────────────────────────
  function applyLanguage(lang) {
    state.lang = lang;
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    document.body.setAttribute('data-lang', lang);

    // Update lang toggle button
    const langLabel = $('#lang-label');
    const langBtn = $('#btn-lang-toggle');
    if (lang === 'bn') {
      langLabel.textContent = 'EN';
      langBtn.setAttribute('aria-label', t('lang_switch_aria'));
      langBtn.setAttribute('title', 'Switch to English');
    } else {
      langLabel.textContent = 'বাং';
      langBtn.setAttribute('aria-label', 'Switch to Bangla');
      langBtn.setAttribute('title', 'Switch to Bangla');
    }

    // Update all [data-i18n] elements
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang] && i18n[lang][key]) {
        el.textContent = i18n[lang][key];
      } else if (i18n.en[key]) {
        el.textContent = i18n.en[key];
      }
    });

    // Re-render dynamic content if tender is loaded
    if (state.tender) {
      renderTenderInfo();
      renderRequirementsTable();
      renderUploadedFiles();
      updateValidation();
    }
  }

  // ── Tender Loading ─────────────────────────────────────────
  function handleJsonLoad(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);

        // Normalize incoming JSON structure to support alternate keys
        if (!data.documents && Array.isArray(data.requirements)) {
          data.documents = data.requirements;
        }
        if (data.tender) {
          if (!data.tender.id && data.tender.tender_id) data.tender.id = data.tender.tender_id;
          if (!data.tender.title_en && data.tender.title) data.tender.title_en = data.tender.title;
          if (!data.tender.bidder_name_en && data.tender.bidder) data.tender.bidder_name_en = data.tender.bidder;
          if (!data.tender.procuring_entity_en && data.tender.procuring_entity) data.tender.procuring_entity_en = data.tender.procuring_entity;
        }

        if (!data.tender || !data.documents || !Array.isArray(data.documents)) {
          showToast(t('err_missing_fields'), 'error');
          return;
        }
        // Validate required tender fields
        if (!data.tender.id || !data.tender.submission_deadline) {
          showToast(t('err_missing_fields'), 'error');
          return;
        }

        // Reset state
        state.tender = data.tender;
        state.documents = [...data.documents].sort((a, b) => a.order - b.order);
        state.uploadedFiles = [];
        state.matches = {};
        state.expiryDates = {};
        state.generatedBlob = null;
        state.fileIdCounter = 0;

        // Render
        renderTenderInfo();
        enableSection('section-upload');
        enableSection('section-match');
        enableSection('section-generate');
        renderRequirementsTable();
        renderUploadedFiles();
        updateValidation();
        hideGenerateSuccess();

        showToast(t('toast_tender_loaded'), 'success');
      } catch (err) {
        showToast(t('err_invalid_json'), 'error');
      }
    };
    reader.readAsText(file);
  }

  function renderTenderInfo() {
    const tender = state.tender;
    if (!tender) return;

    $('#load-empty-state').classList.add('hidden');
    $('#tender-info').classList.remove('hidden');

    $('#info-tender-id').textContent = tender.id || '—';
    $('#info-tender-title').textContent = getTenderField('title');
    $('#info-procuring-entity').textContent = getTenderField('procuring_entity');
    $('#info-bidder-name').textContent = getTenderField('bidder_name');
    $('#info-deadline').textContent = tender.submission_deadline || '—';
  }

  function enableSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) section.classList.remove('disabled-section');
  }

  // ── PDF Upload ─────────────────────────────────────────────
  async function handlePdfUpload(files) {
    const fileList = Array.from(files);
    const pdfFiles = [];
    const nonPdfFiles = [];

    // Filter PDFs
    for (const file of fileList) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push(file);
      } else {
        nonPdfFiles.push(file);
      }
    }

    // Show errors for non-PDF files
    for (const f of nonPdfFiles) {
      showToast(t('err_non_pdf', { name: f.name }), 'error');
    }

    if (pdfFiles.length === 0) return;

    // Check file count limit
    if (state.uploadedFiles.length + pdfFiles.length > 30) {
      showToast(t('err_too_many_files'), 'error');
      return;
    }

    // Check total size limit
    const currentSize = state.uploadedFiles.reduce((sum, f) => sum + f.size, 0);
    const newSize = pdfFiles.reduce((sum, f) => sum + f.size, 0);
    if (currentSize + newSize > 50 * 1024 * 1024) {
      showToast(t('err_too_large'), 'error');
      return;
    }

    let addedCount = 0;
    for (const file of pdfFiles) {
      try {
        // Hash for duplicate detection
        const hash = await hashFile(file);

        // Get page count using pdf.js
        let pageCount = 0;
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
          const pdf = await loadingTask.promise;
          pageCount = pdf.numPages;
        } catch (pdfErr) {
          showToast(t('err_corrupted_pdf', { name: file.name }), 'error');
          continue;
        }

        // Check for duplicates
        const existingDup = state.uploadedFiles.find(f => f.hash === hash);
        const isDuplicate = !!existingDup;

        const fileEntry = {
          id: 'file_' + (++state.fileIdCounter),
          file: file,
          name: file.name,
          size: file.size,
          pageCount: pageCount,
          hash: hash,
          isDuplicate: isDuplicate,
          duplicateOf: isDuplicate ? existingDup.name : null,
          matchedTo: null,
        };

        state.uploadedFiles.push(fileEntry);
        addedCount++;
      } catch (err) {
        showToast(t('err_corrupted_pdf', { name: file.name }), 'error');
      }
    }

    if (addedCount > 0) {
      showToast(t('toast_files_uploaded', { count: addedCount }), 'success');
      renderUploadedFiles();
      renderRequirementsTable();
      updateValidation();
    }
  }

  function removeFile(fileId) {
    const file = state.uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    // If file was matched, remove the match
    if (file.matchedTo) {
      delete state.matches[file.matchedTo];
      delete state.expiryDates[file.matchedTo];
      file.matchedTo = null;
    }

    // Also remove any match pointing to this file
    Object.entries(state.matches).forEach(([docId, fId]) => {
      if (fId === fileId) {
        delete state.matches[docId];
        delete state.expiryDates[docId];
      }
    });

    state.uploadedFiles = state.uploadedFiles.filter(f => f.id !== fileId);

    // Recalculate duplicates
    recalcDuplicates();

    renderUploadedFiles();
    renderRequirementsTable();
    updateValidation();
    hideGenerateSuccess();
    showToast(t('toast_file_removed'), 'info');
  }

  function clearAllFiles() {
    state.uploadedFiles = [];
    state.matches = {};
    state.expiryDates = {};
    renderUploadedFiles();
    renderRequirementsTable();
    updateValidation();
    hideGenerateSuccess();
    showToast(t('toast_all_cleared'), 'info');
  }

  function recalcDuplicates() {
    // Reset all duplicate flags
    state.uploadedFiles.forEach(f => {
      f.isDuplicate = false;
      f.duplicateOf = null;
    });
    // Mark duplicates (second+ occurrence of same hash)
    const seen = {};
    for (const f of state.uploadedFiles) {
      if (seen[f.hash]) {
        f.isDuplicate = true;
        f.duplicateOf = seen[f.hash];
      } else {
        seen[f.hash] = f.name;
      }
    }
  }

  // ── Render Uploaded Files ──────────────────────────────────
  function renderUploadedFiles() {
    const container = $('#uploaded-files-container');
    const list = $('#uploaded-files-list');
    const stats = $('#upload-stats');

    if (state.uploadedFiles.length === 0) {
      container.classList.add('hidden');
      stats.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    stats.classList.remove('hidden');

    // Update stats
    const totalSize = state.uploadedFiles.reduce((s, f) => s + f.size, 0);
    const matchedCount = Object.keys(state.matches).length;
    const dupCount = state.uploadedFiles.filter(f => f.isDuplicate).length;

    $('#stat-file-count').textContent = state.uploadedFiles.length;
    $('#stat-total-size').textContent = formatFileSize(totalSize);
    $('#stat-matched').textContent = matchedCount;
    $('#stat-duplicates').textContent = dupCount;

    // Render file cards
    list.innerHTML = '';
    state.uploadedFiles.forEach(f => {
      const card = document.createElement('div');
      card.className = 'file-card' + (f.isDuplicate ? ' duplicate' : '');
      card.setAttribute('role', 'listitem');

      const isMatched = !!f.matchedTo;
      let badges = '';
      if (f.isDuplicate) {
        badges += `<span class="file-badge badge-duplicate">${t('err_duplicate_info', { name: f.duplicateOf })}</span>`;
      }
      if (isMatched) {
        const doc = state.documents.find(d => d.id === f.matchedTo);
        if (doc) {
          badges += `<span class="file-badge badge-matched">→ ${getDocTitle(doc)}</span>`;
        }
      }

      card.innerHTML = `
        <div class="file-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="file-info">
          <div class="file-name" title="${f.name}">${f.name}</div>
          <div class="file-meta">
            <span>${t('pages_tpl', { count: f.pageCount })}</span>
            <span>•</span>
            <span>${formatFileSize(f.size)}</span>
            ${badges}
          </div>
        </div>
        <button class="file-remove" data-file-id="${f.id}" aria-label="Remove ${f.name}" title="Remove file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;

      list.appendChild(card);
    });

    // File remove event delegation
    list.querySelectorAll('.file-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFile(btn.getAttribute('data-file-id'));
      });
    });
  }

  // ── Requirements Table ─────────────────────────────────────
  function renderRequirementsTable() {
    const tbody = $('#requirements-tbody');
    if (!state.documents.length) {
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML = '';
    state.documents.forEach(doc => {
      const tr = document.createElement('tr');
      const matchedFileId = state.matches[doc.id];
      const matchedFile = matchedFileId ? state.uploadedFiles.find(f => f.id === matchedFileId) : null;
      const status = getDocStatus(doc);
      const statusClass = getStatusClass(status);
      const statusLabel = getStatusLabel(status);

      // Expiry cell
      let expiryHtml;
      if (!doc.has_expiry) {
        expiryHtml = `<span class="expiry-na">${t('expiry_na')}</span>`;
      } else if (matchedFile) {
        const expiryVal = state.expiryDates[doc.id] || '';
        const isExpired = status === 'expired';
        expiryHtml = `<input type="date" class="expiry-input ${isExpired ? 'expired' : ''}" data-doc-id="${doc.id}" value="${expiryVal}" aria-label="Expiry date for ${getDocTitle(doc)}">`;
      } else {
        expiryHtml = `<span class="expiry-na">—</span>`;
      }

      // Matched file cell
      let matchedHtml;
      if (matchedFile) {
        matchedHtml = `<span class="matched-file-name" title="${matchedFile.name}">${matchedFile.name}</span>`;
      } else {
        matchedHtml = `<span class="no-match">${t('no_match')}</span>`;
      }

      // Action cell
      let actionHtml;
      if (matchedFile) {
        actionHtml = `
          <div class="action-btns">
            <button class="btn-match" data-doc-id="${doc.id}">${t('btn_change')}</button>
            <button class="btn-unmatch" data-doc-id="${doc.id}">${t('btn_unmatch')}</button>
          </div>
        `;
      } else {
        actionHtml = `<button class="btn-match" data-doc-id="${doc.id}">${t('btn_match')}</button>`;
      }

      tr.innerHTML = `
        <td>${doc.order}</td>
        <td>
          <div class="doc-name">${getDocTitle(doc)}</div>
          <div class="doc-desc">${getDocDesc(doc)}</div>
        </td>
        <td><span class="type-badge ${doc.mandatory ? 'type-mandatory' : 'type-optional'}">${doc.mandatory ? t('mandatory') : t('optional')}</span></td>
        <td>${matchedHtml}</td>
        <td>${expiryHtml}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>${actionHtml}</td>
      `;

      tbody.appendChild(tr);
    });

    // Event: Match / Change buttons
    tbody.querySelectorAll('.btn-match').forEach(btn => {
      btn.addEventListener('click', () => openMatchModal(btn.getAttribute('data-doc-id')));
    });

    // Event: Unmatch buttons
    tbody.querySelectorAll('.btn-unmatch').forEach(btn => {
      btn.addEventListener('click', () => unmatchDoc(btn.getAttribute('data-doc-id')));
    });

    // Event: Expiry date inputs
    tbody.querySelectorAll('.expiry-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const docId = e.target.getAttribute('data-doc-id');
        state.expiryDates[docId] = e.target.value;
        renderRequirementsTable();
        updateValidation();
        hideGenerateSuccess();
      });
    });
  }

  // ── Status Calculation ─────────────────────────────────────
  function getDocStatus(doc) {
    const matchedFileId = state.matches[doc.id];
    const matchedFile = matchedFileId ? state.uploadedFiles.find(f => f.id === matchedFileId) : null;

    if (!matchedFile) {
      return doc.mandatory ? 'missing' : 'not_provided';
    }

    if (doc.has_expiry) {
      const expiry = state.expiryDates[doc.id];
      if (!expiry) return 'expiry_needed';

      const expiryDate = new Date(expiry + 'T00:00:00');
      const deadlineDate = new Date(state.tender.submission_deadline + 'T00:00:00');
      if (expiryDate < deadlineDate) return 'expired';
    }

    return 'ok';
  }

  function getStatusClass(status) {
    const map = {
      ok: 'status-ok',
      missing: 'status-missing',
      expired: 'status-expired',
      expiry_needed: 'status-expiry-needed',
      not_provided: 'status-not-provided',
    };
    return map[status] || '';
  }

  function getStatusLabel(status) {
    const map = {
      ok: t('status_ok'),
      missing: t('status_missing'),
      expired: t('status_expired'),
      expiry_needed: t('status_expiry_needed'),
      not_provided: t('status_not_provided'),
    };
    return map[status] || status;
  }

  function isBlocking(status) {
    return ['missing', 'expiry_needed', 'expired'].includes(status);
  }

  // ── Validation ─────────────────────────────────────────────
  function updateValidation() {
    if (!state.tender) return;

    const blockingIssues = [];
    state.documents.forEach(doc => {
      const status = getDocStatus(doc);
      if (isBlocking(status)) {
        blockingIssues.push({ doc, status });
      }
    });

    const summaryDiv = $('#validation-summary');
    const okDiv = $('#validation-ok');
    const issuesDiv = $('#validation-issues');
    const generateBtn = $('#btn-generate');
    const blockedMsg = $('#generate-blocked-msg');
    const blockedText = $('#generate-blocked-text');

    summaryDiv.classList.remove('hidden');

    if (blockingIssues.length === 0) {
      okDiv.classList.remove('hidden');
      issuesDiv.classList.add('hidden');
      generateBtn.disabled = false;
      blockedMsg.classList.add('hidden');
    } else {
      okDiv.classList.add('hidden');
      issuesDiv.classList.remove('hidden');
      $('#validation-issues-text').textContent = t('issues_tpl', { count: blockingIssues.length });
      generateBtn.disabled = true;
      blockedMsg.classList.remove('hidden');
      blockedText.textContent = t('issues_tpl', { count: blockingIssues.length });
    }
  }

  // ── Match Modal ────────────────────────────────────────────
  let currentMatchDocId = null;

  function openMatchModal(docId) {
    currentMatchDocId = docId;
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    const modal = $('#match-modal');
    const desc = $('#match-modal-desc');
    const fileList = $('#match-file-list');
    const emptyMsg = $('#match-empty');

    desc.textContent = t('match_modal_desc_tpl', { docName: getDocTitle(doc) });

    // Get available files: not matched elsewhere, or matched to this doc
    // Duplicates: a duplicate file can't be matched to a different requirement if its original is already matched somewhere
    const matchedFileIds = new Set(Object.values(state.matches));
    const currentMatch = state.matches[docId];

    const availableFiles = state.uploadedFiles.filter(f => {
      // Allow the currently matched file
      if (f.id === currentMatch) return true;
      // Don't allow if already matched to another requirement
      if (matchedFileIds.has(f.id)) return false;
      // Don't allow if any file with the same content hash is already matched elsewhere
      // This prevents duplicates (regardless of which copy) from being matched to different requirements
      const sameHashMatched = state.uploadedFiles.some(
        other => other.hash === f.hash && other.id !== f.id && matchedFileIds.has(other.id)
      );
      if (sameHashMatched) return false;
      return true;
    });

    fileList.innerHTML = '';
    if (availableFiles.length === 0) {
      emptyMsg.classList.remove('hidden');
    } else {
      emptyMsg.classList.add('hidden');
      availableFiles.forEach(f => {
        const opt = document.createElement('div');
        opt.className = 'match-file-option';
        opt.setAttribute('role', 'option');
        opt.setAttribute('tabindex', '0');

        const isCurrent = f.id === currentMatch;

        opt.innerHTML = `
          <div class="file-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="file-info">
            <div class="file-name">${f.name}${isCurrent ? ' ✓' : ''}</div>
            <div class="file-meta">
              <span>${t('pages_tpl', { count: f.pageCount })}</span>
              <span>•</span>
              <span>${formatFileSize(f.size)}</span>
              ${f.isDuplicate ? `<span class="file-badge badge-duplicate">Duplicate</span>` : ''}
            </div>
          </div>
        `;

        opt.addEventListener('click', () => matchFile(docId, f.id));
        opt.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            matchFile(docId, f.id);
          }
        });

        fileList.appendChild(opt);
      });
    }

    modal.classList.remove('hidden');
    // Focus first option
    const firstOpt = fileList.querySelector('.match-file-option');
    if (firstOpt) firstOpt.focus();
  }

  function closeMatchModal() {
    $('#match-modal').classList.add('hidden');
    currentMatchDocId = null;
  }

  function matchFile(docId, fileId) {
    // Remove previous match for this doc
    const prevFileId = state.matches[docId];
    if (prevFileId) {
      const prevFile = state.uploadedFiles.find(f => f.id === prevFileId);
      if (prevFile) prevFile.matchedTo = null;
    }

    // Remove if this file was matched elsewhere
    Object.entries(state.matches).forEach(([dId, fId]) => {
      if (fId === fileId && dId !== docId) {
        delete state.matches[dId];
        delete state.expiryDates[dId];
        const f = state.uploadedFiles.find(x => x.id === fileId);
        if (f) f.matchedTo = null;
      }
    });

    // Set new match
    state.matches[docId] = fileId;
    const file = state.uploadedFiles.find(f => f.id === fileId);
    if (file) file.matchedTo = docId;

    closeMatchModal();
    renderUploadedFiles();
    renderRequirementsTable();
    updateValidation();
    hideGenerateSuccess();
    showToast(t('toast_matched'), 'success');
  }

  function unmatchDoc(docId) {
    const fileId = state.matches[docId];
    if (fileId) {
      const file = state.uploadedFiles.find(f => f.id === fileId);
      if (file) file.matchedTo = null;
    }
    delete state.matches[docId];
    delete state.expiryDates[docId];

    renderUploadedFiles();
    renderRequirementsTable();
    updateValidation();
    hideGenerateSuccess();
    showToast(t('toast_unmatched'), 'info');
  }

  // ── PDF Generation ─────────────────────────────────────────
  async function generatePackage() {
    const btn = $('#btn-generate');
    const progressDiv = $('#generate-progress');
    const progressFill = $('#progress-fill');
    const progressText = $('#progress-text');
    const successDiv = $('#generate-success');

    btn.disabled = true;
    progressDiv.classList.remove('hidden');
    successDiv.classList.add('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = t('generating');

    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;

      const mergedPdf = await PDFDocument.create();
      const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
      const logoFont = await mergedPdf.embedFont(StandardFonts.TimesRomanBold);

      // Gather ordered docs that have matches
      const includedDocs = state.documents
        .filter(doc => {
          const status = getDocStatus(doc);
          return status === 'ok';
        })
        .sort((a, b) => a.order - b.order);

      // First pass: count total pages to compute footer
      let totalContentPages = 0;
      const docPageCounts = [];
      for (const doc of includedDocs) {
        const fileId = state.matches[doc.id];
        const file = state.uploadedFiles.find(f => f.id === fileId);
        if (file) {
          docPageCounts.push({ doc, file, pages: file.pageCount });
          totalContentPages += file.pageCount;
        }
      }

      const coverPageCount = 1;
      const totalPages = coverPageCount + totalContentPages;

      progressFill.style.width = '10%';

      // ── Create Cover Page ────────────────────────────────
      const coverPage = mergedPdf.addPage([595.28, 841.89]); // A4
      const { width: cw, height: ch } = coverPage.getSize();

      // Cover content
      const tender = state.tender;
      let cy = ch - 80;

      // Title
      coverPage.drawText('Tender Document Package', {
        x: 50, y: cy, size: 22, font: fontBold, color: rgb(0.25, 0.25, 0.35),
      });

      // Company Logo (MT)
      const logoSize = 54;
      const logoX = cw - 50 - logoSize;
      const logoY = cy - 12; // align with title
      
      // Teal square background
      coverPage.drawRectangle({
        x: logoX, y: logoY, width: logoSize, height: logoSize,
        color: rgb(21/255, 81/255, 105/255),
      });
      // White circle outline
      coverPage.drawCircle({
        x: logoX + logoSize/2, y: logoY + logoSize/2, size: (logoSize/2) - 3,
        borderColor: rgb(1, 1, 1), borderWidth: 2,
      });
      // "MT" text
      const mtText = 'MT';
      const mtSize = 26;
      const mtWidth = logoFont.widthOfTextAtSize(mtText, mtSize);
      coverPage.drawText(mtText, {
        x: logoX + (logoSize - mtWidth) / 2, 
        y: logoY + 16, 
        size: mtSize, 
        font: logoFont, 
        color: rgb(1, 1, 1),
      });
      cy -= 40;

      // Divider line
      coverPage.drawLine({
        start: { x: 50, y: cy }, end: { x: cw - 50, y: cy },
        thickness: 1, color: rgb(0.8, 0.8, 0.85),
      });
      cy -= 30;

      // Info fields
      const coverFields = [
        ['Tender ID', tender.id],
        ['Tender Title', tender.title_en || ''],
        ['Procuring Entity', tender.procuring_entity_en || ''],
        ['Bidder Name', tender.bidder_name_en || ''],
        ['Submission Deadline', tender.submission_deadline || ''],
        ['Package Created', new Date().toISOString().split('T')[0]],
      ];

      for (const [label, value] of coverFields) {
        coverPage.drawText(label + ':', {
          x: 50, y: cy, size: 10, font: fontBold, color: rgb(0.4, 0.4, 0.5),
        });
        cy -= 16;
        coverPage.drawText(value || '—', {
          x: 50, y: cy, size: 12, font: font, color: rgb(0.15, 0.15, 0.2),
        });
        cy -= 28;
      }

      // Included documents list
      cy -= 10;
      coverPage.drawText('Included Documents:', {
        x: 50, y: cy, size: 12, font: fontBold, color: rgb(0.25, 0.25, 0.35),
      });
      cy -= 24;

      for (let i = 0; i < includedDocs.length; i++) {
        const doc = includedDocs[i];
        const text = `${doc.order}. ${doc.title_en}`;
        if (cy < 60) break; // Don't overflow page
        coverPage.drawText(text, {
          x: 60, y: cy, size: 10, font: font, color: rgb(0.2, 0.2, 0.3),
        });
        cy -= 18;
      }

      // Cover footer
      const footerText = `${tender.id} | Page 1 of ${totalPages}`;
      const footerWidth = font.widthOfTextAtSize(footerText, 9);
      coverPage.drawText(footerText, {
        x: (cw - footerWidth) / 2,
        y: 25,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.55),
      });

      progressFill.style.width = '25%';

      // ── Add Document Pages ───────────────────────────────
      let currentPageNum = 2; // After cover
      const totalDocs = docPageCounts.length;

      for (let di = 0; di < docPageCounts.length; di++) {
        const { file } = docPageCounts[di];
        const arrayBuffer = await file.file.arrayBuffer();
        let srcDoc;
        try {
          srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        } catch (loadErr) {
          showToast(t('err_corrupted_pdf', { name: file.name }), 'error');
          continue;
        }

        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

        for (const page of copiedPages) {
          mergedPdf.addPage(page);

          // Add footer
          const { width: pw, height: _ph } = page.getSize();
          const ft = `${tender.id} | Page ${currentPageNum} of ${totalPages}`;
          const ftWidth = font.widthOfTextAtSize(ft, 9);
          page.drawText(ft, {
            x: (pw - ftWidth) / 2,
            y: 25,
            size: 9,
            font: font,
            color: rgb(0.5, 0.5, 0.55),
          });
          currentPageNum++;
        }

        // Update progress
        const progress = 25 + (70 * (di + 1) / totalDocs);
        progressFill.style.width = progress + '%';
      }

      progressFill.style.width = '95%';

      // Save
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const filename = `${tender.id}_Package.pdf`;

      state.generatedBlob = blob;
      state.generatedFilename = filename;

      progressFill.style.width = '100%';

      // Show success
      setTimeout(() => {
        progressDiv.classList.add('hidden');
        successDiv.classList.remove('hidden');

        $('#success-tender-id').textContent = t('success_tender', { id: tender.id });
        $('#success-doc-count').textContent = t('success_docs', { count: includedDocs.length });
        $('#success-page-count').textContent = t('success_pages', { count: totalPages });

        btn.disabled = false;
        showToast(t('success_title'), 'success');
      }, 500);

    } catch (err) {
      progressDiv.classList.add('hidden');
      btn.disabled = false;
      showToast(t('err_pdf_generation'), 'error');
      console.error('PDF generation error:', err);
    }
  }

  function downloadPackage() {
    if (!state.generatedBlob) return;
    const url = URL.createObjectURL(state.generatedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.generatedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function hideGenerateSuccess() {
    $('#generate-success').classList.add('hidden');
    $('#generate-progress').classList.add('hidden');
    state.generatedBlob = null;
  }

  // ── Event Listeners ────────────────────────────────────────
  function initEvents() {
    // Theme toggle
    $('#btn-theme-toggle').addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // Language toggle
    $('#btn-lang-toggle').addEventListener('click', () => {
      applyLanguage(state.lang === 'en' ? 'bn' : 'en');
    });

    // JSON file inputs
    $('#input-json').addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleJsonLoad(e.target.files[0]);
      e.target.value = '';
    });

    $('#input-json-reload').addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleJsonLoad(e.target.files[0]);
      e.target.value = '';
    });

    // PDF file input
    const pdfInput = $('#input-pdfs');
    pdfInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handlePdfUpload(e.target.files);
      e.target.value = '';
    });

    // Drop zone
    const dropZone = $('#drop-zone');

    dropZone.addEventListener('click', () => pdfInput.click());
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pdfInput.click();
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        handlePdfUpload(e.dataTransfer.files);
      }
    });

    // Clear all files
    $('#btn-clear-all-files').addEventListener('click', clearAllFiles);

    // Generate button
    $('#btn-generate').addEventListener('click', generatePackage);

    // Download button
    $('#btn-download').addEventListener('click', downloadPackage);

    // Modal close
    $('#btn-close-modal').addEventListener('click', closeMatchModal);
    $('#btn-modal-cancel').addEventListener('click', closeMatchModal);
    $('#match-modal').addEventListener('click', (e) => {
      if (e.target === $('#match-modal')) closeMatchModal();
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMatchModal();
    });

    // Prevent drag & drop on the whole page from opening files
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
  }

  // ── Initialization ─────────────────────────────────────────
  function init() {
    applyTheme(state.theme);
    applyLanguage('en');
    initEvents();
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
