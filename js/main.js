/**
 * Raihan Muzaffar - Portfolio Multi-page Main Script
 * Target: /portfolio/js/main.js
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  initMobileNav();
  initActiveNavLink();
  initStickyNavbar();
  initRevealOnScroll();
  initAccordions();
  initSkillProgressAnimation();
  initMagneticButtons();
  initProjectsFilter();
  initContactValidation();
});

/**
 * Page fade-in effect on load
 */
function initPageTransition() {
  document.body.style.opacity = '1';
}

/**
 * Mobile Navigation Menu Toggle
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBtn.classList.toggle('open');
    navMenu.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggleBtn.classList.remove('open');
      navMenu.classList.remove('open');
    }
  });
}

/**
 * Set active state in navigation based on current filename
 */
function initActiveNavLink() {
  const path = window.location.pathname;
  const page = path.split("/").pop();
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    
    // Exact match or default index match
    if (page === href || (href === 'index.html' && (page === '' || page === 'index.html'))) {
      link.classList.add('active');
    }
  });
}

/**
 * Add border and blur to navbar when page is scrolled
 */
function initStickyNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check
}

/**
 * Reveal elements when scrolled into view
 */
function initRevealOnScroll() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  if (revealElements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('active'));
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    observer.observe(el);
  });
}

/**
 * Handle accordions for both services.html and contact.html (FAQs)
 */
function initAccordions() {
  // Services & FAQ Accordions
  const accordionItems = document.querySelectorAll('.accordion-item, .faq-item');
  
  accordionItems.forEach((item, index) => {
    const header = item.querySelector('.accordion-header, .faq-header');
    const body = item.querySelector('.accordion-body, .faq-body');
    
    if (!header || !body) return;

    // Set first item open by default ONLY if it's the services list accordion
    if (index === 0 && item.classList.contains('accordion-item')) {
      item.classList.add('active');
      body.style.maxHeight = body.scrollHeight + 'px';
    }

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Determine other sibling elements to collapse
      const siblingSelector = item.classList.contains('accordion-item') ? '.accordion-item' : '.faq-item';
      const siblings = document.querySelectorAll(siblingSelector);
      
      siblings.forEach(sibling => {
        sibling.classList.remove('active');
        const siblingBody = sibling.querySelector('.accordion-body, .faq-body');
        if (siblingBody) siblingBody.style.maxHeight = '0px';
      });

      if (!isActive) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });

    window.addEventListener('resize', () => {
      if (item.classList.contains('active')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/**
 * Animate progress bars in skills page
 */
function initSkillProgressAnimation() {
  const skillBars = document.querySelectorAll('.skill-progress-fill');
  if (skillBars.length === 0) return;

  const observerOptions = {
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const progress = fill.getAttribute('data-progress');
        fill.style.width = `${progress}%`;
        observer.unobserve(fill);
      }
    });
  }, observerOptions);

  skillBars.forEach(bar => {
    observer.observe(bar);
  });
}

/**
 * Magnetic button cursor alignment effect
 */
function initMagneticButtons() {
  const magneticButtons = document.querySelectorAll('.btn-primary, .btn-secondary, .social-btn, .accordion-icon, .faq-icon, .filter-btn');
  
  if (window.innerWidth < 768) return;

  magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - (rect.width / 2);
      const y = e.clientY - rect.top - (rect.height / 2);
      
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0px, 0px)';
    });
  });
}

/**
 * Filter projects in projects.html
 */
function initProjectsFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length === 0 || projectCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Set active button class
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (filterValue === 'all' || cardCategory === filterValue) {
          card.classList.remove('hidden');
          // Trigger slight fade-in animation
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transition = 'opacity 0.4s ease';
          }, 50);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/**
 * Validation handle for contact form
 */
function initContactValidation() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !subject || !message) {
      alert('Please fill out all fields before submitting.');
      return;
    }

    // Mock success trigger
    alert(`Thank you, ${name}! Your message has been sent successfully. I will get back to you shortly at ${email}.`);
    form.reset();
  });
}
