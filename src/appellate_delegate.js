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
  constructor({ tabId, court, links, pacerDocId }) {
    this.tabId = tabId;
    this.court = court;
    this.targetPage = this.setTargetPage();

    this.notifier = importInstance(Notifier);
    this.recap = importInstance(Recap);
    this.links = links || [];
  }

  // confirmed identifiers for 1st, 2nd, 3rd Circuits
  setTargetPage() {
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
      return 'downloadConfirmation';
    } else if (title === 'Document') {
      return 'attachmentMenu';
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
  };
  
  // dispatch associated handler
  handleTargetPage(){
    if (this.targetPage === 'caseQuery') {
      this.handleCaseQueryPage();

    } else if (this.targetPage === 'caseSearchResults') {
      this.handleCaseSearchResultsPage();

    } else if (this.targetPage === 'downloadConfirmation') { 
      this.handleDownloadConfirmationPage();

    } else if (this.targetPage === 'attachmentMenu') {
      this.handleAttachmentMenuPage();

    } else if (this.targetPage === 'fullDocketSearch') { 
      this.handleFullDocketSearchPage();
    
    } else if (this.targetPage === 'caseSearch' || this.targetPage === 'advancedCaseSearch') {
      this.handleCaseSearchPage();

    } else if (this.targetPage === 'fullDocket' || this.targetPage === 'shortDocket') {
      this.handleDocketPage();

    } else {
      return;
    };
  };

  handleCaseSearchPage(){
    console.log('handleCaseSearchPage')
    // store info
  };

  handleCaseSearchResultsPage(){
    console.log("handleCaseSearchResults")
    // store caseId in tabStorage
    // unsure if needed since caseId can be obtained from docket pages
    // this is probably cleaner
    const anchors = [...document.querySelectorAll('a')];
    const pacerCaseId = PACER.getCaseIdFromAppellateSearchResults(anchors);
    if (pacerCaseId){
      updateTabStorage({ [this.tabId]: { caseId: pacerCaseId } });
    };
  };

  async handleCaseQueryPage(){
    console.log("handleCaseQuery")
    // set pacerCaseId for pages down the line
    const inputs = [...document.querySelectorAll('input')];
    const pacerCaseId = PACER.getCaseIdFromAppellateCaseQueryPage(inputs);
    if (pacerCaseId) {
      await updateTabStorage({ [this.tabId]: { caseId: pacerCaseId }});
    };
    
    // don't upload more than once per session
    if (history.state && history.state.uploaded) { return; };
    
    // don't upload if the user disabled the option
    const options = await getItemsFromStorage('options');
    console.log(options);
    if (options.recap_enabled === false) { return; };
    
    // set params for upload
    const params = {
      pacerCaseId: pacerCaseId,
      htmlPage: document.documentElement.outerHTML,
      uploadType: 'CASE_QUERY',
      pacerCourt: this.court,
    };
    
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
    );
  };

  // TODO: add notification that multi aren't supported 
  handleDownloadConfirmationPage() {
    console.log("handleDocumentDownloadConfirmationPage")

    // replace form action and 
    // add listener for button click
    // handle the download and push to docketDisplayPage
    const inputs = [...document.querySelectorAll('input')];
    const input = inputs.find(input => input.type === 'button' && input.value.includes('Accept'));

    const newInput = document.createElement('input');
    newInput.setAttribute('type', 'button');
    newInput.setAttribute('value', input.value);
    newInput.addEventListener('click', () => window.postMessage(input.attributes.onclick.baseURI));

    // we replace the onclick button with a listener and
    // store the onclick method in a hidden element for the worker to use later
    input.setAttribute('type', 'hidden');
    input.setAttribute('id', 'originalLink');
    input.insertAdjacentElement('beforebegin', newInput);
    
    window.addEventListener('message', this.onDocumentDownload.bind(this), false);
  };

  async handleAttachmentMenuPage() {
    console.log("handleAttachmentMenuPage")

    // check if this tab was opened by another and use that tabId
    // to get the relevant tabStorage
    const { openerTabId } = await checkForOpenerTabId();
    const tabId = openerTabId ? openerTabId : this.tabId; 
    const tabStorage = await getItemsFromStorage(tabId);

    // don't upload more than once per session
    if (history.state && history.state.uploaded) { return; };
    
    // don't upload if the user disabled the option
    const options = await getItemsFromStorage('options');
    if (options.recap_enabled === false) { return; };
    
    const params = {
      pacerCourt: this.court,
      pacerCaseId: tabStorage && tabStorage.caseId,
      htmlPage: document.documentElement.outerHTML,
      uploadType: 'ATTACHMENT_PAGE',
    };
    
    this.recap.uploadAppellatePage(
      params,
      (response) => {
        history.replaceState({ uploaded: true }, '');
        this.notifier.showUpload(
          'Attachment page uploaded to the public RECAP Archive',
          () => {}
        );
      }
    );
  };

  handleFullDocketSearchPage(){
    // store info
    console.log("handleFullDocketSearchPage")
  };

  async handleDocketPage(){
    console.log("handleDocketPage")
  
    // set pacerCaseId for pages down the line
    const anchors = [...document.querySelectorAll('a')];
    const pacerCaseId = PACER.getCaseIdFromAppellateDocketPage(anchors);
    if (pacerCaseId) {
      await updateTabStorage({ [this.tabId]: { caseId: pacerCaseId }});
    };

    // don't upload more than once per session
    if (history.state && history.state.uploaded) { return; };
    
    // don't upload if the user disabled the option
    const options = await getItemsFromStorage('options');
    if (options.recap_enabled === false) { return; };
    
    const params = { 
      pacerCaseId,
      htmlPage: document.documentElement.outerHTML,
      uploadType: this.targetPage === 'fullDocket' ? 'FULL_DOCKET' : 'SHORT_DOCKET',
      pacerCourt: this.court,
    };
    
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

  async onDocumentDownload(event) {
    const data = event.data;
    console.log(data);
    console.log("onDocumentDownload");
    
    const result = await fetch(data);
    console.log(result);
  }

};

