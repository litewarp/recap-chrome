// If this is a document's menu of attachments (subdocuments), upload it to
// RECAP.
ContentDelegate.prototype.handleAttachmentMenuPage = function () {
  if (history.state && history.state.uploaded) {
    return;
  }

  if (!PACER.isAttachmentMenuPage(this.url, document)) {
    return;
  }

  chrome.storage.local.get('options', function (items) {
    if (items['options']['recap_enabled']) {
      let callback = $.proxy(function (ok) {
        if (ok) {
          history.replaceState({ uploaded: true }, '');
          this.notifier.showUpload(
            'Menu page uploaded to the public RECAP Archive.',
            function () {
            }
          );
        }
      }, this);

      this.recap.uploadAttachmentMenu(this.court, this.pacer_case_id,
        document.documentElement.innerHTML, callback);
    } else {
      console.info('RECAP: Not uploading attachment menu. RECAP is disabled.');
    }
  }.bind(this));
};