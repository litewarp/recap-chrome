import PACER from '../pacer';
import {
  alertButtonTr,
  changeAlertButtonStateToActive,
  getItemsFromStorage,
} from '../utils';

function isADocketPage(url) {
  // If it's not a docket display URL or a docket history URL, punt.
  return PACER.isDocketDisplayUrl(url) || PACER.isDocketHistoryDisplayUrl(url);
}
// check for more than one radioDateInput and return if true
// (you are on an interstitial page so no docket to display)
function isInterstitialPage() {
  const arr = Array.from(document.querySelectorAll('input[type="radio"]'));
  const radioDateInputs = arr.filter((i) => i.name === 'date_from');
  return radioDateInputs.length > 1;
}

function alertBtn() {
  return document.getElementById('recap-alert-button');
}

// If this is a docket page, upload it to RECAP.
export async function handleDocketDisplayPage() {
  if (!isADocketPage(this.url)) return;

  if (isInterstitialPage()) return;

  // if you've already uploaded the page, return
  if (history.state && history.state.uploaded) return;

  // check if appellate
  // let isAppellate = PACER.isAppellateCourt(this.court);

  // if the content_delegate didn't pull the case Id on initialization,
  // check the page for a lead case dktrpt url.
  this.pacer_case_id = this.pacer_case_id
    ? this.pacer_case_id
    : await getItemsFromStorage(this.tabId).caseId;

  // If we don't have this.pacer_case_id at this point, punt.
  if (!this.pacer_case_id) return;

  // insert the button in a disabled state
  document.querySelector('tbody').insertBefore(
    alertButtonTr({
      court: this.court,
      caseId: this.pacer_case_id,
      isActive: false,
    }),
    document.querySelector('tbody').childNodes[0]
  );

  const disabledMsg = 'RECAP: Not uploading docket. RECAP is disabled';
  const warnMsg = 'RECAP: Zero results found for docket lookup.';
  const successMsg = 'Docket uploaded to the public RECAP Archive.';
  const errorMsg = 'RECAP: Upload failed. Check the logs for more information.';
  const tooManyMsg = (count) =>
    'Recap: More than one result found for docket lookup. ' + `Found ${count}`;

  // check to see if we have the docket already
  this.recap.getAvailabilityForDocket(
    this.court,
    this.pacer_case_id,
    (result) => {
      if (result.count === 0) return console.warn(warnMsg);
      if (result.count > 1) return console.error(tooManyMsg(result.count));
      changeAlertButtonStateToActive({ el: alertBtn() });
    }
  );

  // do nothing if recap is not enabled
  const options = await getItemsFromStorage('options');
  if (!options['recap_enabled']) return console.info(disabledMsg);

  // else upload docket to RECAP
  this.recap.uploadDocket(
    this.court,
    this.pacer_case_id,
    document.documentElement.innerHTML,
    // send the appropriate label - if not one then other
    PACER.isDocketDisplayUrl(this.url) ? 'DOCKET' : 'DOCKET_HISTORY_REPORT',
    (ok) => {
      if (!ok) return console.error(errorMsg);
      history.replaceState({ uploaded: true }, '');
      this.notifier.showUpload(successMsg, () => {});
      changeAlertButtonStateToActive({ el: alertBtn() });
    }
  );
}
