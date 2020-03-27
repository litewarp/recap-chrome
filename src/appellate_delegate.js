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
// Advanced Case Search
//   url: ecf.ca2.uscourts.gov/n/beam/servlet/TransportRoom?servlet=CaseSearch.jsp&advancedSearch=Advanced 
//   document head title is "Case Search - Advanced"
//   document has div with class "pageTitle" that is "Case Search - Advanced"
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
  constructor({ tabId, court, links, pacerCaseId, pacerDocId }) {
    this.tabId = tabId;
    this.court = court;
    this.pacerCaseId = pacerCaseId;
    this.targetPage = this.getTargetPage();

    this.notifier = importInstance(Notifier);
    this.recap = importInstance(Recap);
    this.links = links || []
  }
  // confirmed identifiers for 1st, 2nd Circuits
  getTargetPage() {
    // check the document head for a title
    const title = !!document.head.textContent
      ? document.head.querySelector('title').text.trim()
      : '';
    // return page name depending on match
    if (title === 'Case Search') {
      return 'caseSearch';
    } else if (title === 'Case Search - Advanced') {
      return 'advancedCaseSearch';
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
      // check the page for an embedded pdf viewer
      const embed = document.querySelector('embed');
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
  handleTargetPage(){
    // punt if no cookie
    if (!PACER.hasPacerCookie(document.cookie)) {
      return;
    }
    switch(this.targetPage) {
    case ('caseSearch'): 
      this.handleCaseSearchPage();
      break;
    case ('advancedCaseSearch'): 
      this.handleCaseSearchPage();
      break;
    case 'caseQuery': 
      this.handleCaseQueryPage();
      break;
    case 'caseSearchResults': 
      this.handleCaseSearchResultsPage();
      break;
    case 'documentDownloadConfirmation': 
      this.handleDocumentDownloadConfirmationPage();
      break;
    case 'multiDocumentDownload': 
      this.handleMultiDocumentDownloadPage();
      break;
    case 'fullDocketSearch': 
      this.handleFullDocketSearchPage();
      break;
    case ('fullDocket'): 
      this.handleDocketPage();
      break;
    case ('shortDocket'): 
      this.handleDocketPage();
      break;
    default:
      return;
    };
  };

  handleCaseSearchPage(){
    console.log("handleCaseSearchPage")
    // store info
  };

  handleCaseSearchResultsPage (){
    // store caseId in tabStorage
    // unsure if needed since caseId can be obtained from docket pages
    // this is probably cleaner
    const anchors = [...document.querySelectorAll('a')];
    const pacerCaseId = PACER.getCaseIdFromAppellateSearchResults(anchors);
    if (pacerCaseId){
      updateTabStorage({ [this.tabId]: { caseId: pacerCaseId } })
    };
  };

  handleCaseQueryPage(){
    // set params for upload
    const inputs = [...document.querySelectorAll('input')];
    const params = {
      // render the html as a string
      htmlPage: document.documentElement.outerHTML,
      uploadType: 'CASE_QUERY',
      pacerCourt: this.court,
      pacerCaseId: PACER.getCaseIdFromAppellateCaseQueryPage(inputs),
    };
    // upload page through recap instance
    this.recap.uploadAppellatePage(
      params,
      // send a callback for now to mimic contentDelegate
      (response) => {
        history.replaceState({ uploaded: true }, '');
        this.notifier.showUpload(
          'Case query page uploaded to the public RECAP Archive',
          () => {}
        );
      }
    )
  };

  handleDocumentDownloadConfirmationPage() {
    console.log("handleDocumentDownloadConfirmationPage")
    // replace form action and 
    // add listener for button click
    // handle the download and push to docketDisplayPage
  };

  handleMultiDocumentDownloadPage() {
    console.log("handleMultiDocumentDownloadPage")
    getItemsFromStorage(this.tabId).then(tabStorage => {
      const pacerCaseId = tabStorage['caseId'] 
      // add notification that multi aren't supported 

      const attachmentPageHtml = document.documentElement.outerHTML;
    });    
  };

  handleFullDocketSearchPage(){
    // store info
    console.log("handleFullDocketSearchPage")
  };

  handleDocketPage(){
    // set params for upload
    // wrap the parameters in an object to permit null params
    const anchors = [...document.querySelectorAll('a')];
    const params = { 
      htmlPage: document.documentElement.outerHTML,
      uploadType: this.targetPage === 'fullDocket' ? 'FULL_DOCKET' : 'SHORT_DOCKET',
      pacerCourt: this.court,
      pacerCaseId: PACER.getCaseIdFromAppellateDocketPage(anchors),
    }
    // upload page through recap instance
    this.recap.uploadAppellatePage(
      params,
      (response) => {
        history.replaceState({ uploaded: true }, '');
        this.notifier.showUpload(
          'Docket page uploaded to the public RECAP Archive',
          () => {}
        );
      }
    );
  };
};

