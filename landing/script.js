document.getElementById('year').textContent = new Date().getFullYear();

const reveal = document.querySelectorAll('.pain-card, .feature-card, .steps li');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = 1;
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

reveal.forEach((el) => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(16px)';
  observer.observe(el);
});

const leadForm = document.getElementById('lead-form');
if (leadForm) {
  const statusEl = leadForm.querySelector('.lead-form-status');
  const submitBtn = leadForm.querySelector('.lead-submit');

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(leadForm).entries());
    if (!data.full_name?.trim() || !data.phone?.trim()) {
      statusEl.textContent = 'נא למלא שם וטלפון';
      statusEl.className = 'lead-form-status is-error';
      return;
    }

    submitBtn.disabled = true;
    statusEl.textContent = 'שולח...';
    statusEl.className = 'lead-form-status';

    try {
      const res = await fetch('https://app.hey-digital-crm.co.il/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('request failed');
      leadForm.reset();
      statusEl.textContent = 'הפרטים נשלחו, נחזור אליכם בהקדם!';
      statusEl.className = 'lead-form-status is-success';
    } catch (err) {
      statusEl.textContent = 'משהו השתבש, אפשר לנסות שוב או להתקשר אלינו.';
      statusEl.className = 'lead-form-status is-error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
