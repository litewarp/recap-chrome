// If this is a docket page, upload it to RECAP.
ContentDelegate.prototype.handleDocketDisplayPage = async function () {

  // helper functions
  const createAlertButtonTr = () => {
    const tr = document.createElement('tr');
    tr.appendChild(recapAlertButton(this.court, this.pacer_case_id, false));
    return tr;
  };

  const changeAlertButtonStateToActive = async () => {
    const anchor = await document.getElementById('recap-alert-button');
    if (anchor) {
      anchor.setAttribute('aria-disabled', 'false');
      anchor.classList.remove('disabled');
      const img = document.createElement('img');
      img.src = chrome.extension.getURL('assets/images/icon-16.png');
      anchor.innerText = 'Create an Alert for This Case on RECAP';
      anchor.insertBefore(img, anchor.childNodes[0]);
    }
  };

  // If it's not a docket display URL or a docket history URL, punt.
  let isDocketDisplayUrl = PACER.isDocketDisplayUrl(this.url);
  let isDocketHistoryDisplayUrl = PACER.isDocketHistoryDisplayUrl(this.url);
  if (!(isDocketHistoryDisplayUrl || isDocketDisplayUrl)) {
    return;
  }

  // check for more than one radioDateInput and return if true
  // (you are on an interstitial page so no docket to display)
  const radioDateInputs = [...document.getElementsByTagName('input')].filter(
    input => input.name === 'date_from' && input.type === 'radio'
  );
  if (radioDateInputs.length > 1) { return; };

  // if you've already uploaded the page, return
  if (history.state && history.state.uploaded) { return; }

  // check if appellate
  // let isAppellate = PACER.isAppellateCourt(this.court);

  // if the content_delegate didn't pull the case Id on initialization,
  // check the page for a lead case dktrpt url.
  const tabStorage = await getItemsFromStorage(this.tabId)

  this.pacer_case_id = this.pacer_case_id
    ? this.pacer_case_id
    : tabStorage.caseId;

  // If we don't have this.pacer_case_id at this point, punt.
  if (!this.pacer_case_id) return;

  // insert the button in a disabled state
  tableBody.insertBefore(
    createAlertButtonTr(),
    document.querySelector('tbody').childNodes[0]
  );

  this.recap.getAvailabilityForDocket(
    this.court,
    this.pacer_case_id,
    (result) => {
      if (result.count === 0) {
        console.warn('RECAP: Zero results found for docket lookup.');
      } else if (result.count > 1) {
        console.error(
          `RECAP: More than one result found for docket lookup. Found ${result.count}`
        );
      } else {
        changeAlertButtonStateToActive();
      }
    }
  );

  const options = await getItemsFromStorage('options');

  if (options['recap_enabled']) {
    let callback = (ok) => {
      if (ok) {
        changeAlertButtonStateToActive();
        history.replaceState({ uploaded: true }, '');
        this.notifier.showUpload(
          'Docket uploaded to the public RECAP Archive.',
          function () { }
        );
      }
    };
    if (isDocketDisplayUrl) {
      this.recap.uploadDocket(this.court, this.pacer_case_id,
        document.documentElement.innerHTML,
        'DOCKET',
        (ok) => callback(ok));
    } else if (isDocketHistoryDisplayUrl) {
      this.recap.uploadDocket(this.court, this.pacer_case_id,
        document.documentElement.innerHTML,
        'DOCKET_HISTORY_REPORT',
        (ok) => callback(ok));
    }
  } else {
    console.info('RECAP: Not uploading docket. RECAP is disabled.');
  }
};