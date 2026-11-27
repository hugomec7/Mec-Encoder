document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = browser.i18n.getMessage(el.dataset.i18n); });
document.title = browser.i18n.getMessage('helpTitle');
