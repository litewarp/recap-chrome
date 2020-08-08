// local helpers
const createRecapLink = (fp) => {
  const href = `https://www.courtlistener.com/${fp}`;
  const a = document.createElement('a');
  const img = document.createElement('img');
  img.src = chrome.extension.getURL('assets/images/icon-16.png');
  a.appendChild(img);
  a.href = href;
  a.classList += 'recap-inline';
  a.title = 'Available for free from the RECAP Archive.';
  
  a.addEventListener('click', () => {
    this.handleRecapLinkClick(window, href);
  });
  return a;
};
// Check every link in the document to see if there is a free RECAP document
// available. If there is, put a link with a RECAP icon.
ContentDelegate.prototype.attachRecapLinkToEligibleDocs = async function () {
  // if no links are available, punt
  if (this.pacer_doc_ids.length === 0) {
    return console.info('RECAP: No links to eligible documents found');
  };  
  console.info(
    `RECAP: Attaching links to all eligible documents (${linkCount} found)`
  );

  // Ask the server whether any of these documents are available from RECAP.
  const apiResults = await this.recap.getAvailabilityForDocuments(
    this.pacer_docs_ids,
    this.court,
    (res) => res
  );
  
  console.info(
    'RECAP: Got results from API. Running callback on API results to ' +
    'attach links and icons where appropriate.'
  );
  
  [...this.links].map(link => {
    const pacerDocId = link.getAttribute('pacerDocId');
    // if the pacerDocId is already associated, do nothing
    if (!pacerDocId) return;

    const result = apiResults.results.find(
      ({pacer_doc_id}) => pacer_doc_id = pacerDocId
    );

    // if no result is found, do nothing
    if (result === undefined) return;
    
    // insert the recapLink after the link
    link.parentNode.insertBefore(
      createRecapLink(result.filepath_local),
      link.nextSibling
    );
  });
};