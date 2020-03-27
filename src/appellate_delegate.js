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
// ------------------------
// Case Search
//   url: ecf.ca1.uscourts.gov/in/beam/servlet/TransportRoom?servlet=CaseSearch.jsp
//   document head has title "Case Search"
//   document has div with className "pageTitle" which contains string "Case Search"
// Case Search Results
//  url: ecf.ca1.uscourts.gov/in/beam/servlet/TransportRoom
//  document head has title "Cases Selection Table"
//  document has center with value "Case Selection Page"
//    Short Docket Page
//      url: ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom?servlet=CaseSummary.jsp&caseNum=19-1802&incOrigDkt=Y&incDktEntries=Y
//      document head has title "${CASE_ID} Summary"
//      document has input with type "submit" and name="fullDocket"
//    Full Docket Options / Confirmation Page
//      url: ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom?servlet=DocketReportFilter.jsp 
//      document has title "Docket Report Filter"
//      document has input type="submit" && value="Run Docket Report"
//        Full Docket
//          url: ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom 
//          document has title "${CASE_ID} Docket"
//          document has td with string "General Docket"
//            
//          ------either get download confirmation page or multi-doc page-----
//            Multi-Document Download Page
//              url: https://ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom 
//              document head has title "Document"
//              document has input type="button" and value="Combine All Documents"
//            Document Download Confirmation Page
//              url: ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom
//              document head has title "Download Confirmation"
//              document has input type="checkbox" && name="incPdfHeadDisp"
//            Document show page
//              url: ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom 
//              document head has title "${DOCUMENT_TITLE}"
//              document has embed type="application/pdf"
//    Case Query Page
//      url: ecf.ca1.uscourts.gov/n/beam/servlet/TransportRoom?servlet=CaseQuery.jsp&cnthd=3950728289&caseid=45856&csnum1=19-1802&shorttitle=City+of+Providence%2C+et+al+v.+US+Department+of+Justice%2C+et+al 
//      document head has title "Case Query"
//      document has div with className "pageTitle" which contains "Case Query"

// block multi-pdfs
// handle advanced searching
// autocheck pdf headers

// appellate 


class AppellateDelegate {
  constructor({ tabId }) {
    this.tabId = tabId;
    this.targetPage = this.getTargetPage();
  }

  getTargetPage() {
    // check the document head for a title
    const title = !!document.head.textContent
      ? document.head.querySelector('title').text.trim()
      : '';
    // check the page for an embedded pdf viewer
    const embed = document.querySelector('embed');
    // return page name depending on match
    if (title === 'Case Search') {
      return 'caseSearch';
    } else if (title === 'Cases Selection Table') {
      return 'caseSearchResults';
    } else if (title === 'Case Query') {
      return 'caseQuery';
    } else if (title === 'Download Confirmation') {
      return 'documentDownloadConfirmation';
    } else if (title === 'Document') {
      return 'multiDocumentDownload';
    } else if (title === 'Docket Report Filter') {
      return 'fullDocketSearch';
    } else if (title.match(/\d+-\d+\sDocket/)) {
      return 'fullDocket';
    } else if (title.match(/\d+-\d+\sSummary/)) {
      return 'shortDocket';
    } else {
      // an embed element will indicate a download document page if 
      // type = 'application/pdf' or 'application/x-google-chrome-pdf'
      if (embed && embed.type.includes('pdf')) {
        return 'documentDownload';
      } else {
        console.info('No identified appellate page found');
        return;
      }
    }
  }
};

