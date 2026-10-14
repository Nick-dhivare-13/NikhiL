(() => {
  const STORAGE_KEY = 'solarsphere-site-settings-v1';
  const DEFAULTS = {
    sampleRatePerKwh: 6.8,
    sampleCostPerKw: 62500,
    emi: {
      systemPrice: 187500,
      downPayment: 37500,
      interestRate: 10,
      loanMonths: 60
    },
    packages: [
      { name: 'Starter example', sizeKw: 2, price: 125000, note: 'A compact example system', featured: false },
      { name: 'Everyday example', sizeKw: 3, price: 187500, note: 'A mid-size example system', featured: true },
      { name: 'Expanded example', sizeKw: 5, price: 312500, note: 'A larger example system', featured: false }
    ]
  };

  const copyDefaults = () => JSON.parse(JSON.stringify(DEFAULTS));

  const get = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!stored || typeof stored !== 'object') return copyDefaults();
      return {
        ...copyDefaults(),
        ...stored,
        emi: { ...DEFAULTS.emi, ...(stored.emi || {}) },
        packages: Array.isArray(stored.packages) ? stored.packages : copyDefaults().packages
      };
    } catch {
      return copyDefaults();
    }
  };

  const save = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return true;
    } catch {
      return false;
    }
  };

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  };

  window.SolarSphereConfig = { get, save, reset };
})();
