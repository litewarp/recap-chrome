// If this page offers a single document, ask RECAP whether it has the document.
ContentDelegate.prototype.handleSingleDocumentPageCheck = function () {
  if (!PACER.isSingleDocumentPage(this.url, document)) {
    return;
  }

  let callback = $.proxy(function (api_results) {
    console.info(`RECAP: Got results from API. Running callback on API results to ` +
      `insert link`);
    let result = api_results.results.filter(function (obj) {
      return obj.pacer_doc_id === pacer_doc_id;
    })[0];
    if (!result) {
      return;
    }

    let href = `https://www.courtlistener.com/${result.filepath_local}`;
    // Insert a RECAP download link at the bottom of the form.
    $('<div class="recap-banner"/>').append(
      $('<a/>', {
        title: 'Document is available for free in the RECAP Archive.',
        href: href
      }).append(
        $('<img/>', { src: chrome.extension.getURL('assets/images/icon-16.png') })
      ).append(
        ' Get this document for free from the RECAP Archive.'
      )
    ).appendTo($('form'));
  }, this);

  let cl_court = PACER.convertToCourtListenerCourt(this.court);
  this.recap.getAvailabilityForDocuments([this.pacer_doc_id], cl_court, callback);
};