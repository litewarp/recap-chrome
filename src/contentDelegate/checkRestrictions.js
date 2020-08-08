/ Check for document restrictions
ContentDelegate.prototype.checkRestrictions = function () {
  // Some documents are restricted to case participants. Typically
  // this is offered with either an interstitial page (in the case
  // of free looks) or an extra box on the receipt page. In both cases
  // it's something like this:
  //
  // <table><tbody>
  //   <tr><td>Warning!</td></tr>
  //   <tr><td><b>This document is restricted to court users,
  //              case participants and public terminal users.</b></td></tr>
  // </tbody></table>
  //
  // The exact text will change, depending on the circumstances. For
  // sealed documents, e.g., ohsd offers:
  //
  //   "The document you are about to view is SEALED; do not allow it
  //   to be seen by unauthorized persons."
  //
  // Sealing behavior differs from CMECF instance to CMECF instance.
  //
  // Be somewhat paranoid about this and check for either a "Warning!"
  // in the first <td> cell of a table, as well as any <b> containing
  // "document is restricted", "SEALED", or "do not allow it to be seen".
  // Case-insensitively.

  // The regexes below are pretty broad by design.
  // Only trigger this code on doc1 pages.
  if (!PACER.isSingleDocumentPage(this.url, document)) {
    return false;
  }

  let restrictedDoc = false;

  for (let td of
    document.querySelectorAll('table td:first-child')) {
    if (td.textContent.match(/Warning!/)) {
      restrictedDoc = true;
      break;
    }
  }

  for (let td of document.querySelectorAll('b')) {
    if (td.textContent.match(
      /document is restricted|SEALED|do not allow it to be seen/i
    )) {
      restrictedDoc = true;
      break;
    }
  }

  if (restrictedDoc) {
    console.log('RECAP: Restricted document detected. Skipping upload.');
    // We would like to alter the [R] icon to indicate what's going
    // on, but we cannot call chrome.browserAction.setIcon()
    // here. Instead, we'd need to send a message to the background
    // script? ughhhh. Punt for now.

    // Insert a RECAP banner near the end of the form, before the action button.
    // Ideally this would have some RECAP branding, icon/logo, etc.

    // Ideally we target the form <input>, but absent that
    // we just go to the end of the final form.
    // Should we just always go the end of the final form?
    let target =
      document.querySelector('form input') ||
      document.forms[document.forms.length - 1].lastChild;

    // Nested div for horizontal centering.
    const imgSrc = chrome.extension.getURL('assets/images/disabled-38.png');
    const nestedDiv = `
      <div style="text-align: center">
        <div style="display: inline-block; text-align: left; align: top">
          <div class="recap-banner" style="display: table">
            <div style="display: table-cell; padding: 12px; ">
              <img style="width: auto; height: auto" src="${imgSrc}">
            </div>
            <div style="display: table-cell; vertical-align: middle">
              This document <b>will not be uploaded</b> to the RECAP Archive because the RECAP extension has detected that it may be restricted from public distribution.
            </div>
          </div>
        </div>
      </div>
    `;
    target.insertAdjacentHTML('beforebegin', nestedDiv);
  }

  return restrictedDoc;
};