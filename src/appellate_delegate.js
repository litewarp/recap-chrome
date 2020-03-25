//  Abstraction of content scripts to make them modular and testable.
//  Functions:

//  checkRestrictions

//  findAndStorePacerIds

//  handleDocketQueryUrl
//  handleDocketDisplayPage
//  handleAttachmentPageMenu
//  handleSingleDocumentPageCheck
//  handleOnDocumentViewSubmit
//  showPdfPage
//  handleSingleDocumentPageView
//  handleRecapLinkClick
//  attachRecapLinkToEligibleDocs
//  onDownloadAllSubmit
//  handleZipFilePageView

// Appellate Process Pages
// Case Search
// Case Search Results
//    Short Docket Page
//      Full Docket Options / Confirmation Page
//        Full Docket
//          Document Download Confirmation Page
// .        Document show page
//    Case Query Page

class ApellateDelegate {
  constructor({ tabId, url, path, court, pacerCaseId, pacerDocId, links}) {
    this.tabId = tabId;
    this.url = url;
    this.path = path;
    this.court = court;
    this.pacer_case_id = pacer_case_id;
    if (pacer_doc_id) {
      this.pacer_doc_id = pacer_doc_id;
      this.pacer_doc_ids = [pacer_doc_id];
    } else {
      this.pacer_doc_ids = [];
    }
    this.links = links || [];
  
    this.notifier = importInstance(Notifier);
    this.recap = importInstance(Recap);
  
    this.findAndStorePacerDocIds();
  
    this.restricted = this.checkRestrictions();
  }

  findAndStorePacerIds() {

  }

  

}