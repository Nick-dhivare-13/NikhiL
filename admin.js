(() => {
  const config = window.SolarSphereConfig;
  const loginPanel = document.querySelector('#admin-login');
  const dashboard = document.querySelector('#admin-dashboard');
  const loginForm = document.querySelector('#admin-login-form');
  const loginMessage = document.querySelector('#admin-login-message');
  const settingsForm = document.querySelector('#admin-settings-form');
  const saveMessage = document.querySelector('#admin-save-message');
  const packageList = document.querySelector('#admin-package-list');
  const addPackageButton = document.querySelector('#add-package');
  const sessionKey = 'solarsphere-admin-signed-in';
  const demoUsername = 'admin';
  const demoPassword = 'solar123';
  if (!config || !loginPanel || !dashboard || !loginForm || !settingsForm || !packageList) return;

  const showDashboard = () => {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    fillForm(config.get());
  };

  const showLogin = () => {
    loginPanel.hidden = false;
    dashboard.hidden = true;
  };

  const makeField = (labelText, key, value, options = {}) => {
    const label = document.createElement('label');
    label.className = 'field admin-field';
    const caption = document.createElement('span');
    caption.textContent = labelText;
    const input = document.createElement('input');
    input.type = options.type || 'text';
    input.dataset.packageField = key;
    input.value = value ?? '';
    input.required = options.required !== false;
    if (options.min !== undefined) input.min = String(options.min);
    if (options.max !== undefined) input.max = String(options.max);
    if (options.step !== undefined) input.step = String(options.step);
    if (options.maxLength !== undefined) input.maxLength = options.maxLength;
    label.append(caption, input);
    return label;
  };

  const createPackageRow = (item, index) => {
    const row = document.createElement('fieldset');
    row.className = 'admin-package-row';
    const legend = document.createElement('legend');
    legend.textContent = 'Package ' + (index + 1);
    const fields = document.createElement('div');
    fields.className = 'admin-package-fields';
    fields.append(
      makeField('Package name', 'name', item.name, { maxLength: 50 }),
      makeField('System size (kW)', 'sizeKw', item.sizeKw, { type: 'number', min: 0.5, max: 50, step: 0.1 }),
      makeField('Example price (₹)', 'price', item.price, { type: 'number', min: 1, max: 100000000, step: 1 }),
      makeField('Short description', 'note', item.note, { maxLength: 120 })
    );
    const footer = document.createElement('div');
    footer.className = 'admin-package-footer';
    const featuredLabel = document.createElement('label');
    featuredLabel.className = 'admin-featured';
    const featured = document.createElement('input');
    featured.type = 'checkbox';
    featured.dataset.packageField = 'featured';
    featured.checked = Boolean(item.featured);
    featuredLabel.append(featured, document.createTextNode(' Highlight this package'));
    const remove = document.createElement('button');
    remove.className = 'admin-remove-package';
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove package ' + (index + 1));
    remove.addEventListener('click', () => {
      row.remove();
      refreshPackageControls();
    });
    footer.append(featuredLabel, remove);
    row.append(legend, fields, footer);
    return row;
  };

  const refreshPackageControls = () => {
    [...packageList.querySelectorAll('.admin-package-row')].forEach((row, index) => {
      row.querySelector('legend').textContent = 'Package ' + (index + 1);
      row.querySelector('.admin-remove-package').setAttribute('aria-label', 'Remove package ' + (index + 1));
    });
    addPackageButton.disabled = packageList.querySelectorAll('.admin-package-row').length >= 6;
  };

  const fillForm = (settings) => {
    const emi = settings.emi;
    settingsForm.elements.systemPrice.value = emi.systemPrice;
    settingsForm.elements.downPayment.value = emi.downPayment;
    settingsForm.elements.interestRate.value = emi.interestRate;
    settingsForm.elements.loanMonths.value = emi.loanMonths;
    packageList.replaceChildren(...settings.packages.map(createPackageRow));
    refreshPackageControls();
    saveMessage.textContent = '';
  };

  const collectPackages = () => [...packageList.querySelectorAll('.admin-package-row')].map((row) => {
    const value = (key) => row.querySelector('[data-package-field="' + key + '"]');
    return {
      name: value('name').value.trim(),
      sizeKw: Number(value('sizeKw').value),
      price: Number(value('price').value),
      note: value('note').value.trim(),
      featured: value('featured').checked
    };
  });

  const saveSettings = (event) => {
    event.preventDefault();
    saveMessage.textContent = '';
    if (!settingsForm.reportValidity()) return;

    const systemPrice = Number(settingsForm.elements.systemPrice.value);
    const downPayment = Number(settingsForm.elements.downPayment.value);
    const packages = collectPackages();
    if (downPayment >= systemPrice) {
      saveMessage.textContent = 'Down payment must be less than the system price.';
      settingsForm.elements.downPayment.focus();
      return;
    }
    if (packages.length < 1 || packages.length > 6) {
      saveMessage.textContent = 'Keep between 1 and 6 package examples.';
      return;
    }
    if (packages.some((item) => !item.name || !item.note || item.sizeKw <= 0 || item.price <= 0)) {
      saveMessage.textContent = 'Complete every package name, description, capacity, and price.';
      return;
    }

    const current = config.get();
    const updated = {
      ...current,
      emi: {
        systemPrice,
        downPayment,
        interestRate: Number(settingsForm.elements.interestRate.value),
        loanMonths: Number(settingsForm.elements.loanMonths.value)
      },
      packages
    };
    if (!config.save(updated)) {
      saveMessage.textContent = 'Could not save settings. Open the project through VS Code Live Server and try again.';
      return;
    }
    saveMessage.textContent = 'Saved in this browser. Refresh the home page and EMI calculator to view the changes.';
  };

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = loginForm.elements.username.value.trim();
    const password = loginForm.elements.password.value;
    if (username !== demoUsername || password !== demoPassword) {
      loginMessage.textContent = 'That username or password does not match the classroom demo.';
      return;
    }
    loginMessage.textContent = '';
    try {
      sessionStorage.setItem(sessionKey, 'yes');
    } catch {
      // Keep the demo login usable for this page view when storage is unavailable.
    }
    showDashboard();
  });

  settingsForm.addEventListener('submit', saveSettings);
  addPackageButton.addEventListener('click', () => {
    if (packageList.querySelectorAll('.admin-package-row').length >= 6) return;
    const currentCount = packageList.querySelectorAll('.admin-package-row').length;
    packageList.append(createPackageRow({
      name: 'New example ' + (currentCount + 1),
      sizeKw: 1,
      price: 62500,
      note: 'A new illustrative system option',
      featured: false
    }, currentCount));
    refreshPackageControls();
  });

  document.querySelector('#reset-settings').addEventListener('click', () => {
    if (!window.confirm('Restore the original sample packages and EMI values?')) return;
    if (!config.reset()) {
      saveMessage.textContent = 'Could not reset settings in this browser.';
      return;
    }
    fillForm(config.get());
    saveMessage.textContent = 'Sample defaults restored. Refresh the home page and EMI calculator.';
  });

  document.querySelector('#admin-logout').addEventListener('click', () => {
    try {
      sessionStorage.removeItem(sessionKey);
    } catch {
      // The current view still signs out if storage is unavailable.
    }
    showLogin();
  });

  try {
    if (sessionStorage.getItem(sessionKey) === 'yes') showDashboard();
  } catch {
    showLogin();
  }
})();
