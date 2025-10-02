// ============================================================
// SECURITY LAYER FOR MAIN WEBSITE
// ============================================================

(function() {
  'use strict';

  // Security Configuration
  const SECURITY_CONFIG = {
    maxSubmissionsPerIP: 10,
    maxSubmissionsPerHour: 5,
    minNicknameLength: 2,
    maxNicknameLength: 50,
    minLocationLength: 2,
    maxLocationLength: 100,
    submissionCooldown: 30000, // 30 seconds
    bannedWords: ['admin', 'test', 'script', '<', '>', 'delete', 'drop'],
    sessionTimeout: 3600000 // 1 hour
  };

  // Rate Limiter
  const RateLimiter = {
    getSubmissionCount: function() {
      const data = sessionStorage.getItem('visitor_submissions');
      return data ? JSON.parse(data) : { count: 0, timestamp: Date.now() };
    },
    
    incrementSubmissionCount: function() {
      const data = this.getSubmissionCount();
      data.count++;
      data.timestamp = Date.now();
      sessionStorage.setItem('visitor_submissions', JSON.stringify(data));
      return data.count;
    },
    
    getLastSubmission: function() {
      return parseInt(sessionStorage.getItem('last_submission') || '0');
    },
    
    setLastSubmission: function() {
      sessionStorage.setItem('last_submission', Date.now().toString());
    },
    
    isRateLimited: function() {
      const data = this.getSubmissionCount();
      const now = Date.now();
      
      if (now - data.timestamp > SECURITY_CONFIG.sessionTimeout) {
        sessionStorage.removeItem('visitor_submissions');
        return false;
      }
      
      if (data.count >= SECURITY_CONFIG.maxSubmissionsPerIP) {
        return true;
      }
      
      const lastSubmission = this.getLastSubmission();
      if (now - lastSubmission < SECURITY_CONFIG.submissionCooldown) {
        return true;
      }
      
      return false;
    }
  };

  // Input Validator
  const InputValidator = {
    sanitize: function(input) {
      if (typeof input !== 'string') return '';
      
      let sanitized = input.replace(/<[^>]*>/g, '');
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
      
      return sanitized.trim();
    },
    
    validateNickname: function(nickname) {
      const sanitized = this.sanitize(nickname);
      
      if (sanitized.length < SECURITY_CONFIG.minNicknameLength) {
        return { valid: false, error: `Nickname must be at least ${SECURITY_CONFIG.minNicknameLength} characters` };
      }
      
      if (sanitized.length > SECURITY_CONFIG.maxNicknameLength) {
        return { valid: false, error: `Nickname must be less than ${SECURITY_CONFIG.maxNicknameLength} characters` };
      }
      
      const lowerNickname = sanitized.toLowerCase();
      for (const word of SECURITY_CONFIG.bannedWords) {
        if (lowerNickname.includes(word)) {
          return { valid: false, error: 'Nickname contains invalid characters or words' };
        }
      }
      
      if (!/^[a-zA-Z0-9\s\-_.]+$/.test(sanitized)) {
        return { valid: false, error: 'Nickname can only contain letters, numbers, spaces, and basic punctuation' };
      }
      
      return { valid: true, value: sanitized };
    },
    
    validateLocation: function(location) {
      const sanitized = this.sanitize(location);
      
      if (sanitized.length < SECURITY_CONFIG.minLocationLength) {
        return { valid: false, error: `Location must be at least ${SECURITY_CONFIG.minLocationLength} characters` };
      }
      
      if (sanitized.length > SECURITY_CONFIG.maxLocationLength) {
        return { valid: false, error: `Location must be less than ${SECURITY_CONFIG.maxLocationLength} characters` };
      }
      
      if (!/^[a-zA-Z0-9\s,.\-]+$/.test(sanitized)) {
        return { valid: false, error: 'Location contains invalid characters' };
      }
      
      return { valid: true, value: sanitized };
    },
    
    validateDateTime: function(dateTime) {
      if (!dateTime) {
        return { valid: false, error: 'Visit time is required' };
      }
      
      const date = new Date(dateTime);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid date format' };
      }
      
      const maxFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (date > maxFuture) {
        return { valid: false, error: 'Visit time cannot be more than 24 hours in the future' };
      }
      
      const minPast = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      if (date < minPast) {
        return { valid: false, error: 'Visit time cannot be more than 1 year in the past' };
      }
      
      return { valid: true, value: dateTime };
    },
    
    validateRole: function(role) {
      const validRoles = ['students', 'visitors'];
      if (!validRoles.includes(role)) {
        return { valid: false, error: 'Invalid role selected' };
      }
      return { valid: true, value: role };
    }
  };

  // Security Logger
  const SecurityLogger = {
    log: function(event, details) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: event,
        details: details
      };
      console.warn('[SECURITY]', logEntry);
    }
  };

  // Form Validation Interceptor
  function interceptFormSubmission() {
    const form = document.getElementById('info-form');
    if (!form) return;
    
    form.addEventListener('submit', function(event) {
      if (RateLimiter.isRateLimited()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        const cooldownRemaining = Math.ceil((SECURITY_CONFIG.submissionCooldown - (Date.now() - RateLimiter.getLastSubmission())) / 1000);
        
        showError(cooldownRemaining > 0 
          ? `Please wait ${cooldownRemaining} seconds before submitting again`
          : 'Too many submissions. Please try again later');
        
        SecurityLogger.log('RATE_LIMIT_EXCEEDED', {
          submissions: RateLimiter.getSubmissionCount().count
        });
        
        return false;
      }

      const nickname = document.getElementById('nickname').value;
      const location = document.getElementById('location').value;
      const visitTime = document.getElementById('visit_time').value;
      const role = document.getElementById('role').value;

      const nicknameValidation = InputValidator.validateNickname(nickname);
      if (!nicknameValidation.valid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showError(nicknameValidation.error);
        SecurityLogger.log('VALIDATION_FAILED', { field: 'nickname' });
        return false;
      }

      const locationValidation = InputValidator.validateLocation(location);
      if (!locationValidation.valid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showError(locationValidation.error);
        SecurityLogger.log('VALIDATION_FAILED', { field: 'location' });
        return false;
      }

      const dateTimeValidation = InputValidator.validateDateTime(visitTime);
      if (!dateTimeValidation.valid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showError(dateTimeValidation.error);
        SecurityLogger.log('VALIDATION_FAILED', { field: 'visit_time' });
        return false;
      }

      const roleValidation = InputValidator.validateRole(role);
      if (!roleValidation.valid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showError(roleValidation.error);
        SecurityLogger.log('VALIDATION_FAILED', { field: 'role' });
        return false;
      }

      document.getElementById('nickname').value = nicknameValidation.value;
      document.getElementById('location').value = locationValidation.value;
      
      RateLimiter.incrementSubmissionCount();
      RateLimiter.setLastSubmission();
      
      SecurityLogger.log('FORM_SUBMITTED', { role: role });
    }, true);
  }

  // Error Display
  function showError(message) {
    let errorDiv = document.getElementById('security-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'security-error';
      errorDiv.className = 'bg-red-500/90 text-white px-4 py-3 rounded-lg mb-4 text-center';
      errorDiv.style.animation = 'fadeInUp 0.3s';
      
      const form = document.getElementById('info-form');
      if (form) {
        form.insertBefore(errorDiv, form.firstChild);
      }
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }

  // Initialize Security
  function initSecurity() {
    interceptFormSubmission();

    const nicknameInput = document.getElementById('nickname');
    const locationInput = document.getElementById('location');

    if (nicknameInput) {
      nicknameInput.addEventListener('input', function() {
        this.value = InputValidator.sanitize(this.value);
      });
    }

    if (locationInput) {
      locationInput.addEventListener('input', function() {
        this.value = InputValidator.sanitize(this.value);
      });
    }

    console.log('[SECURITY] Protection enabled');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
  } else {
    initSecurity();
  }

})();