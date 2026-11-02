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
