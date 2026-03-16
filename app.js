

// @ts-nocheck

window.addEventListener('DOMContentLoaded', function () {

  /* ── EmailJS Keys ── */
  var SERVICE_ID  = 'service_a1b2c3';
  // template IDs are defined inside the submit handler below
  var PUBLIC_KEY  = 'RCglu7aWx9hf2nhBG';

  emailjs.init({ publicKey: PUBLIC_KEY });

  /* ── Today's date ── */
  var today = new Date().toISOString().split('T')[0];
  document.getElementById('formDate').value = today;
  document.getElementById('declarationDate').value = today;

  /* ── Toggle yes/no detail fields ── */
  window.toggleDetail = function(id, radio) {
    var el = document.getElementById(id);
    if (!el) return;
    if (radio && radio.value === 'Yes') {
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  };

  /* ── Signature Canvas ── */
  var canvas = document.getElementById('signatureCanvas');
  var ctx = canvas.getContext('2d');
  var drawing = false;
  var lastX = 0, lastY = 0;
  var hasSig = false;

  function getPos(e) {
    var r = canvas.getBoundingClientRect();
    var scaleX = canvas.width / r.width;
    var scaleY = canvas.height / r.height;
    if (e.touches && e.touches[0]) {
      return [(e.touches[0].clientX - r.left) * scaleX, (e.touches[0].clientY - r.top) * scaleY];
    }
    return [(e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY];
  }

  function drawLine(x, y) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1c1c1c';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastX = x; lastY = y;
    hasSig = true;
  }

  canvas.addEventListener('mousedown', function(e) {
    drawing = true;
    var p = getPos(e); lastX = p[0]; lastY = p[1];
  });
  canvas.addEventListener('mousemove', function(e) {
    if (!drawing) return;
    var p = getPos(e); drawLine(p[0], p[1]);
  });
  canvas.addEventListener('mouseup', function() { drawing = false; });
  canvas.addEventListener('mouseleave', function() { drawing = false; });

  canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    drawing = true;
    var p = getPos(e); lastX = p[0]; lastY = p[1];
  }, { passive: false });
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e); drawLine(p[0], p[1]);
  }, { passive: false });
  canvas.addEventListener('touchend', function() { drawing = false; });

  document.addEventListener('mouseup', function() { drawing = false; });

  window.clearSignature = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSig = false;
  };

  /* ── Toast ── */
  function showToast(msg, isError) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' error' : '');
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 5000);
  }

  /* ── Collect all form values ── */
  function collectData() {
    var d = {};
    var fd = new FormData(document.getElementById('zakatForm'));
    fd.forEach(function(v, k) { d[k] = v; });
    d.formDate = document.getElementById('formDate').value;
    return d;
  }

  /* ── Build plain-text email body ── */
  function buildMessage(d) {
    return [
      'EMPLOYEE ZAKAT ELIGIBILITY DECLARATION',
      '=========================================',
      'Form Date: ' + (d.formDate || '-'),
      '',
      '-- EMPLOYEE INFORMATION --',
      'Name:              ' + (d.empName || '-'),
      'Employee ID:       ' + (d.empId || '-'),
      'Department:        ' + (d.department || '-'),
      'Job Title:         ' + (d.jobTitle || '-'),
      'Monthly Salary:    ' + (d.salary ? 'PKR ' + Number(d.salary).toLocaleString() : '-'),
      'Contact Number:    ' + (d.contactNo || '-'),
      'Email Address:     ' + (d.empEmail || '-'),
      '',
      '-- FAMILY INFORMATION --',
      'Marital Status:    ' + (d.maritalStatus || '-'),
      'No. of Dependents: ' + (d.dependents || '0'),
      '',
      '-- FINANCIAL INFORMATION --',
      'Exceeds Nisab:     ' + (d.exceedsNisab || '-'),
      'Details:           ' + (d.exceedsNisabDetails || '-'),
      'Has Debts:         ' + (d.hasDebts || '-'),
      'Details:           ' + (d.hasDebtsDetails || '-'),
      '',
      '-- DECLARATION --',
      'Digitally Signed:  ' + (hasSig ? 'Yes' : 'No'),
      'Declaration Date:  ' + (d.declarationDate || '-'),
      '',
      '-- FOR OFFICE USE --',
      'Reviewed By:       ' + (d.reviewedBy || '-'),
      'Eligibility:       ' + (d.eligibilityStatus || '-'),
      'Approved By:       ' + (d.approvedBy || '-'),
      'Approval Date:     ' + (d.approvalDate || '-'),
      '',
      '-----------------------------------------',
      'Submitted via Zakat Declaration Web Form'
    ].join('\n');
  }

  /* ── Validate required fields ── */
  function validate() {
    var ok = true;
    var required = ['empName','empId','department','jobTitle','salary','contactNo','empEmail','declarationDate'];
    required.forEach(function(id) {
      var el = document.getElementById(id);
      if (el && !el.value.trim()) {
        el.style.borderColor = '#dc2626';
        ok = false;
      } else if (el) {
        el.style.borderColor = '';
      }
    });
    if (!document.querySelector('input[name="maritalStatus"]:checked')) ok = false;
    if (!document.querySelector('input[name="exceedsNisab"]:checked')) ok = false;
    if (!document.querySelector('input[name="hasDebts"]:checked')) ok = false;
    return ok;
  }

  /* ── Form Submit ── */
  document.getElementById('zakatForm').addEventListener('submit', function(e) {
    e.preventDefault();

    if (!validate()) {
      showToast('Please fill in all required fields.', true);
      return;
    }

    var btn   = document.getElementById('submitBtn');
    var label = document.getElementById('submitLabel');
    btn.disabled = true;
    label.textContent = 'Sending...';

    var data = collectData();

    var params = {
      emp_name:   data.empName    || '-',
      emp_id:     data.empId      || '-',
      department: data.department || '-',
      job_title:  data.jobTitle   || '-',
      form_date:  data.formDate   || '-',
      emp_email:  data.empEmail   || '-',
      reply_to:   data.empEmail   || '-',
      message:    buildMessage(data)
    };

    // Send to admin (your email)
    var THANKYOU_TEMPLATE_ID = 'template_j9qzr3o';  // Auto-Reply → employee thank you
    var ADMIN_TEMPLATE_ID    = 'template_p3lavtl';   // Contact Us → your inbox

    emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, params)
      .then(function() {
        // Now send thank you to employee
        return emailjs.send(SERVICE_ID, THANKYOU_TEMPLATE_ID, params);
      })
      .then(function() {
        showToast('✅ Declaration submitted! Confirmation email sent to employee.');
        setTimeout(function() { resetForm(true); }, 1500);
      })
      .catch(function(err) {
        console.error('EmailJS error:', JSON.stringify(err));
        showToast('Failed to send: ' + (err.text || JSON.stringify(err)), true);
      })
      .finally(function() {
        btn.disabled = false;
        label.textContent = 'Submit Declaration';
      });
  });

  /* ── Reset ── */
  window.resetForm = function(silent) {
    if (!silent && !confirm('Reset all fields? This cannot be undone.')) return;
    document.getElementById('zakatForm').reset();
    document.getElementById('formDate').value = today;
    document.getElementById('declarationDate').value = today;
    window.clearSignature();
    document.querySelectorAll('.yn-detail').forEach(function(el) { el.classList.remove('visible'); });
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"]').forEach(function(el) { el.style.borderColor = ''; });
    if (!silent) showToast('Form has been reset.');
  };

}); // end DOMContentLoaded
