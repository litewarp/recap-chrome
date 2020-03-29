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

class AppellateDelegate {
  constructor({ tabId, court, links, pacerDocId }) {
    this.tabId = tabId;
    this.court = court;
    this.targetPage = this.setTargetPage();

    this.notifier = importInstance(Notifier);
    this.recap = importInstance(Recap);
    this.links = links || [];
  }

  // identify the current page
  // currently only implements head title check
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
  dispatchTargetHandler(){
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
    }   
  };

  // unclear if needed
  handleCaseSearchPage(){
    console.log('handleCaseSearchPage');
  };

  async handleCaseSearchResultsPage(){
    console.log('handleCaseSearchResults');
    const anchors = [...document.querySelectorAll('a')];
    const pacerCaseId = PACER.getCaseIdFromAppellateSearchResults(anchors);
    if (pacerCaseId){
      await updateTabStorage({ [this.tabId]: { caseId: pacerCaseId } });
    };
  };

  async handleCaseQueryPage(){
    console.log('handleCaseQuery')
    const inputs = [...document.querySelectorAll('input')];
    const pacerCaseId = PACER.getCaseIdFromAppellateCaseQueryPage(inputs);
    if (pacerCaseId) {
      await updateTabStorage({ [this.tabId]: { caseId: pacerCaseId }});
    };
    
    // don't upload more than once per session
    if (history.state && history.state.uploaded) { return; };
    
    // don't upload if the user disabled the option
    const options = await getItemsFromStorage('options');
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

    // if (opinion hasn't already been download) {
    this.checkForAndUploadOpinion({pacerCaseId});
    // };

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

  // TODO: add notification that multidocument downloads aren't supported 
  handleDownloadConfirmationPage() {
    console.log("handleDocumentDownloadConfirmationPage")

    // find the download button and hide it
    const inputs = [...document.querySelectorAll('input')];
    const input = inputs.find(input => input.type === 'button' && input.value.includes('Accept'));
    input.setAttribute('type', 'hidden');
    // build the dummy input and insert it next to the original button
    const newInput = document.createElement('input');
    newInput.setAttribute('type', 'button');
    newInput.setAttribute('value', input.value);
    newInput.addEventListener('click', () => window.postMessage(input.attributes.onclick.baseURI));
    input.insertAdjacentElement('beforebegin', newInput);

    // bind the eventListener to the downloadDocumentHandler
    window.addEventListener('message', this.onDocumentDownload.bind(this), false);
  };

  async onDocumentDownload(event) {
    // 0. initialize the function and fetch async data
    console.log('onDocumentDownload');
    document.querySelector('body').className += ' cursor wait';

    // 1.  make the back button display the previous page //
    window.onpopstate = ({ state }) => {
      if (state.content) {
        document.documentElement.innerHTML = state.content; 
      }
    };
    history.replaceState({ content: document.documentElement.innerHTML }, '');

    // 2.  collect the formData to request the pdf
    const inputs = [...document.querySelectorAll('form > input')];
    const inputData = [];
    inputs.map(({ name, value }) => {
      // excludes the submit button and the 'recp' undefined field
      if (!!name && !!value) { inputData[name] = value; };
    });
    // set the receipt field to currentTime to mimic the pacer call
    const formData = { ...inputData, recp: new Date().getTime() };

    // 3. encode the params as URL search params to match the pacer request
    const url = this.buildSearchParamsUrl({ url: event.data, params: formData }); 

    // 4. get the blob and store it
    const blob = await contentScriptFetch(url).then(res => res.blob());
    const dataUrl = await blobToDataURL(blob);
    await updateTabStorage({ [this.tabId]: { pdfBlob: dataUrl }});

    // 5. build the innerHtml to show the user
    
    // set the params before you set the new innerHTML
    const params = {
      pacerCaseId: formData.caseId,
      pacerDocId: formData.dls_id,
      court: this.court,
    };
   
    // get needed info to build the filename
    const options = await getItemsFromStorage('options');
    const td = [...document.querySelectorAll('td')].find(
      td => td.textContent.match(/Case\: \d{2}-\d{4}/)
    );
    const filename = await generateFileName({
      iaStyle: options.ia_style_filenames,
      docketNumber: td.textContent.match(/\d{2}\-\d{4}/)[0],
      attachmentNumber: '', // no relevant number found
      suffix: 'pdf', // for future zip support?
      ...params
    });

    const externalPdfEnabled = isChromeBrowserAndPdfViewerDisabled()
      ? true
      : options.external_pdf_enabled;

    if (externalPdfEnabled) {
      saveAs(blob, filename);
    } else {
      // create an iframe to display the pdf
      const iframe = document.createElement('iframe');
      iframe.src = URL.createObjectURL(blob);
      iframe.setAttribute('height','100%');
      iframe.setAttribute('width', '100%');
      iframe.style = 'border: none';
      
      // insert it into a body and set the style
      const body = document.createElement('body');
      body.style.margin = 0;
      body.style.height = '100vh';
      body.appendChild(iframe);
      
      // insert it into a top-level html element
      const html = document.createElement('html');
      html.appendChild(body);

      // swap the current documentElement with our new one
      document.documentElement.innerHTML = html.innerHTML;
      // let the browser know we've 'gone forward' a page
      history.pushState({ content: html.innerHTML}, '');
    };

    // 6. upload it to recap
    this.recap.uploadAppellateDocument(
      params, 
      (response) => {
        history.replaceState({ uploaded: true }, '');
        this.notifier.showUpload(
          'PDF page uploaded to the public RECAP Archive',
          () => {}
        );
      }
    ); 
  };

  // private methods - add private before release
  // can't add private now because of eslint issue 
  
  // convert formdata to url search params
  // see https://fetch.spec.whatwg.org/#fetch-api
  buildSearchParamsUrl({ url, params }) {
    const newUrl = new URL(url);
    Object.keys(params).forEach(key => newUrl.searchParams.append(key, params[key]));
    return newUrl;
  };
  
  // check if the opinion is free to download and if so
  // fetch it and upload it to recap in the background
  async checkForAndUploadOpinion({ pacerCaseId }){
    const trs = [...document.querySelectorAll('tr')]
    const opinionTr = trs.find(tr => {
      if ([...tr.children].length > 0) {
        const match = [...tr.children].find(
          td => (td.textContent.match(/OPINION/) && td.width === "90%")
        );
        if (match) { return true; };
      }
    });
    const link = opinionTr.querySelector('a');
    if (link) {
      const params = {
        caseId: pacerCaseId,
        dls_id: link.href.match(/docs1\/(\d+)/)[1],
        servlet: 'ShowDoc',
        dktType: 'dktPublic',
      };
      // encode the params as URL params
      const url = new URL(document.URL.replace(/\?.*$/,''));
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const blob = await contentScriptFetch(url).then(res => {
        return res.blob();
      });

      const fetchParams = {
        court: this.court,
        pacerCaseId: pacerCaseId,
        pacerDocId: params.dls_id
      };

      if (blob.type.includes('pdf')) {
        // upload it to recap
        const dataUrl = await blobToDataURL(blob);
        await updateTabStorage({ [this.tabId]: { pdfBlob: dataUrl }});
        this.recap.uploadAppellateDocument(
          fetchParams, 
          (response) => {
            this.notifier.showUpload(
              'Case Opinion automatically uploaded to the public RECAP Archive',
              () => {}
            );
            // insert available for free tag on item
          }
        ); 
      }
    }
  }
};

