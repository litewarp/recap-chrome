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
//          Document show page
//    Case Query Page

// block multi-pdfs
// handle advanced searching
// autocheck pdf headers

// appellate 


class ApellateDelegate {
  constructor({ tabId }) {
    this.tabId = tabId;
  }
  identifyTargetPage() {}
}
