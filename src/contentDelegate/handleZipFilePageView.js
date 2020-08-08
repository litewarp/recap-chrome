// Same as handleSingleDocumentPageView, but for zip files
ContentDelegate.prototype.handleZipFilePageView = function () {
  // return if not the download all page
  if (!PACER.isDownloadAllDocumentsPage(this.url, document)) {
    return;
  }

  // return if on the appellate courts
  if (PACER.isAppellateCourt(this.court)) {
    debug(4, 'No interposition for appellate downloads yet');
    return;
  }

  // extract the url from the onclick attribute from one of the two
  // "Download Documents" buttons
  const inputs = [...document.getElementsByTagName('input')];
  const targetInputs = inputs.filter(
    input => input.type === 'button' && input.value === 'Download Documents'
  );
  const url = targetInputs[0]
    .getAttribute('onclick')
    .replace(/p.*\//, '') // remove parent.location='/cgi-bin/
    .replace(/\'(?=$)/, ''); // remove endquote

  const isAppendixPage = url.match(/create\_appendix\=1/);
  if (isAppendixPage) {
    debug(4, 'No interposition for appendix page downloads yet');
    return;
  }

  // imperatively manipulate hte dom elements without injecting a script
  const forms = [...document.querySelectorAll('form')];
  forms.map(form => {
    form.removeAttribute('action');
    const input = form.querySelector('input');
    input.removeAttribute('onclick');
    input.disabled = true;
    form.hidden = true;
    const div = document.createElement('div');
    const button = document.createElement('button');
    button.textContent = 'Download Documents';
    button.addEventListener('click', () => window.postMessage({ id: url }));
    div.appendChild(button);
    const parentNode = form.parentNode;
    parentNode.insertBefore(div, form);
  });
  // When we receive the message from the above submit method, submit the form
  // via fetch so we can get the document before the browser does.
  window.addEventListener(
    'message',
    this.onDownloadAllSubmit.bind(this),
  );
};