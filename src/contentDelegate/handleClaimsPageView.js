ContentDelegate.prototype.handleClaimsPageView = function () {
  // return if not a claims register page
  if (!PACER.isClaimsRegisterPage(this.url, document)) return;

  const pacerCaseId = this.pacer_case_id
    ? this.pacer_case_id
    : PACER.getCaseIdFromClaimsPage(document);

  // render the page as a string and upload it to recap
  const claimsPageHtml = document.documentElement.outerHTML;
  this.recap.uploadClaimsRegister(
    this.court,
    pacerCaseId,
    claimsPageHtml,
    (ok) => { // callback - dispatch the notifier if upload is ok
      if (!ok) console.error('Page not uploaded to the public RECAP archive.');
      
      this.notifier.showUpload(
        'Claims page uploaded to the public RECAP Archive', 
        () => {}
      );
    }
  );
};
