// Use a variety of approaches to get and store pacer_doc_id to pacer_case_id
// mappings in local storage.
ContentDelegate.prototype.findAndStorePacerDocIds = function () {
  // if no Pacer Cookie, do nothing
  if (!PACER.hasPacerCookie(document.cookie)) return;
  
  // Not all pages have a case ID, and there are corner-cases in merged dockets
  // where there are links to documents on another case.
  const page_pacer_case_id = this.pacer_case_id
    ? this.pacer_case_id
    : this.recap.getPacerCaseIdFromPacerDocId(this.pacer_doc_id, () => {});

  const docsToCases = {};

  // Try getting a mapping from a pacer_doc_id in the URL to a
  if (
    this.pacer_doc_id &&
    page_pacer_case_id &&
    typeof page_pacer_case_id === 'string'
  ) {
    debug(3, `Z doc ${this.pacer_doc_id} to ${page_pacer_case_id}`);
    docsToCases[this.pacer_doc_id] = page_pacer_case_id;
  }

  this.links.map(link => {
    if (!PACER.isDocumentUrl(link.href)) return;
 
    const docId = PACER.getDocumentIdFromUrl(link.href);
    link.setAttribute('pacerDocId', docId);
    this.pacer_doc_ids.push(docId);

    const goDLS = PACER.parseGoDLSFunction(
      link.getAttribute('onclick')
    );

    if (goDLS && goDLS.de_caseid) {
      docsToCases[docId] = goDLS.de_caseid;
      debug(3, `Y doc ${docId} to ${goDLS.de_caseid}`);
    } else if (page_pacer_case_id) {
      docsToCases[docId] = page_pacer_case_id;
      debug(3, `X doc ${docId} to ${page_pacer_case_id}`);
    }
  });

  // save JSON object in chrome storage under the tabId
  // append caseId if a docketQueryUrl
  const payload = { docsToCases };
  if (!!this.pacer_doc_id) {
    payload['docId'] = this.pacer_doc_id;
  }
  if (PACER.isDocketQueryUrl(this.url) && page_pacer_case_id) {
    payload['caseId'] = page_pacer_case_id;
  }
  updateTabStorage({ [this.tabId]: payload });
};