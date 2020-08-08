// If this page offers a single document, intercept navigation to the document
// view page.  The "View Document" button calls the goDLS() function, which
// creates a <form> element and calls submit() on it, so we hook into submit().
ContentDelegate.prototype.handleSingleDocumentPageView = function () {
  if (!PACER.isSingleDocumentPage(this.url, document)) {
    return;
  }

  if (PACER.isAppellateCourt(this.court)) {
    debug(4, "No interposition for appellate downloads yet");
    return;
  }

  // Monkey-patch the <form> prototype so that its submit() method sends a
  // message to this content script instead of submitting the form.  To do this
  // in the page context instead of this script's, we inject a <script> element.
  let script = document.createElement('script');
  script.innerText =
    'document.createElement("form").__proto__.submit = function () {' +
    '  this.id = "form" + new Date().getTime();' +
    '  window.postMessage({id: this.id}, "*");' +
    '};';
  document.body.appendChild(script);

  // When we receive the message from the above submit method, submit the form
  // via XHR so we can get the document before the browser does.
  window.addEventListener(
    'message', this.onDocumentViewSubmit.bind(this), false);
};