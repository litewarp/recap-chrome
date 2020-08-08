// Given the HTML for a page with an <iframe> in it, downloads the PDF
// document in the iframe, displays it in the browser, and also
// uploads the PDF document to RECAP.
//
// The documentElement is provided via dependency injection so that it
// can be properly mocked in tests.
ContentDelegate.prototype.showPdfPage = async function (
  documentElement, html, previousPageHtml, document_number, attachment_number,
  docket_number) {
  // Find the <iframe> URL in the HTML string.
  let match = html.match(/([^]*?)<iframe[^>]*src="(.*?)"([^]*)/);
  if (!match) {
    document.documentElement.innerHTML = html;
    return;
  }

  const options = await getItemsFromStorage('options');

  // Show the page with a blank <iframe> while waiting for the download.
  document.documentElement.innerHTML = `${match[1]}<p id="recap-waiting">Waiting for download...</p><iframe src="about:blank"${match[3]}`;

  // Make the Back button redisplay the previous page.
  window.onpopstate = function (event) {
    if (event.state.content) {
      document.documentElement.innerHTML = event.state.content;
    }
  };
  history.replaceState({ content: previousPageHtml }, '');

  // Download the file from the <iframe> URL.
  const browserSpecificFetch = (navigator.userAgent.indexOf('Chrome') < 0) ? content.fetch : window.fetch;
  const blob = await browserSpecificFetch(match[2]).then(res => res.blob());
  let blobUrl = URL.createObjectURL(blob);
  const dataUrl = await blobToDataURL(blob);
  await updateTabStorage({ [this.tabId]: { ['pdf_blob']: dataUrl } });
  console.info("RECAP: Successfully got PDF as arraybuffer via ajax request.");
  // Get the PACER case ID and, on completion, define displayPDF()
  // to either display the PDF in the provided <iframe>, or, if
  // external_pdf is set, save it using FileSaver.js's saveAs().

  const pacer_case_id = this.pacer_case_id
    ? this.pacer_case_id
    : await this.recap.getPacerCaseIdFromPacerDocId(this.pacer_doc_id, () => { });

  const generateFileName = (pacer_case_id) => {
    let filename, pieces;
    if (options.ia_style_filenames) {
      pieces = [
        'gov',
        'uscourts',
        this.court,
        (pacer_case_id || 'unknown-case-id'),
        (document_number || '0'),
        (attachment_number || '0')
      ];
      filename = `${pieces.join('.')}.pdf`;
    } else if (options.lawyer_style_filenames) {
      pieces = [
        PACER.COURT_ABBREVS[this.court],
        (docket_number || '0'),
        (document_number || '0'),
        (attachment_number || '0')
      ];
      filename = `${pieces.join('_')}.pdf`;
    }
    return filename;
  };

  const setInnerHtml = (pacer_case_id) => {
    const filename = generateFileName(pacer_case_id);
    let external_pdf = options.external_pdf;
    if ((navigator.userAgent.indexOf('Chrome') >= 0) &&
      !navigator.plugins.namedItem('Chrome PDF Viewer')) {
      // We are in Google Chrome, and the built-in PDF Viewer has been disabled.
      // So we autodetect and force external_pdf true for proper filenames.
      external_pdf = true;
    }
    if (!external_pdf) {
      let downloadLink = `<div id="recap-download" class="initial">
                            <a href="${blobUrl}" download="${filename}">Save as ${filename}</a>
                          </div>`;
      html = `${match[1]}${downloadLink}<iframe onload="setTimeout(function() {
                document.getElementById('recap-download').className = '';
              }, 7500)" src="${blobUrl}"${match[3]}`;
      document.documentElement.innerHTML = html;
      history.pushState({ content: html }, '');
    } else {
      // Saving to an external PDF.
      const waitingGraph = document.getElementById('recap-waiting');
      if (waitingGraph) {
        waitingGraph.remove();
      }
      window.saveAs(blob, filename);
    }
  };

  setInnerHtml(pacer_case_id);

  // store the blob in chrome storage for background worker
  if (options['recap_enabled'] && !this.restricted) {
    // If we have the pacer_case_id, upload the file to RECAP.
    // We can't pass an ArrayBuffer directly to the background
    // page, so we have to convert to a regular array.
    this.recap.uploadDocument(
      this.court,
      pacer_case_id,
      this.pacer_doc_id,
      document_number,
      attachment_number,
      (ok) => {  // callback
        if (ok) {
          this.notifier.showUpload(
            'PDF uploaded to the public RECAP Archive.',
            () => { }
          );
        }
      }
    );
  } else {
    console.info("RECAP: Not uploading PDF. RECAP is disabled.");
  }
};