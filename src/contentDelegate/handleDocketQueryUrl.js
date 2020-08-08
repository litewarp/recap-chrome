// If this is a docket query page, ask RECAP whether it has the docket page.
ContentDelegate.prototype.handleDocketQueryUrl = function () {
  if (!PACER.isDocketQueryUrl(this.url)) { return; };
  // Logged out users that load a docket page, see a login page, so they
  // shouldn't check for docket availability.
  if (!PACER.hasPacerCookie(document.cookie)) { return; };

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
        if (result.results) {
          const form = document.querySelector('form');
          const div = document.createElement('div');
          div.classList.add('recap-banner');
          div.appendChild(
            recapAlertButton(this.court, this.pacer_case_id, true)
          );
          form.appendChild(recapBanner(result.results[0]));
          form.appendChild(div);
        }
      }
    }
  );
};